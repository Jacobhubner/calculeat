import { useState, useRef, useCallback } from 'react'
import {
  Share2,
  Apple,
  ChefHat,
  Search,
  Send,
  Users,
  ListOrdered,
  ChevronLeft,
  Check,
  X,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useShareableFoodItems,
  useShareableRecipes,
  useShareableFoodListCount,
} from '@/hooks/useShareableItems'
import { useSendShareInvitation, useCheckUserExists } from '@/hooks/useShareInvitations'
import { useFriends, useSendShareInvitationToFriend } from '@/hooks/useFriends'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import type { Friend } from '@/lib/types/friends'
import { useTranslation } from 'react-i18next'

type Step = 'recipient' | 'content' | 'confirm'
type RecipientTab = 'friend' | 'email'
type ContentType = 'food_item' | 'recipe' | 'food_list'

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
  const { t } = useTranslation('social')
  const { user } = useAuth()

  const [step, setStep] = useState<Step>(preselectedFriend ? 'content' : 'recipient')
  const [recipientTab, setRecipientTab] = useState<RecipientTab>('friend')
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(preselectedFriend ?? null)
  const [email, setEmail] = useState('')
  const [emailStatus, setEmailStatus] = useState<'idle' | 'checking' | 'found' | 'not_found'>(
    'idle'
  )
  const [friendSearch, setFriendSearch] = useState('')
  const [contentType, setContentType] = useState<ContentType>('food_item')
  const [selectedId, setSelectedId] = useState<string>('')
  const [selectedName, setSelectedName] = useState<string>('')
  const [itemSearch, setItemSearch] = useState('')

  const emailDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: foodItems = [] } = useShareableFoodItems()
  const { data: recipes = [] } = useShareableRecipes()
  const { count: foodListCount, isLoading: foodListLoading } = useShareableFoodListCount()
  const { data: friends = [] } = useFriends()
  const { mutateAsync: sendByEmail, isPending: isSendingEmail } = useSendShareInvitation()
  const { mutateAsync: sendToFriend, isPending: isSendingFriend } = useSendShareInvitationToFriend()
  const { mutateAsync: checkEmail } = useCheckUserExists()

  const handleEmailChange = useCallback(
    (value: string) => {
      setEmail(value)
      if (emailDebounceRef.current) clearTimeout(emailDebounceRef.current)
      if (!value.trim() || value.trim() === user?.email) {
        setEmailStatus('idle')
        return
      }
      setEmailStatus('checking')
      emailDebounceRef.current = setTimeout(async () => {
        try {
          const result = await checkEmail(value.trim())
          setEmailStatus(result.exists ? 'found' : 'not_found')
        } catch {
          setEmailStatus('idle')
        }
      }, 600)
    },
    [user?.email, checkEmail]
  )

  const isPending = isSendingEmail || isSendingFriend

  const reset = () => {
    setStep(preselectedFriend ? 'content' : 'recipient')
    setRecipientTab('friend')
    setSelectedFriend(preselectedFriend ?? null)
    setEmail('')
    setEmailStatus('idle')
    setFriendSearch('')
    setContentType('food_item')
    setSelectedId('')
    setSelectedName('')
    setItemSearch('')
  }

  const handleOpenChange = (val: boolean) => {
    if (!val) reset()
    onOpenChange(val)
  }

  const filteredFriends = friends.filter(f => {
    if (!friendSearch.trim()) return true
    const q = friendSearch.toLowerCase()
    return (f.alias ?? f.friend_name).toLowerCase().includes(q)
  })

  const filteredFoodItems = foodItems.filter(
    f => !itemSearch.trim() || f.name.toLowerCase().includes(itemSearch.toLowerCase())
  )

  const filteredRecipes = recipes.filter(
    r => !itemSearch.trim() || r.name.toLowerCase().includes(itemSearch.toLowerCase())
  )

  const recipientLabel = selectedFriend
    ? (selectedFriend.alias ?? selectedFriend.friend_name)
    : email

  const handleFriendSelect = (friend: Friend) => {
    setSelectedFriend(friend)
    setStep('content')
  }

  const handleItemSelect = (id: string, name: string) => {
    setSelectedId(id)
    setSelectedName(name)
    setStep('confirm')
  }

  const handleFoodListSelect = () => {
    setSelectedId('')
    setSelectedName(t('share.food_list.count_label', { count: foodListCount }))
    setStep('confirm')
  }

  const handleSend = async () => {
    if (!user) return
    try {
      if (contentType === 'food_list') {
        if (selectedFriend) {
          const result = await sendToFriend({
            itemId: null,
            itemType: 'food_list',
            friendUserId: selectedFriend.friend_id,
          })
          if (!result.success) {
            toast.error(
              result.error === 'empty_food_list'
                ? t('share.error.empty_food_list')
                : t('share.error.generic')
            )
            return
          }
        } else {
          const result = await sendByEmail({
            itemId: null,
            itemType: 'food_list',
            recipientEmail: email,
          })
          if (!result.success) {
            toast.error(
              result.error === 'empty_food_list'
                ? t('share.error.empty_food_list')
                : t('share.error.generic')
            )
            return
          }
        }
        toast.success(t('share.toast.food_list_shared', { count: foodListCount }))
      } else {
        if (selectedFriend) {
          const result = await sendToFriend({
            itemId: selectedId,
            itemType: contentType,
            friendUserId: selectedFriend.friend_id,
          })
          if (!result.success) {
            toast.error(t('share.error.friend_share_failed'))
            return
          }
        } else {
          await sendByEmail({ itemId: selectedId, itemType: contentType, recipientEmail: email })
        }
        toast.success(t('share.toast.item_shared', { name: selectedName }))
      }
      handleOpenChange(false)
    } catch (err) {
      console.error('[ShareDialog] delningsfel:', err)
      toast.error(t('share.error.send_failed'))
    }
  }

  const getTitle = () => {
    if (step === 'recipient') return t('share.title.recipient')
    if (step === 'content') return t('share.title.content', { recipient: recipientLabel })
    return contentType === 'food_list' ? t('share.title.confirm_list') : t('share.title.confirm_item', { name: selectedName })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary-600" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        {/* ── Steg 1: Välj mottagare ── */}
        {step === 'recipient' && (
          <div className="space-y-4">
            <div className="flex rounded-lg border border-neutral-200 p-1 gap-1">
              <button
                type="button"
                onClick={() => setRecipientTab('friend')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  recipientTab === 'friend'
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <Users className="h-4 w-4" />
                {t('share.recipient.tab_friends')}
              </button>
              <button
                type="button"
                onClick={() => setRecipientTab('email')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                  recipientTab === 'email'
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {t('share.recipient.tab_email')}
              </button>
            </div>

            {recipientTab === 'friend' && (
              <div className="space-y-2">
                {friends.length === 0 ? (
                  <p className="text-sm text-neutral-500 text-center py-4">
                    {t('share.recipient.no_friends')}
                  </p>
                ) : (
                  <>
                    {friends.length > 4 && (
                      <Input
                        placeholder={t('share.recipient.search_placeholder')}
                        value={friendSearch}
                        onChange={e => setFriendSearch(e.target.value)}
                        className="text-sm"
                      />
                    )}
                    <div className="space-y-1 max-h-52 overflow-y-auto">
                      {filteredFriends.map(friend => (
                        <button
                          key={friend.friendship_id}
                          type="button"
                          onClick={() => handleFriendSelect(friend)}
                          className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-primary-50 transition-colors text-left"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-semibold shrink-0">
                            {getInitials(friend.alias ?? friend.friend_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {friend.alias ?? `@${friend.friend_username ?? friend.friend_name}`}
                            </p>
                            {friend.alias && (
                              <p className="text-xs text-neutral-400 truncate">
                                @{friend.friend_username ?? friend.friend_name}
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

            {recipientTab === 'email' && (
              <div className="space-y-3">
                <div className="space-y-1">
                  <Input
                    type="email"
                    placeholder={t('share.recipient.email_placeholder')}
                    value={email}
                    onChange={e => handleEmailChange(e.target.value)}
                    onKeyDown={e =>
                      e.key === 'Enter' && emailStatus === 'found' && setStep('content')
                    }
                    autoFocus
                  />
                  {email.trim() && emailStatus === 'checking' && (
                    <p className="text-xs text-neutral-400 pl-1">{t('share.recipient.checking')}</p>
                  )}
                  {emailStatus === 'found' && (
                    <p className="text-xs text-green-600 pl-1 flex items-center gap-1">
                      <Check className="h-3 w-3" /> {t('share.recipient.user_found')}
                    </p>
                  )}
                  {emailStatus === 'not_found' && (
                    <p className="text-xs text-red-500 pl-1 flex items-center gap-1">
                      <X className="h-3 w-3" /> {t('share.recipient.user_not_found')}
                    </p>
                  )}
                </div>
                <Button
                  onClick={() => setStep('content')}
                  disabled={emailStatus !== 'found'}
                  className="w-full"
                >
                  {t('share.recipient.next')}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── Steg 2: Välj innehåll ── */}
        {step === 'content' && (
          <div className="space-y-4">
            {!preselectedFriend && (
              <button
                type="button"
                onClick={() => setStep('recipient')}
                className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                {recipientLabel}
              </button>
            )}

            <div className="flex gap-1 rounded-lg border border-neutral-200 p-1">
              {(['food_item', 'recipe', 'food_list'] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    setContentType(type)
                    setSelectedId('')
                    setSelectedName('')
                    setItemSearch('')
                  }}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 px-1.5 rounded-md text-xs font-medium transition-colors ${
                    contentType === type
                      ? 'bg-primary-600 text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {type === 'food_item' && <Apple className="h-3.5 w-3.5" />}
                  {type === 'recipe' && <ChefHat className="h-3.5 w-3.5" />}
                  {type === 'food_list' && <ListOrdered className="h-3.5 w-3.5" />}
                  {type === 'food_item'
                    ? t('share.content.tab_food_item')
                    : type === 'recipe'
                      ? t('share.content.tab_recipe')
                      : t('share.content.tab_food_list')}
                </button>
              ))}
            </div>

            {contentType === 'food_item' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder={t('share.content.search_food_placeholder')}
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    className="pl-9 text-sm"
                    autoFocus
                  />
                </div>
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {filteredFoodItems.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-4">
                      {t('share.content.no_food_items')}
                    </p>
                  ) : (
                    filteredFoodItems.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemSelect(item.id, item.name)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-primary-50 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-neutral-900 truncate">
                          {item.name}
                        </span>
                        <span className="text-xs text-neutral-400 shrink-0 ml-2">
                          {item.calories} kcal
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {contentType === 'recipe' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                  <Input
                    placeholder={t('share.content.search_recipe_placeholder')}
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    className="pl-9 text-sm"
                    autoFocus
                  />
                </div>
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {filteredRecipes.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-4">
                      {t('share.content.no_recipes')}
                    </p>
                  ) : (
                    filteredRecipes.map(recipe => (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => handleItemSelect(recipe.id, recipe.name)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-primary-50 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-neutral-900 truncate">
                          {recipe.name}
                        </span>
                        <span className="text-xs text-neutral-400 shrink-0 ml-2">
                          {recipe.servings} {t('share.content.servings_abbr')}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {contentType === 'food_list' && (
              <div className="space-y-3">
                {foodListLoading ? (
                  <p className="text-sm text-neutral-400 text-center py-4">{t('share.content.loading')}</p>
                ) : foodListCount === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <ListOrdered className="h-8 w-8 text-neutral-300 mx-auto" />
                    <p className="text-sm text-neutral-400">{t('share.content.no_food_list')}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleFoodListSelect}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors text-left"
                  >
                    <ListOrdered className="h-8 w-8 text-primary-600 shrink-0" />
                    <div>
                      <p className="font-semibold text-neutral-900">{t('share.food_list.title')}</p>
                      <p className="text-sm text-neutral-500">{t('share.food_list.count_label', { count: foodListCount })}</p>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Steg 3: Bekräfta ── */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-sm font-semibold shrink-0">
                  {getInitials(recipientLabel)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate">
                    {recipientLabel}
                  </p>
                  <p className="text-xs text-neutral-400">{t('share.confirm.recipient_label')}</p>
                </div>
              </div>
              <div className="border-t border-neutral-100 pt-3 flex items-center gap-3">
                {contentType === 'food_item' && (
                  <Apple className="h-5 w-5 text-green-600 shrink-0" />
                )}
                {contentType === 'recipe' && (
                  <ChefHat className="h-5 w-5 text-amber-600 shrink-0" />
                )}
                {contentType === 'food_list' && (
                  <ListOrdered className="h-5 w-5 text-primary-600 shrink-0" />
                )}
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {contentType === 'food_list'
                      ? t('share.confirm.food_list_name', { count: foodListCount })
                      : selectedName}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {contentType === 'food_item'
                      ? t('share.confirm.type_food_item')
                      : contentType === 'recipe'
                        ? t('share.confirm.type_recipe')
                        : t('share.confirm.type_food_list')}
                  </p>
                </div>
              </div>
            </div>

            {contentType === 'food_list' && (
              <p className="text-xs text-neutral-400 text-center">
                {t('share.confirm.duplicate_note')}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep('content')}
                disabled={isPending}
                className="flex-1"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t('share.confirm.back')}
              </Button>
              <Button onClick={handleSend} disabled={isPending} className="flex-1 gap-2">
                <Send className="h-4 w-4" />
                {isPending ? t('share.confirm.sending') : t('share.confirm.send')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
