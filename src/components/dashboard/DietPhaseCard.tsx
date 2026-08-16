import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import {
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowUpRight,
  Target,
  Lock,
  Check,
  Clock,
  AlertCircle,
  Scale,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DietPhase, DietPhaseType } from '@/lib/types'
import {
  weeksSince,
  phaseProgress,
  currentPhaseCalories,
  suggestedNextPhase,
  phaseTypeForCalorieGoal,
  phaseTracking,
  type PhaseTracking,
} from '@/lib/calculations/dietPhases'
import { useActiveDietPhase, useEndDietPhase } from '@/hooks/useDietPhases'
import { useWeightHistory } from '@/hooks/useWeightHistory'
import { PhasePickerDialog } from './PhasePickerDialog'

const PHASE_ICON = {
  cut: TrendingDown,
  bulk: TrendingUp,
  maintenance: Minus,
  reverse: ArrowUpRight,
} as const

/** Färg per fas — cut ned, bulk upp, underhåll neutralt, reverse uppåt igen. */
const PHASE_ACCENT: Record<DietPhaseType, string> = {
  cut: 'text-blue-600 dark:text-blue-300',
  bulk: 'text-amber-600 dark:text-amber-300',
  maintenance: 'text-neutral-600 dark:text-neutral-300',
  reverse: 'text-green-600 dark:text-green-300',
}

/**
 * Färg per uppföljningsstatus. Grönt bara för on_track — 'ahead' är inte
 * nödvändigtvis bra: snabbare nedgång än planerat ökar risken för
 * muskelförlust (Garthe 2011).
 */
const TRACKING_ACCENT: Record<PhaseTracking['status'], string> = {
  on_track: 'text-green-600 dark:text-green-300',
  ahead: 'text-amber-600 dark:text-amber-300',
  behind: 'text-amber-600 dark:text-amber-300',
  too_early: 'text-neutral-400 dark:text-neutral-500',
}

/** Viktförändring med explicit tecken: "−1,2 kg" / "+0,4 kg" */
function formatKg(kg: number): string {
  const rounded = Math.round(kg * 10) / 10
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  return `${sign}${Math.abs(rounded).toFixed(1).replace('.', ',')} kg`
}

interface Props {
  tdee?: number
  weightKg?: number
  /** Nuvarande kalorimål, används som startnivå för en reverse diet */
  currentCalories?: number
  /** Uppmätt kroppsfett — Deff-läget kräver det för proteinmål mot FFM */
  bodyFatPercentage?: number
  /** Profilens riktning — förväljer periodtyp så frågan inte ställs två gånger */
  calorieGoal?: string | null
}

export function DietPhaseCard({
  tdee,
  weightKg,
  currentCalories,
  bodyFatPercentage,
  calorieGoal,
}: Props) {
  const { t } = useTranslation('dashboard')
  const { data: phase } = useActiveDietPhase()
  const endPhase = useEndDietPhase()
  const [searchParams, setSearchParams] = useSearchParams()
  const [pickerOpen, setPickerOpen] = useState(false)

  /**
   * Öppna dialogen igen när användaren kommer tillbaka från
   * kroppssammansättning (?phase=open). Perioddialogen skickar dit den som
   * valt styrkespåret utan uppmätt kroppsfett — utan den här återkomsten
   * blev det en återvändsgränd: mätningen sparades men användaren fick själv
   * hitta tillbaka till periodvalet.
   *
   * Parametern städas bort direkt så att en omladdning inte öppnar dialogen
   * på nytt.
   */
  useEffect(() => {
    if (searchParams.get('phase') !== 'open') return
    setPickerOpen(true)
    const next = new URLSearchParams(searchParams)
    next.delete('phase')
    setSearchParams(next, { replace: true })
  }, [searchParams, setSearchParams])

  // Fasen bygger på TDEE och kroppsvikt — utan dem går inga mål att föreslå.
  const canPickPhase = !!tdee && !!weightKg

  const handleEnd = (p: DietPhase) => {
    if (!window.confirm(t('phase.endConfirm'))) return
    endPhase.mutate(p.id, {
      onSuccess: () => toast.success(t('phase.toast.ended')),
    })
  }

  return (
    <>
      <div className="rounded-2xl border border-neutral-200 bg-white px-5 py-4 shadow-sm dark:border-neutral-700 dark:bg-neutral-850 dark:shadow-black/30">
        {phase ? (
          <ActivePhase
            phase={phase}
            tdee={tdee}
            onChange={() => setPickerOpen(true)}
            onEnd={() => handleEnd(phase)}
            canPickPhase={canPickPhase}
            isEnding={endPhase.isPending}
          />
        ) : (
          <EmptyPhase canPickPhase={canPickPhase} onPick={() => setPickerOpen(true)} />
        )}
      </div>

      {canPickPhase && (
        <PhasePickerDialog
          open={pickerOpen}
          onOpenChange={setPickerOpen}
          tdee={tdee}
          weightKg={weightKg}
          currentCalories={currentCalories}
          bodyFatPercentage={bodyFatPercentage}
          initialPhase={
            phase
              ? // Byter man period föreslås nästa steg i kedjan
                (suggestedNextPhase(phase.phase_type) ?? undefined)
              : // Första perioden: utgå från riktningen användaren redan
                // angett i profilen, så frågan inte ställs två gånger
                phaseTypeForCalorieGoal(calorieGoal)
          }
          initialFocus={phase?.focus}
        />
      )}
    </>
  )
}

function EmptyPhase({ canPickPhase, onPick }: { canPickPhase: boolean; onPick: () => void }) {
  const { t } = useTranslation('dashboard')

  return (
    <div className="flex items-start gap-3">
      <div className="rounded-full bg-neutral-100 p-2 dark:bg-neutral-800">
        <Target className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
      </div>
      <div className="min-w-0 flex-1">
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {t('phase.noPhaseTitle')}
        </h4>
        <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">
          {canPickPhase ? t('phase.noPhaseBody') : t('phase.modal.needsTdee')}
        </p>
        {canPickPhase && (
          <Button size="sm" className="mt-3 text-xs" onClick={onPick}>
            {t('phase.startPhase')}
          </Button>
        )}
      </div>
    </div>
  )
}

function ActivePhase({
  phase,
  tdee,
  onChange,
  onEnd,
  canPickPhase,
  isEnding,
}: {
  phase: DietPhase
  tdee?: number
  onChange: () => void
  onEnd: () => void
  canPickPhase: boolean
  isEnding: boolean
}) {
  const { t } = useTranslation('dashboard')
  const { limits } = useEntitlements()
  const openUpgradeModal = useUpgradeModalStore(state => state.open)
  /** Planering över tid är premium; själva fasen och dess mål är gratis */
  const hasPlanning = limits.diet_phase_planning
  const Icon = PHASE_ICON[phase.phase_type]
  const week = weeksSince(phase.started_at) + 1
  const progress = phaseProgress(phase)
  // Reverse diet höjer målet varje vecka — visa nivån som gäller nu, inte
  // startnivån som står i target_calories.
  const calories = currentPhaseCalories(phase, tdee)
  const next = suggestedNextPhase(phase.phase_type)

  // Uppföljning mot uppmätt vikt. Returnerar null tills det finns underlag.
  const { data: weightHistory } = useWeightHistory()
  const tracking = phaseTracking(phase, weightHistory ?? [], tdee)

  // Skilj på "har inte vägt sig alls" och "har vägt sig en gång": den som
  // redan börjat behöver veta att det fattas EN till, inte höra en allmän
  // uppmaning som låter som att inget registrerats.
  const weighInsInPhase = (weightHistory ?? []).filter(
    w => new Date(w.recorded_at) >= new Date(phase.started_at + 'T00:00:00')
  ).length
  const TrackingIcon = tracking
    ? tracking.status === 'on_track'
      ? Check
      : tracking.status === 'too_early'
        ? Clock
        : AlertCircle
    : Clock

  return (
    <div>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="rounded-full bg-neutral-100 p-2 dark:bg-neutral-800">
            <Icon className={cn('h-4 w-4', PHASE_ACCENT[phase.phase_type])} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t(`phase.types.${phase.focus}.${phase.phase_type}`)}
              </h4>
              <span className="text-xs text-neutral-500 dark:text-neutral-400">
                {phase.planned_weeks
                  ? t('phase.weekOf', { current: week, total: phase.planned_weeks })
                  : t('phase.week', { current: week })}
              </span>
            </div>
            {calories != null && (
              <p className="mt-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                {phase.phase_type === 'reverse'
                  ? t('phase.reverseProgress', { calories })
                  : `${calories} kcal`}
                {phase.protein_g_per_kg ? ` · ${phase.protein_g_per_kg} g/kg` : ''}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Uppföljning: går perioden som planerat? Utan detta visar kortet bara
          MÅLET och aldrig UTFALLET — en period utan återkoppling är bara ett
          kalorital. Gratis, eftersom det är själva poängen med en period. */}
      {tracking && (
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2 dark:bg-neutral-900">
          <TrackingIcon
            className={cn('mt-0.5 h-3.5 w-3.5 shrink-0', TRACKING_ACCENT[tracking.status])}
          />
          <div className="min-w-0">
            <p className="text-xs text-neutral-700 dark:text-neutral-200">
              {t(`phase.tracking.${tracking.status}`)}
            </p>
            {tracking.status !== 'too_early' && (
              <p className="mt-0.5 text-[11px] text-neutral-500 dark:text-neutral-400">
                {t('phase.tracking.detail', {
                  actual: formatKg(tracking.actualChangeKg),
                  expected: formatKg(tracking.expectedChangeKg),
                  days: tracking.daysElapsed,
                })}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Utan vägningar går perioden inte att följa upp. Säg det i stället för
          att visa ingenting — samma resonemang som beredskapskortet för
          kalibrering. */}
      {!tracking && (
        <p className="mt-3 flex items-start gap-2 rounded-lg bg-neutral-50 px-3 py-2 text-[11px] text-neutral-500 dark:bg-neutral-900 dark:text-neutral-400">
          <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {weighInsInPhase >= 1
            ? t('phase.tracking.needsOneMore')
            : t('phase.tracking.needsWeights')}
        </p>
      )}

      {/* Progressbar = planering över tid → premium (diet_phase_planning) */}
      {hasPlanning && progress !== null && (
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
          <div
            className="h-full rounded-full bg-primary-500 transition-all dark:bg-primary-400"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}

      {hasPlanning && phase.phase_type === 'reverse' && phase.weekly_calorie_step ? (
        <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
          {t('phase.reverseStep', { amount: phase.weekly_calorie_step })}
        </p>
      ) : null}

      {/* Uppsäljning: visa VAD som låses, inte bara att något är låst */}
      {!hasPlanning && (
        <button
          type="button"
          onClick={() => openUpgradeModal('diet_phase_planning')}
          className="mt-3 flex w-full items-center gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-left text-xs text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/25 dark:text-amber-200 dark:hover:bg-amber-900/40"
        >
          <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{t('phase.planningLocked')}</span>
        </button>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        {hasPlanning && next ? (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('phase.nextSuggested')}: {t(`phase.types.${phase.focus}.${next}`)}
          </span>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" className="text-xs" onClick={onEnd} disabled={isEnding}>
            {t('phase.endPhase')}
          </Button>
          {canPickPhase && (
            <Button size="sm" variant="outline" className="text-xs" onClick={onChange}>
              {t('phase.changePhase')}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
