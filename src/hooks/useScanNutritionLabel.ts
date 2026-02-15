import { useMutation } from '@tanstack/react-query'
import { FunctionsHttpError } from '@supabase/supabase-js'
import type { ScanResult } from '@/lib/types'
import { supabase } from '@/lib/supabase'

type ScanError = {
  type: string
  message: string
}

// Max base64 size ~800KB to stay well within Supabase edge function limits
const MAX_BASE64_SIZE = 800_000

async function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      // Limit longest side to 768px — enough for reading nutrition labels
      const maxDim = 768
      let width = img.width
      let height = img.height

      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width)
        width = maxDim
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height)
        height = maxDim
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

      // Progressive quality reduction until under size limit
      const qualities = [0.7, 0.5, 0.3]
      let base64 = ''

      for (const q of qualities) {
        const dataUrl = canvas.toDataURL('image/jpeg', q)
        base64 = dataUrl.split(',')[1]
        if (base64.length <= MAX_BASE64_SIZE) break
      }

      if (base64.length > MAX_BASE64_SIZE) {
        reject(new Error('Bilden är för stor även efter komprimering'))
        return
      }

      resolve(base64)
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Kunde inte läsa bilden'))
    }

    img.src = url
  })
}

const ERROR_MESSAGES: Record<string, string> = {
  unauthorized: 'Du är inte inloggad. Ladda om sidan och försök igen.',
  quota_exceeded: 'Skanning tillfälligt otillgänglig. Försök igen senare.',
  timeout: 'Skanning tog för lång tid. Försök igen.',
  no_nutrition_label: 'Bilden verkar inte innehålla en näringsetikett.',
  validation_failed: 'Kunde inte läsa etiketten. Försök med en tydligare bild.',
  image_too_large: 'Bilden är för stor. Försök med en mindre bild.',
  server_error: 'Ett serverfel uppstod.',
}

async function scanLabel(file: File): Promise<ScanResult> {
  const image = await compressImage(file)

  const { data, error } = await supabase.functions.invoke('scan-nutrition-label', {
    body: { image },
  })

  // Handle FunctionsHttpError — extract JSON body from the response
  if (error) {
    if (error instanceof FunctionsHttpError) {
      let body: Record<string, string> | null = null
      try {
        body = await error.context.json()
      } catch {
        // Could not parse error body
      }
      const errorType = body?.error || 'server_error'
      throw {
        type: errorType,
        message: body?.message || ERROR_MESSAGES[errorType] || 'Ett fel uppstod vid skanning.',
      } as ScanError
    }
    throw {
      type: 'network_error',
      message: 'Kunde inte nå servern. Kontrollera din anslutning.',
    } as ScanError
  }

  if (!data || typeof data !== 'object') {
    throw { type: 'unknown', message: 'Tomt svar från servern.' } as ScanError
  }

  // Edge function returned 200 but with an error field
  if (data.error) {
    throw {
      type: data.error,
      message: data.message || ERROR_MESSAGES[data.error] || 'Ett fel uppstod vid skanning.',
    } as ScanError
  }

  return data as ScanResult
}

export function useScanNutritionLabel() {
  return useMutation<ScanResult, ScanError, File>({
    mutationFn: scanLabel,
  })
}
