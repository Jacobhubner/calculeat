import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Coffee, Sun, Moon, Cookie, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useLoadSavedMealToSlot } from '@/hooks/useSavedMeals'
import { useTodayLog } from '@/hooks/useDailyLogs'
import { useMealSettings } from '@/hooks/useMealSettings'
import { getMealOrder, getSuggestedMealSlot } from '@/lib/meal-utils'
import { useNavigate } from 'react-router-dom'

interface SelectMealSlotDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  savedMealId: string
  savedMealName: string
}

interface MealSlotOption {
  name: string
  icon: typeof Coffee
  calories?: number
  isSuggested?: boolean
}

export default function SelectMealSlotDialog({
  open,
  onOpenChange,
  savedMealId,
  savedMealName,
}: SelectMealSlotDialogProps) {
  const [loadingSlot, setLoadingSlot] = useState<string | null>(null)
  const navigate = useNavigate()

  const { data: todayLog } = useTodayLog()
  const { data: mealSettings } = useMealSettings()
  const loadMeal = useLoadSavedMealToSlot()

  // Get suggested meal slot based on time
  const suggestedSlot = useMemo(() => getSuggestedMealSlot(), [])

  // Build meal slot options
  const mealSlots = useMemo((): MealSlotOption[] => {
    if (!mealSettings) return []

    return mealSettings.map(setting => {
      const mealEntry = todayLog?.meals?.find(m => m.meal_name === setting.meal_name)
      const calories = mealEntry?.meal_calories || 0

      return {
        name: setting.meal_name,
        icon: getIconForMeal(setting.meal_name),
        calories,
        isSuggested: setting.meal_name === suggestedSlot,
      }
    })
  }, [mealSettings, todayLog, suggestedSlot])

  const handleSelectSlot = async (mealName: string) => {
    if (!todayLog) {
      toast.error('Kunde inte hitta dagens logg')
      return
    }

    setLoadingSlot(mealName)

    try {
      const mealEntry = todayLog.meals?.find(m => m.meal_name === mealName)

      const result = await loadMeal.mutateAsync({
        savedMealId,
        targetMealName: mealName,
        dailyLogId: todayLog.id,
        targetMealEntryId: mealEntry?.id,
        mealOrder: getMealOrder(mealName),
      })

      // Success feedback
      if (result.missingCount > 0) {
        toast.warning(
          `${result.missingCount} matvara${result.missingCount > 1 ? 'r' : ''} kunde inte hittas och hoppades över`
        )
      }

      toast.success(`${savedMealName} laddad till ${mealName}! (+${result.totalCalories} kcal)`)

      // Close modal
      onOpenChange(false)

      // Navigate to TodayPage and scroll to meal
      navigate('/app/today')
      setTimeout(() => {
        const mealCard = document.querySelector(`[data-meal-name="${mealName}"]`)
        if (mealCard) {
          mealCard.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    } catch (error) {
      console.error('Error loading saved meal:', error)
      toast.error('Kunde inte ladda måltid. Försök igen.')
    } finally {
      setLoadingSlot(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Vilken måltid?</DialogTitle>
          <DialogDescription>Välj var du vill lägga till &quot;{savedMealName}&quot;</DialogDescription>
        </DialogHeader>

        <div className="space-y-2 mt-4">
          {mealSlots.map(slot => {
            const isLoading = loadingSlot === slot.name
            const Icon = slot.icon

            return (
              <Card
                key={slot.name}
                className={`cursor-pointer transition-all hover:border-primary-300 hover:bg-primary-50 ${
                  isLoading ? 'opacity-50 pointer-events-none' : ''
                } ${slot.isSuggested ? 'border-primary-300 bg-primary-50' : ''}`}
                onClick={() => handleSelectSlot(slot.name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary-600" />
                      <div>
                        <h3 className="font-medium text-neutral-900">
                          {slot.name}
                          {slot.isSuggested && (
                            <span className="ml-2 text-xs text-primary-600 font-normal">
                              (Rekommenderad)
                            </span>
                          )}
                        </h3>
                        {slot.calories > 0 && (
                          <p className="text-sm text-neutral-600 mt-0.5">{slot.calories} kcal</p>
                        )}
                      </div>
                    </div>
                    {isLoading && <Loader2 className="h-5 w-5 animate-spin text-primary-600" />}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getIconForMeal(mealName: string): typeof Coffee {
  if (mealName === 'Frukost') return Coffee
  if (mealName === 'Lunch') return Sun
  if (mealName === 'Middag') return Moon
  return Cookie
}
