import { useState } from 'react'
import { Share2, Apple, ChefHat, Search, Send, Users, ChevronDown, ChevronUp } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useShareableFoodItems, useShareableRecipes } from '@/hooks/useShareableItems'
import { useSendShareInvitation } from '@/hooks/useShareInvitations'
import { useFriends, useSendShareInvitationToFriend } from '@/hooks/useFriends'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import type { Friend } from '@/lib/types/friends'

type Step = 'type' | 'select' | 'recipient'
type ItemType = 'food_item' | 'recipe'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedFriend?: Friend
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function ShareDialog({ open, onOpenChange, preselectedFriend }: ShareDialogProps) {
  const { user } = useAuth()
  const [step, setStep] = useState<Step>(preselectedFriend ? 'select' : 'type')
  const [itemType, setItemType] = useState<ItemType>('food_item')
  const [selectedId, setSelectedId] = useState<string>('')
  const [selectedName, setSelectedName] = useState<string>('')
  const [search, setSearch] = useState('')
  const [email, setEmail] = useState('')
  const [showEmailFallback, setShowEmailFallback] = useState(false)
  const [friendSearch, setFriendSearch] = useState('')

  const { data: foodItems = [] } = useShareableFoodItems()
  const { data: recipes = [] } = useShareableRecipes()
  const { data: friends = [] } = useFriends()
  const { mutateAsync: sendInvitation, isPending: isSendingEmail } = useSendShareInvitation()
  const { mutateAsync: sendToFriend, isPending: isSendingFriend } = useSendShareInvitationToFriend()

  const isPending = isSendingEmail || isSendingFriend
  const hasFriends = friends.length > 0

  const reset = () => {
    setStep('type')
    setItemType('food_item')
    setSelectedId('')
    setSelectedName('')
    setSearch('')
    setEmail('')
    setFriendSearch('')
    setShowEmailFallback(false)
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) reset()
    onOpenChange(val)
  }

  const handleTypeSelect = (type: ItemType) => {
    setItemType(type)
    setSearch('')
    setStep('select')
  }

  const handleItemSelect = (id: string, name: string) => {
    setSelectedId(id)
    setSelectedName(name)
    setEmail('')
    setFriendSearch('')
    setShowEmailFallback(false)
    setStep('recipient')
  }

  const handleSendToFriend = async (friend: Friend) => {
    try {
      const result = await sendToFriend({
        itemId: selectedId,
        itemType,
        friendUserId: friend.friend_id,
      })
      if (!result.success) {
        const errorMessages: Record<string, string> = {
          not_friends: 'Du är inte längre vän med den här personen.',
          not_owner_or_not_manual: 'Du kan bara dela objekt du har skapat själv.',
        }
        toast.error(errorMessages[result.error ?? ''] ?? 'Något gick fel.')
        return
      }
      toast.success(`Inbjudan skickad till ${friend.alias ?? friend.friend_name}`)
      handleOpenChange(false)
    } catch {
      toast.error('Något gick fel. Försök igen.')
    }
  }

  const handleSendByEmail = async () => {
    if (!email.trim()) return
    if (email.trim().toLowerCase() === user?.email?.toLowerCase()) {
      toast.error('Du kan inte dela med dig själv.')
      return
    }
    try {
      const result = await sendInvitation({
        itemId: selectedId,
        itemType,
        recipientEmail: email.trim(),
      })
      if (result.success === false) {
        const errorMessages: Record<string, string> = {
          not_owner: 'Du kan bara dela objekt du har skapat själv.',
          cannot_share_non_manual_item: 'Det valda objektet kan inte delas.',
        }
        toast.error(errorMessages[result.error ?? ''] ?? 'Något gick fel.')
        return
      }
      toast.success(`Inbjudan skickad till ${email.trim()}`)
      handleOpenChange(false)
    } catch {
      toast.error('Något gick fel. Försök igen.')
    }
  }

  const filteredItems =
    itemType === 'food_item'
      ? foodItems.filter(fi => fi.name.toLowerCase().includes(search.toLowerCase()))
      : recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  const filteredFriends = friends.filter(f => {
    const displayName = f.alias ?? f.friend_name
    return displayName.toLowerCase().includes(friendSearch.toLowerCase())
  })

  // Rubrik baserat på förvald vän
  const getTitle = () => {
    if (step === 'type') return 'Dela med en vän'
    if (step === 'select') {
      if (preselectedFriend)
        return `Dela med ${preselectedFriend.alias ?? preselectedFriend.friend_name}`
      return itemType === 'food_item' ? 'Välj livsmedel' : 'Välj recept'
    }
    return `Dela "${selectedName}"`
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary-600" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        {/* Steg 1: Välj typ */}
        {step === 'type' && (
          <div className="space-y-3 py-2">
            <p className="text-sm text-neutral-500">Vad vill du dela?</p>
            <button
              onClick={() => handleTypeSelect('food_item')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
            >
              <Apple className="h-8 w-8 text-primary-600 shrink-0" />
              <div>
                <p className="font-medium text-neutral-900">Livsmedel</p>
                <p className="text-sm text-neutral-500">Dela ett eget livsmedel du skapat</p>
              </div>
            </button>
            <button
              onClick={() => handleTypeSelect('recipe')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-neutral-200 hover:border-primary-300 hover:bg-primary-50 transition-colors text-left"
            >
              <ChefHat className="h-8 w-8 text-primary-600 shrink-0" />
              <div>
                <p className="font-medium text-neutral-900">Recept</p>
                <p className="text-sm text-neutral-500">Dela ett av dina recept med ingredienser</p>
              </div>
            </button>
          </div>
        )}

        {/* Steg 2: Välj objekt */}
        {step === 'select' && (
          <div className="space-y-3 py-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Sök..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
                autoFocus
              />
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1 -mx-1 px-1">
              {filteredItems.length === 0 && (
                <p className="text-sm text-neutral-400 text-center py-6">
                  {search
                    ? 'Inga träffar.'
                    : itemType === 'food_item'
                      ? 'Inga egna livsmedel att dela (enbart CalculEat-skapade objekt kan delas).'
                      : 'Inga recept att dela.'}
                </p>
              )}
              {filteredItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => handleItemSelect(item.id, item.name)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors text-left"
                >
                  {itemType === 'food_item' ? (
                    <Apple className="h-4 w-4 text-neutral-400 shrink-0" />
                  ) : (
                    <ChefHat className="h-4 w-4 text-neutral-400 shrink-0" />
                  )}
                  <span className="text-sm text-neutral-900 flex-1 truncate">{item.name}</span>
                  {'calories' in item && (
                    <span className="text-xs text-neutral-400 shrink-0">{item.calories} kcal</span>
                  )}
                </button>
              ))}
            </div>
            <div className="pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => (preselectedFriend ? handleOpenChange(false) : setStep('type'))}
              >
                {preselectedFriend ? 'Avbryt' : 'Tillbaka'}
              </Button>
            </div>
          </div>
        )}

        {/* Steg 3: Välj mottagare */}
        {step === 'recipient' && (
          <div className="space-y-4 py-2">
            {/* Vänlista */}
            {hasFriends && (
              <div className="space-y-2">
                {/* Om förvald vän: visa direkt bekräftelse */}
                {preselectedFriend ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-primary-50 border border-primary-200">
                      <div className="h-9 w-9 rounded-full bg-primary-200 flex items-center justify-center text-primary-700 text-sm font-semibold shrink-0">
                        {getInitials(preselectedFriend.alias ?? preselectedFriend.friend_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {preselectedFriend.alias ?? preselectedFriend.friend_name}
                        </p>
                        <p className="text-xs text-neutral-500 truncate">
                          {preselectedFriend.friend_email}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => setStep('select')}
                        disabled={isPending}
                      >
                        Tillbaka
                      </Button>
                      <Button
                        onClick={() => handleSendToFriend(preselectedFriend)}
                        disabled={isPending}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {isPending ? 'Skickar...' : 'Skicka inbjudan'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      Mina vänner
                    </p>
                    {friends.length > 4 && (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                        <Input
                          placeholder="Sök vän..."
                          value={friendSearch}
                          onChange={e => setFriendSearch(e.target.value)}
                          className="pl-8 h-8 text-sm"
                        />
                      </div>
                    )}
                    <div className="max-h-48 overflow-y-auto space-y-1 -mx-1 px-1">
                      {filteredFriends.map(friend => (
                        <button
                          key={friend.friendship_id}
                          onClick={() => handleSendToFriend(friend)}
                          disabled={isPending}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-neutral-100 active:bg-neutral-200 transition-colors text-left disabled:opacity-50"
                        >
                          <div className="h-8 w-8 rounded-full bg-neutral-200 flex items-center justify-center text-neutral-600 text-xs font-semibold shrink-0">
                            {getInitials(friend.alias ?? friend.friend_name)}
                          </div>
                          <div className="min-w-0 flex-1">
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
                  </>
                )}
              </div>
            )}

            {/* E-post fallback */}
            {!preselectedFriend && (
              <>
                {hasFriends && (
                  <button
                    onClick={() => setShowEmailFallback(v => !v)}
                    className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                  >
                    {showEmailFallback ? (
                      <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5" />
                    )}
                    Skicka till annan e-post
                  </button>
                )}

                {(!hasFriends || showEmailFallback) && (
                  <div className="space-y-2">
                    {!hasFriends && (
                      <p className="text-sm text-neutral-500">
                        Du har inga vänner i CalculEat ännu. Skicka med e-post:
                      </p>
                    )}
                    <Input
                      type="email"
                      placeholder="mottagare@exempel.se"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSendByEmail()}
                      autoFocus={!hasFriends}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => setStep('select')}
                        disabled={isPending}
                      >
                        Tillbaka
                      </Button>
                      <Button
                        onClick={handleSendByEmail}
                        disabled={!email.trim() || isPending}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        {isPending ? 'Skickar...' : 'Skicka inbjudan'}
                      </Button>
                    </div>
                  </div>
                )}

                {hasFriends && !showEmailFallback && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="ghost" onClick={() => setStep('select')} disabled={isPending}>
                      Tillbaka
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
