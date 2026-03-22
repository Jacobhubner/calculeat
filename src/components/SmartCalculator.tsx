import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Calculator, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from './ui/button'
import { calculateBMRWithFormula } from '@/lib/calculations/bmr'
import { getBasicInternetPAL, type ActivityLevel } from '@/lib/calculations/tdee'
import type { Gender } from '@/lib/types'

interface CalculatorResult {
  bmr: number
  tdee: number
}

export default function SmartCalculator() {
  const { t } = useTranslation('marketing')
  const [age, setAge] = useState<string>('')
  const [weight, setWeight] = useState<string>('')
  const [height, setHeight] = useState<string>('')
  const [gender, setGender] = useState<Gender | 'other' | ''>('')
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | ''>('')
  const [result, setResult] = useState<CalculatorResult | null>(null)
  const [genderError, setGenderError] = useState<boolean>(false)

  const handleCalculate = () => {
    // Validate inputs
    const ageNum = parseInt(age)
    const weightNum = parseFloat(weight)
    const heightNum = parseFloat(height)

    if (!ageNum || !weightNum || !heightNum || !activityLevel || !gender) {
      alert(t('home.smartCalc.errorAllFields'))
      return
    }

    if (gender === 'other') {
      alert(t('home.smartCalc.errorGender'))
      return
    }

    if (ageNum < 1 || ageNum > 120) {
      alert(t('home.smartCalc.errorAge'))
      return
    }

    if (weightNum < 20 || weightNum > 300) {
      alert(t('home.smartCalc.errorWeight'))
      return
    }

    if (heightNum < 100 || heightNum > 250) {
      alert(t('home.smartCalc.errorHeight'))
      return
    }

    // Calculate BMR using Mifflin-St Jeor (always in metric)
    const bmr = calculateBMRWithFormula('Mifflin-St Jeor equation', {
      gender,
      age: ageNum,
      weight: weightNum,
      height: heightNum,
    })

    if (!bmr) {
      alert(t('home.smartCalc.errorBmr'))
      return
    }

    // Calculate TDEE using Basic internet PAL values
    const palMultiplier = getBasicInternetPAL(activityLevel)

    // Validate PAL multiplier
    if (!palMultiplier || palMultiplier <= 0) {
      alert(t('home.smartCalc.errorTdee'))
      return
    }

    const tdee = Math.round(bmr * palMultiplier)

    setResult({
      bmr: Math.round(bmr),
      tdee,
    })
  }

  const activityDescriptions: Record<ActivityLevel, string> = {
    Sedentary: t('home.smartCalc.activityDescSedentary'),
    'Lightly active': t('home.smartCalc.activityDescLightly'),
    'Moderately active': t('home.smartCalc.activityDescModerately'),
    'Very active': t('home.smartCalc.activityDescVery'),
    'Extremely active': t('home.smartCalc.activityDescExtremely'),
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-lg">
      <div className="mb-6 flex items-center space-x-3">
        <Calculator className="h-12 w-12 text-primary-600" />
        <h2 className="text-3xl font-bold text-neutral-900">{t('home.smartCalc.title')}</h2>
      </div>

      <div className="space-y-4">
        {/* Gender Selection */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('home.smartCalc.genderLabel')}
          </label>
          <div className="flex gap-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="male"
                checked={gender === 'male'}
                onChange={e => {
                  setGender(e.target.value as Gender | 'other' | '')
                  setGenderError(false)
                }}
                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-neutral-700">{t('home.smartCalc.genderMale')}</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="female"
                checked={gender === 'female'}
                onChange={e => {
                  setGender(e.target.value as Gender | 'other' | '')
                  setGenderError(false)
                }}
                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-neutral-700">{t('home.smartCalc.genderFemale')}</span>
            </label>
            <label className="flex items-center cursor-pointer">
              <input
                type="radio"
                name="gender"
                value="other"
                checked={gender === 'other'}
                onChange={e => {
                  setGender(e.target.value as Gender | 'other' | '')
                  setGenderError(true)
                }}
                className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-neutral-700">{t('home.smartCalc.genderOther')}</span>
            </label>
          </div>
          {genderError && (
            <p className="mt-2 text-sm text-red-600 font-medium">
              {t('home.smartCalc.genderError')}
            </p>
          )}
        </div>

        {/* Age */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            {t('home.smartCalc.ageLabel')}
          </label>
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

        {/* Height */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            {t('home.smartCalc.heightLabel')}
          </label>
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

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium text-neutral-700">
            {t('home.smartCalc.weightLabel')}
          </label>
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

        {/* Activity Level */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">
            {t('home.smartCalc.activityLabel')}
          </label>
          <select
            value={activityLevel}
            onChange={e => setActivityLevel(e.target.value as ActivityLevel | '')}
            className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">{t('home.smartCalc.activityPlaceholder')}</option>
            <option value="Sedentary">{t('home.smartCalc.activitySedentary')}</option>
            <option value="Lightly active">{t('home.smartCalc.activityLightly')}</option>
            <option value="Moderately active">{t('home.smartCalc.activityModerately')}</option>
            <option value="Very active">{t('home.smartCalc.activityVery')}</option>
            <option value="Extremely active">{t('home.smartCalc.activityExtremely')}</option>
          </select>

          {/* Activity Level Description - Only shown when activity level is selected */}
          {activityLevel && (
            <div className="mt-3 flex gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 leading-relaxed">
                {activityDescriptions[activityLevel]}
              </p>
            </div>
          )}
        </div>

        {/* Calculate Button */}
        <Button onClick={handleCalculate} className="w-full">
          {t('home.smartCalc.calculateButton')}
        </Button>

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-4 border-t border-lime-200 bg-lime-50 rounded-xl p-6 pt-6">
            <h3 className="text-xl font-semibold text-neutral-900">
              {t('home.smartCalc.resultsTitle')}
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-primary-50 p-4 border border-primary-200">
                <p className="text-sm font-medium text-neutral-600 mb-1">
                  {t('home.smartCalc.bmrLabel')}{' '}
                  <span className="text-xs">({t('home.smartCalc.bmrSub')})</span>
                </p>
                <p className="text-3xl font-bold text-primary-600">{Math.round(result.bmr)} kcal</p>
                <p className="text-xs text-neutral-500 mt-1">Basal Metabolic Rate</p>
              </div>

              <div className="rounded-xl bg-accent-50 p-4 border border-accent-200">
                <p className="text-sm font-medium text-neutral-600 mb-1">
                  {t('home.smartCalc.tdeeLabel')}{' '}
                  <span className="text-xs">({t('home.smartCalc.tdeeSub')})</span>
                </p>
                <p className="text-3xl font-bold text-accent-600">{Math.round(result.tdee)} kcal</p>
                <p className="text-xs text-neutral-500 mt-1">Total Daily Energy Expenditure</p>
              </div>
            </div>

            {/* Call to Action */}
            <div className="mt-6 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 p-6 border border-primary-200">
              <p className="text-sm text-neutral-700 mb-4">
                {t('home.smartCalc.ctaText')} <strong>{t('home.smartCalc.ctaBold')}</strong>
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button asChild className="flex-1">
                  <Link to="/register">{t('home.smartCalc.ctaRegister')}</Link>
                </Button>
                <Button variant="outline" asChild className="flex-1">
                  <Link to="/login">{t('home.smartCalc.ctaLogin')}</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
