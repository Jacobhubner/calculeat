import { useMutation } from '@tanstack/react-query'
import type { ScanResult } from '@/lib/types'
import { supabase } from '@/lib/supabase'

type ScanError = {
  type: string
  message: string
}

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      const maxWidth = 1024
      let width = img.width
      let height = img.height

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      // Try 0.75 quality first
      let dataUrl = canvas.toDataURL('image/jpeg', 0.75)

      // If still >1MB, lower quality
      if (dataUrl.length > 1_000_000) {
        dataUrl = canvas.toDataURL('image/jpeg', 0.5)
      }

      // Extract base64 data (remove data:image/jpeg;base64, prefix)
      const base64 = dataUrl.split(',')[1]
      resolve(base64)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Kunde inte läsa bilden'))
    }

    img.src = url
  })
}

async function scanLabel(file: File): Promise<ScanResult> {
  const image = await compressImage(file)

  const { data, error } = await supabase.functions.invoke('scan-nutrition-label', {
    body: { image },
  })

  if (error) {
    throw {
      type: 'network_error',
      message: 'Kunde inte nå servern. Kontrollera din anslutning.',
    } as ScanError
  }

  if (data.error) {
    const messages: Record<string, string> = {
      quota_exceeded: data.message || 'Skanning tillfälligt otillgänglig. Försök igen senare.',
      timeout: data.message || 'Skanning tog för lång tid. Försök igen.',
      no_nutrition_label: 'Bilden verkar inte innehålla en näringsetikett.',
      validation_failed: 'Kunde inte läsa etiketten. Försök med en tydligare bild.',
      image_too_large: 'Bilden är för stor. Försök med en mindre bild.',
    }
    throw {
      type: data.error,
      message: messages[data.error] || data.message || 'Ett fel uppstod vid skanning.',
    } as ScanError
  }

  return data as ScanResult
}

export function useScanNutritionLabel() {
  return useMutation<ScanResult, ScanError, File>({
    mutationFn: scanLabel,
  })
}
