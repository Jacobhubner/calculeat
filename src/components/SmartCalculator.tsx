import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, Info } from 'lucide-react'
import { Button } from './ui/button'
import { calculateBMR } from '@/lib/calculations/bmr'
import { ACTIVITY_DESCRIPTIONS, type ActivityLevel } from '@/lib/calculations/tdee'
import type { Gender } from '@/lib/types'

// Basic internet PAL values (matches the standard you provided)
const PAL_VALUES: Record<ActivityLevel, number> = {
  Sedentary: 1.2,
  'Lightly active': 1.375,
  'Moderately active': 1.55,
  'Very active': 1.725,
  'Extremely active': 1.9,
}

interface CalculatorResult {
  bmr: number
  tdee: number
}

export default function SmartCalculator() {
  const [age, setAge] = useState<string>('')
  const [weight, setWeight] = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [gender, setGender] = useState<Gender>('male')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('')
  const [result, setResult] = useState<CalculatorResult | null>(null)

  const handleCalculate = () => {
    // Validate inputs
    const ageNum = parseInt(age)
    const weightNum = parseFloat(weight)
    const heightNum = parseFloat(height)

    if (!ageNum || !weightNum || !heightNum || !activityLevel) {
      alert('Vänligen fyll i alla fält')
      return
    }

    if (ageNum < 1 || ageNum > 120) {
      alert('Ålder måste vara mellan 1 och 120 år')
      return
    }

    if (weightNum < 20 || weightNum > 300) {
      alert('Vikt måste vara mellan 20 och 300 kg')
      return
    }

    if (heightNum < 100 || heightNum > 250) {
      alert('Längd måste vara mellan 100 och 250 cm')
      return
    }

    // Calculate BMR using Mifflin-St Jeor (always in metric)
    const bmr = calculateBMR('Mifflin-St Jeor equation', {
      gender,
      age: ageNum,
      weight: weightNum,
      height: heightNum,
    })

    if (!bmr) {
      alert('Det gick inte att beräkna BMR. Kontrollera dina värden.')
      return
    }

    // Calculate TDEE using Basic internet PAL values
    const palMultiplier = PAL_VALUES[activityLevel]
    const tdee = Math.round(bmr * palMultiplier)

    setResult({
      bmr: Math.round(bmr),
      tdee,
    })
  }

  return (
    <div className="rounded-2xl border border-lime-200 bg-lime-50 p-8 shadow-lg">
      <div className="mb-6 flex items-center space-x-3">
        <Calculator className="h-12 w-12 text-primary-600" />
        <h2 className="text-3xl font-bold text-neutral-900">Beräkna ditt dagliga kaloribehov.</h2>
      </div>

      <div className="space-y-4">
        {/* Gender Selection */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Kön</label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === 'male'}
                onChange={e => setGender(e.target.value as Gender)}
                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-neutral-700">Man</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === 'female'}
                onChange={e => setGender(e.target.value as Gender)}
                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-neutral-700">Kvinna</span>
            </label>
          </div>
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">Ålder</label>
          <input
            type="number"
            value={age}
            onChange={e => setAge(e.target.value)}
            className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="25"
            min="1"
            max="120"
          />
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">Vikt (kg)</label>
          <input
            type="number"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="75"
            min="20"
            max="300"
            step="0.1"
          />
        </div>

        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">Längd (cm)</label>
          <input
            type="number"
            value={height}
            onChange={e => setHeight(e.target.value)}
            className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
            placeholder="180"
            min="100"
            max="250"
          />
        </div>

        {/* Activity Level */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Aktivitetsnivå</label>
          <select
            value={activityLevel}
            onChange={e => setActivityLevel(e.target.value as ActivityLevel | '')}
            className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Välj aktivitetsnivå...</option>
            <option value="Sedentary">Stillasittande</option>
            <option value="Lightly active">Lätt aktiv</option>
            <option value="Moderately active">Måttligt aktiv</option>
            <option value="Very active">Mycket aktiv</option>
            <option value="Extremely active">Extremt aktiv</option>
          </select>

          {/* Activity Level Description - Only shown when activity level is selected */}
          {activityLevel && (
            <div className="mt-3 flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 leading-relaxed">
                {ACTIVITY_DESCRIPTIONS[activityLevel]}
              </p>
            </div>
          )}
        </div>

        {/* Calculate Button */}
        <Button onClick={handleCalculate} className="w-full">
          Beräkna
        </Button>

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-4 border-t pt-6">
            <h3 className="text-xl font-semibold text-neutral-900">Dina resultat</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-primary-50 p-4 border border-primary-200">
                <p className="text-sm font-medium text-neutral-600 mb-1">
                  BMR <span className="text-xs">(kcal/dag i vila)</span>
                </p>
                <p className="text-3xl font-bold text-primary-600">{result.bmr}</p>
                <p className="text-xs text-neutral-500 mt-1">Basal Metabolic Rate</p>
              </div>

              <div className="rounded-xl bg-accent-50 p-4 border border-accent-200">
                <p className="text-sm font-medium text-neutral-600 mb-1">
                  TDEE <span className="text-xs">(kcal/dag totalt)</span>
                </p>
                <p className="text-3xl font-bold text-accent-600">{result.tdee}</p>
                <p className="text-xs text-neutral-500 mt-1">Total Daily Energy Expenditure</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-6 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 p-6 border border-primary-200">
              <p className="text-sm text-neutral-700 mb-4">
                Vill du använda fler formler och verktyg eller lära dig mer om dina värden?{' '}
                <strong>Skapa ett konto eller logga in!</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link to="/register">Skapa konto</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/login">Logga in</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
