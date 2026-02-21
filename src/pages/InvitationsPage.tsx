import { useState } from 'react'
import { Bell, Apple, ChefHat, Loader2 } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  usePendingInvitations,
  useAcceptShareInvitation,
  useRejectShareInvitation,
} from '@/hooks/useShareInvitations'
import type { PendingInvitation } from '@/lib/types/sharing'
import { toast } from 'sonner'
import { formatDistanceToNow, parseISO, differenceInDays } from 'date-fns'
import { sv } from 'date-fns/locale'

function InvitationCard({ invitation }: { invitation: PendingInvitation }) {
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
          concurrent_accept_detected: 'Importerades redan i ett annat fönster.',
          invitation_expired: 'Inbjudan har gått ut.',
          invitation_already_processed: 'Denna inbjudan har redan hanterats.',
        }
        toast.error(errorMessages[result.error ?? ''] ?? 'Något gick fel.')
        return
      }
      const label = invitation.item_type === 'recipe' ? 'Receptet' : 'Livsmedlet'
      toast.success(`${label} har importerats!`)
    } catch {
      toast.error('Något gick fel. Försök igen.')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      const result = await reject(invitation.id)
      if (!result.success) {
        toast.error('Kunde inte avvisa inbjudan.')
        return
      }
      toast.success('Inbjudan avvisad.')
    } catch {
      toast.error('Något gick fel.')
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
              {invitation.item_type === 'recipe' ? 'Recept' : 'Livsmedel'}
            </Badge>
          </div>
          <p className="text-sm text-neutral-500 mt-0.5">
            Delad av <span className="font-medium text-neutral-700">{invitation.sender_name}</span>
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
          {preview.servings && <span>{preview.servings} portioner</span>}
          {preview.ingredient_count !== undefined && (
            <span>{preview.ingredient_count} ingredienser</span>
          )}
          {preview.calories && <span>{preview.calories} kcal/portion</span>}
        </div>
      )}

      {/* Expiry warning */}
      {isExpiringSoon && (
        <p className="text-xs text-amber-600 font-medium">
          Utgår om {daysLeft <= 0 ? 'snart' : `${daysLeft} dag${daysLeft !== 1 ? 'ar' : ''}`}
        </p>
      )}
      {!isExpiringSoon && (
        <p className="text-xs text-neutral-400">
          Skickad{' '}
          {formatDistanceToNow(parseISO(invitation.created_at), { addSuffix: true, locale: sv })}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button size="sm" onClick={handleAccept} disabled={isBusy} className="flex-1 gap-2">
          {isAccepting && <Loader2 className="h-3 w-3 animate-spin" />}
          Importera
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleReject}
          disabled={isBusy}
          className="flex-1 text-neutral-500"
        >
          {isRejecting && <Loader2 className="h-3 w-3 animate-spin" />}
          Avvisa
        </Button>
      </div>
    </div>
  )
}

export default function InvitationsPage() {
  const { data: invitations = [], isLoading } = usePendingInvitations()

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Inbjudningar</h1>
          <p className="text-neutral-500 mt-1">
            Livsmedel och recept som andra användare har delat med dig.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        )}

        {!isLoading && invitations.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Bell className="h-12 w-12 text-neutral-300 mb-4" />
            <p className="text-neutral-500 font-medium">Inga inbjudningar</p>
            <p className="text-sm text-neutral-400 mt-1 max-w-xs">
              När någon delar ett livsmedel eller recept med dig syns det här.
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
      </div>
    </DashboardLayout>
  )
}
