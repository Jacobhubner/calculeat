import { useState } from 'react'
import { Bell, Apple, ChefHat, Loader2, Send, X } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  usePendingInvitations,
  useAcceptShareInvitation,
  useRejectShareInvitation,
  useSentShareInvitations,
  useCancelShareInvitation,
  type SentShareInvitation,
} from '@/hooks/useShareInvitations'
import type { PendingInvitation } from '@/lib/types/sharing'
import { toast } from 'sonner'
import { formatDistanceToNow, parseISO, differenceInDays } from 'date-fns'
import { sv } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

function InvitationCard({ invitation }: { invitation: PendingInvitation }) {
  const { t } = useTranslation('social')
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const { mutateAsync: accept } = useAcceptShareInvitation()
  const { mutateAsync: reject } = useRejectShareInvitation()

  const daysLeft = differenceInDays(parseISO(invitation.expires_at), new Date())
  const isExpiringSoon = daysLeft <= 3

  const preview = invitation.item_preview

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      const result = await accept(invitation.id)
      if (!result.success) {
        const errorMessages: Record<string, string> = {
          concurrent_accept_detected: t('invitations.error.concurrent_accept_detected'),
          invitation_expired: t('invitations.error.invitation_expired'),
          invitation_already_processed: t('invitations.error.invitation_already_processed'),
        }
        toast.error(errorMessages[result.error ?? ''] ?? t('invitations.error.generic'))
        return
      }
      const label =
        invitation.item_type === 'recipe'
          ? t('invitations.label.recipe')
          : t('invitations.label.food_item')
      toast.success(t('invitations.toast.imported', { label }))
    } catch {
      toast.error(t('invitations.error.generic_retry'))
    } finally {
      setIsAccepting(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      const result = await reject(invitation.id)
      if (!result.success) {
        toast.error(t('invitations.error.reject_failed'))
        return
      }
      toast.success(t('invitations.toast.rejected'))
    } catch {
      toast.error(t('invitations.error.generic'))
    } finally {
      setIsRejecting(false)
    }
  }

  const isBusy = isAccepting || isRejecting

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-violet-50 shrink-0">
          {invitation.item_type === 'recipe' ? (
            <ChefHat className="h-5 w-5 text-violet-600" />
          ) : (
            <Apple className="h-5 w-5 text-violet-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-neutral-900 truncate">{invitation.item_name}</p>
            <Badge className="bg-violet-100 text-violet-700 border-violet-300 text-[10px] px-1.5 py-0 h-4 shrink-0">
              {invitation.item_type === 'recipe'
                ? t('invitations.badge.recipe')
                : t('invitations.badge.food_item')}
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            {t('invitations.shared_by')}{' '}
            <span className="font-medium text-neutral-700">{invitation.sender_name}</span>
          </p>
        </div>
      </div>

      {/* Preview */}
      {invitation.item_type === 'food_item' && (
        <div className="flex gap-4 text-xs text-neutral-500">
          {preview.calories && <span>{preview.calories} kcal</span>}
          {preview.protein_g && <span>{preview.protein_g}g P</span>}
          {preview.carb_g && <span>{preview.carb_g}g K</span>}
          {preview.fat_g && <span>{preview.fat_g}g F</span>}
          {preview.brand && <span className="text-neutral-400 truncate">{preview.brand}</span>}
        </div>
      )}
      {invitation.item_type === 'recipe' && (
        <div className="flex gap-4 text-xs text-neutral-500">
          {preview.servings && (
            <span>{t('invitations.preview.servings', { count: preview.servings })}</span>
          )}
          {preview.ingredient_count !== undefined && (
            <span>{t('invitations.preview.ingredients', { count: preview.ingredient_count })}</span>
          )}
          {preview.calories && (
            <span>
              {preview.calories} kcal/{t('invitations.preview.serving')}
            </span>
          )}
        </div>
      )}

      {/* Expiry warning */}
      {isExpiringSoon && (
        <p className="text-xs text-amber-600 font-medium">
          {daysLeft <= 0
            ? t('invitations.expiry.soon')
            : t('invitations.expiry.days', { count: daysLeft })}
        </p>
      )}
      {!isExpiringSoon && (
        <p className="text-xs text-neutral-400">
          {t('invitations.sent')}{' '}
          {formatDistanceToNow(parseISO(invitation.created_at), { addSuffix: true, locale: sv })}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleAccept} disabled={isBusy} className="flex-1 gap-2">
          {isAccepting && <Loader2 className="h-3 w-3 animate-spin" />}
          {t('invitations.action.import')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReject}
          disabled={isBusy}
          className="flex-1 text-neutral-500"
        >
          {isRejecting && <Loader2 className="h-3 w-3 animate-spin" />}
          {t('invitations.action.reject')}
        </Button>
      </div>
    </div>
  )
}

function SentInvitationCard({ invitation }: { invitation: SentShareInvitation }) {
  const { t, i18n } = useTranslation('social')
  const [isCancelling, setIsCancelling] = useState(false)
  const { mutateAsync: cancel } = useCancelShareInvitation()

  const handleCancel = async () => {
    setIsCancelling(true)
    try {
      const result = await cancel(invitation.id)
      if (!result.success) {
        toast.error(t('invitations.error.cancel_failed'))
        return
      }
      toast.success(t('invitations.toast.cancelled'))
    } catch {
      toast.error(t('invitations.error.cancel_failed'))
    } finally {
      setIsCancelling(false)
    }
  }

  const locale = i18n.language === 'sv' ? sv : undefined

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4 flex items-center gap-3">
      <div className="p-2 rounded-lg bg-neutral-50 shrink-0">
        {invitation.item_type === 'recipe' ? (
          <ChefHat className="h-5 w-5 text-neutral-400" />
        ) : (
          <Apple className="h-5 w-5 text-neutral-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 truncate">{invitation.item_name}</p>
        <p className="text-sm text-neutral-500">
          {t('invitations.sent.to')}{' '}
          <span className="font-medium text-neutral-700">{invitation.recipient_name}</span>
          {' · '}
          {formatDistanceToNow(parseISO(invitation.created_at), { addSuffix: true, locale })}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCancel}
        disabled={isCancelling}
        className="shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50 gap-1"
      >
        {isCancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        {t('invitations.action.cancel')}
      </Button>
    </div>
  )
}

export default function InvitationsPage() {
  const { t } = useTranslation('social')
  const { data: invitations = [], isLoading } = usePendingInvitations()
  const { data: sentInvitations = [], isLoading: isSentLoading } = useSentShareInvitations()

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">{t('invitations.page.title')}</h1>
          <p className="text-neutral-500 mt-1">{t('invitations.page.subtitle')}</p>
        </div>

        {/* Received invitations */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        )}

        {!isLoading && invitations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-12 w-12 text-neutral-300 mb-4" />
            <p className="text-neutral-500 font-medium">{t('invitations.empty.title')}</p>
            <p className="text-sm text-neutral-400 mt-1 max-w-xs">
              {t('invitations.empty.subtitle')}
            </p>
          </div>
        )}

        {!isLoading && invitations.length > 0 && (
          <div className="space-y-3">
            {invitations.map(invitation => (
              <InvitationCard key={invitation.id} invitation={invitation} />
            ))}
          </div>
        )}

        {/* Sent invitations awaiting response */}
        {!isSentLoading && sentInvitations.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
              <Send className="h-4 w-4" />
              {t('invitations.sent.section_title')}
            </div>
            {sentInvitations.map(inv => (
              <SentInvitationCard key={inv.id} invitation={inv} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
