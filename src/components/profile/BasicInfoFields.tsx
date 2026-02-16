/**
 * BasicInfoFields - Grundläggande profilfält (födelsedatum, kön, längd)
 * Kollapsbar sektion med låslogik
 * Dessa fält låses när grundläggande information är ifylld
 * Startvikt hanteras nu via viktspårning (WeightTracker) istället
 */

import { useState, useEffect } from 'react'
import { Lock, Info, ChevronDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Gender } from '@/lib/types'

interface BasicInfoFieldsProps {
  birthDate?: string
  gender?: Gender | ''
  height?: number
  weight?: number
  onBirthDateChange: (birthDate: string) => void
  onGenderChange: (gender: Gender | '') => void
  onHeightChange: (height: number | undefined) => void
  onWeightChange?: (weight: number | undefined) => void
  locked?: boolean
  showLockNotice?: boolean
}

export default function BasicInfoFields({
  birthDate,
  gender,
  height,
  weight,
  onBirthDateChange,
  onGenderChange,
  onHeightChange,
  onWeightChange,
  locked = false,
  showLockNotice = false,
}: BasicInfoFieldsProps) {
  // Collapsible state - collapsed when locked (info already filled), open otherwise
  const [isOpen, setIsOpen] = useState(!locked)

  // Parse birth date into day, month, year for dropdowns
  const parsedDate = birthDate ? new Date(birthDate) : null
  const [birthDay, setBirthDay] = useState(parsedDate?.getDate().toString() || '')
  const [birthMonth, setBirthMonth] = useState(
    parsedDate ? (parsedDate.getMonth() + 1).toString() : ''
  )
  const [birthYear, setBirthYear] = useState(parsedDate?.getFullYear().toString() || '')
  const [heightString, setHeightString] = useState(height?.toString() || '')
  const [weightString, setWeightString] = useState(weight?.toString() || '')

  // Sync local state when props change (avoid cascading renders by checking if actually changed)
  useEffect(() => {
    if (birthDate) {
      const date = new Date(birthDate)
      const newDay = date.getDate().toString()
      const newMonth = (date.getMonth() + 1).toString()
      const newYear = date.getFullYear().toString()

      // Only update if values actually changed
      if (birthDay !== newDay) setBirthDay(newDay)
      if (birthMonth !== newMonth) setBirthMonth(newMonth)
      if (birthYear !== newYear) setBirthYear(newYear)
    }
  }, [birthDate, birthDay, birthMonth, birthYear])

  useEffect(() => {
    const newHeightString = height?.toString() || ''
    if (heightString !== newHeightString) {
      setHeightString(newHeightString)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height])

  useEffect(() => {
    const newWeightString = weight?.toString() || ''
    if (weightString !== newWeightString) {
      setWeightString(newWeightString)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weight])

  // Confirmation dialog for locked field changes
  const confirmLockedFieldChange = (fieldName: string): boolean => {
    if (!locked) return true

    return window.confirm(
      `Varning: Du försöker ändra "${fieldName}".\n\n` +
        `Denna uppgift delas mellan alla dina profilkort och kan endast ändras när du har ett enda profilkort.\n\n` +
        `Om du fortsätter kommer ändringen att påverka alla dina profilkort.\n\n` +
        `Vill du fortsätta?`
    )
  }

  // Handle individual dropdown changes
  const handleDayChange = (day: string) => {
    if (locked && birthDay && !confirmLockedFieldChange('Födelsedatum')) {
      return
    }
    setBirthDay(day)
    updateBirthDate(day, birthMonth, birthYear)
  }

  const handleMonthChange = (month: string) => {
    if (locked && birthMonth && !confirmLockedFieldChange('Födelsedatum')) {
      return
    }
    setBirthMonth(month)
    updateBirthDate(birthDay, month, birthYear)
  }

  const handleYearChange = (year: string) => {
    if (locked && birthYear && !confirmLockedFieldChange('Födelsedatum')) {
      return
    }
    setBirthYear(year)
    updateBirthDate(birthDay, birthMonth, year)
  }

  const updateBirthDate = (day: string, month: string, year: string) => {
    // Only update if all three fields are filled
    if (day && month && year) {
      // Format as YYYY-MM-DD without timezone conversion
      // Pad month and day with leading zeros if needed
      const formattedMonth = month.padStart(2, '0')
      const formattedDay = day.padStart(2, '0')
      const dateString = `${year}-${formattedMonth}-${formattedDay}`
      onBirthDateChange(dateString)
    }
    // Don't send empty string if incomplete - just do nothing
  }

  const handleGenderChange = (newGender: Gender) => {
    if (locked && gender && !confirmLockedFieldChange('Kön')) {
      return
    }
    onGenderChange(newGender)
  }

  const handleHeightInput = (value: string) => {
    if (locked && heightString && !confirmLockedFieldChange('Längd')) {
      return
    }
    setHeightString(value)
  }

  const handleHeightBlur = () => {
    const num = parseFloat(heightString)
    onHeightChange(isNaN(num) ? undefined : num)
  }

  const handleWeightInput = (value: string) => {
    setWeightString(value)
  }

  const handleWeightBlur = () => {
    if (onWeightChange) {
      const num = parseFloat(weightString)
      onWeightChange(isNaN(num) ? undefined : num)
    }
  }

  const lockTitle = 'Dessa fält är låsta. Radera alla profilkort för att kunna ändra dem.'

  return (
    <Card className="border-2 border-neutral-300">
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
          type="button"
        >
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-neutral-600" />
            Grundläggande information
          </CardTitle>
          <ChevronDown
            className={`h-5 w-5 text-neutral-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          {/* Lock notice - only show if fields are locked */}
          {showLockNotice && locked && (
            <Alert variant="info">
              <Lock className="h-4 w-4" />
              <AlertDescription>
                <div className="flex-1">
                  <h4 className="font-semibold text-blue-900 mb-1">Alla fält är låsta</h4>
                  <p className="text-sm text-blue-800 mb-2">
                    Födelsedatum, kön och längd delas mellan alla dina profilkort och låses när
                    grundläggande information är ifylld. Du kan inte ändra dessa fält när du har
                    aktiva profilkort.
                  </p>
                  <p className="text-sm text-blue-800">
                    <strong>För att ändra dessa värden:</strong> Radera alla dina profilkort och
                    skapa ett nytt första profilkort med korrekta värden.
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Birth Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              Födelsedatum <span className="text-red-600">*</span>
              {locked && (
                <span className="flex items-center gap-1 text-xs text-neutral-500 font-normal">
                  <Lock className="h-3 w-3" />
                  Låst
                </span>
              )}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Day Dropdown */}
              <div className="relative">
                {locked && (
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 z-10 pointer-events-none" />
                )}
                <select
                  value={birthDay}
                  onChange={e => handleDayChange(e.target.value)}
                  disabled={locked}
                  className={`block w-full rounded-xl shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                    locked
                      ? 'bg-neutral-200 cursor-not-allowed text-neutral-400 border-dashed border-2 border-neutral-300 pl-9'
                      : 'border-neutral-300'
                  }`}
                  title={locked ? lockTitle : ''}
                >
                  <option value="">Dag</option>
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month Dropdown */}
              <div className="relative">
                {locked && (
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 z-10 pointer-events-none" />
                )}
                <select
                  value={birthMonth}
                  onChange={e => handleMonthChange(e.target.value)}
                  disabled={locked}
                  className={`block w-full rounded-xl shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                    locked
                      ? 'bg-neutral-200 cursor-not-allowed text-neutral-400 border-dashed border-2 border-neutral-300 pl-9'
                      : 'border-neutral-300'
                  }`}
                  title={locked ? lockTitle : ''}
                >
                  <option value="">Månad</option>
                  {[
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
                  ].map((month, index) => (
                    <option key={index + 1} value={index + 1}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Dropdown */}
              <div className="relative">
                {locked && (
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 z-10 pointer-events-none" />
                )}
                <select
                  value={birthYear}
                  onChange={e => handleYearChange(e.target.value)}
                  disabled={locked}
                  className={`block w-full rounded-xl shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                    locked
                      ? 'bg-neutral-200 cursor-not-allowed text-neutral-400 border-dashed border-2 border-neutral-300 pl-9'
                      : 'border-neutral-300'
                  }`}
                  title={locked ? lockTitle : ''}
                >
                  <option value="">År</option>
                  {Array.from({ length: 105 }, (_, i) => new Date().getFullYear() - i).map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              Kön <span className="text-red-600">*</span>
              {locked && (
                <span className="flex items-center gap-1 text-xs text-neutral-500 font-normal">
                  <Lock className="h-3 w-3" />
                  Låst
                </span>
              )}
            </label>
            <div
              className={`flex gap-4 p-3 rounded-xl ${
                locked ? 'bg-neutral-200 border-dashed border-2 border-neutral-300' : ''
              }`}
            >
              <label
                className={`flex items-center ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                title={locked ? lockTitle : ''}
              >
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === 'male'}
                  onChange={e => handleGenderChange(e.target.value as Gender)}
                  disabled={locked}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
                />
                <span className={locked ? 'text-neutral-400' : 'text-neutral-700'}>Man</span>
              </label>
              <label
                className={`flex items-center ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                title={locked ? lockTitle : ''}
              >
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === 'female'}
                  onChange={e => handleGenderChange(e.target.value as Gender)}
                  disabled={locked}
                  className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 disabled:cursor-not-allowed"
                />
                <span className={locked ? 'text-neutral-400' : 'text-neutral-700'}>Kvinna</span>
              </label>
            </div>
          </div>

          {/* Height */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2 flex items-center gap-2">
              Längd (cm) <span className="text-red-600">*</span>
              {locked && (
                <span className="flex items-center gap-1 text-xs text-neutral-500 font-normal">
                  <Lock className="h-3 w-3" />
                  Låst
                </span>
              )}
            </label>
            <div className="relative">
              {locked && (
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 z-10 pointer-events-none" />
              )}
              <input
                type="number"
                value={heightString}
                onChange={e => handleHeightInput(e.target.value)}
                onBlur={handleHeightBlur}
                disabled={locked}
                className={`mt-1 block w-full rounded-xl shadow-sm focus:border-primary-500 focus:ring-primary-500 ${
                  locked
                    ? 'bg-neutral-200 cursor-not-allowed text-neutral-400 border-dashed border-2 border-neutral-300 pl-10'
                    : 'border-neutral-300'
                }`}
                placeholder="180"
                min="100"
                max="250"
                title={locked ? lockTitle : ''}
              />
            </div>
          </div>

          {/* Weight - never locked, always editable */}
          {onWeightChange && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Vikt (kg) <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                value={weightString}
                onChange={e => handleWeightInput(e.target.value)}
                onBlur={handleWeightBlur}
                className="mt-1 block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                placeholder="80"
                min="30"
                max="300"
                step="0.1"
              />
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
