/**
 * Justerar underskottsdjupet på en PÅGÅENDE nedgångsperiod.
 *
 * VARFÖR INTE "BYT PERIOD": ett periodbyte avslutar raden och skapar en ny,
 * vilket nollställer veckoräknaren, framstegsmätaren och viktbaslinjen —
 * start_diet_phase sätter dessutom start_weight_kg till dagens vikt, som
 * efter åtta veckors nedgång är den nedbantade. Att kräva det för vad som
 * databasmässigt är en kolumnuppdatering är oproportionerligt.
 *
 * ⚠️ FYRA SAKER MÅSTE SKRIVAS TILLSAMMANS, annars uppstår tyst divergens:
 *   1. diet_phases.deficit_level — triggern speglar till user_profiles och
 *      profiles. Utan detta räknar nästa metabola kalibrering om ur det GAMLA
 *      djupet och användarens val försvinner tyst.
 *   2. diet_phases.target_calories — annars visar kortet gamla kalorier och
 *      phaseTracking jämför mot fel takt.
 *   3. profiles.calories_min/max — TRIGGERN RÖR DEM INTE (verifierat mot
 *      kolumnlistan). Utan detta ändras kortets siffra men inte matdagbokens
 *      faktiska mål, vilket är det värsta tänkbara utfallet.
 *   4. deficit_level_changed_at — så phaseTracking vet att jämförelsen väger
 *      två takter.
 *
 * Makroprocenten rörs INTE: cut → cut behåller samma kostläge, så
 * macrosForMode skulle ge identiskt resultat.
 */

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { DietPhase } from '@/lib/types'
import { DeficitLevelPicker } from './DeficitLevelPicker'
import { suggestPhaseTargets } from '@/lib/calculations/dietPhases'
import {
  deficitLevelIdToLabel,
  deficitLevelIdFromLabel,
  type DeficitLevelId,
} from '@/lib/utils/deficitLevels'
import { useUpdateDietPhase } from '@/hooks/useDietPhases'
import { useUpdateProfile, useActiveProfile } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { localDateString } from '@/lib/utils/localDate'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  phase: DietPhase
  tdee: number
  weightKg: number
  bodyFatPercentage?: number
}

export function DeficitLevelDialog({
  open,
  onOpenChange,
  phase,
  tdee,
  weightKg,
  bodyFatPercentage,
}: Props) {
  const { t } = useTranslation('dashboard')
  const updatePhase = useUpdateDietPhase()
  const updateProfile = useUpdateProfile()
  const { profile: activeProfile } = useActiveProfile()
  const { isPreviewMode } = useAuth()

  /**
   * Utgå från periodens FAKTISKA nivå, inte från förvalet.
   *
   * Gamla cut-perioder kan ha deficit_level = NULL och ändå fungera —
   * triggern har en COALESCE till '20-25%'. De ska därför visas som
   * "Normalt", inte som tomt: en NULL-rad BETER sig som normal utan att
   * SÄGA det.
   */
  const currentLevel = deficitLevelIdFromLabel(phase.deficit_level) ?? 'normal'
  const [level, setLevel] = useState<DeficitLevelId>(currentLevel)

  // Öppnas dialogen på nytt ska den visa det som gäller nu, inte det som
  // valdes förra gången den var öppen.
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLevel(currentLevel)
  }, [open, currentLevel])

  const suggestion = suggestPhaseTargets(
    phase.phase_type,
    tdee,
    weightKg,
    phase.focus,
    undefined,
    bodyFatPercentage,
    level
  )

  const unchanged = level === currentLevel

  const handleSave = async () => {
    if (unchanged) {
      onOpenChange(false)
      return
    }

    updatePhase.mutate(
      {
        phaseId: phase.id,
        updates: {
          deficit_level: deficitLevelIdToLabel(level),
          target_calories: suggestion.targetCalories,
          // Lokalt datum, aldrig toISOString — dygnsgränsen styrs av
          // profilens tidszon.
          deficit_level_changed_at: localDateString(),
        },
      },
      {
        onSuccess: async () => {
          // Triggern sätter calorie_goal och deficit_level på profilerna men
          // INTE kaloriintervallet. Det måste skrivas här, annars följer inte
          // matdagbokens mål med.
          //
          // Preview-läget: triggern hoppar över preview-rader och profilen är
          // en sandlådekopia, så skrivningen görs inte där heller — annars
          // vore halva kopplingen aktiv och halva inte.
          if (activeProfile?.id && !isPreviewMode) {
            try {
              await updateProfile.mutateAsync({
                profileId: activeProfile.id,
                silent: true,
                data: {
                  calories_min: suggestion.targetCaloriesMin,
                  calories_max: suggestion.targetCaloriesMax,
                },
              })
            } catch {
              // Nivån är redan sparad och triggern har speglat den. En
              // utebliven målskrivning får inte se ut som att bytet
              // misslyckades — nästa kalibrering härleder värdena ändå.
            }
          }
          toast.success(t('phase.deficitLevel.toastChanged'))
          onOpenChange(false)
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('phase.deficitLevel.adjustTitle')}</DialogTitle>
          <DialogDescription>{t('phase.deficitLevel.adjustBody')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <DeficitLevelPicker
            value={level}
            onChange={setLevel}
            tdee={tdee}
            weightKg={weightKg}
            hideLabel
          />

          {/* Vad bytet innebär i kalorier — samma tal som sparas. */}
          {!unchanged && (
            <p className="rounded-lg bg-neutral-50 px-3 py-2 text-xs text-neutral-600 dark:bg-neutral-900 dark:text-neutral-400">
              {t('phase.deficitLevel.newTarget', {
                min: suggestion.targetCaloriesMin,
                max: suggestion.targetCaloriesMax,
              })}
            </p>
          )}

          {/* Ärlighet om uppföljningen: den pausas i tio dagar, av samma skäl
              som vid periodstart. Sägs det inte ser kortet plötsligt ut att
              sakna underlag mitt i en pågående period. */}
          {!unchanged && (
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('phase.deficitLevel.trackingNotice')}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {t('actions.cancel', { ns: 'common' })}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={updatePhase.isPending || unchanged}>
            {t('phase.deficitLevel.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
