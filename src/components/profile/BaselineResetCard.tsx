/**
 * BaselineResetCard - Återställ Baseline BMR och AT
 * Varning: Detta är en kraftfull operation som nollställer metabolisk anpassning
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RotateCcw } from 'lucide-react'
import { useUpdateProfile } from '@/hooks'
import { calculateBMR } from '@/lib/calculations/bmr'
import { calculateAge } from '@/lib/calculations/helpers'
import { toast } from 'sonner'
import type { Profile } from '@/lib/types'

interface BaselineResetCardProps {
  profile: Profile
}

export default function BaselineResetCard({ profile }: BaselineResetCardProps) {
  const [isResetting, setIsResetting] = useState(false)
  const updateProfile = useUpdateProfile()

  // Don't show if no baseline_bmr (AT not enabled)
  if (!profile.baseline_bmr) return null

  const handleResetBaseline = async () => {
    // Warning confirmation
    const warningMessage =
      '⚠️ VARNING: Återställ Baseline BMR ⚠️\n\n' +
      'Detta kommer att:\n' +
      '• Sätta din baseline BMR till nuvarande beräknad BMR\n' +
      '• Nollställa all ackumulerad metabolisk anpassning (AT) till 0\n' +
      '• Ta bort all AT-historik\n\n' +
      'Denna åtgärd bör ENDAST göras efter:\n' +
      '• 8-12 veckor av dokumenterad energibalans\n' +
      '• Stabil vikt (±1 kg) under perioden\n' +
      '• Din metabolism har återhämtat sig från tidigare deficit/överskott\n\n' +
      'Vill du fortsätta?'

    const confirmed = window.confirm(warningMessage)
    if (!confirmed) return

    // Calculate new baseline from current data
    let newBaselineBMR: number | null = null
    if (profile.weight_kg && profile.height_cm && profile.birth_date && profile.gender) {
      const age = calculateAge(profile.birth_date)
      // Use same BMR formula as original baseline (Mifflin-St Jeor if manual TDEE, or selected formula if calculated)
      newBaselineBMR = calculateBMR(profile.weight_kg, profile.height_cm, age, profile.gender)
    }

    if (!newBaselineBMR) {
      toast.error('Kunde inte beräkna ny baseline BMR. Kontrollera att all grundläggande information är ifylld.')
      return
    }

    setIsResetting(true)

    try {
      await updateProfile.mutateAsync({
        profileId: profile.id,
        data: {
          baseline_bmr: newBaselineBMR,
          accumulated_at: 0,
          last_at_calculation_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
        },
      })

      toast.success(`Baseline BMR återställd till ${Math.round(newBaselineBMR)} kcal och AT nollställd!`)
    } catch (error) {
      console.error('Error resetting baseline:', error)
      toast.error('Kunde inte återställa baseline BMR')
    } finally {
      setIsResetting(false)
    }
  }

  // Calculate current BMR for comparison
  let currentBMR: number | null = null
  if (profile.weight_kg && profile.height_cm && profile.birth_date && profile.gender) {
    const age = calculateAge(profile.birth_date)
    currentBMR = calculateBMR(profile.weight_kg, profile.height_cm, age, profile.gender)
  }

  const bmrDifference = currentBMR ? currentBMR - profile.baseline_bmr : 0

  return (
    <Card className="border-amber-300 border-2">
      <CardHeader>
        <CardTitle className="text-amber-700 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Återställ Baseline BMR
        </CardTitle>
        <CardDescription>
          Nollställ din baseline BMR och metaboliska anpassning (AT)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current status */}
        <div className="p-3 bg-neutral-50 rounded-lg space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Nuvarande baseline BMR:</span>
            <span className="font-semibold">{Math.round(profile.baseline_bmr)} kcal</span>
          </div>
          {currentBMR && (
            <div className="flex justify-between text-sm">
              <span className="text-neutral-600">Beräknad BMR (nuvarande vikt):</span>
              <span className="font-semibold">
                {Math.round(currentBMR)} kcal
                {bmrDifference !== 0 && (
                  <span className={`ml-2 text-xs ${bmrDifference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ({bmrDifference > 0 ? '+' : ''}
                    {Math.round(bmrDifference)} kcal)
                  </span>
                )}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Ackumulerad AT:</span>
            <span className="font-semibold">
              {profile.accumulated_at !== undefined && profile.accumulated_at > 0 ? '+' : ''}
              {Math.round(profile.accumulated_at || 0)} kcal
            </span>
          </div>
        </div>

        {/* Warning text */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <p className="text-sm text-amber-900 mb-2">
            <strong>Viktigt:</strong> Återställning av baseline ska endast göras efter en period av stabil vikt och
            energibalans.
          </p>
          <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
            <li>8-12 veckor dokumenterad energibalans</li>
            <li>Stabil vikt (±1 kg)</li>
            <li>Metabolismen har återhämtat sig</li>
          </ul>
        </div>

        {/* Reset button */}
        <Button
          variant="outline"
          className="w-full border-amber-500 text-amber-700 hover:bg-amber-50"
          onClick={handleResetBaseline}
          disabled={isResetting}
        >
          <RotateCcw className={`h-4 w-4 mr-2 ${isResetting ? 'animate-spin' : ''}`} />
          {isResetting ? 'Återställer...' : 'Återställ Baseline'}
        </Button>
      </CardContent>
    </Card>
  )
}
