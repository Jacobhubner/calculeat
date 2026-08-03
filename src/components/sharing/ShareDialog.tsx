import { useState, useEffect } from 'react'
import {
  Share2,
  Apple,
  Bookmark,
  ChefHat,
  Search,
  Send,
  ListOrdered,
  ChevronLeft,
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  useShareableFoodItems,
  useShareableRecipes,
  useShareableSavedMeals,
  useShareableFoodListCount,
} from '@/hooks/useShareableItems'
import { useFriends, useSendShareInvitationToFriend } from '@/hooks/useFriends'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import type { Friend } from '@/lib/types/friends'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { AVATAR_GRADIENT } from '@/lib/constants/avatarStyles'

type Step = 'recipient' | 'content' | 'confirm'
type ContentType = 'food_item' | 'recipe' | 'saved_meal' | 'food_list'

interface ShareDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  preselectedFriend?: Friend
  /** Förvald innehållstyp, t.ex. när dialogen öppnas från en sparad måltid */
  preselectedContentType?: ContentType
  /** Förvalt objekt (id + namn) — hoppar direkt till bekräftelsesteget */
  preselectedItem?: { id: string; name: string }
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2)
}

export function ShareDialog({
  open,
  onOpenChange,
  preselectedFriend,
  preselectedContentType,
  preselectedItem,
}: ShareDialogProps) {
  const { t } = useTranslation('social')
  const { user } = useAuth()

  // Med både mottagare och objekt förvalda finns inget kvar att välja → bekräfta direkt
  const initialStep: Step = preselectedFriend
    ? preselectedItem
      ? 'confirm'
      : 'content'
    : 'recipient'

  const [step, setStep] = useState<Step>(initialStep)
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(preselectedFriend ?? null)
  const [friendSearch, setFriendSearch] = useState('')
  const [contentType, setContentType] = useState<ContentType>(preselectedContentType ?? 'food_item')
  const [selectedId, setSelectedId] = useState<string>(preselectedItem?.id ?? '')
  const [selectedName, setSelectedName] = useState<string>(preselectedItem?.name ?? '')
  const [itemSearch, setItemSearch] = useState('')

  // Sync step and selectedFriend when preselectedFriend changes (e.g. different friend clicked)
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStep(initialStep)

      setSelectedFriend(preselectedFriend ?? null)
      setContentType(preselectedContentType ?? 'food_item')
      setSelectedId(preselectedItem?.id ?? '')
      setSelectedName(preselectedItem?.name ?? '')
    }
  }, [open, initialStep, preselectedFriend, preselectedContentType, preselectedItem])

  const { data: foodItems = [] } = useShareableFoodItems()
  const { data: recipes = [] } = useShareableRecipes()
  const { data: savedMeals = [] } = useShareableSavedMeals()
  const { count: foodListCount, isLoading: foodListLoading } = useShareableFoodListCount()
  const { data: friends = [] } = useFriends()
  const { mutateAsync: sendToFriend, isPending } = useSendShareInvitationToFriend()

  const reset = () => {
    setStep(initialStep)
    setSelectedFriend(preselectedFriend ?? null)
    setFriendSearch('')
    setContentType(preselectedContentType ?? 'food_item')
    setSelectedId(preselectedItem?.id ?? '')
    setSelectedName(preselectedItem?.name ?? '')
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

  const filteredSavedMeals = savedMeals.filter(
    m => !itemSearch.trim() || m.name.toLowerCase().includes(itemSearch.toLowerCase())
  )

  const recipientLabel = selectedFriend ? (selectedFriend.alias ?? selectedFriend.friend_name) : ''

  const handleFriendSelect = (friend: Friend) => {
    setSelectedFriend(friend)
    // Är objektet redan förvalt (t.ex. delning från ett måltidskort) finns inget
    // innehåll kvar att välja — gå direkt till bekräftelsesteget.
    setStep(preselectedItem ? 'confirm' : 'content')
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
    if (!user || !selectedFriend) return
    try {
      if (contentType === 'food_list') {
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
        toast.success(t('share.toast.food_list_shared', { count: foodListCount }))
      } else {
        const result = await sendToFriend({
          itemId: selectedId,
          itemType: contentType,
          friendUserId: selectedFriend.friend_id,
        })
        if (!result.success) {
          toast.error(
            result.error === 'empty_saved_meal'
              ? t('share.error.empty_saved_meal')
              : t('share.error.friend_share_failed')
          )
          return
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
    return contentType === 'food_list'
      ? t('share.title.confirm_list')
      : t('share.title.confirm_item', { name: selectedName })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-4 w-4 text-primary-600 dark:text-primary-300" />
            {getTitle()}
          </DialogTitle>
        </DialogHeader>

        {/* ── Steg 1: Välj mottagare ── */}
        {step === 'recipient' && (
          <div className="space-y-4">
            <div className="space-y-2">
              {friends.length === 0 ? (
                <p className="text-sm text-neutral-500 text-center py-4 dark:text-neutral-400">
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
                        className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/25 transition-colors text-left"
                      >
                        <div
                          className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0',
                            AVATAR_GRADIENT
                          )}
                        >
                          {getInitials(friend.alias ?? friend.friend_name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-neutral-900 truncate dark:text-neutral-100">
                            {friend.alias ?? `@${friend.friend_username ?? friend.friend_name}`}
                          </p>
                          {friend.alias && (
                            <p className="text-xs text-neutral-400 truncate dark:text-neutral-500">
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
          </div>
        )}

        {/* ── Steg 2: Välj innehåll ── */}
        {step === 'content' && (
          <div className="space-y-4">
            {!preselectedFriend && (
              <button
                type="button"
                onClick={() => setStep('recipient')}
                className="flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-700 transition-colors dark:hover:text-neutral-200 dark:text-neutral-400"
              >
                <ChevronLeft className="h-4 w-4" />
                {recipientLabel}
              </button>
            )}

            <div className="flex gap-1 rounded-lg border border-neutral-200 p-1 dark:border-neutral-700">
              {(['food_item', 'recipe', 'saved_meal', 'food_list'] as const).map(type => (
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
                      : 'text-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-800 dark:text-neutral-400'
                  }`}
                >
                  {type === 'food_item' && <Apple className="h-3.5 w-3.5" />}
                  {type === 'recipe' && <ChefHat className="h-3.5 w-3.5" />}
                  {type === 'saved_meal' && <Bookmark className="h-3.5 w-3.5" />}
                  {type === 'food_list' && <ListOrdered className="h-3.5 w-3.5" />}
                  {type === 'food_item'
                    ? t('share.content.tab_food_item')
                    : type === 'recipe'
                      ? t('share.content.tab_recipe')
                      : type === 'saved_meal'
                        ? t('share.content.tab_saved_meal')
                        : t('share.content.tab_food_list')}
                </button>
              ))}
            </div>

            {contentType === 'food_item' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
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
                    <p className="text-sm text-neutral-400 text-center py-4 dark:text-neutral-500">
                      {t('share.content.no_food_items')}
                    </p>
                  ) : (
                    filteredFoodItems.map(item => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemSelect(item.id, item.name)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/25 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-neutral-900 truncate dark:text-neutral-100">
                          {item.name}
                        </span>
                        <span className="text-xs text-neutral-400 shrink-0 ml-2 dark:text-neutral-500">
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
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
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
                    <p className="text-sm text-neutral-400 text-center py-4 dark:text-neutral-500">
                      {t('share.content.no_recipes')}
                    </p>
                  ) : (
                    filteredRecipes.map(recipe => (
                      <button
                        key={recipe.id}
                        type="button"
                        onClick={() => handleItemSelect(recipe.id, recipe.name)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/25 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-neutral-900 truncate dark:text-neutral-100">
                          {recipe.name}
                        </span>
                        <span className="text-xs text-neutral-400 shrink-0 ml-2 dark:text-neutral-500">
                          {recipe.servings} {t('share.content.servings_abbr')}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {contentType === 'saved_meal' && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 dark:text-neutral-500" />
                  <Input
                    placeholder={t('share.content.search_saved_meal_placeholder')}
                    value={itemSearch}
                    onChange={e => setItemSearch(e.target.value)}
                    className="pl-9 text-sm"
                    autoFocus
                  />
                </div>
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {filteredSavedMeals.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-4 dark:text-neutral-500">
                      {t('share.content.no_saved_meals')}
                    </p>
                  ) : (
                    filteredSavedMeals.map(meal => (
                      <button
                        key={meal.id}
                        type="button"
                        onClick={() => handleItemSelect(meal.id, meal.name)}
                        className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/25 transition-colors text-left"
                      >
                        <span className="text-sm font-medium text-neutral-900 truncate dark:text-neutral-100">
                          {meal.name}
                        </span>
                        <span className="text-xs text-neutral-400 shrink-0 ml-2 dark:text-neutral-500">
                          {t('share.content.saved_meal_item_count', { count: meal.item_count })}
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
                  <p className="text-sm text-neutral-400 text-center py-4 dark:text-neutral-500">
                    {t('share.content.loading')}
                  </p>
                ) : foodListCount === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <ListOrdered className="h-8 w-8 text-neutral-300 mx-auto" />
                    <p className="text-sm text-neutral-400 dark:text-neutral-500">
                      {t('share.content.no_food_list')}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleFoodListSelect}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-primary-200 bg-primary-50 hover:bg-primary-100 transition-colors text-left dark:bg-primary-900/25 dark:border-primary-800"
                  >
                    <ListOrdered className="h-8 w-8 text-primary-600 shrink-0 dark:text-primary-300" />
                    <div>
                      <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                        {t('share.food_list.title')}
                      </p>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {t('share.food_list.count_label', { count: foodListCount })}
                      </p>
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
            <div className="rounded-xl border border-neutral-200 p-4 space-y-3 dark:border-neutral-700">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold shrink-0',
                    AVATAR_GRADIENT
                  )}
                >
                  {getInitials(recipientLabel)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neutral-900 truncate dark:text-neutral-100">
                    {recipientLabel}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    {t('share.confirm.recipient_label')}
                  </p>
                </div>
              </div>
              <div className="border-t border-neutral-100 dark:border-neutral-700 pt-3 flex items-center gap-3">
                {contentType === 'food_item' && (
                  <Apple className="h-5 w-5 text-green-600 shrink-0 dark:text-green-300" />
                )}
                {contentType === 'recipe' && (
                  <ChefHat className="h-5 w-5 text-amber-600 shrink-0 dark:text-amber-300" />
                )}
                {contentType === 'saved_meal' && (
                  <Bookmark className="h-5 w-5 text-violet-600 shrink-0" />
                )}
                {contentType === 'food_list' && (
                  <ListOrdered className="h-5 w-5 text-primary-600 shrink-0 dark:text-primary-300" />
                )}
                <div>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {contentType === 'food_list'
                      ? t('share.confirm.food_list_name', { count: foodListCount })
                      : selectedName}
                  </p>
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    {contentType === 'food_item'
                      ? t('share.confirm.type_food_item')
                      : contentType === 'recipe'
                        ? t('share.confirm.type_recipe')
                        : contentType === 'saved_meal'
                          ? t('share.confirm.type_saved_meal')
                          : t('share.confirm.type_food_list')}
                  </p>
                </div>
              </div>
            </div>

            {contentType === 'food_list' && (
              <p className="text-xs text-neutral-400 text-center dark:text-neutral-500">
                {t('share.confirm.duplicate_note')}
              </p>
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setStep(preselectedItem ? 'recipient' : 'content')}
                disabled={isPending || (!!preselectedItem && !!preselectedFriend)}
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
