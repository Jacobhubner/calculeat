import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { MAX_RAW_BYTES, MAX_PROCESSED_BYTES, resizeAndConvertToWebP } from '@/lib/imageProcessing'

const BUCKET = 'recipe-images'

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
