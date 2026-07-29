/**
 * Delad klientside-bildbehandling för Storage-uppladdningar.
 * Används av useRecipeImageUpload (receptbilder) och useSupportImageUpload
 * (supportbilagor) — samma EXIF-rotation och WebP-pipeline.
 */

export const MAX_RAW_BYTES = 15 * 1024 * 1024 // 15 MB — raw input limit (before resize/convert)
export const MAX_PROCESSED_BYTES = 5 * 1024 * 1024 // 5 MB  — post-WebP safety net
export const MAX_WIDTH = 1200

// ─── EXIF orientation ────────────────────────────────────────────────────────
// Reads the EXIF orientation tag from a JPEG file without any external library.
// Returns 1 (no rotation) on any parse error — fail-closed.
//
// Common values:
//   1 = normal
//   3 = 180°
//   6 = 90° CW  (portrait on iPhone taken in natural hold)
//   8 = 90° CCW
export async function getExifOrientation(file: File): Promise<number> {
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
export async function resizeAndConvertToWebP(file: File): Promise<Blob> {
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
        0.7
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Kunde inte läsa bilden'))
    }

    img.src = url
  })
}
