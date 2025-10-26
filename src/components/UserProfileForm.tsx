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

export default function UserProfileForm() {
  const { profile, updateProfile } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [showTooltips, setShowTooltips] = useState<Record<string, boolean>>({})

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserProfileFormData>({
    resolver: zodResolver(userProfileSchema),
    defaultValues: profile || {},
  })

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
        onMouseEnter={() => setShowTooltips({ ...showTooltips, [field]: true })}
        onMouseLeave={() => setShowTooltips({ ...showTooltips, [field]: false })}
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
            text="Välj vilken formel som ska användas för att beräkna din basalmetabolism (t.ex. Mifflin-St Jeor eller Harris-Benedict)."
            field="bmr_formula"
          />
        </Label>
        <Select id="bmr_formula" {...register('bmr_formula')} className="mt-2">
          <option value="">Välj...</option>
          <option value="mifflin_st_jeor">Mifflin-St Jeor</option>
          <option value="harris_benedict">Harris-Benedict</option>
          <option value="cunningham">Cunningham</option>
        </Select>
      </div>

      {/* Aktivitetsnivå */}
      <div>
        <Label htmlFor="activity_level" className="flex items-center">
          Aktivitetsnivå (PAL)
          <Tooltip
            text="Physical Activity Level – anger hur aktiv du är i vardagen och påverkar ditt totala energibehov."
            field="activity_level"
          />
        </Label>
        <Select id="activity_level" {...register('activity_level')} className="mt-2">
          <option value="">Välj...</option>
          <option value="sedentary">Sedentär (lite/no aktivitet)</option>
          <option value="light">Lätt aktivitet</option>
          <option value="moderate">Måttlig aktivitet</option>
          <option value="active">Aktiv</option>
          <option value="very_active">Mycket aktiv</option>
        </Select>
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
      <div>
        <Label htmlFor="calorie_goal" className="flex items-center">
          Kalorimål
          <Tooltip
            text="Välj om du vill gå upp i vikt, gå ner i vikt eller behålla din nuvarande vikt."
            field="calorie_goal"
          />
        </Label>
        <Select id="calorie_goal" {...register('calorie_goal')} className="mt-2">
          <option value="">Välj...</option>
          <option value="lose_weight">Gå ner i vikt</option>
          <option value="maintain_weight">Behålla vikt</option>
          <option value="gain_weight">Gå upp i vikt</option>
        </Select>
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
