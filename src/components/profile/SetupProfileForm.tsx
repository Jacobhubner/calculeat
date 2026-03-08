/**
 * SetupProfileForm - Formulär för grundläggande profilinfo vid första inloggning
 * Visas som Scenario 1 i ProfilePage när birth_date/gender/height/weight saknas.
 * Ersätter CTA-knappen som hänvisade till Settings.
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User } from 'lucide-react'
import type { Gender } from '@/lib/types'

interface SetupProfileFormProps {
  onSave: (data: {
    birth_date: string
    gender: Gender
    height_cm: number
    weight_kg: number
  }) => Promise<void>
  isSaving: boolean
}

const MONTHS = [
  'Januari',
  'Februari',
  'Mars',
  'April',
  'Maj',
  'Juni',
  'Juli',
  'Augusti',
  'September',
  'Oktober',
  'November',
  'December',
]

export default function SetupProfileForm({ onSave, isSaving }: SetupProfileFormProps) {
  const [birthDay, setBirthDay] = useState('')
  const [birthMonth, setBirthMonth] = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [gender, setGender] = useState<Gender | ''>('')
  const [heightString, setHeightString] = useState('')
  const [weightString, setWeightString] = useState('')

  const birthDate =
    birthDay && birthMonth && birthYear
      ? `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`
      : ''

  const height = parseFloat(heightString)
  const weight = parseFloat(weightString)

  const isValid =
    !!birthDate &&
    !!gender &&
    !isNaN(height) &&
    height >= 100 &&
    height <= 250 &&
    !isNaN(weight) &&
    weight >= 20 &&
    weight <= 400

  const handleSubmit = async () => {
    if (!isValid || !gender) return
    await onSave({
      birth_date: birthDate,
      gender: gender as Gender,
      height_cm: height,
      weight_kg: weight,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary-600" />
          Fyll i din grundläggande information
        </CardTitle>
        <p className="text-sm text-neutral-500 mt-1">
          Vi behöver dessa uppgifter för att beräkna ditt energibehov.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Födelsedatum */}
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">Födelsedatum</p>
          <div className="grid grid-cols-3 gap-2">
            <select
              value={birthDay}
              onChange={e => setBirthDay(e.target.value)}
              className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Dag</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <select
              value={birthMonth}
              onChange={e => setBirthMonth(e.target.value)}
              className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Månad</option>
              {MONTHS.map((m, i) => (
                <option key={i + 1} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={birthYear}
              onChange={e => setBirthYear(e.target.value)}
              className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">År</option>
              {Array.from({ length: 105 }, (_, i) => new Date().getFullYear() - i).map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Kön */}
        <div>
          <p className="text-sm font-medium text-neutral-700 mb-2">Kön</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="setup-gender"
                value="male"
                checked={gender === 'male'}
                onChange={() => setGender('male')}
                className="h-4 w-4 accent-primary-600"
              />
              <span className="text-sm text-neutral-700">Man</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="setup-gender"
                value="female"
                checked={gender === 'female'}
                onChange={() => setGender('female')}
                className="h-4 w-4 accent-primary-600"
              />
              <span className="text-sm text-neutral-700">Kvinna</span>
            </label>
          </div>
        </div>

        {/* Längd */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Längd (cm)</label>
          <input
            type="number"
            value={heightString}
            onChange={e => setHeightString(e.target.value)}
            placeholder="180"
            min="100"
            max="250"
            className="w-full max-w-xs px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Vikt */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">Vikt (kg)</label>
          <input
            type="number"
            value={weightString}
            onChange={e => setWeightString(e.target.value)}
            placeholder="75"
            min="20"
            max="400"
            step="0.1"
            className="w-full max-w-xs px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        <Button onClick={handleSubmit} disabled={!isValid || isSaving} className="w-full sm:w-auto">
          {isSaving ? 'Sparar...' : 'Spara och fortsätt'}
        </Button>
      </CardContent>
    </Card>
  )
}
