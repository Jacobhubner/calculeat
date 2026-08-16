/**
 * Bilduppladdning för bilagor i vänmeddelanden.
 *
 * Samma mönster som useSupportImageUpload: privat bucket, bilden visas via
 * signerad URL och hooken returnerar en storage-PATH (skickas till
 * send_message som p_image_path), aldrig en URL.
 *
 * RLS: uppladdaren når sin egen mapp, mottagaren når filen via
 * image_path-referensen i ett icke-raderat meddelande i deras vänskap.
 */

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { MAX_RAW_BYTES, MAX_PROCESSED_BYTES, resizeAndConvertToWebP } from '@/lib/imageProcessing'

export const MESSAGE_ATTACHMENTS_BUCKET = 'message-attachments'

/** Måste matcha taket i send_message och enforce_message_attachment_limit */
export const MAX_IMAGES_PER_MESSAGE = 5

type UploadResult = { path: string; error: null } | { path: null; error: string }

export function useMessageImageUpload() {
  const { user } = useAuth()
  // Räknare, inte boolean: vid parallell uppladdning skulle den första
  // avslutade filen annars släcka spinnern medan övriga fortfarande laddar.
  const [activeUploads, setActiveUploads] = useState(0)
  const isUploading = activeUploads > 0

  /**
   * Validerar, komprimerar och laddar upp en bild till användarens egen mapp.
   * Returnerar { path } vid framgång — skicka som p_image_path till RPC:n.
   */
  async function uploadImage(file: File): Promise<UploadResult> {
    if (!user) {
      return { path: null, error: 'Inte inloggad' }
    }

    if (!file.type.startsWith('image/')) {
      return { path: null, error: 'Filen måste vara en bild' }
    }

    if (file.size > MAX_RAW_BYTES) {
      return { path: null, error: 'Bilden är för stor (max 15 MB)' }
    }

    setActiveUploads(n => n + 1)

    try {
      const blob = await resizeAndConvertToWebP(file)

      if (blob.size > MAX_PROCESSED_BYTES) {
        return {
          path: null,
          error: 'Bilden är för komplex att komprimera — prova en annan bild',
        }
      }

      const path = `${user.id}/${crypto.randomUUID().replace(/-/g, '')}.webp`

      const { error: uploadError } = await supabase.storage
        .from(MESSAGE_ATTACHMENTS_BUCKET)
        .upload(path, blob, { upsert: false, contentType: 'image/webp' })

      if (uploadError) throw uploadError

      return { path, error: null }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Uppladdning misslyckades'
      return { path: null, error: msg }
    } finally {
      setActiveUploads(n => n - 1)
    }
  }

  /**
   * Laddar upp flera bilder parallellt. En trasig bild ska inte fälla hela
   * urvalet, så varje fil rapporteras för sig.
   *
   * `uploaded` parar ihop path med KÄLLFILEN — anroparen behöver den för att
   * skapa rätt förhandsvisning. Att matcha på index mot indata går inte när
   * någon fil fallerat.
   */
  async function uploadImages(
    files: File[]
  ): Promise<{ uploaded: { file: File; path: string }[]; errors: string[] }> {
    const results = await Promise.all(
      files.map(async file => ({ file, ...(await uploadImage(file)) }))
    )
    return {
      uploaded: results.flatMap(r => (r.path ? [{ file: r.file, path: r.path }] : [])),
      errors: results.flatMap(r => (r.error ? [r.error] : [])),
    }
  }

  /**
   * Tar bort uppladdade bilagor (t.ex. när användaren ångrar innan sändning).
   * RLS tillåter endast borttagning i egen mapp.
   */
  async function removeImage(path: string | string[]): Promise<void> {
    const paths = Array.isArray(path) ? path : [path]
    if (paths.length === 0) return
    await supabase.storage.from(MESSAGE_ATTACHMENTS_BUCKET).remove(paths)
  }

  return { uploadImage, uploadImages, removeImage, isUploading }
}
