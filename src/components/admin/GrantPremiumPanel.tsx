/**
 * Superadmin: ge en användare premium gratis under en period.
 *
 * Ligger i supportvyn eftersom man redan tittar på användaren där — en
 * separat sida hade betytt att leta upp personen två gånger.
 *
 * Vid utgång faller planen tillbaka till gratis av sig själv: get_user_plan
 * jämför current_period_end mot now(). Inget städjobb behövs, och
 * användarens data rörs aldrig.
 */

import { useState } from 'react'
import { Crown, Loader2, AlertTriangle, Check } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useAdminSubscription,
  useAdminSetPlan,
  type GrantDuration,
} from '@/hooks/useAdminSubscription'
import { cn } from '@/lib/utils'

interface Props {
  userId: string
  /** Visas i bekräftelsen så man ser vem man ger till */
  userLabel: string
}

const DURATIONS: Array<{ months: GrantDuration; label: string }> = [
  { months: 1, label: '1 mån' },
  { months: 3, label: '3 mån' },
  { months: 6, label: '6 mån' },
  { months: 12, label: '12 mån' },
  { months: null, label: 'Tills vidare' },
]

/** "17 nov 2026" */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Vad slutdatumet blir om man väljer detta antal månader */
function previewExpiry(months: GrantDuration): string | null {
  if (months == null) return null
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return formatDate(d.toISOString())
}

export default function GrantPremiumPanel({ userId, userLabel }: Props) {
  const { data: sub, isLoading } = useAdminSubscription(userId)
  const { mutateAsync: setPlan, isPending } = useAdminSetPlan()
  const [note, setNote] = useState('')

  const handleGrant = async (months: GrantDuration) => {
    const until = months == null ? 'tills vidare' : `till ${previewExpiry(months)}`
    if (!window.confirm(`Ge premium ${until} till ${userLabel}?`)) return

    try {
      await setPlan({ userId, plan: 'premium', months, note: note.trim() || undefined })
      toast.success(`Premium ${until}`)
      setNote('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kunde inte sätta planen')
    }
  }

  const handleRemove = async () => {
    if (!window.confirm(`Ta bort manuell premium för ${userLabel}?`)) return
    try {
      await setPlan({ userId, plan: 'default', months: null })
      toast.success('Manuell plan borttagen')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Kunde inte ta bort planen')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-xs text-neutral-500 dark:text-neutral-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Hämtar plan…
      </div>
    )
  }

  // Stripe-kunder hanteras i Stripe. Att skriva över raden här skulle bli
  // överskriven vid nästa webhook-händelse ändå.
  if (sub?.is_stripe) {
    return (
      <div className="mx-4 mb-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/25 dark:text-amber-200">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        <div>
          <p className="font-medium">Betalande kund</p>
          <p className="mt-0.5">
            Prenumerationen ägs av Stripe{' '}
            {sub.current_period_end && `och gäller till ${formatDate(sub.current_period_end)}`}.
            Ändra den i Stripe — ändringar här skrivs över av nästa webhook-händelse.
          </p>
        </div>
      </div>
    )
  }

  const hasManualPlan = sub?.source === 'manual'

  return (
    <div className="mx-4 mb-3 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200">
          <Crown className="h-3.5 w-3.5 text-amber-500" />
          Ge premium gratis
        </span>
        <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
          Nu: {sub?.effective_plan ?? 'free'}
        </span>
      </div>

      {/* Nuvarande manuell plan — visas så man inte råkar ge dubbelt */}
      {hasManualPlan && (
        <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-green-700 dark:text-green-300">
          <Check className="h-3 w-3 shrink-0" />
          {sub?.current_period_end
            ? `Premium till ${formatDate(sub.current_period_end)}`
            : 'Premium tills vidare'}
          {sub?.note && <span className="text-neutral-500">· {sub.note}</span>}
        </p>
      )}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {DURATIONS.map(({ months, label }) => (
          <button
            key={label}
            type="button"
            disabled={isPending}
            onClick={() => handleGrant(months)}
            title={months == null ? 'Ingen utgång' : `Gäller till ${previewExpiry(months)}`}
            className={cn(
              'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
              'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Input
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Anteckning (valfritt) — t.ex. varför"
        className="mt-2 h-8 text-xs"
        disabled={isPending}
      />

      {hasManualPlan && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          disabled={isPending}
          className="mt-2 h-7 w-full text-xs text-neutral-600 hover:text-red-600 dark:text-neutral-400"
        >
          Ta bort manuell premium
        </Button>
      )}
    </div>
  )
}
