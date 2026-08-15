import { useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { CalibrationAvailability } from '@/lib/types'

/**
 * Skickar en "kalibrering rekommenderas"-notis när tillståndet slår om.
 *
 * Varför klienten avgör: rekommendationen härleds i
 * useCalibrationAvailability från viktkluster, CV-baserad trenddetektion
 * och datakvalitet. Att spegla den logiken i SQL vore två sanningar som
 * glider isär. Servern (notify_calibration_recommended) äger istället
 * idempotensen — högst en notis per 14 dagar — så ett extra anrop är
 * ofarligt.
 *
 * Preview-läget ("Testa som ny användare") skickar aldrig notiser:
 * sandlådans data raderas vid exit och ska inte lämna spår i riktiga
 * notisflödet.
 */
export function useCalibrationNotifier(availability: CalibrationAvailability | undefined) {
  const { user, isPreviewMode } = useAuth()
  const queryClient = useQueryClient()
  /** Hindrar upprepade anrop inom samma session (servern är andra spärren) */
  const notifiedRef = useRef(false)

  const isRecommended = availability?.isRecommended ?? false
  const reason = availability?.reason

  useEffect(() => {
    if (!user || isPreviewMode) return
    if (!isRecommended) {
      // Tillståndet gick tillbaka — tillåt ny notis nästa gång det slår om
      notifiedRef.current = false
      return
    }
    if (notifiedRef.current) return

    notifiedRef.current = true
    void (async () => {
      const { data, error } = await supabase.rpc('notify_calibration_recommended', {
        p_reason: reason ?? null,
      })
      if (error) return // tyst: en utebliven notis får aldrig störa dashboarden

      // Uppdatera klockan bara när en notis faktiskt skapades
      const created = (data as { success?: boolean } | null)?.success === true
      if (created) {
        queryClient.invalidateQueries({ queryKey: ['notifications', 'list', user.id] })
        queryClient.invalidateQueries({ queryKey: ['notifications', 'count', user.id] })
      }
    })()
  }, [user, isPreviewMode, isRecommended, reason, queryClient])
}
