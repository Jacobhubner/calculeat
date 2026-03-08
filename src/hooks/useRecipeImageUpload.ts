import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

const BUCKET = 'recipe-images'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB
const MAX_WIDTH = 1200

async function resizeAndConvertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const scale = img.width > MAX_WIDTH ? MAX_WIDTH / img.width : 1
      const width = Math.round(img.width * scale)
      const height = Math.round(img.height * scale)

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context unavailable'))

      ctx.drawImage(img, 0, 0, width, height)

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

function extractStoragePath(publicUrl: string): string | null {
  // Public URL format: .../storage/v1/object/public/recipe-images/{path}
  const marker = `/object/public/${BUCKET}/`
  const idx = publicUrl.indexOf(marker)
  if (idx === -1) return null
  return publicUrl.slice(idx + marker.length)
}

/**
 * Tar bort en receptbild från Storage givet dess publika URL.
 * Kan anropas utanför React-kontext (t.ex. i mutation functions).
 */
export async function deleteRecipeImageByUrl(publicUrl: string): Promise<void> {
  const path = extractStoragePath(publicUrl)
  if (!path) return
  await supabase.storage.from(BUCKET).remove([path])
}

export function useRecipeImageUpload() {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function uploadImage(file: File): Promise<string | null> {
    if (!user) {
      setError('Inte inloggad')
      return null
    }

    if (!file.type.startsWith('image/')) {
      setError('Filen måste vara en bild')
      return null
    }

    if (file.size > MAX_SIZE_BYTES) {
      setError('Bilden får inte vara större än 5 MB')
      return null
    }

    setError(null)
    setIsUploading(true)

    try {
      const blob = await resizeAndConvertToWebP(file)
      const path = `${user.id}/${Date.now()}.webp`

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, blob, { upsert: true, contentType: 'image/webp' })

      if (uploadError) throw uploadError

      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
      return data.publicUrl
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Uppladdning misslyckades'
      setError(msg)
      return null
    } finally {
      setIsUploading(false)
    }
  }

  async function deleteImage(publicUrl: string): Promise<void> {
    const path = extractStoragePath(publicUrl)
    if (!path) return
    await supabase.storage.from(BUCKET).remove([path])
  }

  return { uploadImage, deleteImage, isUploading, error }
}
