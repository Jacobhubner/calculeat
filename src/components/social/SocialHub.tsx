import { useState } from 'react'
import {
  Users,
  UserPlus,
  Apple,
  ChefHat,
  ListOrdered,
  Loader2,
  UserCheck,
  UserX,
  Trash2,
  Share2,
  Pencil,
  Check,
  X,
  MessageCircle,
  ChevronLeft,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  usePendingInvitations,
  useAcceptShareInvitation,
  useRejectShareInvitation,
} from '@/hooks/useShareInvitations'
import {
  useFriends,
  usePendingFriendRequests,
  useSendFriendRequest,
  useAcceptFriendRequest,
  useRejectFriendRequest,
  useRemoveFriend,
  useSetFriendAlias,
  usePendingFriendRequestsCount,
} from '@/hooks/useFriends'
import type { PendingInvitation } from '@/lib/types/sharing'
import type { Friend, FriendRequest } from '@/lib/types/friends'
import { toast } from 'sonner'
import { formatDistanceToNow, parseISO, differenceInDays, format } from 'date-fns'
import { sv } from 'date-fns/locale'

type HubTab = 'friends' | 'activity'
type FriendsView = 'list' | 'profile' | 'add'

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

// ──────────────────────────────────────────────────────────────────────────────
// Mini InvitationCard
// ──────────────────────────────────────────────────────────────────────────────

function MiniInvitationCard({ invitation }: { invitation: PendingInvitation }) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const { mutateAsync: accept } = useAcceptShareInvitation()
  const { mutateAsync: reject } = useRejectShareInvitation()

  const daysLeft = differenceInDays(parseISO(invitation.expires_at), new Date())
  const isExpiringSoon = daysLeft <= 3

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      const result = await accept(invitation.id)
      if (!result.success) {
        const msgs: Record<string, string> = {
          concurrent_accept_detected: 'Importerades redan i ett annat fönster.',
          invitation_expired: 'Inbjudan har gått ut.',
          invitation_already_processed: 'Inbjudan har redan hanterats.',
        }
        toast.error(msgs[result.error ?? ''] ?? 'Något gick fel.')
        return
      }
      if (invitation.item_type === 'food_list') {
        const imp = result.imported_count ?? 0
        const skip = result.skipped_count ?? 0
        toast.success(
          skip > 0
            ? `${imp} livsmedel importerade! (${skip} hoppades över)`
            : `${imp} livsmedel importerade!`
        )
      } else {
        toast.success(
          invitation.item_type === 'recipe' ? 'Receptet importerades!' : 'Livsmedlet importerades!'
        )
      }
    } catch {
      toast.error('Något gick fel. Försök igen.')
    } finally {
      setIsAccepting(false)
    }
  }

  const handleReject = async () => {
    setIsRejecting(true)
    try {
      await reject(invitation.id)
      toast.success('Inbjudan avvisad.')
    } catch {
      toast.error('Något gick fel.')
    } finally {
      setIsRejecting(false)
    }
  }

  const isBusy = isAccepting || isRejecting

  const itemIcon =
    invitation.item_type === 'recipe' ? (
      <ChefHat className="h-4 w-4 text-violet-600" />
    ) : invitation.item_type === 'food_list' ? (
      <ListOrdered className="h-4 w-4 text-violet-600" />
    ) : (
      <Apple className="h-4 w-4 text-violet-600" />
    )

  const typeLabel =
    invitation.item_type === 'recipe'
      ? 'Recept'
      : invitation.item_type === 'food_list'
        ? 'Lista'
        : 'Livsmedel'

  return (
    <div className="rounded-lg border border-neutral-100 p-3 space-y-2 bg-white">
      <div className="flex items-start gap-2">
        <div className="p-1.5 rounded bg-violet-50 shrink-0">{itemIcon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-medium text-neutral-900 truncate">{invitation.item_name}</p>
            <Badge className="text-[9px] px-1 py-0 h-3.5 bg-violet-100 text-violet-700 border-violet-200 shrink-0">
              {typeLabel}
            </Badge>
          </div>
          <p className="text-xs text-neutral-400">från {invitation.sender_name}</p>
          {isExpiringSoon && (
            <p className="text-xs text-amber-600">
              Utgår om {daysLeft <= 0 ? 'snart' : `${daysLeft}d`}
            </p>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAccept} disabled={isBusy} className="flex-1 h-7 text-xs">
          {isAccepting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <UserCheck className="h-3 w-3 mr-1" />
          )}
          {invitation.item_type === 'food_list' ? 'Importera lista' : 'Importera'}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReject}
          disabled={isBusy}
          className="flex-1 h-7 text-xs text-neutral-500"
        >
          {isRejecting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <UserX className="h-3 w-3 mr-1" />
          )}
          Neka
        </Button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// Mini FriendRequestCard
// ──────────────────────────────────────────────────────────────────────────────

function MiniFriendRequestCard({ request }: { request: FriendRequest }) {
  const [isAccepting, setIsAccepting] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const { mutateAsync: accept } = useAcceptFriendRequest()
  const { mutateAsync: reject } = useRejectFriendRequest()

  const handleAccept = async () => {
    setIsAccepting(true)
    try {
      await accept(request.friendship_id)
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
    } catch {
      toast.error('Något gick fel.')
    } finally {
      setIsRejecting(false)
    }
  }

  const isBusy = isAccepting || isRejecting

  return (
    <div className="rounded-lg border border-neutral-100 p-3 space-y-2 bg-white">
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-600 text-xs font-semibold shrink-0">
          {getInitials(request.requester_name)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">{request.requester_name}</p>
          <p className="text-xs text-neutral-400">
            {formatDistanceToNow(parseISO(request.created_at), { addSuffix: true, locale: sv })}
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={handleAccept} disabled={isBusy} className="flex-1 h-7 text-xs">
          {isAccepting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <UserCheck className="h-3 w-3 mr-1" />
          )}
          Acceptera
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleReject}
          disabled={isBusy}
          className="flex-1 h-7 text-xs text-neutral-500"
        >
          {isRejecting ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <UserX className="h-3 w-3 mr-1" />
          )}
          Neka
        </Button>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// FriendProfile (intern vy i hubben)
// ──────────────────────────────────────────────────────────────────────────────

function FriendProfile({
  friend,
  onBack,
  onShare,
}: {
  friend: Friend
  onBack: () => void
  onShare: (friend: Friend) => void
}) {
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
      toast.success('Smeknamn sparat!')
    } catch {
      toast.error('Något gick fel.')
    }
  }

  const handleRemove = async () => {
    try {
      await removeFriend(friend.friendship_id)
      toast.success(`${displayName} har tagits bort från din vänlista.`)
      onBack()
    } catch {
      toast.error('Något gick fel.')
    }
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors px-4 pt-2"
      >
        <ChevronLeft className="h-4 w-4" />
        Tillbaka
      </button>

      {/* Avatar + info */}
      <div className="flex flex-col items-center py-4 gap-2">
        <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-semibold">
          {getInitials(displayName)}
        </div>
        <div className="text-center">
          <p className="font-semibold text-neutral-900">{displayName}</p>
          {friend.alias && <p className="text-sm text-neutral-400">{friend.friend_name}</p>}
          <p className="text-xs text-neutral-400">
            Vänner sedan {format(parseISO(friend.since), 'd MMM yyyy', { locale: sv })}
          </p>
        </div>
      </div>

      {/* Åtgärder */}
      <div className="px-4 pb-4 space-y-2">
        {/* Redigera smeknamn */}
        <div className="rounded-lg border border-neutral-200 overflow-hidden">
          <div className="flex items-center gap-3 p-3">
            <Pencil className="h-4 w-4 text-neutral-400 shrink-0" />
            <div className="flex-1 min-w-0">
              {isEditingAlias ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={aliasInput}
                    onChange={e => setAliasInput(e.target.value.slice(0, 50))}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSaveAlias()
                      if (e.key === 'Escape') {
                        setAliasInput(friend.alias ?? '')
                        setIsEditingAlias(false)
                      }
                    }}
                    placeholder="Smeknamn (max 50)"
                    className="h-7 text-sm"
                    autoFocus
                    maxLength={50}
                  />
                  <button
                    onClick={handleSaveAlias}
                    disabled={isSavingAlias}
                    className="text-primary-600 hover:text-primary-800"
                  >
                    {isSavingAlias ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setAliasInput(friend.alias ?? '')
                      setIsEditingAlias(false)
                    }}
                    className="text-neutral-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditingAlias(true)}
                  className="text-sm text-neutral-700 hover:text-primary-600 transition-colors text-left w-full"
                >
                  {friend.alias ? `Smeknamn: "${friend.alias}"` : 'Sätt smeknamn'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Dela */}
        <button
          type="button"
          onClick={() => onShare(friend)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-primary-50 hover:border-primary-200 transition-colors text-left"
        >
          <Share2 className="h-4 w-4 text-primary-600 shrink-0" />
          <span className="text-sm font-medium text-neutral-700">Starta delning</span>
        </button>

        {/* Meddelande (disabled) */}
        <div className="flex items-center gap-3 p-3 rounded-lg border border-neutral-100 opacity-50 cursor-not-allowed">
          <MessageCircle className="h-4 w-4 text-neutral-400 shrink-0" />
          <div>
            <span className="text-sm text-neutral-500">Skicka meddelande</span>
            <span className="text-xs text-neutral-400 ml-2">Kommer snart</span>
          </div>
        </div>

        {/* Ta bort vän */}
        {confirmRemove ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
            <p className="text-sm text-red-700 font-medium">Ta bort {displayName} som vän?</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setConfirmRemove(false)}
                className="flex-1 h-7 text-xs"
              >
                Avbryt
              </Button>
              <Button
                size="sm"
                onClick={handleRemove}
                disabled={isRemoving}
                className="flex-1 h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
              >
                {isRemoving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Ja, ta bort'}
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            className="w-full flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-red-50 hover:border-red-200 transition-colors text-left"
          >
            <Trash2 className="h-4 w-4 text-red-400 shrink-0" />
            <span className="text-sm text-neutral-500 hover:text-red-600 transition-colors">
              Ta bort vän
            </span>
          </button>
        )}
      </div>
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// SocialHub — main component
// ──────────────────────────────────────────────────────────────────────────────

interface SocialHubProps {
  onClose: () => void
  onOpenShareDialog: (friend?: Friend) => void
}

export function SocialHub({ onClose: _onClose, onOpenShareDialog }: SocialHubProps) {
  const [tab, setTab] = useState<HubTab>('friends')
  const [friendsView, setFriendsView] = useState<FriendsView>('list')
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [friendSearch, setFriendSearch] = useState('')
  const [addEmail, setAddEmail] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const { data: friends = [] } = useFriends()
  const { data: friendRequests = [] } = usePendingFriendRequests()
  const { data: pendingInvitations = [] } = usePendingInvitations()
  const { data: pendingCount = 0 } = usePendingFriendRequestsCount()
  const { mutateAsync: sendFriendRequest } = useSendFriendRequest()

  const activityCount = (pendingCount as number) + pendingInvitations.length

  const filteredFriends = friends.filter(f => {
    if (!friendSearch.trim()) return true
    return (f.alias ?? f.friend_name).toLowerCase().includes(friendSearch.toLowerCase())
  })

  const handleAddFriend = async () => {
    if (!addEmail.trim()) return
    setIsAdding(true)
    try {
      const result = await sendFriendRequest(addEmail.trim())
      if (result.success) {
        toast.success('Vänförfrågan skickad!')
        setAddEmail('')
        setFriendsView('list')
      } else {
        toast.error('Kunde inte skicka förfrågan.')
      }
    } catch {
      toast.error('Något gick fel.')
    } finally {
      setIsAdding(false)
    }
  }

  const handleShare = (friend: Friend) => {
    onOpenShareDialog(friend)
  }

  const handleOpenProfile = (friend: Friend) => {
    setSelectedFriend(friend)
    setFriendsView('profile')
  }

  return (
    <>
      {/* Header */}
      <div className="px-4 pt-4 pb-2 border-b border-neutral-100 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-neutral-900">Social</h2>
        </div>

        {/* Tab-knappar */}
        <div className="flex gap-1">
          {[
            { id: 'friends' as HubTab, label: 'Vänner', count: 0 },
            { id: 'activity' as HubTab, label: 'Aktivitet', count: activityCount },
          ].map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-primary-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`text-[10px] rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none ${
                    tab === t.id ? 'bg-white/30 text-white' : 'bg-primary-100 text-primary-700'
                  }`}
                >
                  {t.count > 99 ? '99+' : t.count}
                </span>
              )}
            </button>
          ))}
          {/* Meddelanden — disabled */}
          <button
            type="button"
            disabled
            title="Kommer snart"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-neutral-300 cursor-not-allowed"
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Meddelanden
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Vänner-tab ── */}
        {tab === 'friends' && (
          <div>
            {friendsView === 'list' && (
              <div className="p-4 space-y-3">
                {friends.length > 4 && (
                  <Input
                    placeholder="Sök vän..."
                    value={friendSearch}
                    onChange={e => setFriendSearch(e.target.value)}
                    className="text-sm"
                  />
                )}

                {friends.length === 0 ? (
                  <div className="text-center py-8 space-y-2">
                    <Users className="h-10 w-10 text-neutral-200 mx-auto" />
                    <p className="text-sm text-neutral-400">Du har inga vänner ännu</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {filteredFriends.map(friend => (
                      <button
                        key={friend.friendship_id}
                        type="button"
                        onClick={() => handleOpenProfile(friend)}
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-neutral-50 transition-colors text-left"
                      >
                        <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold shrink-0">
                          {getInitials(friend.alias ?? friend.friend_name)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {friend.alias ?? friend.friend_name}
                          </p>
                          {friend.alias && (
                            <p className="text-xs text-neutral-400 truncate">
                              {friend.friend_name}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Åtgärdsknappar */}
                <div className="pt-2 space-y-2 border-t border-neutral-100">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-neutral-600"
                    onClick={() => setFriendsView('add')}
                  >
                    <UserPlus className="h-4 w-4" />
                    Lägg till vän
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 text-neutral-600"
                    onClick={() => onOpenShareDialog(undefined)}
                  >
                    <Share2 className="h-4 w-4" />
                    Starta delning
                  </Button>
                </div>
              </div>
            )}

            {friendsView === 'add' && (
              <div className="p-4 space-y-4">
                <button
                  type="button"
                  onClick={() => setFriendsView('list')}
                  className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Tillbaka
                </button>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-neutral-700">Lägg till vän via e-post</p>
                  <Input
                    type="email"
                    placeholder="vän@exempel.se"
                    value={addEmail}
                    onChange={e => setAddEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddFriend()}
                    autoFocus
                  />
                  <p className="text-xs text-neutral-400">
                    Om personen finns i CalculEat får de en vänförfrågan.
                  </p>
                </div>
                <Button
                  onClick={handleAddFriend}
                  disabled={!addEmail.trim() || isAdding}
                  className="w-full gap-2"
                >
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                  Skicka förfrågan
                </Button>
              </div>
            )}

            {friendsView === 'profile' && selectedFriend && (
              <FriendProfile
                friend={selectedFriend}
                onBack={() => setFriendsView('list')}
                onShare={handleShare}
              />
            )}
          </div>
        )}

        {/* ── Aktivitet-tab ── */}
        {tab === 'activity' && (
          <div className="p-4 space-y-4">
            {/* Vänförfrågningar */}
            {friendRequests.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                  Vänförfrågningar
                </p>
                {friendRequests.map(req => (
                  <MiniFriendRequestCard key={req.friendship_id} request={req} />
                ))}
              </div>
            )}

            {/* Delningsförfrågningar */}
            {pendingInvitations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wide">
                  Delningsförfrågningar
                </p>
                {pendingInvitations.map(inv => (
                  <MiniInvitationCard key={inv.id} invitation={inv} />
                ))}
              </div>
            )}

            {friendRequests.length === 0 && pendingInvitations.length === 0 && (
              <div className="text-center py-10 space-y-2">
                <p className="text-2xl">🎉</p>
                <p className="text-sm font-medium text-neutral-600">Allt är lugnt!</p>
                <p className="text-xs text-neutral-400">Inga väntande åtgärder.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
