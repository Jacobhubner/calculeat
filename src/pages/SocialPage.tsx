import { useState } from 'react'
import {
  Users,
  UserPlus,
  Bell,
  Apple,
  ChefHat,
  Loader2,
  UserCheck,
  UserX,
  Trash2,
  Share2,
  Pencil,
  Check,
  X,
  Clock,
} from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  usePendingInvitations,
  useAcceptShareInvitation,
  useRejectShareInvitation,
} from '@/hooks/useShareInvitations'
import {
  useFriends,
  usePendingFriendRequests,
  useSentFriendRequests,
  useSendFriendRequest,
  useCancelFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useRemoveFriend,
  useSetFriendAlias,
  usePendingFriendRequestsCount,
} from '@/hooks/useFriends'
import { ShareDialog } from '@/components/sharing/ShareDialog'
import type { PendingInvitation } from '@/lib/types/sharing'
import type { Friend, FriendRequest, SentFriendRequest } from '@/lib/types/friends'
import { toast } from 'sonner'
import { formatDistanceToNow, parseISO, differenceInDays, format } from 'date-fns'
import { sv } from 'date-fns/locale'
import { useAuth } from '@/contexts/AuthContext'

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// ──────────────────────────────────────────────────────────────────────────────
// InvitationCard (befintlig logik, anpassad)
// ──────────────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────────────
// FriendRequestCard
// ──────────────────────────────────────────────────────────────────────────────

function FriendRequestCard({ request }: { request: FriendRequest }) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const { mutateAsync: accept } = useAcceptFriendRequest()
  const { mutateAsync: reject } = useRejectFriendRequest()

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      const result = await accept(request.friendship_id)
      if (!result.success) {
        toast.error('Kunde inte acceptera förfrågan.')
        return
      }
      toast.success(`Du och ${request.requester_name} är nu vänner!`)
    } catch {
      toast.error('Något gick fel.')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      await reject(request.friendship_id)
      toast.success('Förfrågan avvisad.')
    } catch {
      toast.error('Något gick fel.')
    } finally {
      setIsRejecting(false)
    }
  }

  const isBusy = isAccepting || isRejecting

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 text-sm font-semibold shrink-0">
          {getInitials(request.requester_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-neutral-900 truncate">{request.requester_name}</p>
          <p className="text-xs text-neutral-500 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDistanceToNow(parseISO(request.created_at), { addSuffix: true, locale: sv })}
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button size="sm" onClick={handleAccept} disabled={isBusy} className="gap-1.5">
            {isAccepting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserCheck className="h-3.5 w-3.5" />
            )}
            Acceptera
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReject}
            disabled={isBusy}
            className="gap-1.5 text-neutral-500"
          >
            {isRejecting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <UserX className="h-3.5 w-3.5" />
            )}
            Neka
          </Button>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// FriendCard
// ──────────────────────────────────────────────────────────────────────────────

function FriendCard({ friend, onShare }: { friend: Friend; onShare: (friend: Friend) => void }) {
  const [isEditingAlias, setIsEditingAlias] = useState(false)
  const [aliasInput, setAliasInput] = useState(friend.alias ?? '')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const { mutateAsync: setAlias, isPending: isSavingAlias } = useSetFriendAlias()
  const { mutateAsync: removeFriend, isPending: isRemoving } = useRemoveFriend()

  const displayName = friend.alias ?? friend.friend_name

  const handleSaveAlias = async () => {
    try {
      const result = await setAlias({
        friendshipId: friend.friendship_id,
        alias: aliasInput.trim(),
      })
      if (!result.success) {
        toast.error('Kunde inte spara smeknamn.')
        return
      }
      setIsEditingAlias(false)
    } catch {
      toast.error('Något gick fel.')
    }
  }

  const handleCancelAlias = () => {
    setAliasInput(friend.alias ?? '')
    setIsEditingAlias(false)
  }

  const handleRemove = async () => {
    try {
      await removeFriend(friend.friendship_id)
      toast.success(`${displayName} har tagits bort från din vänlista.`)
    } catch {
      toast.error('Något gick fel.')
    }
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold shrink-0">
          {getInitials(displayName)}
        </div>
        <div className="flex-1 min-w-0">
          {/* Namn / alias-redigering */}
          {isEditingAlias ? (
            <div className="flex items-center gap-2">
              <Input
                value={aliasInput}
                onChange={e => setAliasInput(e.target.value.slice(0, 50))}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveAlias()
                  if (e.key === 'Escape') handleCancelAlias()
                }}
                className="h-7 text-sm py-0"
                placeholder="Smeknamn (max 50 tecken)"
                autoFocus
                maxLength={50}
              />
              <button
                onClick={handleSaveAlias}
                disabled={isSavingAlias}
                className="text-primary-600 hover:text-primary-800 transition-colors"
              >
                {isSavingAlias ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
              </button>
              <button
                onClick={handleCancelAlias}
                className="text-neutral-400 hover:text-neutral-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-neutral-900 truncate">{displayName}</p>
              <button
                onClick={() => {
                  setAliasInput(friend.alias ?? '')
                  setIsEditingAlias(true)
                }}
                className="text-neutral-300 hover:text-neutral-500 transition-colors shrink-0"
                title="Byt smeknamn"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {/* Visa riktigt namn om alias är satt */}
          {friend.alias && !isEditingAlias && (
            <p className="text-xs text-neutral-400 truncate">{friend.friend_name}</p>
          )}
          <p className="text-xs text-neutral-400">
            Vänner sedan {format(parseISO(friend.since), 'd MMM yyyy', { locale: sv })}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-neutral-400 hover:text-primary-600"
            title="Dela något med denna vän"
            onClick={() => onShare(friend)}
          >
            <Share2 className="h-4 w-4" />
          </Button>

          {confirmRemove ? (
            <div className="flex items-center gap-1">
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="text-xs text-error-600 hover:text-error-700 font-medium px-2 py-1 rounded hover:bg-error-50 transition-colors"
              >
                {isRemoving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Ja, ta bort'}
              </button>
              <button
                onClick={() => setConfirmRemove(false)}
                className="text-xs text-neutral-500 px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
              >
                Avbryt
              </button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-neutral-400 hover:text-error-600"
              title="Ta bort vän"
              onClick={() => setConfirmRemove(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// SentRequestCard
// ──────────────────────────────────────────────────────────────────────────────

function SentRequestCard({ request }: { request: SentFriendRequest }) {
  const [confirmCancel, setConfirmCancel] = useState(false)
  const { mutateAsync: cancel, isPending } = useCancelFriendRequest()

  const handleCancel = async () => {
    try {
      await cancel(request.friendship_id)
      toast.success('Vänförfrågan ångrad.')
    } catch {
      toast.error('Något gick fel.')
    }
  }

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-lg bg-neutral-50">
      <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-500 text-xs font-semibold shrink-0">
        {getInitials(request.addressee_name)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-800 truncate">{request.addressee_name}</p>
        <p className="text-xs text-neutral-400">
          Skickad{' '}
          {formatDistanceToNow(parseISO(request.created_at), { addSuffix: true, locale: sv })}
        </p>
      </div>
      {confirmCancel ? (
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="text-xs text-error-600 hover:text-error-700 font-medium px-2 py-1 rounded hover:bg-error-50 transition-colors"
          >
            {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Ångra'}
          </button>
          <button
            onClick={() => setConfirmCancel(false)}
            className="text-xs text-neutral-500 px-2 py-1 rounded hover:bg-neutral-100 transition-colors"
          >
            Behåll
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmCancel(true)}
          className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors shrink-0"
        >
          Ångra
        </button>
      )}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// AddFriendDialog
// ──────────────────────────────────────────────────────────────────────────────

function AddFriendDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const { mutateAsync: sendRequest, isPending } = useSendFriendRequest()

  const handleClose = () => {
    setEmail('')
    onOpenChange(false)
  }

  const handleSend = async () => {
    const trimmed = email.trim()
    if (!trimmed) return
    if (trimmed.toLowerCase() === user?.email?.toLowerCase()) {
      toast.error('Du kan inte lägga till dig själv.')
      return
    }
    try {
      await sendRequest(trimmed)
      // Privacy: alltid success-toast
      toast.success('Vänförfrågan skickad!')
      handleClose()
    } catch {
      toast.error('Något gick fel. Försök igen.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary-600" />
            Lägg till vän
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-neutral-500">
            Ange e-postadressen till den person du vill lägga till som vän.
          </p>
          <Input
            type="email"
            placeholder="vän@exempel.se"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            autoFocus
          />
          <p className="text-xs text-neutral-400">
            Om personen finns i CalculEat får de en vänförfrågan.
          </p>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" onClick={handleClose} disabled={isPending}>
              Avbryt
            </Button>
            <Button onClick={handleSend} disabled={!email.trim() || isPending} className="gap-2">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Skicka förfrågan
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// SocialPage
// ──────────────────────────────────────────────────────────────────────────────

export default function SocialPage() {
  const [addFriendOpen, setAddFriendOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<Friend | undefined>(undefined)

  const { data: invitations = [], isLoading: isLoadingInvitations } = usePendingInvitations()
  const { data: friendRequests = [], isLoading: isLoadingRequests } = usePendingFriendRequests()
  const { data: friends = [], isLoading: isLoadingFriends } = useFriends()
  const { data: sentRequests = [] } = useSentFriendRequests()
  // Aktivera Realtime + social feedback toasts
  usePendingFriendRequestsCount()

  const pendingCount = invitations.length + friendRequests.length
  const isLoading = isLoadingInvitations || isLoadingRequests || isLoadingFriends

  const handleShare = (friend: Friend) => {
    setSelectedFriend(friend)
    setShareDialogOpen(true)
  }

  const handleShareClose = (open: boolean) => {
    setShareDialogOpen(open)
    if (!open) setSelectedFriend(undefined)
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">
        {/* Sidhuvud */}
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Social</h1>
          <p className="text-neutral-500 mt-1">Hantera vänner och mottagna delningsinbjudningar.</p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* Sektion: Väntar på åtgärd */}
            {pendingCount > 0 && (
              <section className="space-y-3">
                <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Väntar på åtgärd ({pendingCount})
                </h2>

                {friendRequests.map(req => (
                  <FriendRequestCard key={req.friendship_id} request={req} />
                ))}

                {invitations.map(inv => (
                  <InvitationCard key={inv.id} invitation={inv} />
                ))}
              </section>
            )}

            {/* Sektion: Mina vänner */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Mina vänner {friends.length > 0 && `(${friends.length})`}
                </h2>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setAddFriendOpen(true)}
                  className="gap-1.5"
                >
                  <UserPlus className="h-4 w-4" />
                  Lägg till vän
                </Button>
              </div>

              {friends.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-neutral-50 rounded-xl border border-neutral-200">
                  <Users className="h-10 w-10 text-neutral-300 mb-3" />
                  <p className="text-neutral-500 font-medium">Inga vänner ännu</p>
                  <p className="text-sm text-neutral-400 mt-1 max-w-xs">
                    Lägg till din första vän för att kunna dela livsmedel och recept enklare.
                  </p>
                  <Button size="sm" className="mt-4 gap-1.5" onClick={() => setAddFriendOpen(true)}>
                    <UserPlus className="h-4 w-4" />
                    Lägg till vän
                  </Button>
                </div>
              )}

              {friends.map(friend => (
                <FriendCard key={friend.friendship_id} friend={friend} onShare={handleShare} />
              ))}
            </section>

            {/* Sektion: Skickade förfrågningar */}
            {sentRequests.length > 0 && (
              <section className="space-y-2">
                <h2 className="text-sm font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Skickade förfrågningar ({sentRequests.length})
                </h2>
                <div className="space-y-1">
                  {sentRequests.map(req => (
                    <SentRequestCard key={req.friendship_id} request={req} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      <AddFriendDialog open={addFriendOpen} onOpenChange={setAddFriendOpen} />

      <ShareDialog
        open={shareDialogOpen}
        onOpenChange={handleShareClose}
        preselectedFriend={selectedFriend}
      />
    </DashboardLayout>
  )
}
