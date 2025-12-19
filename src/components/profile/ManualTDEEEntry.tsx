/**
 * ManualTDEEEntry - Formulär för manuell TDEE-inmatning
 * Använder startvikt från grundläggande information, endast TDEE och kroppsfettprocent (valfri)
 * Sparar automatiskt när TDEE är ifyllt
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUpdateProfile } from '@/hooks'
import { toast } from 'sonner'

interface ManualTDEEEntryProps {
  profileId: string
  initialWeight?: number
  onSuccess?: () => void
}

export default function ManualTDEEEntry({ profileId, initialWeight, onSuccess }: ManualTDEEEntryProps) {
  const [tdee, setTdee] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const updateProfile = useUpdateProfile()

  // Auto-save when TDEE is valid
  useEffect(() => {
    const tdeeNum = parseFloat(tdee)
    const bodyFatNum = bodyFat ? parseFloat(bodyFat) : undefined

    // Only auto-save if TDEE is valid and we have initial weight
    if (!isNaN(tdeeNum) && tdeeNum > 0 && initialWeight && initialWeight > 0) {
      // Validate body fat if provided
      if (bodyFat && (isNaN(bodyFatNum!) || bodyFatNum! < 0 || bodyFatNum! > 100)) {
        return // Don't save if body fat is invalid
      }

      // Debounce to avoid saving on every keystroke
      const timeoutId = setTimeout(async () => {
        try {
          await updateProfile.mutateAsync({
            profileId,
            data: {
              tdee: tdeeNum,
              weight_kg: initialWeight,
              body_fat_percentage: bodyFatNum,
              tdee_source: 'manual',
              tdee_calculated_at: new Date().toISOString(),
              tdee_calculation_snapshot: {
                weight_kg: initialWeight,
                calculated_tdee: tdeeNum,
                note: 'Manuellt angiven TDEE',
              },
            },
          })

          toast.success('TDEE sparad!')
          onSuccess?.()
        } catch (error) {
          console.error('Error saving manual TDEE:', error)
          // Don't show error toast for auto-save
        }
      }, 1000) // Wait 1 second after user stops typing

      return () => clearTimeout(timeoutId)
    }
  }, [tdee, bodyFat, initialWeight, profileId, updateProfile, onSuccess])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ange TDEE manuellt</CardTitle>
        <CardDescription>
          Ange ditt TDEE om du redan känner till det från en annan källa eller beräkning
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Show initial weight from basic info */}
          {initialWeight && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-900">
                <strong>Startvikt:</strong> {initialWeight} kg (från Grundläggande information)
              </p>
            </div>
          )}

          {/* TDEE Input */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              TDEE (kcal/dag) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              value={tdee}
              onChange={e => setTdee(e.target.value)}
              className="block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="2500"
              min="500"
              max="10000"
            />
          </div>

          {/* Body Fat Percentage (Optional) */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Kroppsfettprocent (valfri)
            </label>
            <input
              type="number"
              value={bodyFat}
              onChange={e => setBodyFat(e.target.value)}
              className="block w-full rounded-xl border-neutral-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              placeholder="15"
              min="0"
              max="100"
              step="0.1"
            />
            <p className="text-xs text-neutral-500 mt-1">
              Krävs för vissa BMR-formler om du vill beräkna TDEE senare
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
