import { useState, useMemo } from 'react'
import { Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { useProfileData, useMissingProfileData } from '@/hooks/useProfileData'
import MissingDataCard from '../common/MissingDataCard'
import { useUpdateProfile } from '@/hooks'
import {
  calculateAllModels,
  getTargetWeights,
  type GeneticPotentialResult,
} from '@/lib/calculations/geneticPotentialCalculations'
import { toast } from 'sonner'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Helper function to get short display names for formulas
function getFormulaDisplayName(fullName: string): string {
  const nameMap: Record<string, string> = {
    'Martin Berkhan (Leangains)': 'Berkhan Formula',
    'Casey Butt': 'Casey Butt Formula',
    'Alan Aragon Model': 'Alan Aragon Model',
    'Lyle McDonald Model': 'Lyle McDonald Model',
  }
  return nameMap[fullName] || fullName
}

// Helper function to get formula explanations
function getFormulaExplanation(fullName: string): string {
  const explanations: Record<string, string> = {
    'Martin Berkhan (Leangains)':
      'Berkhan-formeln baseras på tävlingsvikt vid extremt låg kroppsfett (5% för män, 12% för kvinnor). Använder enkelt längd - 100 tum = vikt i pounds. Populär för sin enkelhet och fokus på naturlig gräns vid lågfett.',
    'Casey Butt':
      'Casey Butts formel tar hänsyn till skelettstruktur genom handled- och ankelmått. Mer precis än andra formler eftersom den beaktar individuella ramar. Baserad på data från naturliga bodybuilders.',
    'Alan Aragon Model':
      'Aragon-modellen fokuserar på träningserfarenhet och realistiska gains över tid. Nybörjare: 1-1.5% av kroppsvikt/mån, Intermediär: 0.5-1%, Avancerad: 0.25-0.5%. Uppskattar potential baserat på nuvarande status.',
    'Lyle McDonald Model':
      'McDonalds konservativa modell baseras på biologiska gränser och långsiktig forskning. Använder längd i cm - 100 = max vikt i kg vid 10% kroppsfett. Känd för att ge realistiska, uppnåeliga mål.',
  }
  return explanations[fullName] || 'Information om denna formel saknas.'
}

export default function GeneticPotentialTool() {
  const profileData = useProfileData(['height_cm', 'gender', 'weight_kg', 'body_fat_percentage'])

  const missingFields = useMissingProfileData(['height_cm', 'gender'])
  const updateProfileMutation = useUpdateProfile()

  // Local state för handled/ankel mätningar (inte i profil)
  const [wristCm, setWristCm] = useState<number | ''>('')
  const [ankleCm, setAnkleCm] = useState<number | ''>('')
  const [selectedFormulaIndex, setSelectedFormulaIndex] = useState(0)

  // Beräkna resultat
  const results = useMemo(() => {
    if (!profileData?.height_cm || !profileData?.gender) return null

    return calculateAllModels({
      heightCm: profileData.height_cm,
      gender: profileData.gender,
      wristCm: wristCm ? Number(wristCm) : undefined,
      ankleCm: ankleCm ? Number(ankleCm) : undefined,
      currentWeight: profileData.weight_kg,
      currentBodyFat: profileData.body_fat_percentage,
    })
  }, [profileData, wristCm, ankleCm])

  const handleSaveMissingData = async (data: Partial<Profile>) => {
    try {
      await updateProfileMutation.mutateAsync(data)
      toast.success('Profil uppdaterad')
    } catch (error) {
      toast.error('Kunde inte uppdatera profil')
      throw error
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Genetisk Muskelpotential</h2>
          <p className="text-neutral-600 mt-1">
            Beräkna din maximala muskelmassa baserat på längd och kroppsbyggnad
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Kroppsanalys
        </Badge>
      </div>

      {/* Saknad Data */}
      {missingFields.length > 0 && (
        <MissingDataCard
          missingFields={missingFields.map(field => ({
            key: field.key,
            label: field.label,
            type: field.key === 'gender' ? 'select' : 'number',
            options:
              field.key === 'gender'
                ? [
                    { value: 'male', label: 'Man' },
                    { value: 'female', label: 'Kvinna' },
                  ]
                : undefined,
          }))}
          onSave={handleSaveMissingData}
        />
      )}

      {/* Info Alert */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Om Genetisk Muskelpotential</p>
              <p className="text-blue-700">
                Dessa modeller uppskattar din maximala naturliga muskelmassa. Resultaten varierar
                mellan formler beroende på vilka faktorer de tar hänsyn till. Ingen formel är 100%
                exakt, men de ger en användbar riktlinje för realistiska mål.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Vänster: Inputs */}
        <div className="space-y-6">
          {/* Skelettmätningar */}
          <Card>
            <CardHeader>
              <CardTitle>Skelettmätningar (Valfritt)</CardTitle>
              <CardDescription>
                För mer exakta beräkningar med Casey Butt&apos;s formel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wrist">Handledsmått (cm)</Label>
                  <Input
                    id="wrist"
                    type="number"
                    step="0.1"
                    placeholder="16.5"
                    value={wristCm}
                    onChange={e =>
                      setWristCm(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                  />
                  <p className="text-xs text-neutral-500 mt-1">Mät på smalaste punkten</p>
                </div>
                <div>
                  <Label htmlFor="ankle">Ankelmått (cm)</Label>
                  <Input
                    id="ankle"
                    type="number"
                    step="0.1"
                    placeholder="22.0"
                    value={ankleCm}
                    onChange={e =>
                      setAnkleCm(e.target.value === '' ? '' : parseFloat(e.target.value))
                    }
                  />
                  <p className="text-xs text-neutral-500 mt-1">Mät på smalaste punkten</p>
                </div>
              </div>

              {/* Mätguide */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-neutral-900 mb-2">Mätinstruktioner:</p>
                <ul className="space-y-1 text-neutral-600">
                  <li>
                    • <strong>Handled:</strong> Mät runt handleden på smalaste punkten
                  </li>
                  <li>
                    • <strong>Ankel:</strong> Mät runt ankeln på smalaste punkten (ovanför fotleden)
                  </li>
                  <li>• Använd måttband och mät utan skor</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Resultat per formel */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Beräknade Resultat</CardTitle>
                <CardDescription>Olika modeller ger olika uppskattningar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Formula selector buttons */}
                <TooltipProvider>
                  <div className="flex gap-2 flex-wrap">
                    {results.map((result, index) => (
                      <Tooltip key={index}>
                        <TooltipTrigger asChild>
                          <Button
                            variant={selectedFormulaIndex === index ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedFormulaIndex(index)}
                            className="gap-1.5"
                          >
                            {getFormulaDisplayName(result.formula)}
                            <Info className="h-3 w-3 opacity-70" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <p className="text-xs">{getFormulaExplanation(result.formula)}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>

                {/* Formula explanation card */}
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-blue-900 mb-1">
                          {getFormulaDisplayName(results[selectedFormulaIndex].formula)}
                        </p>
                        <p className="text-xs text-blue-700 leading-relaxed">
                          {getFormulaExplanation(results[selectedFormulaIndex].formula)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Selected formula result */}
                <ResultCard
                  result={results[selectedFormulaIndex]}
                  currentBodyFat={profileData?.body_fat_percentage}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Höger: Nuvarande Status */}
        {results && profileData?.weight_kg && profileData?.body_fat_percentage && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Din Nuvarande Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-600">Vikt:</span>
                    <span className="font-medium">{profileData.weight_kg.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-600">Kroppsfett:</span>
                    <span className="font-medium">
                      {profileData.body_fat_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Fettfri massa:</span>
                    <span className="font-medium">
                      {(
                        profileData.weight_kg *
                        (1 - profileData.body_fat_percentage / 100)
                      ).toFixed(1)}{' '}
                      kg
                    </span>
                  </div>
                </div>

                {/* Progress */}
                {results[selectedFormulaIndex].currentProgress !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-neutral-600">
                        Progress ({results[selectedFormulaIndex].formula}):
                      </span>
                      <span className="font-bold text-primary-600">
                        {results[selectedFormulaIndex].currentProgress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={results[selectedFormulaIndex].currentProgress}
                      className="h-2"
                    />
                  </div>
                )}

                {results[selectedFormulaIndex].remainingPotential !== undefined && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-neutral-600 mb-1">Återstående potential:</p>
                    <p className="text-2xl font-bold text-green-600">
                      +{results[selectedFormulaIndex].remainingPotential.toFixed(1)} kg
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">fettfri massa att bygga</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// Hjälpkomponent för att visa resultat
function ResultCard({
  result,
  currentBodyFat,
}: {
  result: GeneticPotentialResult
  currentBodyFat?: number
}) {
  const targetWeights = getTargetWeights(result.maxLeanMass)

  // Calculate weight at user's current body fat %
  const weightAtCurrentBF = currentBodyFat ? result.maxLeanMass / (1 - currentBodyFat / 100) : null

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
        <p className="text-sm text-neutral-600 mb-1">{result.description}</p>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <p className="text-xs text-neutral-500">Maximal fettfri massa:</p>
            <p className="text-2xl font-bold text-green-700">{result.maxLeanMass.toFixed(1)} kg</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Vid låg kroppsfett:</p>
            <p className="text-2xl font-bold text-blue-700">{result.maxWeight.toFixed(1)} kg</p>
          </div>
        </div>

        {/* Show weight at user's current body fat % */}
        {weightAtCurrentBF && currentBodyFat && (
          <div className="mt-4 pt-4 border-t border-green-300">
            <p className="text-xs text-neutral-500 mb-1">
              Vid din kroppsfett ({currentBodyFat.toFixed(1)}%):
            </p>
            <p className="text-2xl font-bold text-primary-600">{weightAtCurrentBF.toFixed(1)} kg</p>
          </div>
        )}
      </div>

      {/* Martin Berkhan: Show exact BF% result if available */}
      {result.formula === 'Martin Berkhan (Leangains)' && currentBodyFat && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-900">
              Maxvikt vid din kroppsfett% ({currentBodyFat.toFixed(1)}%):
            </p>
            <p className="text-2xl font-bold text-blue-700">{result.maxWeight.toFixed(1)} kg</p>
          </div>
          <p className="text-xs text-blue-700">
            Berkhan&apos;s formel justerar maxvikten baserat på din faktiska kroppsfettprocent.
            Längre personer och högre BF% ger högre maxvikt.
          </p>
        </div>
      )}

      {/* Målvikter vid olika kroppsfett % */}
      <div>
        <h4 className="font-medium text-sm text-neutral-900 mb-2">
          Målvikt vid olika kroppsfett %:
        </h4>
        <div className="grid grid-cols-4 gap-2 text-center">
          {targetWeights.slice(0, 8).map(target => {
            const isCurrentBF = currentBodyFat && Math.abs(target.bodyFat - currentBodyFat) < 1
            return (
              <div
                key={target.bodyFat}
                className={`rounded-lg p-2 border ${
                  isCurrentBF
                    ? 'bg-primary-100 border-primary-400 ring-2 ring-primary-300'
                    : 'bg-neutral-50 border-neutral-200'
                }`}
              >
                <p
                  className={`text-xs ${isCurrentBF ? 'text-primary-700 font-semibold' : 'text-neutral-500'}`}
                >
                  {target.bodyFat}%
                </p>
                <p
                  className={`font-semibold text-sm ${isCurrentBF ? 'text-primary-900' : 'text-neutral-900'}`}
                >
                  {target.weight.toFixed(1)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Casey Butt specific: Max measurements and gainer type */}
      {result.formula === 'Casey Butt' && result.maxMeasurements && result.gainerType && (
        <div className="space-y-4">
          {/* Gainer Type Badge */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-purple-900">Kroppstyp:</p>
              <Badge
                variant={
                  result.gainerType === 'easy'
                    ? 'default'
                    : result.gainerType === 'hard'
                      ? 'destructive'
                      : 'secondary'
                }
              >
                {result.gainerType === 'easy'
                  ? 'Easy Gainer (Mesomorph/Endomorph)'
                  : result.gainerType === 'hard'
                    ? 'Hard Gainer (Ectomorph)'
                    : 'Average Gainer'}
              </Badge>
            </div>
            <p className="text-xs text-purple-700">
              Baserat på handled/ankel-förhållande.{' '}
              {result.gainerType === 'easy'
                ? 'Lättare att bygga muskler.'
                : result.gainerType === 'hard'
                  ? 'Svårare att bygga muskler, kräver mer kalorier.'
                  : 'Genomsnittlig förutsättning att bygga muskler.'}
            </p>
          </div>

          {/* Max Measurements */}
          <div>
            <h4 className="font-medium text-sm text-neutral-900 mb-2">
              Maximala kroppsmått (vid låg kroppsfett):
            </h4>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                <p className="text-xs text-orange-600 mb-1">Max Arm</p>
                <p className="text-lg font-bold text-orange-900">
                  {result.maxMeasurements.armCm.toFixed(1)} cm
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                <p className="text-xs text-orange-600 mb-1">Max Bröst</p>
                <p className="text-lg font-bold text-orange-900">
                  {result.maxMeasurements.chestCm.toFixed(1)} cm
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                <p className="text-xs text-orange-600 mb-1">Max Vad</p>
                <p className="text-lg font-bold text-orange-900">
                  {result.maxMeasurements.calfCm.toFixed(1)} cm
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
