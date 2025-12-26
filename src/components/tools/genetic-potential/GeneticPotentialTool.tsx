import { useState, useMemo } from 'react'
import { Info, AlertCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useProfileData } from '@/hooks/useProfileData'
import { useMeasurementSets } from '@/hooks'
import {
  calculateAllModels,
  getTargetWeights,
  type GeneticPotentialResult,
} from '@/lib/calculations/geneticPotentialCalculations'
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
      'Casey Butts 2009 formel tar hänsyn till skelettstruktur genom handled- och ankelmått samt aktuell kroppsfett. Klassificerar överkropp och underkropp separat baserat på benstruktur. Mer precis än andra formler eftersom den beaktar individuella ramar och kroppsfett.',
    'Alan Aragon Model':
      'Aragon-modellen fokuserar på träningserfarenhet och realistiska gains över tid. Nybörjare: 1-1.5% av kroppsvikt/mån, Intermediär: 0.5-1%, Avancerad: 0.25-0.5%. Uppskattar potential baserat på nuvarande status.',
    'Lyle McDonald Model':
      'McDonalds konservativa modell baseras på biologiska gränser och långsiktig forskning. Använder längd i cm - 100 = max vikt i kg vid 10% kroppsfett. Känd för att ge realistiska, uppnåeliga mål.',
  }
  return explanations[fullName] || 'Information om denna formel saknas.'
}

export default function GeneticPotentialTool() {
  const profileData = useProfileData(['height_cm', 'gender', 'weight_kg', 'body_fat_percentage'])
  const { data: measurementSets } = useMeasurementSets()

  // Get wrist/ankle från senaste measurement set
  const latestMeasurement = useMemo(() => {
    return measurementSets && measurementSets.length > 0 ? measurementSets[0] : null
  }, [measurementSets])

  const [selectedFormulaIndex, setSelectedFormulaIndex] = useState(0)

  // Beräkna resultat
  const results = useMemo(() => {
    if (!profileData?.height_cm || !profileData?.gender) return null

    return calculateAllModels({
      heightCm: profileData.height_cm,
      gender: profileData.gender,
      wristCm: latestMeasurement?.wrist,
      ankleCm: latestMeasurement?.ankle,
      currentWeight: profileData.weight_kg,
      currentBodyFat: profileData.body_fat_percentage,
    })
  }, [profileData, latestMeasurement])

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

      {/* Warning if user is female - these formulas are designed for men only */}
      {profileData?.gender === 'female' && (
        <Alert variant="default" className="border-red-300 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-900">
            <p className="font-medium mb-2">Genetisk Muskelpotential är endast för män</p>
            <p>
              Dessa formler (Martin Berkhan, Casey Butt, Alan Aragon och Lyle McDonald) är alla
              utvecklade och validerade för män. De tar inte hänsyn till kvinnors fysiologi och
              hormonella skillnader, vilket innebär att resultaten inte skulle vara korrekta eller
              användbara för kvinnor.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {/* Warning if body fat percentage is missing */}
      {profileData?.gender === 'male' && !profileData?.body_fat_percentage && (
        <Alert variant="default" className="border-amber-300 bg-amber-50">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertDescription className="text-amber-900">
            <p className="font-medium mb-2">Kroppsfettprocent saknas</p>
            <p>
              För att få meningsfulla resultat från Genetisk Muskelpotential behöver du ange din
              kroppsfettprocent i din profil. Utan detta kan vi inte visa din nuvarande fettfria
              massa och hur nära du är din genetiska potential.
            </p>
            <Link
              to="/app/profile"
              className="inline-block mt-2 underline font-medium hover:text-amber-700"
            >
              Gå till Profil för att ange kroppsfettprocent
            </Link>
          </AlertDescription>
        </Alert>
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
          {/* Resultat per formel */}
          {results && results.length > 0 && (
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
        {results && results.length > 0 && profileData?.weight_kg && profileData?.body_fat_percentage && (
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
      {result.formula === 'Casey Butt' ? (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-3">
          <h4 className="text-sm font-semibold text-neutral-800 mb-3">
            Uppskattad maximal genetisk potential
          </h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-xs text-neutral-600">Fettfri massa (MLBM):</p>
              <p className="text-lg font-bold text-green-700">{result.maxLeanMass.toFixed(1)} kg</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-neutral-600">Kroppsvikt (MBW):</p>
              <p className="text-lg font-bold text-blue-700">{result.maxWeight.toFixed(1)} kg</p>
            </div>
            {result.maxBulkedWeight && (
              <div className="flex justify-between items-center">
                <p className="text-xs text-neutral-600">Bulked vikt (MBBW):</p>
                <p className="text-lg font-bold text-purple-700">
                  {result.maxBulkedWeight.toFixed(1)} kg
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-3">
          <div className="space-y-2">
            {/* Current body fat weight - primary info */}
            {weightAtCurrentBF && currentBodyFat && (
              <div>
                <p className="text-xs text-neutral-600">
                  Vid din kroppsfett ({currentBodyFat.toFixed(1)}%):
                </p>
                <p className="text-xl font-bold text-primary-700">
                  {weightAtCurrentBF.toFixed(1)} kg
                </p>
              </div>
            )}

            {/* Lean mass - secondary info */}
            <div className="pt-2 border-t border-green-200">
              <p className="text-xs text-neutral-600">Maximal fettfri massa:</p>
              <p className="text-lg font-semibold text-green-700">
                {result.maxLeanMass.toFixed(1)} kg
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uppskattad maximal genetisk potential för kroppsvikt */}
      <div>
        <h4 className="font-medium text-sm text-neutral-900 mb-2">
          Uppskattad maximal genetisk potential för kroppsvikt
        </h4>
        <p className="text-xs text-neutral-500 mb-3">Maxvikt vid olika kroppsfettprocent</p>
        <div className="grid grid-cols-5 gap-2 text-center">
          {targetWeights.slice(0, 10).map(target => {
            const isCurrentBF = currentBodyFat && Math.abs(target.bodyFat - currentBodyFat) < 1

            // Gradient colors based on BF% (lower BF = more green/lean)
            const getColorClasses = (bf: number) => {
              if (bf <= 10) return 'from-green-50 to-green-100 border-green-300'
              if (bf <= 15) return 'from-blue-50 to-blue-100 border-blue-300'
              if (bf <= 20) return 'from-yellow-50 to-yellow-100 border-yellow-300'
              return 'from-orange-50 to-orange-100 border-orange-300'
            }

            return (
              <div
                key={target.bodyFat}
                className={`rounded-lg p-2 border ${
                  isCurrentBF
                    ? 'bg-gradient-to-br from-primary-100 to-primary-200 border-primary-500 ring-1 ring-primary-400'
                    : `bg-gradient-to-br ${getColorClasses(target.bodyFat)}`
                }`}
              >
                <p
                  className={`text-xs font-medium ${isCurrentBF ? 'text-primary-700' : 'text-neutral-600'}`}
                >
                  {target.bodyFat}%
                </p>
                <p
                  className={`font-bold text-sm ${isCurrentBF ? 'text-primary-900' : 'text-neutral-900'}`}
                >
                  {target.weight.toFixed(1)}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Casey Butt specific: Gainer type and max measurements */}
      {result.formula === 'Casey Butt' &&
        result.upperBodyType &&
        result.lowerBodyType &&
        result.maxMeasurements && (
          <div className="space-y-3">
            {/* Gainer Type Badges */}
            <h4 className="font-medium text-sm text-neutral-900">Kroppstyp</h4>

            {/* Upper body classification */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-blue-900">Överkropp (handled):</p>
                <Badge variant={result.upperBodyType === 'easy' ? 'default' : 'secondary'}>
                  {result.upperBodyType === 'hard' ? 'Hardgainer' : 'Easygainer'}
                </Badge>
              </div>
              <p className="text-xs text-blue-700">
                {result.upperBodyType === 'hard'
                  ? 'Tunnare skelettstruktur - kräver mer fokus för överkroppsutveckling'
                  : 'Tjockare skelettstruktur - lättare bygga överkroppsmuskler'}
              </p>
            </div>

            {/* Lower body classification */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-purple-900">Underkropp (fotled):</p>
                <Badge variant={result.lowerBodyType === 'easy' ? 'default' : 'secondary'}>
                  {result.lowerBodyType === 'hard' ? 'Hardgainer' : 'Easygainer'}
                </Badge>
              </div>
              <p className="text-xs text-purple-700">
                {result.lowerBodyType === 'hard'
                  ? 'Tunnare skelettstruktur - kräver mer fokus för underkroppsutveckling'
                  : 'Tjockare skelettstruktur - lättare bygga underkroppsmuskler'}
              </p>
            </div>

            {/* Max Measurements */}
            <h4 className="font-medium text-sm text-neutral-900 mt-4">Maximala kroppsmått</h4>

            {/* Upper body measurements */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-900 mb-2">Överkropp</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-blue-600">Bröst</p>
                  <p className="text-base font-bold text-blue-900">
                    {result.maxMeasurements.chestCm.toFixed(1)} cm
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Biceps</p>
                  <p className="text-base font-bold text-blue-900">
                    {result.maxMeasurements.bicepsCm.toFixed(1)} cm
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Underarmar</p>
                  <p className="text-base font-bold text-blue-900">
                    {result.maxMeasurements.forearmsCm.toFixed(1)} cm
                  </p>
                </div>
                <div>
                  <p className="text-xs text-blue-600">Nacke</p>
                  <p className="text-base font-bold text-blue-900">
                    {result.maxMeasurements.neckCm.toFixed(1)} cm
                  </p>
                </div>
              </div>
            </div>

            {/* Lower body measurements */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-3">
              <p className="text-xs font-medium text-purple-900 mb-2">Underkropp</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-purple-600">Lår</p>
                  <p className="text-base font-bold text-purple-900">
                    {result.maxMeasurements.thighsCm.toFixed(1)} cm
                  </p>
                </div>
                <div>
                  <p className="text-xs text-purple-600">Vader</p>
                  <p className="text-base font-bold text-purple-900">
                    {result.maxMeasurements.calvesCm.toFixed(1)} cm
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
