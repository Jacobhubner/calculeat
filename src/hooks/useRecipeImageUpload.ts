import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const BUCKET = 'recipe-images'
const MAX_RAW_BYTES = 15 * 1024 * 1024 // 15 MB — raw input limit (before resize/convert)
const MAX_PROCESSED_BYTES = 3 * 1024 * 1024 // 3 MB  — post-WebP safety net
const MAX_WIDTH = 1200

// ─── EXIF orientation ────────────────────────────────────────────────────────
// Reads the EXIF orientation tag from a JPEG file without any external library.
// Returns 1 (no rotation) on any parse error — fail-closed.
//
// Common values:
//   1 = normal
//   3 = 180°
//   6 = 90° CW  (portrait on iPhone taken in natural hold)
//   8 = 90° CCW
async function getExifOrientation(file: File): Promise<number> {
  try {
    const buffer = await file.slice(0, 65536).arrayBuffer()
    const view = new DataView(buffer)

    // Must start with JPEG SOI marker
    if (view.getUint16(0) !== 0xffd8) return 1

    let offset = 2
    while (offset < view.byteLength - 4) {
      const marker = view.getUint16(offset)
      const segLen = view.getUint16(offset + 2)

      // APP1 segment
      if (marker === 0xffe1) {
        // Check for 'Exif\0\0' magic (bytes 4–9 relative to segment start)
        if (view.getUint32(offset + 4) !== 0x45786966) return 1 // 'Exif'

        const tiffStart = offset + 10
        const littleEndian = view.getUint16(tiffStart) === 0x4949
        const ifdOffset = view.getUint32(tiffStart + 4, littleEndian)
        const ifdStart = tiffStart + ifdOffset
        const entryCount = view.getUint16(ifdStart, littleEndian)

        for (let i = 0; i < entryCount; i++) {
          const entryOffset = ifdStart + 2 + i * 12
          // Tag 0x0112 = Orientation
          if (view.getUint16(entryOffset, littleEndian) === 0x0112) {
            return view.getUint16(entryOffset + 8, littleEndian)
          }
        }
        return 1
      }

      // Stop if marker doesn't look like a JPEG segment
      if ((marker & 0xff00) !== 0xff00) break
      offset += 2 + segLen
    }
    return 1
  } catch {
    return 1 // fail-closed
  }
}

// ─── Resize + WebP conversion ────────────────────────────────────────────────
// Accepts the raw File so EXIF orientation can be read before drawing.
async function resizeAndConvertToWebP(file: File): Promise<Blob> {
  const orientation = await getExifOrientation(file)
  // orientation 6/8 swap width and height (portrait stored as landscape)
  const swapped = orientation === 6 || orientation === 8

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Scale based on the image's natural (un-rotated) dimensions
      const naturalW = img.naturalWidth
      const naturalH = img.naturalHeight
      const scale = naturalW > MAX_WIDTH ? MAX_WIDTH / naturalW : 1
      const drawW = Math.round(naturalW * scale)
      const drawH = Math.round(naturalH * scale)

      // Canvas dimensions after applying orientation rotation
      const canvasW = swapped ? drawH : drawW
      const canvasH = swapped ? drawW : drawH

      const canvas = document.createElement('canvas')
      canvas.width = canvasW
      canvas.height = canvasH

      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context unavailable'))

      // Apply rotation transform so image is drawn correctly oriented
      if (orientation !== 1) {
        ctx.save()
        switch (orientation) {
          case 3: // 180°
            ctx.translate(canvasW, canvasH)
            ctx.rotate(Math.PI)
            break
          case 6: // 90° CW
            ctx.translate(canvasW, 0)
            ctx.rotate(Math.PI / 2)
            break
          case 8: // 90° CCW
            ctx.translate(0, canvasH)
            ctx.rotate(-Math.PI / 2)
            break
        }
      }

      ctx.drawImage(img, 0, 0, drawW, drawH)

      if (orientation !== 1) ctx.restore()

      canvas.toBlob(
        blob => {
          if (!blob) return reject(new Error('Kunde inte konvertera bilden'))
          resolve(blob)
        },
        'image/webp',
        0.85
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Kunde inte läsa bilden'))
    }

    img.src = url
  })
}

// ─── Storage path utilities ───────────────────────────────────────────────────
function extractStoragePath(publicUrl: string): string | null {
  // Public URL format: .../storage/v1/object/public/recipe-images/{path}
  const marker = `/object/public/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return publicUrl.slice(idx + marker.length)
}

/**
 * Deletes a recipe image from Storage given its public URL.
 * Can be called outside React context (e.g. in mutation functions).
 *
 * ⚠️  ARCHITECTURE GUARDRAIL — read before implementing recipe copy/duplicate features:
 *
 * Each Storage object has EXACTLY ONE owning recipe row. This invariant is what makes
 * delete-cleanup safe and simple. The cleanup model is:
 *   delete recipe row → delete Storage object at recipe.image_url
 *
 * When implementing copy_list_recipe_to_personal or any other recipe copy/duplicate flow,
 * NEVER copy image_url directly from one recipe row to another. Doing so creates a shared
 * Storage reference: if either recipe is deleted, the other gets a broken image and the
 * Storage object may be double-deleted or silently leaked.
 *
 * Correct approach for recipe copy:
 *   1. Re-upload the image to the recipient's own folder  ({recipientId}/randomUUID.webp)
 *   2. — OR — leave image_url as NULL on the copied recipe
 *
 * See also: accept_share_invitation RPCs (supabase/migrations/20260221000000 and fixes)
 * which intentionally omit image_url for this exact reason.
 */
export async function deleteRecipeImageByUrl(publicUrl: string): Promise<void> {
  const path = extractStoragePath(publicUrl)
  if (!path) return
  await supabase.storage.from(BUCKET).remove([path])
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

type UploadResult = { url: string; error: null } | { url: null; error: string }

type DeleteResult = { ok: true } | { ok: false; error: string }

export function useRecipeImageUpload() {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)

  /**
   * Validates, resizes, converts and uploads an image file.
   * Returns { url, error: null } on success or { url: null, error } on failure.
   * Error strings are in Swedish and suitable for direct display in toasts.
   */
  async function uploadImage(file: File): Promise<UploadResult> {
    if (!user) {
      return { url: null, error: 'Inte inloggad' }
    }

    if (!file.type.startsWith('image/')) {
      return { url: null, error: 'Filen måste vara en bild' }
    }

    if (file.size > MAX_RAW_BYTES) {
      return { url: null, error: 'Bilden är för stor (max 15 MB)' }
    }

    setIsUploading(true)

    try {
      const blob = await resizeAndConvertToWebP(file)

      // console.log(`[RecipeImageUpload] processed blob size: ${(blob.size / 1024).toFixed(0)} KB`)

      if (blob.size > MAX_PROCESSED_BYTES) {
        return {
          url: null,
          error: 'Bilden är för komplex att komprimera — prova en annan bild',
        }
      }

      const path = `${user.id}/${crypto.randomUUID().replace(/-/g, '')}.webp`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { upsert: false, contentType: 'image/webp' })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      return { url: data.publicUrl, error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Uppladdning misslyckades'
      return { url: null, error: msg }
    } finally {
      setIsUploading(false)
    }
  }

  /**
   * Removes a recipe image from Storage given its public URL.
   * Returns { ok: true } on success or { ok: false, error } on failure.
   */
  async function deleteImage(publicUrl: string): Promise<DeleteResult> {
    const path = extractStoragePath(publicUrl)
    if (!path) return { ok: true } // nothing to delete

    try {
      const { error } = await supabase.storage.from(BUCKET).remove([path])
      if (error) throw error
      return { ok: true }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Kunde inte ta bort bilden'
      return { ok: false, error: msg }
    }
  }

  return { uploadImage, deleteImage, isUploading }
}
