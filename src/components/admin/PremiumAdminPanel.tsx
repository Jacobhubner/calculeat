/**
 * Superadmin: sök upp vilken användare som helst och ge premium gratis.
 *
 * Låg tidigare i supportvyn, men nådde då bara personer som hört av sig.
 * Här går det att hitta alla — och se hur de hamnat där de är: provperiod,
 * betald prenumeration, eller tidigare tilldelad premium.
 *
 * Historiken kommer från subscription_events. user_subscriptions bär bara
 * nuläget (en rad per användare som skrivs över), så utan loggen gick det
 * inte att se vad som hänt tidigare.
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TFunction } from 'i18next'
import {
  Crown,
  Search,
  Loader2,
  AlertTriangle,
  CreditCard,
  Gift,
  Clock,
  X,
  ShieldCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useAdminUserSearch,
  useSubscriptionEvents,
  type AdminUserRow,
} from '@/hooks/useAdminUserSearch'
import { useAdminSetPlan, type GrantDuration } from '@/hooks/useAdminSubscription'
import { cn } from '@/lib/utils'

const DURATION_MONTHS: GrantDuration[] = [1, 3, 6, 12, null]

/** t-funktionen för 'admin'-namespacet, vidarebefordrad till hjälpfunktioner. */
type TFn = TFunction<'admin'>

/** Datum i användarens språk — 'sv' ger "25 juli 2026", 'en' ger "Jul 25, 2026". */
function formatDate(iso: string, lang: string): string {
  return new Date(iso).toLocaleDateString(lang === 'en' ? 'en-GB' : 'sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Senaste aktivitet, med precision efter hur långt bort i tiden det är.
 *
 * Inom ett dygn: minuter och timmar — då vill man veta om personen är inne
 * just nu eller var det i morse. Efter fyra månader: datum, eftersom
 * "fem månader sedan" varken går att jämföra eller kontrollera.
 * Däremellan är relativ tid lättast att läsa i förbifarten.
 */
function formatLastSeen(iso: string | null, t: TFn, lang: string): string {
  if (!iso) return t('premiumPanel.lastSeen.none')

  const then = new Date(iso)
  const minutes = Math.floor((Date.now() - then.getTime()) / 60000)

  if (minutes < 1) return t('premiumPanel.lastSeen.now')
  if (minutes < 60) return t('premiumPanel.lastSeen.minutes', { count: minutes })

  const hours = Math.floor(minutes / 60)
  if (hours < 24) {
    return hours === 1
      ? t('premiumPanel.lastSeen.hourOne')
      : t('premiumPanel.lastSeen.hours', { count: hours })
  }

  const days = Math.floor(hours / 24)
  if (days === 1) return t('premiumPanel.lastSeen.yesterday')
  if (days < 30) return t('premiumPanel.lastSeen.days', { count: days })

  // Fyra månader ≈ 120 dagar. Därefter säger datumet mer än antalet månader.
  if (days < 120) {
    const months = Math.floor(days / 30)
    return months === 1
      ? t('premiumPanel.lastSeen.monthOne')
      : t('premiumPanel.lastSeen.months', { count: months })
  }

  return formatDate(iso, lang)
}

function previewExpiry(months: GrantDuration, lang: string): string | null {
  if (months == null) return null
  const d = new Date()
  d.setMonth(d.getMonth() + months)
  return formatDate(d.toISOString(), lang)
}

/** Historikmärken — vad användaren varit med om tidigare */
function HistoryBadges({ user, t }: { user: AdminUserRow; t: TFn }) {
  const badges: Array<{ icon: React.ReactNode; label: string; className: string }> = []

  if (user.has_paid_before) {
    badges.push({
      icon: <CreditCard className="h-3 w-3" />,
      label: t('premiumPanel.badge.paid'),
      className:
        'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/25 dark:text-green-300 dark:border-green-800',
    })
  }
  if (user.had_trial) {
    badges.push({
      icon: <Clock className="h-3 w-3" />,
      label: t('premiumPanel.badge.trial'),
      className:
        'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/25 dark:text-blue-300 dark:border-blue-800',
    })
  }
  if (user.was_granted) {
    badges.push({
      icon: <Gift className="h-3 w-3" />,
      label: t('premiumPanel.badge.granted'),
      className:
        'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:border-amber-800',
    })
  }

  // Admins är alltid founder via admins-tabellen (get_user_plan), utan att
  // det skapar någon prenumerationshändelse. Märkena ovan bygger enbart på
  // händelseloggen och kände därför inte till det.
  if (user.is_admin) {
    badges.push({
      icon: <ShieldCheck className="h-3 w-3" />,
      label: t('premiumPanel.badge.viaAdmin'),
      className:
        'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-900/25 dark:text-primary-300 dark:border-primary-800',
    })
  }

  if (badges.length === 0) {
    // Säg aldrig "aldrig haft premium" om personen HAR premium just nu —
    // då finns en väg vi inte känner till, och påståendet vore falskt.
    const hasPremiumNow = user.effective_plan !== 'free'
    return (
      <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
        {hasPremiumNow ? t('premiumPanel.badge.noHistory') : t('premiumPanel.badge.never')}
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-1">
      {badges.map(b => (
        <span
          key={b.label}
          className={cn(
            'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium leading-none',
            b.className
          )}
        >
          {b.icon}
          {b.label}
        </span>
      ))}
    </div>
  )
}

/** Utfälld panel: full historik + tilldelning */
function UserDetail({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  const { t, i18n } = useTranslation('admin')
  const lang = i18n.language?.startsWith('en') ? 'en' : 'sv'
  const { data: events = [], isLoading } = useSubscriptionEvents(user.user_id)
  const { mutateAsync: setPlan, isPending } = useAdminSetPlan()
  const [reason, setReason] = useState('')

  const label = user.username || user.email || t('premiumPanel.grant.fallbackUser')

  const handleGrant = async (months: GrantDuration) => {
    if (!reason.trim()) {
      toast.error(t('premiumPanel.grant.reasonRequired'))
      return
    }
    const until =
      months == null
        ? t('premiumPanel.grant.untilIndefinite')
        : t('premiumPanel.grant.untilDate', { date: previewExpiry(months, lang) })
    if (!window.confirm(t('premiumPanel.grant.confirm', { until, user: label }))) return

    try {
      await setPlan({ userId: user.user_id, plan: 'premium', months, note: reason.trim() })
      toast.success(t('premiumPanel.grant.success', { until }))
      setReason('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('premiumPanel.grant.error'))
    }
  }

  const handleRevoke = async () => {
    if (!window.confirm(t('premiumPanel.revoke.confirm', { user: label }))) return
    try {
      await setPlan({
        userId: user.user_id,
        plan: 'default',
        months: null,
        note: reason.trim() || undefined,
      })
      toast.success(t('premiumPanel.revoke.success'))
      setReason('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t('premiumPanel.revoke.error'))
    }
  }

  return (
    <div className="border-t border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900">
      {/* Aktiv betalande kund hanteras i betalflödet */}
      {user.is_stripe ? (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/25 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <div>
            <p className="font-medium">{t('premiumPanel.stripe.title')}</p>
            <p className="mt-0.5">
              {t('premiumPanel.stripe.body', {
                until: user.current_period_end
                  ? t('premiumPanel.stripe.untilDate', {
                      date: formatDate(user.current_period_end, lang),
                    })
                  : '',
              })}
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Adminrollen ger founder oavsett prenumeration. Att tilldela
              premium här ändrar inget för användaren — säg det, i stället för
              att bjuda in till en åtgärd utan effekt. */}
          {user.is_admin && (
            <div className="mb-2.5 flex items-start gap-2 rounded-lg border border-primary-200 bg-primary-50 px-3 py-2 text-xs text-primary-800 dark:border-primary-800 dark:bg-primary-900/25 dark:text-primary-200">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>{t('premiumPanel.adminNote')}</p>
            </div>
          )}
          <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200">
            {t('premiumPanel.grant.title')}
          </p>
          <Input
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder={t('premiumPanel.grant.reasonPlaceholder')}
            className="mt-1.5 h-8 text-xs"
            disabled={isPending}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {DURATION_MONTHS.map(months => (
              <button
                key={String(months)}
                type="button"
                disabled={isPending}
                onClick={() => handleGrant(months)}
                title={
                  months == null
                    ? t('premiumPanel.duration.noExpiry')
                    : t('premiumPanel.duration.validUntil', {
                        date: previewExpiry(months, lang),
                      })
                }
                className={cn(
                  'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
                  'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                  'dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700'
                )}
              >
                {months == null
                  ? t('premiumPanel.duration.indefinite')
                  : t('premiumPanel.duration.months', { count: months })}
              </button>
            ))}
          </div>
          {user.source === 'manual' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRevoke}
              disabled={isPending}
              className="mt-2 h-7 text-xs text-neutral-600 hover:text-red-600 dark:text-neutral-400"
            >
              {t('premiumPanel.revoke.button')}
            </Button>
          )}
        </>
      )}

      {/* Historik */}
      <div className="mt-3 border-t border-neutral-200 pt-2.5 dark:border-neutral-700">
        <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200">
          {t('premiumPanel.history.title')}
        </p>
        {isLoading ? (
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t('premiumPanel.history.loading')}
          </p>
        ) : events.length === 0 ? (
          <p className="mt-1 text-[11px] text-neutral-500 dark:text-neutral-400">
            {t('premiumPanel.history.empty')}
          </p>
        ) : (
          <ul className="mt-1.5 space-y-1.5">
            {events.map((e, i) => (
              <li key={i} className="text-[11px] leading-snug">
                <span className="text-neutral-700 dark:text-neutral-200">
                  {t('premiumPanel.event.' + e.event_type, { defaultValue: e.event_type })}
                </span>
                <span className="text-neutral-400 dark:text-neutral-500">
                  {' · '}
                  {formatDate(e.created_at, lang)}
                  {e.actor_username &&
                    ' · ' + t('premiumPanel.history.byActor', { actor: '@' + e.actor_username })}
                </span>
                {e.reason && <p className="text-neutral-500 dark:text-neutral-400">{e.reason}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="mt-2 h-7 w-full text-xs text-neutral-500"
      >
        Stäng
      </Button>
    </div>
  )
}

export default function PremiumAdminPanel() {
  const { t, i18n } = useTranslation('admin')
  const lang = i18n.language?.startsWith('en') ? 'en' : 'sv'
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 300)
  const { data: users = [], isLoading } = useAdminUserSearch(debounced)
  const [openUserId, setOpenUserId] = useState<string | null>(null)

  return (
    <div>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={t('premiumPanel.searchPlaceholder')}
          className="h-9 pl-8 text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
            aria-label="Rensa sökning"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {t('premiumPanel.searching')}
        </p>
      ) : users.length === 0 ? (
        <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
          {t('premiumPanel.noMatch')}
        </p>
      ) : (
        // Listan växer med användarantalet, därför max-h-96 + skroll: annars
        // trycks resten av sidan ur vägen vid många träffar.
        <div className="mt-3 max-h-96 divide-y divide-neutral-200 overflow-y-auto rounded-lg border border-neutral-200 dark:divide-neutral-700 dark:border-neutral-700">
          {users.map(user => {
            const isOpen = openUserId === user.user_id
            const hasPremium = user.effective_plan !== 'free'

            return (
              <div key={user.user_id}>
                <button
                  type="button"
                  onClick={() => setOpenUserId(isOpen ? null : user.user_id)}
                  className="flex w-full items-start justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-neutral-50 dark:hover:bg-neutral-800"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {user.username || t('premiumPanel.noName')}
                      {user.is_admin && (
                        <span className="ml-1.5 text-[10px] font-normal text-primary-600 dark:text-primary-300">
                          {t('premiumPanel.adminTag')}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-neutral-500 dark:text-neutral-400">
                      {user.email}
                    </p>
                    {/* Aktivitet och ålder på kontot — registreringsdatum säger
                        inget om någon faktiskt använder appen. */}
                    <p className="mt-0.5 text-[11px] text-neutral-400 dark:text-neutral-500">
                      {formatLastSeen(user.last_active_at, t, lang)}
                      <span className="mx-1">·</span>
                      {t('premiumPanel.accountCreated', {
                        date: formatDate(user.created_at, lang),
                      })}
                    </p>
                    <div className="mt-1">
                      <HistoryBadges user={user} t={t} />
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium leading-none',
                        hasPremium
                          ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/25 dark:text-primary-300'
                          : 'bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400'
                      )}
                    >
                      {hasPremium && <Crown className="h-2.5 w-2.5" />}
                      {user.effective_plan}
                    </span>
                    {user.current_period_end && (
                      <p className="mt-0.5 text-[10px] text-neutral-400 dark:text-neutral-500">
                        {t('premiumPanel.validUntilShort', {
                          date: formatDate(user.current_period_end, lang),
                        })}
                      </p>
                    )}
                  </div>
                </button>
                {isOpen && <UserDetail user={user} onClose={() => setOpenUserId(null)} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
