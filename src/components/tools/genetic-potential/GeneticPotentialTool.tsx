import { useState, useMemo } from 'react'
import { AlertCircle } from 'lucide-react'
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
  type LyleMcDonaldReference,
  type AlanAragonReference,
} from '@/lib/calculations/geneticPotentialCalculations'

// Helper function to get short display names for formulas
function getFormulaDisplayName(fullName: string): string {
  const nameMap: Record<string, string> = {
    'Martin Berkhan (Leangains)': "Martin Berkhan's formel",
    'Casey Butt': "Casey Butt's formel",
    "Alan Aragon's modell": "Alan Aragon's modell",
    "Lyle McDonald's modell": "Lyle McDonald's modell",
  }
  return nameMap[fullName] || fullName
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
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
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
                <div className="flex gap-2 flex-wrap">
                  {results.map((result, index) => (
                    <Button
                      key={index}
                      variant={selectedFormulaIndex === index ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFormulaIndex(index)}
                    >
                      {getFormulaDisplayName(result.formula)}
                    </Button>
                  ))}
                </div>

                {/* Selected formula result */}
                <ResultCard
                  result={results[selectedFormulaIndex]}
                  currentBodyFat={profileData?.body_fat_percentage}
                  currentWeight={latestMeasurement?.weight_kg}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Höger: Nuvarande Status */}
        {/* Dölj för Lyle McDonald och Alan Aragon - dessa modeller har bara referenstabeller */}
        {results &&
          results.length > 0 &&
          profileData?.weight_kg &&
          profileData?.body_fat_percentage &&
          results[selectedFormulaIndex].formula !== "Lyle McDonald's modell" &&
          results[selectedFormulaIndex].formula !== "Alan Aragon's modell" && (
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
                        <span className="text-neutral-600">Progress:</span>
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

// Tabell för Lyle McDonald referensvärden
function LyleMcDonaldTable({ referenceTable }: { referenceTable: LyleMcDonaldReference[] }) {
  return (
    <div className="mt-4 space-y-4">
      {/* Informationsruta med bakgrund */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Om Lyle McDonald&rsquo;s modell
        </h4>
        <p className="text-xs text-blue-800 leading-relaxed mb-2">
          Denna modell utvecklades av Lyle McDonald, en välkänd författare och forskare inom
          näringslära och träning. Modellen baseras på decennier av forskning och observation av
          naturliga styrkelyftare och bodybuilders.
        </p>
        <p className="text-xs text-blue-800 leading-relaxed mb-2">
          McDonald analyserade data från tusentals tränade individer och identifierade tydliga
          mönster för hur muskeltillväxt avtar över tid. Modellen publicerades ursprungligen i hans
          böcker och artiklar under tidigt 2000-tal.
        </p>
        <p className="text-xs text-blue-700 italic">
          Källa: McDonald, L. &ldquo;What&rsquo;s My Genetic Muscular Potential?&rdquo;
          bodyrecomposition.com
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-neutral-900 mb-2">
          Årlig potentiell muskeltillväxt
        </h4>
        <p className="text-xs text-neutral-600 mb-3">
          Baserat på &ldquo;korrekt&rdquo; träning med progressiv överbelastning
        </p>
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-primary-100 border-b-2 border-primary-300">
              <th className="text-left p-3 text-sm font-semibold text-primary-900">Träningsår</th>
              <th className="text-right p-3 text-sm font-semibold text-primary-900">
                Tillväxt/år (kg)
              </th>
              <th className="text-right p-3 text-sm font-semibold text-primary-900">
                Tillväxt/månad (kg)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {referenceTable.map((row, index) => (
              <tr
                key={index}
                className="border-b border-primary-100 hover:bg-primary-50 transition-colors"
              >
                <td className="p-3 text-sm font-medium text-neutral-900">
                  {row.year === 4 ? '4+' : row.year}
                </td>
                <td className="p-3 text-sm text-right font-semibold text-primary-700">
                  {row.gainPerYearKg.min}–{row.gainPerYearKg.max}
                </td>
                <td className="p-3 text-sm text-right text-neutral-600">
                  {row.year === 4 ? '—' : row.gainPerMonthKg.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-neutral-500 mt-3 italic">
          Notera: Dessa värden förutsätter korrekt träning, näring och återhämtning
        </p>
      </div>
    </div>
  )
}

// Tabell för Alan Aragon referensvärden
function AlanAragonTable({
  referenceTable,
  currentWeight,
}: {
  referenceTable: AlanAragonReference[]
  currentWeight?: number
}) {
  return (
    <div className="mt-4 space-y-4">
      {/* Informationsruta med bakgrund */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Om Alan Aragon&rsquo;s modell</h4>
        <p className="text-xs text-blue-800 leading-relaxed mb-2">
          Alan Aragon är en erkänd näringsfysiolog och tränare som utvecklade denna modell baserad
          på hans omfattande erfarenhet av att arbeta med både nybörjare och elitidrottare. Modellen
          presenterades först i hans månatliga forskningssammanfattning &ldquo;Alan Aragon&rsquo;s
          Research Review&rdquo; (AARR).
        </p>
        <p className="text-xs text-blue-800 leading-relaxed mb-2">
          Till skillnad från andra modeller som fokuserar på absoluta gränser, betonar
          Aragon&rsquo;s modell tidsperspektivet och realistiska förväntningar baserat på
          träningserfarenhet. Modellen publicerades under mitten av 2000-talet.
        </p>
        <p className="text-xs text-blue-700 italic">
          Källa: Aragon, A. &ldquo;Girth Control: The Science of Fat Loss and Muscle Gain&rdquo;
          (2007), AARR
        </p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-neutral-900 mb-2">Potentiell muskeltillväxt</h4>
        <p className="text-xs text-neutral-600 mb-3">Procent av total kroppsvikt per månad</p>
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-primary-100 border-b-2 border-primary-300">
              <th className="text-left p-3 text-sm font-semibold text-primary-900">Kategori</th>
              <th className="text-right p-3 text-sm font-semibold text-primary-900">
                % av vikt/månad
              </th>
              {currentWeight && (
                <th className="text-right p-3 text-sm font-semibold text-primary-900">
                  Exempel (kg/månad)
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white">
            {referenceTable.map((row, index) => (
              <tr
                key={index}
                className="border-b border-primary-100 hover:bg-primary-50 transition-colors"
              >
                <td className="p-3">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{row.category}</div>
                    <div className="text-xs text-neutral-500">{row.description}</div>
                  </div>
                </td>
                <td className="p-3 text-sm text-right font-semibold text-primary-700">
                  {row.gainPercentMin}–{row.gainPercentMax}%
                </td>
                {currentWeight && (
                  <td className="p-3 text-sm text-right text-neutral-600">
                    {((currentWeight * row.gainPercentMin) / 100).toFixed(2)}–
                    {((currentWeight * row.gainPercentMax) / 100).toFixed(2)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-neutral-500 mt-3 italic">
          Notera: Bedöm själv var du befinner dig baserat på din faktiska träningserfarenhet
        </p>
      </div>
    </div>
  )
}

// Hjälpkomponent för att visa resultat
function ResultCard({
  result,
  currentBodyFat,
  currentWeight,
}: {
  result: GeneticPotentialResult
  currentBodyFat?: number
  currentWeight?: number
}) {
  const targetWeights = getTargetWeights(result.maxLeanMass)

  // Calculate weight at user's current body fat %
  const weightAtCurrentBF = currentBodyFat ? result.maxLeanMass / (1 - currentBodyFat / 100) : null

  return (
    <div className="space-y-4">
      {/* Martin Berkhan informationsruta */}
      {result.formula === 'Martin Berkhan (Leangains)' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">
            Om Martin Berkhan&rsquo;s formel
          </h4>
          <p className="text-xs text-blue-800 leading-relaxed mb-2">
            Martin Berkhan är grundaren av Leangains-metoden och en pionjär inom intermittent
            fasting. Hans formel för genetisk muskelpotential utvecklades baserat på observation av
            elitbodybuilders och naturliga tävlingsatleter under 2000-talet.
          </p>
          <p className="text-xs text-blue-800 leading-relaxed mb-2">
            Formeln bygger på principen att tävlingsvikt vid extremt låg kroppsfett (5% för män, 12%
            för kvinnor) kan uppskattas genom den enkla beräkningen: längd i centimeter minus 100 =
            maximal vikt i kilogram. Berkhan betonar att detta representerar en övre gräns för
            naturliga atleter vid peak condition.
          </p>
          <p className="text-xs text-blue-700 italic">
            Källa: Berkhan, M. &ldquo;Maximum Muscular Potential of Drug-Free Athletes&rdquo;
            leangains.com (2008-2010)
          </p>
        </div>
      )}

      {/* Casey Butt informationsruta */}
      {result.formula === 'Casey Butt' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-900 mb-2">Om Casey Butt&rsquo;s formel</h4>
          <p className="text-xs text-blue-800 leading-relaxed mb-2">
            Casey Butt är en forskare och styrkelyftare som publicerade sin omfattande studie om
            genetisk muskelpotential år 2009. Hans forskning baserades på analys av tusentals
            mätningar från naturliga bodybuilders och styrkelyftare över flera decennier.
          </p>
          <p className="text-xs text-blue-800 leading-relaxed mb-2">
            Till skillnad från enklare formler tar Butt&rsquo;s modell hänsyn till individuell
            skelettstruktur genom handled- och ankelmått. Formeln klassificerar också separat
            överkropp och underkropp baserat på benstruktur, vilket ger en mer personaliserad
            uppskattning. Studien inkluderade även beräkningar för maximala kroppsmått vid genetisk
            potential.
          </p>
          <p className="text-xs text-blue-700 italic">
            Källa: Butt, C. &ldquo;Your Muscular Potential: How to Predict Your Maximum Muscular
            Bodyweight and Measurements&rdquo; weightrainer.net (2009)
          </p>
        </div>
      )}

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
      ) : result.formula === "Lyle McDonald's modell" ||
        result.formula === "Alan Aragon's modell" ? (
        // Lyle McDonald och Alan Aragon visar bara referenstabeller, inga kroppsfett-värden
        <></>
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
      {/* Dölj för Lyle McDonald och Alan Aragon - dessa modeller har bara referenstabeller */}
      {result.formula !== "Lyle McDonald's modell" && result.formula !== "Alan Aragon's modell" && (
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
      )}

      {/* Lyle McDonald referenstabell */}
      {result.formula === "Lyle McDonald's modell" && result.referenceTable && (
        <LyleMcDonaldTable referenceTable={result.referenceTable as LyleMcDonaldReference[]} />
      )}

      {/* Alan Aragon referenstabell */}
      {result.formula === "Alan Aragon's modell" && result.referenceTable && (
        <AlanAragonTable
          referenceTable={result.referenceTable as AlanAragonReference[]}
          currentWeight={currentWeight}
        />
      )}

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
