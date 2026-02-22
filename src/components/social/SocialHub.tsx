import { useState, useRef, useEffect } from 'react'
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
  Send,
  ArrowLeft,
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
import {
  useConversations,
  useMessages,
  useSendMessage,
  useMarkMessagesRead,
  useUnreadMessageCount,
} from '@/hooks/useMessages'
import type { PendingInvitation } from '@/lib/types/sharing'
import type { Friend, FriendRequest } from '@/lib/types/friends'
import type { Conversation, Message } from '@/lib/types/messages'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import {
  formatDistanceToNow,
  parseISO,
  differenceInDays,
  format,
  differenceInMinutes,
} from 'date-fns'
import { sv } from 'date-fns/locale'

type HubTab = 'friends' | 'activity' | 'messages'
type FriendsView = 'list' | 'profile' | 'add'
type MessagesView = 'conversations' | 'thread'

function getInitials(name: string) {
  return name
    .split(/[\s@]/)
    .filter(Boolean)
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
  onMessage,
}: {
  friend: Friend
  onBack: () => void
  onShare: (friend: Friend) => void
  onMessage: (friend: Friend) => void
}) {
  const [isEditingAlias, setIsEditingAlias] = useState(false)
  const [aliasInput, setAliasInput] = useState(friend.alias ?? '')
  const [confirmRemove, setConfirmRemove] = useState(false)
  const { mutateAsync: setAlias, isPending: isSavingAlias } = useSetFriendAlias()
  const { mutateAsync: removeFriend, isPending: isRemoving } = useRemoveFriend()

  // Primärt: alias om satt, annars email
  const displayName = friend.alias ?? friend.friend_email

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
          {/* Visa alltid email som subtext */}
          <p className="text-sm text-neutral-400">{friend.friend_email}</p>
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

        {/* Skicka meddelande */}
        <button
          type="button"
          onClick={() => onMessage(friend)}
          className="w-full flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-primary-50 hover:border-primary-200 transition-colors text-left"
        >
          <MessageCircle className="h-4 w-4 text-primary-600 shrink-0" />
          <span className="text-sm font-medium text-neutral-700">Skicka meddelande</span>
        </button>

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
// ConversationList
// ──────────────────────────────────────────────────────────────────────────────

function ConversationList({ onOpenThread }: { onOpenThread: (conv: Conversation) => void }) {
  const { data: conversations = [], isLoading } = useConversations()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
      </div>
    )
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-10 px-4 space-y-2">
        <MessageCircle className="h-10 w-10 text-neutral-200 mx-auto" />
        <p className="text-sm font-medium text-neutral-500">Inga konversationer än</p>
        <p className="text-xs text-neutral-400">
          Öppna en vän och tryck &quot;Skicka meddelande&quot; för att starta.
        </p>
      </div>
    )
  }

  return (
    <div className="divide-y divide-neutral-100">
      {conversations.map(conv => {
        const displayName = conv.friend_alias ?? conv.friend_name
        const isUnread = conv.unread_count > 0
        return (
          <button
            key={conv.friendship_id}
            type="button"
            onClick={() => onOpenThread(conv)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors text-left"
          >
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold shrink-0">
              {getInitials(displayName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-sm truncate ${isUnread ? 'font-semibold text-neutral-900' : 'font-medium text-neutral-700'}`}
                >
                  {displayName}
                </p>
                {conv.last_message_at && (
                  <p className="text-[10px] text-neutral-400 shrink-0">
                    {formatDistanceToNow(parseISO(conv.last_message_at), {
                      addSuffix: false,
                      locale: sv,
                    })}
                  </p>
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <p
                  className={`text-xs truncate ${isUnread ? 'text-neutral-700' : 'text-neutral-400'}`}
                >
                  {conv.last_message_content ?? ''}
                </p>
                {isUnread && (
                  <span className="shrink-0 flex items-center justify-center bg-primary-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-4 px-1 leading-none">
                    {conv.unread_count > 99 ? '99+' : conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ──────────────────────────────────────────────────────────────────────────────
// MessageThread
// ──────────────────────────────────────────────────────────────────────────────

function MessageThread({
  conversation,
  onBack,
}: {
  conversation: Conversation
  onBack: () => void
}) {
  const { user } = useAuth()
  const [input, setInput] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isFirstLoad = useRef(true)

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useMessages(
    conversation.friendship_id
  )

  const { mutateAsync: sendMessage, isPending: isSending } = useSendMessage()
  useMarkMessagesRead(conversation.friendship_id)

  // Bygg platt meddelandelista: RPC ger nyaste-först, vi reverserar
  const messages: Message[] = data
    ? data.pages
        .slice()
        .reverse()
        .flatMap(page => [...page].reverse())
    : []

  // Auto-scroll till botten vid första laddning
  useEffect(() => {
    if (!isLoading && isFirstLoad.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      isFirstLoad.current = false
    }
  }, [isLoading, messages.length])

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`
  }, [input])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || isSending) return
    setInput('')
    try {
      const result = await sendMessage({
        friendshipId: conversation.friendship_id,
        content: trimmed,
      })
      if (!result.success) {
        toast.error(
          result.error === 'empty_content'
            ? 'Meddelandet är tomt.'
            : result.error === 'content_too_long'
              ? 'Meddelandet är för långt (max 2000 tecken).'
              : 'Något gick fel.'
        )
        setInput(trimmed)
        return
      }
      // Scrolla till botten efter eget skickat meddelande
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
      }, 50)
    } catch {
      toast.error('Något gick fel.')
      setInput(trimmed)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const displayName = conversation.friend_alias ?? conversation.friend_name
  const charCount = input.length
  const showCharCount = charCount > 1800
  const isOverLimit = charCount > 2000

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tråd-header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-neutral-100 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="p-1 text-neutral-400 hover:text-neutral-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold shrink-0">
          {getInitials(displayName)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">{displayName}</p>
          <p className="text-[10px] text-neutral-400 truncate">{conversation.friend_name}</p>
        </div>
      </div>

      {/* Meddelandelista */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 px-3 py-3 space-y-1">
        {isLoading && (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
          </div>
        )}

        {hasNextPage && (
          <div className="flex justify-center pb-2">
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-xs text-primary-600 hover:text-primary-800 transition-colors"
            >
              {isFetchingNextPage ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                'Ladda äldre meddelanden'
              )}
            </button>
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <div className="text-center py-8">
            <p className="text-xs text-neutral-400">Inga meddelanden än. Skriv något!</p>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isOwn = msg.sender_id === user?.id
          const prev = idx > 0 ? messages[idx - 1] : null
          const showTimestamp =
            !prev || differenceInMinutes(parseISO(msg.created_at), parseISO(prev.created_at)) > 10

          return (
            <div key={msg.id}>
              {showTimestamp && (
                <div className="flex justify-center py-1">
                  <span className="text-[10px] text-neutral-400">
                    {format(parseISO(msg.created_at), 'd MMM, HH:mm', { locale: sv })}
                  </span>
                </div>
              )}
              <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    isOwn
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : 'bg-neutral-100 text-neutral-900 rounded-bl-sm'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Inmatningsfält */}
      <div className="shrink-0 border-t border-neutral-100 px-3 py-2">
        {showCharCount && (
          <p
            className={`text-[10px] mb-1 text-right ${isOverLimit ? 'text-red-500' : 'text-neutral-400'}`}
          >
            {charCount}/2000
          </p>
        )}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Skriv ett meddelande..."
            rows={1}
            className="flex-1 resize-none rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            style={{ maxHeight: '120px' }}
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isSending || isOverLimit}
            className="shrink-0 h-9 w-9 rounded-xl bg-primary-600 text-white flex items-center justify-center hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </button>
        </div>
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
  const [messagesView, setMessagesView] = useState<MessagesView>('conversations')
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null)

  const { data: friends = [] } = useFriends()
  const { data: friendRequests = [] } = usePendingFriendRequests()
  const { data: pendingInvitations = [] } = usePendingInvitations()
  const { data: pendingCount = 0 } = usePendingFriendRequestsCount()
  const { data: conversations = [] } = useConversations()
  const unreadMessageCount = useUnreadMessageCount()
  const { mutateAsync: sendFriendRequest } = useSendFriendRequest()

  const activityCount = (pendingCount as number) + pendingInvitations.length

  const filteredFriends = friends.filter(f => {
    if (!friendSearch.trim()) return true
    return (f.alias ?? f.friend_email).toLowerCase().includes(friendSearch.toLowerCase())
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

  const handleMessage = (friend: Friend) => {
    const existingConv = conversations.find(c => c.friendship_id === friend.friendship_id)
    const conv: Conversation = existingConv ?? {
      friendship_id: friend.friendship_id,
      friend_name: friend.friend_email,
      friend_alias: friend.alias ?? null,
      last_message_content: null,
      last_message_at: null,
      last_message_sender_id: null,
      unread_count: 0,
    }
    setSelectedConversation(conv)
    setMessagesView('thread')
    setTab('messages')
    setFriendsView('list')
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
            { id: 'messages' as HubTab, label: 'Meddelanden', count: unreadMessageCount },
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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
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
                          {getInitials(friend.alias ?? friend.friend_email)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate">
                            {friend.alias ?? friend.friend_email}
                          </p>
                          <p className="text-xs text-neutral-400 truncate">{friend.friend_email}</p>
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
                onMessage={handleMessage}
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

        {/* ── Meddelanden-tab ── */}
        {tab === 'messages' && (
          <div className="flex flex-col h-full min-h-0">
            {messagesView === 'conversations' && (
              <ConversationList
                onOpenThread={conv => {
                  setSelectedConversation(conv)
                  setMessagesView('thread')
                }}
              />
            )}
            {messagesView === 'thread' && selectedConversation && (
              <MessageThread
                conversation={selectedConversation}
                onBack={() => {
                  setMessagesView('conversations')
                  setSelectedConversation(null)
                }}
              />
            )}
          </div>
        )}
      </div>
    </>
  )
}
