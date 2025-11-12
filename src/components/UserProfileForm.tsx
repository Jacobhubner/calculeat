import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { userProfileSchema } from '@/lib/validation'
import { useAuth } from '@/contexts/AuthContext'
import { UserProfileFormData } from '@/lib/types'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select } from './ui/select'
import { Info, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { translatePALSystem, deficitLevelTranslations } from '@/lib/translations'
import PALTableContainer from './calculator/PALTableContainer'
import ConditionalPALFields from './calculator/ConditionalPALFields'

export default function UserProfileForm() {
  const { profile, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showTooltips, setShowTooltips] = useState<Record<string, boolean>>({})

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: profile || {},
  })

  // Watch values for conditional rendering
  const palSystem = watch('pal_system')
  const calorieGoal = watch('calorie_goal')

  const onSubmit = async (data: UserProfileFormData) => {
    setIsLoading(true)
    try {
      await updateProfile(data)
      alert('Profil uppdaterad!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Fel vid uppdatering av profil')
    } finally {
      setIsLoading(false)
    }
  }

  const Tooltip = ({ text, field }: { text: string; field: string }) => (
    <div className="relative inline-flex ml-2">
      <Info
        className="h-4 w-4 text-neutral-400 cursor-help"
        onMouseEnter={() => setShowTooltips(prev => ({ ...prev, [field]: true }))}
        onMouseLeave={() => setShowTooltips(prev => ({ ...prev, [field]: false }))}
      />
      {showTooltips[field] && (
        <div className="absolute bottom-full left-0 mb-2 w-64 p-3 bg-neutral-800 text-white text-sm rounded-lg shadow-lg z-10">
          {text}
        </div>
      )}
    </div>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Namn */}
      <div>
        <Label htmlFor="full_name" className="flex items-center">
          Fullständigt namn
        </Label>
        <Input id="full_name" {...register('full_name')} className="mt-2" />
        {errors.full_name && (
          <p className="text-red-500 text-sm mt-1">{errors.full_name.message}</p>
        )}
      </div>

      {/* Födelsedatum */}
      <div>
        <Label htmlFor="birth_date" className="flex items-center">
          Födelsedatum
          <Tooltip
            text="Ange ditt födelsedatum – används för att räkna ut ålder automatiskt."
            field="birth_date"
          />
        </Label>
        <Input id="birth_date" type="date" {...register('birth_date')} className="mt-2" />
      </div>

      {/* Kön */}
      <div>
        <Label htmlFor="gender" className="flex items-center">
          Kön
          <Tooltip text="Välj kön – påverkar beräkning av energibehov." field="gender" />
        </Label>
        <Select id="gender" {...register('gender')} className="mt-2">
          <option value="">Välj...</option>
          <option value="male">Man</option>
          <option value="female">Kvinna</option>
          <option value="other">Annat</option>
          <option value="prefer_not_to_say">Vill ej uppge</option>
        </Select>
      </div>

      {/* Längd */}
      <div>
        <Label htmlFor="height_cm" className="flex items-center">
          Längd (cm)
          <Tooltip text="Ange din kroppslängd i centimeter." field="height_cm" />
        </Label>
        <Input
          id="height_cm"
          type="number"
          {...register('height_cm', { valueAsNumber: true })}
          className="mt-2"
        />
        {errors.height_cm && (
          <p className="text-red-500 text-sm mt-1">{errors.height_cm.message}</p>
        )}
      </div>

      {/* Vikt */}
      <div>
        <Label htmlFor="weight_kg" className="flex items-center">
          Vikt (kg)
          <Tooltip text="Ange din nuvarande kroppsvikt i kilogram." field="weight_kg" />
        </Label>
        <Input
          id="weight_kg"
          type="number"
          step="0.1"
          {...register('weight_kg', { valueAsNumber: true })}
          className="mt-2"
        />
        {errors.weight_kg && (
          <p className="text-red-500 text-sm mt-1">{errors.weight_kg.message}</p>
        )}
      </div>

      {/* BMR-formel */}
      <div>
        <Label htmlFor="bmr_formula" className="flex items-center">
          BMR-formel
          <Tooltip
            text="Välj vilken formel som ska användas för att beräkna din basalmetabolism. Olika formler passar olika personer beroende på träningsnivå och kroppssammansättning."
            field="bmr_formula"
          />
        </Label>
        <Select id="bmr_formula" {...register('bmr_formula')} className="mt-2">
          <option value="">Välj...</option>
          <option value="Mifflin-St Jeor equation">Mifflin-St Jeor (Standard)</option>
          <option value="Cunningham equation">Cunningham (Kräver kroppsfett%)</option>
          <option value="Oxford/Henry equation">Oxford/Henry</option>
          <option value="Schofield equation">Schofield</option>
          <option value="Revised Harris-Benedict equation">Revised Harris-Benedict</option>
          <option value="Original Harris-Benedict equation">Original Harris-Benedict</option>
          <option value="MacroFactor standard equation">MacroFactor Standard</option>
          <option value="MacroFactor FFM equation">MacroFactor FFM</option>
          <option value="MacroFactor athlete equation">MacroFactor Athlete</option>
          <option value="Fitness Stuff Podcast equation">Fitness Stuff Podcast</option>
        </Select>
      </div>

      {/* PAL System */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <Label htmlFor="pal_system" className="flex items-center text-base font-semibold">
            PAL-system (Aktivitetsnivå)
            <Tooltip
              text="Välj vilket system du vill använda för att beräkna ditt fysiska aktivitetsnivå (PAL). Olika system passar olika personer och träningsmål."
              field="pal_system"
            />
          </Label>
          <Select id="pal_system" {...register('pal_system')} className="mt-2">
            <option value="">Välj PAL-system...</option>
            <option value="FAO/WHO/UNU based PAL values">
              {translatePALSystem('FAO/WHO/UNU based PAL values')}
            </option>
            <option value="DAMNRIPPED PAL values">
              {translatePALSystem('DAMNRIPPED PAL values')}
            </option>
            <option value="Pro Physique PAL values">
              {translatePALSystem('Pro Physique PAL values')}
            </option>
            <option value="Fitness Stuff PAL values">
              {translatePALSystem('Fitness Stuff PAL values')}
            </option>
            <option value="Basic internet PAL values">
              {translatePALSystem('Basic internet PAL values')}
            </option>
            <option value="Custom PAL">{translatePALSystem('Custom PAL')}</option>
          </Select>
        </div>

        {/* Show PAL table if system is selected */}
        {palSystem && (
          <div className="mt-4">
            <PALTableContainer system={palSystem} />
          </div>
        )}

        {/* Conditional fields based on PAL system */}
        {palSystem && (
          <ConditionalPALFields
            palSystem={palSystem}
            register={register}
            watch={watch}
            setValue={setValue}
          />
        )}
      </div>

      {/* Kroppsfettprocent */}
      <div>
        <Label htmlFor="body_fat_percentage" className="flex items-center">
          Kroppsfettprocent (%)
          <Tooltip
            text="Andelen kroppsfett i procent av din totala vikt. Kan användas för mer exakt energiberäkning."
            field="body_fat_percentage"
          />
        </Label>
        <Input
          id="body_fat_percentage"
          type="number"
          step="0.1"
          {...register('body_fat_percentage', { valueAsNumber: true })}
          className="mt-2"
        />
      </div>

      {/* Kalorimål */}
      <div className="space-y-4 border-t pt-6">
        <div>
          <Label htmlFor="calorie_goal" className="flex items-center text-base font-semibold">
            Kalorimål
            <Tooltip
              text="Välj om du vill gå upp i vikt, gå ner i vikt eller behålla din nuvarande vikt."
              field="calorie_goal"
            />
          </Label>
          <Select id="calorie_goal" {...register('calorie_goal')} className="mt-2">
            <option value="">Välj kalorimål...</option>
            <option value="Weight loss">Viktnedgång</option>
            <option value="Maintain weight">Vikthållning</option>
            <option value="Weight gain">Viktökning</option>
          </Select>
        </div>

        {/* Deficit level - only show for weight loss */}
        {calorieGoal === 'Weight loss' && (
          <div>
            <Label htmlFor="deficit_level" className="flex items-center">
              Viktnedgångstakt
              <Tooltip
                text="Välj hur snabb viktnedgång du vill ha. Långsammare är mer hållbart, snabbare ger snabbare resultat men kan vara svårare att följa."
                field="deficit_level"
              />
            </Label>
            <Select id="deficit_level" {...register('deficit_level')} className="mt-2">
              <option value="">Välj takt...</option>
              <option value="Slow">{deficitLevelTranslations['Slow']}</option>
              <option value="Moderate">{deficitLevelTranslations['Moderate']}</option>
              <option value="Aggressive">{deficitLevelTranslations['Aggressive']}</option>
            </Select>
          </div>
        )}

        {/* Target weight - show for weight loss or gain */}
        {(calorieGoal === 'Weight loss' || calorieGoal === 'Weight gain') && (
          <div>
            <Label htmlFor="target_weight_kg" className="flex items-center">
              Målvikt (kg)
              <Tooltip
                text="Ange din målvikt i kilogram. Detta används för att beräkna ungefär hur lång tid det tar att nå ditt mål."
                field="target_weight_kg"
              />
            </Label>
            <Input
              id="target_weight_kg"
              type="number"
              step="0.1"
              {...register('target_weight_kg', { valueAsNumber: true })}
              className="mt-2"
            />
            {errors.target_weight_kg && (
              <p className="text-red-500 text-sm mt-1">{errors.target_weight_kg.message}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sparar...
            </>
          ) : (
            'Spara profil'
          )}
        </Button>
      </div>
    </form>
  )
}
