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

type UploadResult = { path: string; error: null } | { path: null; error: string }

export function useMessageImageUpload() {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)

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

    setIsUploading(true)

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
      setIsUploading(false)
    }
  }

  /**
   * Tar bort en uppladdad bilaga (t.ex. när användaren ångrar innan sändning).
   * RLS tillåter endast borttagning i egen mapp.
   */
  async function removeImage(path: string): Promise<void> {
    await supabase.storage.from(MESSAGE_ATTACHMENTS_BUCKET).remove([path])
  }

  return { uploadImage, removeImage, isUploading }
}
