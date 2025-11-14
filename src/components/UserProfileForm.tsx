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
import { useState, useMemo } from 'react'
import {
  translatePALSystem,
  deficitLevelTranslations,
  calorieGoalTranslations,
} from '@/lib/translations'
import PALTableContainer from './calculator/PALTableContainer'
import { requiresBodyFat } from '@/lib/calculations/bmr'
import type { BMRFormula } from '@/lib/types'
import BMRFormulaModal from './calculator/BMRFormulaModal'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useCalculations } from '@/hooks/useCalculations'
import CalculationResults from './calculator/CalculationResults'
import BodyFatGoalCalculation from './calculator/BodyFatGoalCalculation'
import SectionDescription from './ui/SectionDescription'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

export default function UserProfileForm() {
  const { profile, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showBMRModal, setShowBMRModal] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: profile || {},
  })

  // Watch values for conditional rendering
  const palSystem = watch('pal_system')
  const calorieGoal = watch('calorie_goal')
  const bmrFormula = watch('bmr_formula') as BMRFormula | undefined
  const bodyFatPercentage = watch('body_fat_percentage')
  const targetBodyFatPercentage = watch('target_body_fat_percentage')

  // Create profile object from watched values for live calculations
  const watchedProfile = useMemo(() => {
    const values = watch()
    return {
      ...profile,
      ...values,
    }
  }, [watch(), profile])

  // Get live calculations
  const calculations = useCalculations(watchedProfile)

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

  // Helper component for tooltips
  const InfoTooltip = ({ text }: { text: string }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="h-4 w-4 text-neutral-400 cursor-help ml-2" />
      </TooltipTrigger>
      <TooltipContent>
        <p className="max-w-xs">{text}</p>
      </TooltipContent>
    </Tooltip>
  )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto">
      {/* SECTION 1: Profilinformation */}
      <Card className="border-2 border-primary-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-primary-50 to-accent-50 border-b-2 border-primary-200">
          <CardTitle className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            <span className="text-2xl">📋</span>
            Profilinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <SectionDescription text="Ditt profilnamn används för att identifiera din profil. Detta är särskilt användbart om du vill skapa flera profiler med olika mål eller inställningar." />

          {/* Profilnamn */}
          <div>
            <Label htmlFor="profile_name" className="flex items-center">
              Profilnamn
              <InfoTooltip text="Ditt namn eller ett valfritt visningsnamn för din profil." />
            </Label>
            <Input id="profile_name" {...register('profile_name')} className="mt-2" />
            {errors.profile_name && (
              <p className="text-red-500 text-sm mt-1">{errors.profile_name.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SECTION 2: Grundläggande Information */}
      <Card className="border-2 border-blue-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b-2 border-blue-200">
          <CardTitle className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            <span className="text-2xl">👤</span>
            Grundläggande Information
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <SectionDescription text="Din ålder, kön, längd och vikt används för att beräkna din basalmetabolism (BMR). Kroppsfettprocenten är valfri men ger mer exakta beräkningar om du använder vissa formler." />

          {/* Födelsedatum */}
          <div>
            <Label htmlFor="birth_date" className="flex items-center">
              Födelsedatum
              <InfoTooltip text="Ange ditt födelsedatum – används för att räkna ut ålder automatiskt." />
            </Label>
            <Input id="birth_date" type="date" {...register('birth_date')} className="mt-2" />
          </div>

          {/* Kön */}
          <div>
            <Label htmlFor="gender" className="flex items-center">
              Kön
              <InfoTooltip text="Välj kön – påverkar beräkning av energibehov." />
            </Label>
            <Select id="gender" {...register('gender')} className="mt-2">
              <option value="">Välj...</option>
              <option value="male">Man</option>
              <option value="female">Kvinna</option>
            </Select>
          </div>

          {/* Längd */}
          <div>
            <Label htmlFor="height_cm" className="flex items-center">
              Längd (cm)
              <InfoTooltip text="Ange din kroppslängd i centimeter." />
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
              <InfoTooltip text="Ange din nuvarande kroppsvikt i kilogram." />
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

          {/* Kroppsfettprocent */}
          <div>
            <Label htmlFor="body_fat_percentage" className="flex items-center">
              Kroppsfettprocent (%)
              <InfoTooltip text="Andelen kroppsfett i procent av din totala vikt. Kan användas för mer exakt energiberäkning." />
            </Label>
            <Input
              id="body_fat_percentage"
              type="number"
              step="0.1"
              {...register('body_fat_percentage', { valueAsNumber: true })}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* SECTION 3: Kaloriräknare */}
      <Card className="border-2 border-purple-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b-2 border-purple-200">
          <CardTitle className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            <span className="text-2xl">🔥</span>
            Kaloriräknare
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <SectionDescription text="Välj BMR-formel och PAL-system för att beräkna ditt totala dagliga energibehov (TDEE). BMR är din basalmetabolism i vila, och PAL-systemet multiplicerar detta med din aktivitetsnivå." />

          {/* BMR-formel */}
          <div>
            <Label htmlFor="bmr_formula" className="flex items-center">
              BMR-formel
              <InfoTooltip text="Välj vilken formel som ska användas för att beräkna din basalmetabolism. Olika formler passar olika personer beroende på träningsnivå och kroppssammansättning." />
              {bmrFormula && (
                <button
                  type="button"
                  onClick={() => setShowBMRModal(true)}
                  className="ml-2 text-primary-600 hover:text-primary-700 transition-colors"
                  aria-label="Visa detaljerad information om formeln"
                >
                  <Info className="h-4 w-4" />
                </button>
              )}
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
              <option value="MacroFactor FFM equation">MacroFactor FFM (Kräver kroppsfett%)</option>
              <option value="MacroFactor athlete equation">
                MacroFactor Athlete (Kräver kroppsfett%)
              </option>
              <option value="Fitness Stuff Podcast equation">
                Fitness Stuff Podcast (Kräver kroppsfett%)
              </option>
            </Select>
            {bmrFormula && requiresBodyFat(bmrFormula) && !bodyFatPercentage && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 mt-3">
                <p className="text-sm text-amber-800 flex items-center gap-2">
                  <span className="text-lg">⚠️</span>
                  <span>
                    Denna formel kräver kroppsfettprocent. Vänligen fyll i kroppsfettprocent nedan
                    för att få korrekta beräkningar.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* PAL System */}
          <div>
            <Label htmlFor="pal_system" className="flex items-center text-base font-semibold">
              PAL-system (Aktivitetsnivå)
              <InfoTooltip text="Välj vilket system du vill använda för att beräkna ditt fysiska aktivitetsnivå (PAL). Olika system passar olika personer och träningsmål." />
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
              <PALTableContainer system={palSystem} register={register} watch={watch} />
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 4: Kalorimål */}
      <Card className="border-2 border-orange-200 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b-2 border-orange-200">
          <CardTitle className="text-xl font-bold text-neutral-800 flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            Kalorimål
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <SectionDescription text="Välj ditt mål: viktunderhåll (äta lika mycket som du förbränner), viktnedgång (kaloriunderskott) eller viktuppgång (kaloröverskott). Ange även din målvikt och önskad kroppsfettprocent om du har sådana mål." />

          {/* Kalorimål */}
          <div>
            <Label htmlFor="calorie_goal" className="flex items-center">
              Kalorimål
              <InfoTooltip text="Välj om du vill gå upp i vikt, gå ner i vikt eller behålla din nuvarande vikt." />
            </Label>
            <Select id="calorie_goal" {...register('calorie_goal')} className="mt-2">
              <option value="">Välj kalorimål...</option>
              <option value="Weight loss">{calorieGoalTranslations['Weight loss']}</option>
              <option value="Maintain weight">{calorieGoalTranslations['Maintain weight']}</option>
              <option value="Weight gain">{calorieGoalTranslations['Weight gain']}</option>
            </Select>
          </div>

          {/* Deficit level - only show for weight loss */}
          {calorieGoal === 'Weight loss' && (
            <div>
              <Label htmlFor="deficit_level" className="flex items-center">
                Viktnedgångstakt
                <InfoTooltip text="Välj hur snabb viktnedgång du vill ha. Långsammare är mer hållbart, snabbare ger snabbare resultat men kan vara svårare att följa." />
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
                <InfoTooltip text="Ange din målvikt i kilogram. Detta används för att beräkna ungefär hur lång tid det tar att nå ditt mål." />
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

          {/* Target Body Fat Percentage - show when body fat percentage is filled */}
          {bodyFatPercentage && (
            <div>
              <Label htmlFor="target_body_fat_percentage" className="flex items-center">
                Målvikt för kroppsfettprocent (%)
                <InfoTooltip text="Ange din önskade kroppsfettprocent. Detta hjälper till att beräkna din målvikt baserat på fettfri massa." />
              </Label>
              <Input
                id="target_body_fat_percentage"
                type="number"
                step="0.1"
                {...register('target_body_fat_percentage', { valueAsNumber: true })}
                className="mt-2"
              />
              {errors.target_body_fat_percentage && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.target_body_fat_percentage.message}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SECTION 5: Dina Resultat */}
      {calculations.bmr && calculations.tdee && calculations.calorieGoal && (
        <Card className="border-2 border-green-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b-2 border-green-200">
            <CardTitle className="text-xl font-bold text-neutral-800 flex items-center gap-2">
              <span className="text-2xl">📊</span>
              Dina Resultat
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <SectionDescription text="Här ser du dina beräknade värden baserat på den information du angett. BMR är din vilometabolism, TDEE är ditt totala dagliga energibehov, och kalorimålet visar hur mycket du bör äta för att nå ditt mål." />
            <CalculationResults
              profile={watchedProfile}
              bmr={calculations.bmr}
              tdee={calculations.tdee}
              calorieGoal={calculations.calorieGoal.target}
              timeToGoal={calculations.timeToGoal || undefined}
            />
          </CardContent>
        </Card>
      )}

      {/* SECTION 6: Body Fat Goal Calculation - MOVED TO END */}
      {bodyFatPercentage && targetBodyFatPercentage && watch('weight_kg') && watch('gender') && (
        <Card className="border-2 border-cyan-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 border-b-2 border-cyan-200">
            <CardTitle className="text-xl font-bold text-neutral-800 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Kroppsfettprocent Målberäkning
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <SectionDescription text="Baserat på din nuvarande kroppsfettprocent och din målprocent beräknas här vilken vikt du behöver nå för att uppnå ditt kroppsfettmål. Beräkningen tar hänsyn till att du behåller din fettfria massa (muskler, ben, organ)." />
            <BodyFatGoalCalculation
              currentWeight={watch('weight_kg')!}
              currentBodyFatPercentage={bodyFatPercentage}
              targetBodyFatPercentage={targetBodyFatPercentage}
              gender={watch('gender')}
              tdee={calculations.tdee}
              calorieIntake={calculations.calorieGoal?.target}
            />
          </CardContent>
        </Card>
      )}

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

      {/* BMR Formula Modal */}
      {bmrFormula && (
        <BMRFormulaModal
          formula={bmrFormula}
          isOpen={showBMRModal}
          onClose={() => setShowBMRModal(false)}
        />
      )}
    </form>
  )
}
