import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingDown, TrendingUp, Minus, ArrowUpRight, Lock, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useDietPhases, useDeleteDietPhase } from '@/hooks/useDietPhases'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'
import type { DietPhase, DietPhaseType } from '@/lib/types'
import { cn } from '@/lib/utils'

const PHASE_ICON = {
  cut: TrendingDown,
  bulk: TrendingUp,
  maintenance: Minus,
  reverse: ArrowUpRight,
} as const

const PHASE_ACCENT: Record<DietPhaseType, string> = {
  cut: 'text-blue-600 dark:text-blue-300',
  bulk: 'text-amber-600 dark:text-amber-300',
  maintenance: 'text-neutral-600 dark:text-neutral-300',
  reverse: 'text-green-600 dark:text-green-300',
}

/**
 * Avslutade faser. Premium (diet_phase_planning) — historiken är en av de
 * fyra sakerna den nyckeln gate:ar.
 *
 * Nedgraderingsregeln i PREMIUM_SPEC gäller: raderna finns kvar i databasen
 * även utan premium, de döljs bara i UI:t.
 */
export function PhaseHistoryCard() {
  const { t } = useTranslation('dashboard')
  const { data: phases } = useDietPhases()
  const { limits } = useEntitlements()
  const openUpgradeModal = useUpgradeModalStore(state => state.open)
  const deletePhase = useDeleteDietPhase()
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const hasPlanning = limits.diet_phase_planning
  const ended = (phases ?? []).filter(p => p.ended_at !== null)

  const handleDelete = (id: string) => {
    deletePhase.mutate(id, {
      onSuccess: () => {
        toast.success(t('phase.history.deleted'))
        setConfirmId(null)
      },
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{t('phase.history.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        {!hasPlanning ? (
          <button
            type="button"
            onClick={() => openUpgradeModal('diet_phase_planning')}
            className="flex w-full items-start gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-3 text-left text-xs text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/25 dark:text-amber-200 dark:hover:bg-amber-900/40"
          >
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t('phase.history.locked')}</span>
          </button>
        ) : ended.length === 0 ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {t('phase.history.empty')}
          </p>
        ) : (
          <ul className="space-y-2">
            {ended.map(p => (
              <HistoryRow
                key={p.id}
                phase={p}
                isConfirming={confirmId === p.id}
                isDeleting={deletePhase.isPending}
                onAskDelete={() => setConfirmId(p.id)}
                onCancelDelete={() => setConfirmId(null)}
                onConfirmDelete={() => handleDelete(p.id)}
              />
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function HistoryRow({
  phase,
  isConfirming,
  isDeleting,
  onAskDelete,
  onCancelDelete,
  onConfirmDelete,
}: {
  phase: DietPhase
  isConfirming: boolean
  isDeleting: boolean
  onAskDelete: () => void
  onCancelDelete: () => void
  onConfirmDelete: () => void
}) {
  const { t } = useTranslation('dashboard')
  const Icon = PHASE_ICON[phase.phase_type]

  // Faktisk längd, inte planerad — historiken ska visa vad som hände.
  const weeks = phase.ended_at
    ? Math.max(1, Math.round(daysBetween(phase.started_at, phase.ended_at) / 7))
    : 0

  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-700">
      <div className="flex min-w-0 items-start gap-3">
        <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', PHASE_ACCENT[phase.phase_type])} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
            {t(`phase.types.${phase.focus}.${phase.phase_type}`)}
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {formatDate(phase.started_at)} – {phase.ended_at ? formatDate(phase.ended_at) : ''} ·{' '}
            {t('phase.history.weeks', { count: weeks })}
            {phase.start_weight_kg != null
              ? ` · ${t('phase.startWeight')} ${phase.start_weight_kg} kg`
              : ''}
          </p>
        </div>
      </div>

      {isConfirming ? (
        <div className="flex shrink-0 items-center gap-2 text-xs">
          <button
            type="button"
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50 dark:text-red-300"
          >
            {t('phase.history.confirmDelete')}
          </button>
          <span className="text-neutral-300 dark:text-neutral-600">|</span>
          <button
            type="button"
            onClick={onCancelDelete}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
          >
            {t('phase.history.cancelDelete')}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={onAskDelete}
          aria-label={t('phase.history.delete')}
          className="shrink-0 rounded p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-red-600 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </li>
  )
}

function daysBetween(fromIso: string, toIso: string): number {
  const from = new Date(fromIso + 'T00:00:00').getTime()
  const to = new Date(toIso + 'T00:00:00').getTime()
  return Math.max(0, (to - from) / (1000 * 60 * 60 * 24))
}

function formatDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}
