import { useTranslation } from 'react-i18next'
import {
  Edit2,
  Trash2,
  ScrollText,
  Users,
  Clock,
  BookmarkPlus,
  Loader2,
  Globe,
  Undo2,
  Camera,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { Recipe, RecipeIngredient } from '@/hooks/useRecipes'
import type { FoodItem } from '@/hooks/useFoodItems'
import { useShowEnergyDensity } from '@/hooks/useShowEnergyDensity'

interface RecipeWithIngredients extends Recipe {
  ingredients?: Array<
    RecipeIngredient & {
      food_item?: FoodItem
    }
  >
}

interface RecipeCardProps {
  recipe: RecipeWithIngredients
  onPreview: () => void
  /** Utelämnas för bankrecept (Upptäck) — då visas ingen redigeringsknapp */
  onEdit?: () => void
  /** Utelämnas för bankrecept (Upptäck) — då visas ingen raderingsknapp */
  onDelete?: () => void
  /** Bankrecept: "Spara till mina recept"-knapp */
  onSave?: () => void
  isSaving?: boolean
  /** Superadmin: publicera receptet till receptbanken */
  onPublish?: () => void
  /** Superadmin: avpublicera från receptbanken */
  onUnpublish?: () => void
  /** Superadmin: ladda upp/byt bild på ett officiellt recept */
  onUploadImage?: () => void
}

export function RecipeCard({
  recipe,
  onPreview,
  onEdit,
  onDelete,
  onSave,
  isSaving,
  onPublish,
  onUnpublish,
  onUploadImage,
}: RecipeCardProps) {
  const { t } = useTranslation('recipes')

  const servings = recipe.servings || 1
  const totalTime = (recipe.prep_time_min ?? 0) + (recipe.cook_time_min ?? 0)

  // Read saved nutrition values from the recipe's linked food_item — never recalculate live
  const savedAs100g = recipe.food_item?.default_unit === 'g'
  const fi = recipe.food_item

  const displayCalories = fi
    ? Math.round(savedAs100g ? (fi.calories * 100) / 100 : (fi.kcal_per_unit ?? fi.calories))
    : 0
  const displayFat = fi
    ? (savedAs100g ? fi.fat_g : (fi.fat_per_unit ?? fi.fat_g)).toFixed(1)
    : '0.0'
  const displayCarbs = fi
    ? (savedAs100g ? fi.carb_g : (fi.carb_per_unit ?? fi.carb_g)).toFixed(1)
    : '0.0'
  const displayProtein = fi
    ? (savedAs100g ? fi.protein_g : (fi.protein_per_unit ?? fi.protein_g)).toFixed(1)
    : '0.0'
  const showEnergyDensity = useShowEnergyDensity()
  const energyDensityColor = showEnergyDensity ? (fi?.energy_density_color ?? null) : null

  const colorBadgeClass = {
    Green: 'bg-green-100 text-green-700 border-green-300',
    Yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    Orange: 'bg-orange-100 text-orange-700 border-orange-300',
  }

  const colorLabel = {
    Green: t('card.colorGreen'),
    Yellow: t('card.colorYellow'),
    Orange: t('card.colorOrange'),
  }

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onPreview}>
      <CardContent className="p-3">
        <div className="flex items-center gap-3">
          {/* Tumnagel eller ikon */}
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.name}
              className="h-10 w-10 rounded-lg object-cover flex-shrink-0"
              loading="lazy"
            />
          ) : (
            <ScrollText className="h-4 w-4 text-primary-600 flex-shrink-0" />
          )}

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="font-semibold text-neutral-900 truncate text-sm">{recipe.name}</h3>
              {energyDensityColor && (
                <Badge
                  variant="outline"
                  className={`${colorBadgeClass[energyDensityColor]} flex-shrink-0 text-xs`}
                >
                  {colorLabel[energyDensityColor]}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {savedAs100g
                  ? t('card.per100g')
                  : `${servings} ${servings === 1 ? t('card.portion') : t('card.portionPlural')}`}
              </span>
              {totalTime > 0 && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {totalTime} min
                </span>
              )}
              <span className="text-neutral-400">·</span>
              <span className="font-semibold text-primary-600">{displayCalories} kcal</span>
              <span style={{ color: '#f5c518' }}>F:{displayFat}g</span>
              <span style={{ color: '#fb923c' }}>K:{displayCarbs}g</span>
              <span style={{ color: '#f43f5e' }}>P:{displayProtein}g</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
            {onSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                disabled={isSaving}
                title={t('card.saveToMineHint')}
                className="h-8 gap-1.5 text-primary-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <BookmarkPlus className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">{t('card.saveToMine')}</span>
              </Button>
            )}
            {onUploadImage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onUploadImage}
                className="h-8 w-8 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                aria-label={t('card.uploadImage')}
              >
                <Camera className="h-4 w-4" />
              </Button>
            )}
            {onPublish && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onPublish}
                className="h-8 w-8 p-0 text-primary-600 hover:text-primary-800 hover:bg-primary-50"
                aria-label={t('card.publish')}
              >
                <Globe className="h-4 w-4" />
              </Button>
            )}
            {onUnpublish && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onUnpublish}
                className="h-8 w-8 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                aria-label={t('card.unpublish')}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
            )}
            {onEdit && (
              <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 w-8 p-0">
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
