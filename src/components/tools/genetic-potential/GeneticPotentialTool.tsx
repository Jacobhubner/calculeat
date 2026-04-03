import { useState, useMemo, useEffect } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, User, Info, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { BackToHubButton } from '@/components/tools/common/BackToHubButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useProfileData } from '@/hooks/useProfileData'
import { useMeasurementSets, useActiveProfile } from '@/hooks'
import { useMeasurementSetStore } from '@/stores/measurementSetStore'
import EmptyState from '@/components/EmptyState'
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
    'Martin Berkhans modell': 'Martin Berkhans modell',
    'Casey Butts modell': 'Casey Butts modell',
    'Alan Aragons ramverk': 'Alan Aragons ramverk',
    'Lyle McDonalds ramverk': 'Lyle McDonalds ramverk',
  }
  return nameMap[fullName] || fullName
}

export default function GeneticPotentialTool() {
  const { t } = useTranslation('tools')
  const navigate = useNavigate()
  const { profile } = useActiveProfile()
  const profileData = useProfileData(['height_cm', 'gender', 'weight_kg', 'body_fat_percentage'])
  const { data: measurementSets } = useMeasurementSets()

  // Get the actively selected measurement set from the store
  const activeMeasurementSet = useMeasurementSetStore(state => state.activeMeasurementSet)

  // Use the active measurement set if available, otherwise fall back to the first one
  const currentMeasurement = useMemo(() => {
    // First try to use the active measurement set
    if (activeMeasurementSet) {
      // Find the full measurement data in the fetched list
      const fullData = measurementSets?.find(s => s.id === activeMeasurementSet.id)
      if (fullData) return fullData
    }
    // Fallback to first measurement set if no active set
    return measurementSets && measurementSets.length > 0 ? measurementSets[0] : null
  }, [activeMeasurementSet, measurementSets])

  const [selectedFormulaIndex, setSelectedFormulaIndex] = useState(0)
  const [caseyButtMethod, setCaseyButtMethod] = useState<'standard' | 'personalized'>('standard')
  const [showStandardInfo, setShowStandardInfo] = useState(false)
  const [showPersonalizedInfo, setShowPersonalizedInfo] = useState(false)
  const [showCaseyButtInfo, setShowCaseyButtInfo] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState<{ title: string; description: string } | null>(
    null
  )

  // Manual wrist and ankle measurements for Casey Butt model
  const [manualWrist, setManualWrist] = useState<number | undefined>(
    currentMeasurement?.wrist ?? undefined
  )
  const [manualAnkle, setManualAnkle] = useState<number | undefined>(
    currentMeasurement?.ankle ?? undefined
  )

  // Sync manual measurements with active measurement set when it changes
  /* eslint-disable react-hooks/set-state-in-effect -- Syncing external store state to local state */
  useEffect(() => {
    if (currentMeasurement?.wrist !== undefined) {
      setManualWrist(currentMeasurement.wrist ?? undefined)
    }
    if (currentMeasurement?.ankle !== undefined) {
      setManualAnkle(currentMeasurement.ankle ?? undefined)
    }
  }, [currentMeasurement])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Beräkna resultat
  const results = useMemo(() => {
    if (!profileData?.height_cm || !profileData?.gender) return null

    return calculateAllModels({
      heightCm: profileData.height_cm,
      gender: profileData.gender,
      wristCm: manualWrist,
      ankleCm: manualAnkle,
      currentWeight: currentMeasurement?.weight_kg || profileData.weight_kg,
      currentBodyFat: profileData.body_fat_percentage,
      caseyButtMethod,
    })
  }, [profileData, manualWrist, manualAnkle, currentMeasurement?.weight_kg, caseyButtMethod])

  // Check if profile exists - show empty state if no profile
  if (!profile) {
    return (
      <EmptyState
        icon={User}
        title={t('geneticPotential.noProfile.title')}
        description={t('geneticPotential.noProfile.description')}
        action={{
          label: t('geneticPotential.noProfile.action'),
          onClick: () => navigate('/app/profile'),
        }}
      />
    )
  }

  return (
    <div className="space-y-6">
      <BackToHubButton hubPath="/app/body-composition" hubLabel="Kroppssammansättning" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('geneticPotential.header.title')}</h2>
          <p className="text-neutral-600 mt-1">
            {t('geneticPotential.header.description')}
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          {t('geneticPotential.header.badge')}
        </Badge>
      </div>

      {/* Warning if user is female - these formulas are designed for men only */}
      {profileData?.gender === 'female' && (
        <Alert variant="default" className="border-red-300 bg-red-50">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <AlertDescription className="text-red-900">
            <p className="font-medium mb-2">{t('geneticPotential.maleOnly.title')}</p>
            <p>{t('geneticPotential.maleOnly.description')}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Info if body fat percentage is missing - optional but recommended */}
      {profileData?.gender === 'male' && !profileData?.body_fat_percentage && (
        <Alert variant="default" className="border-blue-300 bg-blue-50">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <p className="font-medium mb-2">{t('geneticPotential.addBodyFatTip.title')}</p>
            <p>{t('geneticPotential.addBodyFatTip.description')}</p>
            <Link
              to="/app/profile"
              className="inline-block mt-2 underline font-medium hover:text-blue-700"
            >
              {t('geneticPotential.addBodyFatTip.link')}
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert - only show for males */}
      {profileData?.gender === 'male' && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-900">
                <p className="font-medium mb-1">{t('geneticPotential.infoCard.title')}</p>
                <p className="text-blue-700">{t('geneticPotential.infoCard.description')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr] min-w-0 overflow-hidden">
        {/* Vänster: Inputs */}
        <div className="space-y-6 min-w-0 overflow-hidden">
          {/* Resultat per formel */}
          {results && results.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>{t('geneticPotential.results.title')}</CardTitle>
                <CardDescription>{t('geneticPotential.results.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Formula selector buttons */}
                <div className="flex gap-2 flex-wrap">
                  {results.map((result, index) => (
                    <Button
                      key={index}
                      variant={selectedFormulaIndex === index ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFormulaIndex(index)}
                    >
                      {getFormulaDisplayName(result.formula)}
                    </Button>
                  ))}
                </div>

                {/* Casey Butt metodväljare - visa bara när Casey Butt är vald */}
                {results[selectedFormulaIndex].formula === 'Casey Butts modell' && (
                  <>
                    {/* Om Casey Butts modell - informationsruta */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => setShowCaseyButtInfo(!showCaseyButtInfo)}
                        className="w-full p-4 flex justify-between items-center hover:bg-blue-100 transition-colors"
                      >
                        <h4 className="text-sm font-semibold text-blue-900">
                          Om Casey Butts modell
                        </h4>
                        {showCaseyButtInfo ? (
                          <ChevronUp className="h-5 w-5 text-blue-700" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-blue-700" />
                        )}
                      </button>
                      {showCaseyButtInfo && (
                        <div className="px-4 pb-4 space-y-2">
                          <p className="text-xs text-blue-800 leading-relaxed">
                            Casey Butt är forskare (PhD) och styrkelyftare som under 2000-talet
                            publicerade en omfattande empirisk modell för att uppskatta genetisk
                            muskelpotential hos naturliga atleter. Modellen bygger på analys av
                            historiska data från naturliga bodybuilders och styrkelyftare över flera
                            decennier, särskilt från perioder då prestationshöjande droger var
                            ovanliga.
                          </p>
                          <p className="text-xs text-blue-800 leading-relaxed">
                            Till skillnad från enklare längd- och viktbaserade formler tar Butts
                            modell hänsyn till individuell skelettstruktur genom mätningar av
                            handled- och ankelomkrets. Dessa används för att uppskatta ramstorlek
                            och muskelpotential. Modellen ger även separata beräkningar för maximala
                            kroppsmått (t.ex. armar, bröst, lår) vid genetisk potential.
                          </p>
                          <p className="text-xs text-blue-800 leading-relaxed">
                            Modellen är empirisk och observationsbaserad, inte en formellt
                            vetenskapligt validerad studie, men används ofta som referens för
                            realistiska övre gränser för naturlig muskelutveckling, inte som en
                            statistisk medelvärdesmodell.
                          </p>
                          <p className="text-xs font-semibold text-blue-800 mt-2">Formel</p>
                          <div className="overflow-x-auto rounded-lg border border-blue-200">
                            <table className="w-full text-xs">
                              <tbody>
                                <tr className="bg-blue-100 text-blue-600 font-medium">
                                  <td className="px-3 py-1.5" colSpan={2}>
                                    Steg 1 — Max fettfri massa (MLBM)
                                  </td>
                                </tr>
                                <tr className="bg-white">
                                  <td className="px-3 py-1.5 text-blue-900 font-mono" colSpan={2}>
                                    MLBM = H¹·⁵ × (√W / 22,667 + √A / 17,0104) × (BF% / 224 + 1)
                                  </td>
                                </tr>
                                <tr className="bg-blue-50">
                                  <td className="px-3 py-1.5 text-blue-700" colSpan={2}>
                                    H = längd (tum), W = handled (tum), A = fotled (tum), BF% =
                                    kroppsfett
                                  </td>
                                </tr>
                                <tr className="bg-blue-100 text-blue-600 font-medium">
                                  <td className="px-3 py-1.5" colSpan={2}>
                                    Steg 2 — Max kroppsvikt (MBW)
                                  </td>
                                </tr>
                                <tr className="bg-white">
                                  <td className="px-3 py-1.5 text-blue-900 font-mono" colSpan={2}>
                                    MBW = MLBM / (100 − BF%) × 100
                                  </td>
                                </tr>
                                <tr className="bg-blue-100 text-blue-600 font-medium">
                                  <td className="px-3 py-1.5" colSpan={2}>
                                    Steg 3 — Max bulkad kroppsvikt (MBBW)
                                  </td>
                                </tr>
                                <tr className="bg-white">
                                  <td className="px-3 py-1.5 text-blue-900 font-mono" colSpan={2}>
                                    MBBW = MBW × 1,04
                                  </td>
                                </tr>
                                <tr className="bg-blue-100 text-blue-600 font-medium">
                                  <td className="px-3 py-1.5" colSpan={2}>
                                    Hardgainer-gränser
                                  </td>
                                </tr>
                                <tr className="bg-white">
                                  <td className="px-3 py-1.5 text-blue-800">Överkropp (handled)</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    Handled ≤ 0,1045 × Längd
                                  </td>
                                </tr>
                                <tr className="bg-blue-50">
                                  <td className="px-3 py-1.5 text-blue-800">Underkropp (fotled)</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    Fotled ≤ 0,1296 × Längd
                                  </td>
                                </tr>
                                <tr className="bg-blue-100 text-blue-600 font-medium">
                                  <td className="px-3 py-1.5">Kroppsmått — Easygainer</td>
                                  <td className="px-3 py-1.5 text-right text-blue-500 font-normal text-xs">
                                    W = handled, A = fotled, H = längd (tum)
                                  </td>
                                </tr>
                                <tr className="bg-white">
                                  <td className="px-3 py-1.5 text-blue-800">Bröst</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    1,6817×W + 1,3759×A + 0,3314×H
                                  </td>
                                </tr>
                                <tr className="bg-blue-50">
                                  <td className="px-3 py-1.5 text-blue-800">Biceps</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    1,2033×W + 0,1236×H
                                  </td>
                                </tr>
                                <tr className="bg-white">
                                  <td className="px-3 py-1.5 text-blue-800">Underarmar</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    0,9626×W + 0,0989×H
                                  </td>
                                </tr>
                                <tr className="bg-blue-50">
                                  <td className="px-3 py-1.5 text-blue-800">Nacke</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    1,1424×W + 0,1236×H
                                  </td>
                                </tr>
                                <tr className="bg-white">
                                  <td className="px-3 py-1.5 text-blue-800">Lår</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    1,3868×A + 0,1805×H
                                  </td>
                                </tr>
                                <tr className="bg-blue-50">
                                  <td className="px-3 py-1.5 text-blue-800">Vader</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    0,9298×A + 0,1210×H
                                  </td>
                                </tr>
                                <tr className="bg-blue-100 text-blue-600 font-medium">
                                  <td className="px-3 py-1.5">Kroppsmått — Hardgainer</td>
                                  <td className="px-3 py-1.5 text-right text-blue-500 font-normal text-xs">
                                    W = handled, A = fotled (tum)
                                  </td>
                                </tr>
                                <tr className="bg-white">
                                  <td className="px-3 py-1.5 text-blue-800">Bröst</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    3,15×W + 2,54×A
                                  </td>
                                </tr>
                                <tr className="bg-blue-50">
                                  <td className="px-3 py-1.5 text-blue-800">Biceps</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    2,28×W
                                  </td>
                                </tr>
                                <tr className="bg-white">
                                  <td className="px-3 py-1.5 text-blue-800">Underarmar</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    1,83×W
                                  </td>
                                </tr>
                                <tr className="bg-blue-50">
                                  <td className="px-3 py-1.5 text-blue-800">Nacke</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    2,30×W
                                  </td>
                                </tr>
                                <tr className="bg-white">
                                  <td className="px-3 py-1.5 text-blue-800">Lår</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    2,65×A
                                  </td>
                                </tr>
                                <tr className="bg-blue-50">
                                  <td className="px-3 py-1.5 text-blue-800">Vader</td>
                                  <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                                    1,80×A
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <p className="text-xs text-blue-700 italic mt-3">
                            Källa: Butt, C. &ldquo;Your Muscular Potential: How to Predict Your
                            Maximum Muscular Bodyweight and Measurements&rdquo; weightrainer.net
                            (ursprungligen publicerad tidigt 2000-tal, uppdaterad 2009)
                          </p>
                          <p className="text-xs text-blue-800 leading-relaxed mt-3">
                            Det finns en förvirring med denna modell. Casey Butt specificerar inte
                            strikt vilken kroppsfettprocent man ska använda utan beskriver:
                            &ldquo;%bf = The body fat percentage at which you want to predict your
                            maximum lean body mass&rdquo;. Detta lämnar det öppet för tolkning och
                            man kan därför använda denna modell på två olika sätt:
                          </p>
                          <p className="text-xs text-blue-800 leading-relaxed font-medium">
                            Alternativ 1: Standardiserad genetisk referens
                            <br />
                            Alternativ 2: Tillståndsberoende fettfri kroppsvikt
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Input fields för wrist och ankle */}
                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg">
                      <h4 className="text-sm font-semibold text-neutral-900 mb-3">
                        Omkretsmått för Casey Butt-modellen
                      </h4>
                      <p className="text-xs text-neutral-600 mb-4">
                        Dessa mått används för att beräkna skelettstruktur och muskelpotential.
                        {currentMeasurement?.wrist || currentMeasurement?.ankle
                          ? ' Värden är förifyllda från ditt aktiva måttkort.'
                          : ' Ange dina mått manuellt eller spara dem i kroppssammansättning.'}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <Label htmlFor="wrist-input">
                              Handled <span className="text-neutral-500">(cm)</span>
                            </Label>
                            <button
                              type="button"
                              onClick={() => {
                                setModalContent({
                                  title: 'Handled',
                                  description:
                                    'Mäts på handsidan av processus styloideus, där underarmen är som smalast.',
                                })
                                setShowModal(true)
                              }}
                              className="text-neutral-400 hover:text-primary-600 transition-colors cursor-pointer"
                              aria-label="Visa information om Handled"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </div>
                          <Input
                            id="wrist-input"
                            type="number"
                            min="10"
                            max="30"
                            step="0.1"
                            value={manualWrist ?? ''}
                            onChange={e =>
                              setManualWrist(
                                e.target.value === '' ? undefined : parseFloat(e.target.value)
                              )
                            }
                            placeholder="0.0"
                            className="rounded-xl"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <Label htmlFor="ankle-input">
                              Fotled <span className="text-neutral-500">(cm)</span>
                            </Label>
                            <button
                              type="button"
                              onClick={() => {
                                setModalContent({
                                  title: 'Fotled',
                                  description: 'Mäts vid den smalaste punkten.',
                                })
                                setShowModal(true)
                              }}
                              className="text-neutral-400 hover:text-primary-600 transition-colors cursor-pointer"
                              aria-label="Visa information om Fotled"
                            >
                              <Info className="h-4 w-4" />
                            </button>
                          </div>
                          <Input
                            id="ankle-input"
                            type="number"
                            min="15"
                            max="40"
                            step="0.1"
                            value={manualAnkle ?? ''}
                            onChange={e =>
                              setManualAnkle(
                                e.target.value === '' ? undefined : parseFloat(e.target.value)
                              )
                            }
                            placeholder="0.0"
                            className="rounded-xl"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Metodväljare */}
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="text-sm font-semibold text-blue-900 mb-3">
                        Välj beräkningsmetod för Casey Butt-modellen
                      </h4>

                      <div className="space-y-3">
                        {/* Standard metod (10% BF) */}
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="caseyButtMethod"
                            value="standard"
                            checked={caseyButtMethod === 'standard'}
                            onChange={e =>
                              setCaseyButtMethod(e.target.value as 'standard' | 'personalized')
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-blue-900">
                                Standardiserad genetisk referens
                              </span>
                              <button
                                type="button"
                                onClick={e => {
                                  e.preventDefault()
                                  setShowStandardInfo(true)
                                }}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-xs text-blue-700 mt-1">
                              Beräknar MLBM med 10% kroppsfett som referens, sedan konverterat till
                              din faktiska kroppsfettsprocent. Jämförbart mellan individer och
                              baserat på Casey Butts originaldata.
                            </div>
                          </div>
                        </label>

                        {/* Personalized metod (användarens BF%) */}
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="radio"
                            name="caseyButtMethod"
                            value="personalized"
                            checked={caseyButtMethod === 'personalized'}
                            onChange={e =>
                              setCaseyButtMethod(e.target.value as 'standard' | 'personalized')
                            }
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-blue-900">
                                Tillståndsberoende fettfri kroppsvikt
                              </span>
                              <button
                                type="button"
                                onClick={e => {
                                  e.preventDefault()
                                  setShowPersonalizedInfo(true)
                                }}
                                className="text-blue-600 hover:text-blue-800 transition-colors"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-xs text-blue-700 mt-1">
                              Visar hur mycket fettfri kroppsvikt din kropp kan bära vid din
                              nuvarande kroppsfettprocent, inklusive vätska och glykogen.
                              {!profileData?.body_fat_percentage && (
                                <span className="block mt-1 text-amber-700 font-medium">
                                  ⚠️ Kroppsfett saknas - använder 10% som fallback
                                </span>
                              )}
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Modal för Standardreferens info */}
                    {showStandardInfo && (
                      <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowStandardInfo(false)}
                      >
                        <div
                          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Header */}
                          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-accent-500 text-white p-6 rounded-t-2xl flex justify-between items-start">
                            <div>
                              <h2 className="text-2xl font-bold">
                                Standardiserad genetisk referens
                              </h2>
                            </div>
                            <button
                              onClick={() => setShowStandardInfo(false)}
                              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                              aria-label="Stäng"
                            >
                              <X className="h-6 w-6" />
                            </button>
                          </div>

                          {/* Content */}
                          <div className="p-6 space-y-6">
                            {/* Beskrivning */}
                            <div>
                              <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                                Beskrivning
                              </h3>
                              <div className="text-neutral-700 leading-relaxed">
                                <p className="mb-3">
                                  Denna metod beräknar din maximala genetiska potential i två steg:
                                </p>
                                <ol className="list-decimal list-inside mb-3 space-y-2">
                                  <li>
                                    <strong>MLBM (Maximum Lean Body Mass)</strong> beräknas med 10%
                                    kroppsfett som en standardiserad referenspunkt
                                  </li>
                                  <li>
                                    Resultatet{' '}
                                    <strong>
                                      konverteras till din faktiska kroppsfettsprocent
                                    </strong>{' '}
                                    för att visa din maximala vikt vid ditt nuvarande kroppsfett
                                  </li>
                                </ol>
                                <p className="mb-3">
                                  Casey Butts analys byggde på ca 300 drug-free bodybuildingmästare
                                  och styrkeatleter från 1947–2010. Dessa atleter var i ett lean,
                                  stabilt tillstånd (~8–10 % kroppsfett), därför används 10% som
                                  referenspunkt för MLBM-beräkningen.
                                </p>
                                <p>
                                  Genom att använda 10% som fast referens i MLBM-formeln, men sedan
                                  konvertera till din faktiska kroppsfettsprocent, får du ett
                                  genetiskt meningsfullt resultat som också är relevant för ditt
                                  nuvarande tillstånd.
                                </p>
                              </div>
                            </div>

                            {/* Fördelar */}
                            <div>
                              <h3 className="text-lg font-semibold text-green-800 mb-3">
                                Fördelar
                              </h3>
                              <ul className="space-y-2">
                                <li className="flex gap-3">
                                  <span className="text-green-600 font-bold mt-1">✅</span>
                                  <span className="text-neutral-700 flex-1">
                                    Genetiskt meningsfullt - MLBM baserat på standardiserad referens
                                  </span>
                                </li>
                                <li className="flex gap-3">
                                  <span className="text-green-600 font-bold mt-1">✅</span>
                                  <span className="text-neutral-700 flex-1">
                                    Jämförbart mellan personer - alla använder samma 10% referens
                                  </span>
                                </li>
                                <li className="flex gap-3">
                                  <span className="text-green-600 font-bold mt-1">✅</span>
                                  <span className="text-neutral-700 flex-1">
                                    Undviker att övervikt &ldquo;ökar genetisk potential&rdquo;
                                  </span>
                                </li>
                                <li className="flex gap-3">
                                  <span className="text-green-600 font-bold mt-1">✅</span>
                                  <span className="text-neutral-700 flex-1">
                                    Relevant för ditt nuvarande tillstånd - visar vikt vid din
                                    faktiska kroppsfett
                                  </span>
                                </li>
                              </ul>
                            </div>

                            {/* Nackdelar */}
                            <div>
                              <h3 className="text-lg font-semibold text-red-800 mb-3">Nackdelar</h3>
                              <ul className="space-y-2">
                                <li className="flex gap-3">
                                  <span className="text-red-600 font-bold mt-1">❌</span>
                                  <span className="text-neutral-700 flex-1">
                                    Kan vara svårare att förstå (tvåstegsberäkning)
                                  </span>
                                </li>
                                <li className="flex gap-3">
                                  <span className="text-red-600 font-bold mt-1">❌</span>
                                  <span className="text-neutral-700 flex-1">
                                    Kräver att du känner till din kroppsfettsprocent för bäst
                                    resultat
                                  </span>
                                </li>
                              </ul>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="sticky bottom-0 bg-neutral-50 p-6 rounded-b-2xl border-t border-neutral-200">
                            <Button onClick={() => setShowStandardInfo(false)} className="w-full">
                              Stäng
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Modal för Personaliserad info */}
                    {showPersonalizedInfo && (
                      <div
                        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
                        onClick={() => setShowPersonalizedInfo(false)}
                      >
                        <div
                          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                          onClick={e => e.stopPropagation()}
                        >
                          {/* Header */}
                          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-accent-500 text-white p-6 rounded-t-2xl flex justify-between items-start">
                            <div>
                              <h2 className="text-2xl font-bold">
                                Tillståndsberoende fettfri kroppsvikt
                              </h2>
                            </div>
                            <button
                              onClick={() => setShowPersonalizedInfo(false)}
                              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                              aria-label="Stäng"
                            >
                              <X className="h-6 w-6" />
                            </button>
                          </div>

                          {/* Content */}
                          <div className="p-6 space-y-6">
                            {/* Beskrivning */}
                            <div>
                              <h3 className="text-lg font-semibold text-neutral-800 mb-2">
                                Beskrivning
                              </h3>
                              <div className="text-neutral-700 leading-relaxed">
                                <p className="mb-3">
                                  Resultatet kommer visa hur mycket fettfri kroppsvikt din kropp kan
                                  bära i detta tillstånd. Det inkluderar även vätska, glykogen och
                                  andra icke-permanenta komponenter.
                                </p>
                                <p className="mb-3">
                                  Här använder man användarens %BF direkt i MLBM (maximum lean body
                                  mass). Man beräknar sedan MBW (maximum body weight) och MBBW
                                  (maximum bulked body weight) från detta.
                                </p>
                              </div>
                            </div>

                            {/* Fördelar */}
                            <div>
                              <h3 className="text-lg font-semibold text-green-800 mb-3">
                                Fördelar
                              </h3>
                              <ul className="space-y-2">
                                <li className="flex gap-3">
                                  <span className="text-green-600 font-bold mt-1">✅</span>
                                  <span className="text-neutral-700 flex-1">
                                    Fullt korrekt enligt formeln
                                  </span>
                                </li>
                                <li className="flex gap-3">
                                  <span className="text-green-600 font-bold mt-1">✅</span>
                                  <span className="text-neutral-700 flex-1">Individanpassat</span>
                                </li>
                              </ul>
                            </div>

                            {/* Nackdelar */}
                            <div>
                              <h3 className="text-lg font-semibold text-red-800 mb-3">Nackdelar</h3>
                              <ul className="space-y-2">
                                <li className="flex gap-3">
                                  <span className="text-red-600 font-bold mt-1">❌</span>
                                  <span className="text-neutral-700 flex-1">
                                    MLBM blir tillståndsberoende (MLBM ökar när %BF ökar)
                                  </span>
                                </li>
                                <li className="flex gap-3">
                                  <span className="text-red-600 font-bold mt-1">❌</span>
                                  <span className="text-neutral-700 flex-1">
                                    Kan feltolkas som &ldquo;mer muskel&rdquo;
                                  </span>
                                </li>
                                <li className="flex gap-3">
                                  <span className="text-red-600 font-bold mt-1">❌</span>
                                  <span className="text-neutral-700 flex-1">
                                    Mindre lämpligt som genetiskt tak
                                  </span>
                                </li>
                              </ul>
                            </div>
                          </div>

                          {/* Footer */}
                          <div className="sticky bottom-0 bg-neutral-50 p-6 rounded-b-2xl border-t border-neutral-200">
                            <Button
                              onClick={() => setShowPersonalizedInfo(false)}
                              className="w-full"
                            >
                              Stäng
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Selected formula result */}
                <ResultCard
                  result={results[selectedFormulaIndex]}
                  currentBodyFat={profileData?.body_fat_percentage}
                  currentWeight={currentMeasurement?.weight_kg ?? undefined}
                  onShowMeasurementInfo={(title: string, description: string) => {
                    setModalContent({ title, description })
                    setShowModal(true)
                  }}
                  currentMeasurement={
                    currentMeasurement
                      ? {
                          neck: currentMeasurement.neck ?? undefined,
                          forearm: currentMeasurement.forearm ?? undefined,
                          thigh_circ: currentMeasurement.thigh_circ ?? undefined,
                          calf_circ: currentMeasurement.calf_circ ?? undefined,
                        }
                      : null
                  }
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Höger: Nuvarande Status */}
        {/* Dölj för Lyle McDonald och Alan Aragon - dessa modeller har bara referenstabeller */}
        {results &&
          results.length > 0 &&
          (currentMeasurement?.weight_kg || profileData?.weight_kg) &&
          profileData?.body_fat_percentage &&
          results[selectedFormulaIndex].formula !== 'Lyle McDonalds ramverk' &&
          results[selectedFormulaIndex].formula !== 'Alan Aragons ramverk' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Din Nuvarande Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600">Vikt:</span>
                      <span className="font-medium">
                        {(currentMeasurement?.weight_kg || profileData.weight_kg)?.toFixed(1)} kg
                      </span>
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
                          (currentMeasurement?.weight_kg || profileData.weight_kg || 0) *
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

                  {results[selectedFormulaIndex].remainingPotential !== undefined && (() => {
                    const remaining = results[selectedFormulaIndex].remainingPotential!
                    const isOver = remaining < 0
                    return (
                      <div className="pt-4 border-t">
                        <p className="text-sm text-neutral-600 mb-1">
                          {isOver
                            ? t('geneticPotential.exceedingPotential')
                            : t('geneticPotential.remainingPotential')}
                        </p>
                        <p className={`text-2xl font-bold ${isOver ? 'text-orange-500' : 'text-green-600'}`}>
                          {isOver ? '+' : '+'}{Math.abs(remaining).toFixed(1)} kg
                        </p>
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </div>
          )}
      </div>

      {/* Modal för måttinformation */}
      {showModal && modalContent && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-br from-primary-500 to-accent-500 text-white px-6 py-4 flex justify-between items-start rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold">{modalContent.title}</h2>
                <p className="text-sm text-white/90 mt-1">Mätinstruktion</p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/90 hover:text-white transition-colors"
                aria-label="Stäng modal"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              {(() => {
                const description = modalContent.description

                // Check if description contains special formatting (methods or gender-specific)
                const hasMethodLabels = description.includes('Enligt ') || description.includes(':')
                const hasMaleInstruction = description.includes('Män:')
                const hasFemaleInstruction = description.includes('Kvinnor:')
                const hasBulletPoints = description.includes('• ')

                if (
                  hasMethodLabels ||
                  hasMaleInstruction ||
                  hasFemaleInstruction ||
                  hasBulletPoints
                ) {
                  type SectionType = 'text' | 'male' | 'female' | 'method' | 'both-genders'
                  const sections: Array<{ type: SectionType; title?: string; content: string }> = []
                  const lines = description.split('\n')
                  let currentSection: string[] = []
                  let currentType: SectionType = 'text'
                  let currentTitle: string | undefined

                  const pushCurrentSection = () => {
                    if (currentSection.length > 0) {
                      sections.push({
                        type: currentType,
                        title: currentTitle,
                        content: currentSection.join('\n').trim(),
                      })
                      currentSection = []
                      currentTitle = undefined
                    }
                  }

                  lines.forEach(line => {
                    const trimmedLine = line.trim()

                    // Check for method labels like "Enligt Casey Butt:", "U.S. Navy kroppsfettformel:", etc.
                    if (
                      trimmedLine.startsWith('Enligt ') ||
                      (trimmedLine.endsWith(':') &&
                        !trimmedLine.startsWith('•') &&
                        !trimmedLine.startsWith('Män:') &&
                        !trimmedLine.startsWith('Kvinnor:') &&
                        !trimmedLine.startsWith('Båda könen:'))
                    ) {
                      pushCurrentSection()
                      currentType = 'method'

                      // Check if there's content after the colon on the same line
                      const colonIndex = trimmedLine.indexOf(':')
                      if (colonIndex !== -1) {
                        currentTitle = trimmedLine.substring(0, colonIndex)
                        const contentAfterColon = trimmedLine.substring(colonIndex + 1).trim()
                        if (contentAfterColon) {
                          currentSection.push(contentAfterColon)
                        }
                      } else {
                        currentTitle = trimmedLine
                      }
                      return
                    }

                    // Check for gender-specific bullets
                    if (trimmedLine.startsWith('• Män:')) {
                      pushCurrentSection()
                      currentType = 'male'
                      currentSection.push(trimmedLine.replace('• Män:', '').trim())
                      return
                    }

                    if (trimmedLine.startsWith('• Kvinnor:')) {
                      pushCurrentSection()
                      currentType = 'female'
                      currentSection.push(trimmedLine.replace('• Kvinnor:', '').trim())
                      return
                    }

                    if (trimmedLine.startsWith('• Båda könen:')) {
                      pushCurrentSection()
                      currentType = 'both-genders'
                      currentSection.push(trimmedLine.replace('• Båda könen:', '').trim())
                      return
                    }

                    // Check for gender labels without bullets - keep as part of method section
                    if (
                      trimmedLine.startsWith('Män:') ||
                      trimmedLine.startsWith('Kvinnor:') ||
                      trimmedLine.startsWith('Båda könen:')
                    ) {
                      // Add to current method section instead of creating new section
                      currentSection.push(line)
                      return
                    }

                    // Empty line - push section and reset to text
                    if (trimmedLine === '') {
                      pushCurrentSection()
                      currentType = 'text'
                      return
                    }

                    // Regular line - add to current section
                    currentSection.push(line)
                  })

                  pushCurrentSection()

                  return (
                    <div className="space-y-4">
                      {sections.map((section, idx) => {
                        if (section.type === 'male') {
                          return (
                            <div
                              key={idx}
                              className="bg-blue-50 border-blue-200 border rounded-lg p-4"
                            >
                              <p className="font-semibold text-blue-700 mb-2">👨 Män</p>
                              <p className="text-blue-900 leading-relaxed">{section.content}</p>
                            </div>
                          )
                        }

                        if (section.type === 'female') {
                          return (
                            <div
                              key={idx}
                              className="bg-pink-50 border-pink-200 border rounded-lg p-4"
                            >
                              <p className="font-semibold text-pink-700 mb-2">👩 Kvinnor</p>
                              <p className="text-pink-900 leading-relaxed">{section.content}</p>
                            </div>
                          )
                        }

                        if (section.type === 'both-genders') {
                          return (
                            <div
                              key={idx}
                              className="bg-purple-50 border-purple-200 border rounded-lg p-4"
                            >
                              <p className="font-semibold text-purple-700 mb-2">👥 Båda könen</p>
                              <p className="text-purple-900 leading-relaxed">{section.content}</p>
                            </div>
                          )
                        }

                        if (section.type === 'method' && section.title) {
                          return (
                            <div
                              key={idx}
                              className="bg-amber-50 border-amber-200 border rounded-lg p-4"
                            >
                              <p className="font-semibold text-amber-700 mb-2">
                                📋 {section.title}
                              </p>
                              {section.content && (
                                <p className="text-amber-900 leading-relaxed whitespace-pre-line">
                                  {section.content}
                                </p>
                              )}
                            </div>
                          )
                        }

                        // Regular text
                        return (
                          <p
                            key={idx}
                            className="text-neutral-700 leading-relaxed whitespace-pre-line"
                          >
                            {section.content}
                          </p>
                        )
                      })}
                    </div>
                  )
                }

                // No special formatting, just show normal text
                return (
                  <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                    {description}
                  </p>
                )
              })()}
            </div>
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 rounded-b-2xl">
              <Button onClick={() => setShowModal(false)} className="w-full">
                Stäng
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Tabell för Lyle McDonald referensvärden
function LyleMcDonaldTable({ referenceTable }: { referenceTable: LyleMcDonaldReference[] }) {
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mt-4 space-y-4">
      {/* Informationsruta med bakgrund */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex justify-between items-center hover:bg-blue-100 transition-colors"
        >
          <h4 className="text-sm font-semibold text-blue-900">Om Lyle McDonalds ramverk</h4>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-blue-700" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-700" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 space-y-2">
            <p className="text-xs text-blue-800 leading-relaxed">
              Lyle McDonald är en författare och analytiker inom nutrition och styrketräning som
              sedan slutet av 1990-talet publicerat omfattande material om muskeluppbyggnad,
              energibalans och träningsanpassning. I artikeln &ldquo;What&rsquo;s My Genetic
              Muscular Potential?&rdquo; diskuterar han hur muskeltillväxt gradvis avtar i takt med
              ökad träningsålder och närmar sig en individuell genetisk övre gräns.
            </p>
            <p className="text-xs text-blue-800 leading-relaxed">
              McDonalds resonemang bygger på en syntes av vetenskaplig litteratur, praktiska
              observationer och jämförelser mellan nybörjare, intermediära och avancerade tränande.
              Till skillnad från kvantitativa modeller för maximal muskelmassa presenterar han inget
              specifikt beräkningsförfarande, utan erbjuder ett teoretiskt ramverk för att förstå
              sannolika utvecklingsförlopp och realistiska förväntningar över tid.
            </p>
            <p className="text-xs text-blue-700 italic">
              Källa: McDonald, L. What&rsquo;s My Genetic Muscular Potential? BodyRecomposition.com
            </p>
          </div>
        )}
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
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mt-4 space-y-4">
      {/* Informationsruta med bakgrund */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex justify-between items-center hover:bg-blue-100 transition-colors"
        >
          <h4 className="text-sm font-semibold text-blue-900">Om Alan Aragons ramverk</h4>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-blue-700" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-700" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 space-y-2">
            <p className="text-xs text-blue-800 leading-relaxed">
              Alan Aragon är näringsfysiolog och tränare, samt grundare av Alan Aragon&rsquo;s
              Research Review (AARR). I sina publikationer, bland annat artikeln &ldquo;Girth
              Control: The Science of Fat Loss and Muscle Gain&rdquo; (2007), behandlar han hur
              muskeluppbyggnad och kroppskomposition förändras i relation till träningsnivå,
              erfarenhet och tid.
            </p>
            <p className="text-xs text-blue-800 leading-relaxed">
              Aragons perspektiv fokuserar på realistiska förväntningar och adaptationshastigheter
              snarare än på att fastställa absoluta genetiska gränser. Han beskriver hur potentialen
              för muskelökning är som störst hos nybörjare och successivt minskar hos mer avancerade
              tränande. Arbetet fungerar därmed som ett konceptuellt ramverk för tidsberoende
              muskeltillväxt, inte som en numerisk modell för maximal muskelmassa.
            </p>
            <p className="text-xs text-blue-700 italic">
              Källa: Aragon, A. Girth Control: The Science of Fat Loss and Muscle Gain (2007), Alan
              Aragon&rsquo;s Research Review
            </p>
          </div>
        )}
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
  onShowMeasurementInfo,
  currentMeasurement,
}: {
  result: GeneticPotentialResult
  currentBodyFat?: number
  currentWeight?: number
  onShowMeasurementInfo?: (title: string, description: string) => void
  currentMeasurement?: {
    neck?: number
    forearm?: number
    thigh_circ?: number
    calf_circ?: number
  } | null
}) {
  const { t } = useTranslation('tools')
  const [isExpanded, setIsExpanded] = useState(false)
  const targetWeights = getTargetWeights(result.maxLeanMass)

  // Calculate weight at user's current body fat %
  const weightAtCurrentBF = currentBodyFat ? result.maxLeanMass / (1 - currentBodyFat / 100) : null

  return (
    <div className="space-y-4">
      {/* Martin Berkhan informationsruta */}
      {result.formula === 'Martin Berkhans modell' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-4 flex justify-between items-center hover:bg-blue-100 transition-colors"
          >
            <h4 className="text-sm font-semibold text-blue-900">Om Martin Berkhans modell</h4>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-blue-700" />
            ) : (
              <ChevronDown className="h-5 w-5 text-blue-700" />
            )}
          </button>
          {isExpanded && (
            <div className="px-4 pb-4 space-y-2">
              <p className="text-xs text-blue-800 leading-relaxed">
                Martin Berkhan är grundaren av Leangains-metoden och en tidig förespråkare för
                intermittent fasta inom fitnessvärlden. I artikeln &ldquo;Maximum Muscular Potential
                of Drug-Free Athletes&rdquo; presenterar han en enkel modell för att uppskatta
                maximal muskelmassa hos naturliga (drug-free) atleter.
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">
                Modellen bygger på observationer av elitbodybuilders och tävlingsatleter i mycket
                låg kroppsfettprocent, främst cirka 5–6 % för män. Berkhan föreslår att maximal
                tävlingsvikt i peak condition kan uppskattas genom formeln:
              </p>
              <div className="overflow-x-auto rounded-lg border border-blue-200 my-1">
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="bg-blue-100 text-blue-600 font-medium">
                      <td className="px-3 py-1.5">{t('geneticPotential.berkhanTableHeight')}</td>
                      <td className="px-3 py-1.5 font-mono text-right">{t('geneticPotential.berkhanTableCompWeight')}</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-3 py-1.5 text-blue-800">&lt; 170 cm</td>
                      <td className="px-3 py-1.5 text-blue-900 font-mono text-right">Längd − 98</td>
                    </tr>
                    <tr className="bg-blue-50">
                      <td className="px-3 py-1.5 text-blue-800">170–179 cm</td>
                      <td className="px-3 py-1.5 text-blue-900 font-mono text-right">Längd − 99</td>
                    </tr>
                    <tr className="bg-white">
                      <td className="px-3 py-1.5 text-blue-800">180–189 cm</td>
                      <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                        Längd − 100
                      </td>
                    </tr>
                    <tr className="bg-blue-50">
                      <td className="px-3 py-1.5 text-blue-800">≥ 190 cm</td>
                      <td className="px-3 py-1.5 text-blue-900 font-mono text-right">
                        Längd − 101
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                Han betonar att detta värde representerar en övre praktisk gräns för naturliga
                atleter i extrem tävlingsform, snarare än ett genomsnitt eller ett garanterat mål.
                Berkhan påpekar även att individuell genetik, kroppsstruktur och längd kan motivera
                mindre justeringar runt denna uppskattning (vanligen ±2–4 kg).
              </p>
              <p className="text-xs text-blue-800 leading-relaxed">
                Modellen är empirisk och baserad på praktiska observationer, inte på formell
                vetenskaplig validering, och bör därför ses som en grov riktlinje snarare än en
                exakt fysiologisk lag.
              </p>
              <p className="text-xs text-blue-700 italic">
                Källa: Berkhan, M. &ldquo;Maximum Muscular Potential of Drug-Free Athletes&rdquo;
                leangains.com (2008-2010) (uppdaterad 31 dec 2010)
              </p>
            </div>
          )}
        </div>
      )}

      {result.formula === 'Casey Butts modell' ? (
        result.maxLeanMass === 0 ? (
          // Visa meddelande när mått saknas
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-900 mb-2">
                  Omkretsmått krävs för Casey Butt-modellen
                </h4>
                <p className="text-xs text-yellow-800 leading-relaxed">
                  För att beräkna dina resultat med Casey Butts modell behöver du ange omkretsmått
                  för handled och fotled i fälten ovan. Dessa mått kan antingen förifyllas från ditt
                  aktiva måttkort i Kroppssammansättning, eller så kan du ange dem manuellt.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Visa resultat när mått finns
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-3">
            <h4 className="text-sm font-semibold text-neutral-800 mb-3">
              {result.caseyButtMethod === 'personalized'
                ? t('geneticPotential.capacityAtCurrentBF', { bf: result.caseyButtBodyFat?.toFixed(1) })
                : t('geneticPotential.estimatedMaxPotential')}
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs text-neutral-600">Maximal fettfri massa (MLBM):</p>
                <p className="text-lg font-bold text-green-700">
                  {result.maxLeanMass.toFixed(1)} kg
                </p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-neutral-600">Maximal kroppsvikt (MBW):</p>
                  {currentBodyFat && (
                    <p className="text-[10px] text-neutral-400">vid {currentBodyFat.toFixed(1)}% kroppsfett</p>
                  )}
                </div>
                <p className="text-lg font-bold text-blue-700">{result.maxWeight.toFixed(1)} kg</p>
              </div>
              {result.maxBulkedWeight && (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-neutral-600">Maximal bulked vikt (MBBW):</p>
                    <p className="text-[10px] text-neutral-400">+4% av MBW</p>
                  </div>
                  <p className="text-lg font-bold text-purple-700">
                    {result.maxBulkedWeight.toFixed(1)} kg
                  </p>
                </div>
              )}
            </div>
          </div>
        )
      ) : result.formula === 'Lyle McDonalds ramverk' ||
        result.formula === 'Alan Aragons ramverk' ? (
        // Lyle McDonald och Alan Aragon visar bara referenstabeller, inga kroppsfett-värden
        <></>
      ) : (
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-3">
          <div className="space-y-2">
            {/* Lean mass - primary info */}
            <div>
              <p className="text-xs text-neutral-600">Maximal fettfri massa:</p>
              <p className="text-xl font-bold text-green-700">
                {result.maxLeanMass.toFixed(1)} kg
              </p>
            </div>

            {/* Current body fat weight - secondary info */}
            {weightAtCurrentBF && currentBodyFat && (
              <div className="pt-2 border-t border-green-200">
                <p className="text-xs text-neutral-600">
                  Vid din kroppsfett ({currentBodyFat.toFixed(1)}%):
                </p>
                <p className="text-lg font-semibold text-primary-700">
                  {weightAtCurrentBF.toFixed(1)} kg
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Uppskattad maximal genetisk potential för kroppsvikt */}
      {/* Dölj för Lyle McDonald och Alan Aragon - dessa modeller har bara referenstabeller */}
      {result.formula !== 'Lyle McDonalds ramverk' && result.formula !== 'Alan Aragons ramverk' && (
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
      {result.formula === 'Lyle McDonalds ramverk' && result.referenceTable && (
        <LyleMcDonaldTable referenceTable={result.referenceTable as LyleMcDonaldReference[]} />
      )}

      {/* Alan Aragon referenstabell */}
      {result.formula === 'Alan Aragons ramverk' && result.referenceTable && (
        <AlanAragonTable
          referenceTable={result.referenceTable as AlanAragonReference[]}
          currentWeight={currentWeight}
        />
      )}

      {/* Casey Butt specific: Gainer type and max measurements */}
      {result.formula === 'Casey Butts modell' &&
        result.maxLeanMass > 0 &&
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

            {/* Measurements table */}
            <h4 className="font-medium text-sm text-neutral-900 mt-4 mb-3">Maximala kroppsmått</h4>

            {(() => {
              const allMeasurements = [
                {
                  label: 'Bröst',
                  max: result.maxMeasurements.chestCm,
                  current: undefined,
                  group: 'upper' as const,
                  infoTitle: 'Bröst',
                  infoDesc:
                    'Lyft armarna och placera måttbandet runt övre delen av överkroppen, under armhålorna, innan armarna sänks längs sidorna. Bröstomkretsen mäts horisontellt vid utandning och i avslappnat tillstånd.',
                },
                {
                  label: 'Biceps',
                  max: result.maxMeasurements.bicepsCm,
                  current: undefined,
                  group: 'upper' as const,
                  infoTitle: 'Biceps',
                  infoDesc:
                    'Mätt i spänt läge vid den största omkretsen, med armen lyft framåt och armbågen i 45°.',
                },
                {
                  label: 'Underarmar',
                  max: result.maxMeasurements.forearmsCm,
                  current: currentMeasurement?.forearm,
                  group: 'upper' as const,
                  infoTitle: 'Underarmar',
                  infoDesc:
                    'Med knuten näve och armen rakt ut mäts omkretsen vid största punkten, oftast närmare armbågen.',
                },
                {
                  label: 'Nacke',
                  max: result.maxMeasurements.neckCm,
                  current: currentMeasurement?.neck,
                  group: 'upper' as const,
                  infoTitle: 'Nacke',
                  infoDesc:
                    'Enligt Topend Sports: Omedelbart ovanför adamsäpplet.\nEnligt Casey Butt: Strax nedanför adamsäpplet, vid det smalaste området.\n\nPersonen ska hålla huvudet upprätt och titta rakt fram.',
                },
                {
                  label: 'Lår',
                  max: result.maxMeasurements.thighsCm,
                  current: currentMeasurement?.thigh_circ,
                  group: 'lower' as const,
                  infoTitle: 'Lår',
                  infoDesc:
                    'Mäts vid mittpunkten på lårets utsida, halvvägs mellan trochanter major och laterala tibiakondylen.',
                },
                {
                  label: 'Vader',
                  max: result.maxMeasurements.calvesCm,
                  current: currentMeasurement?.calf_circ,
                  group: 'lower' as const,
                  infoTitle: 'Vader',
                  infoDesc: 'Mäts vid största omkretsen, med musklerna avslappnade.',
                },
              ]

              const hasAnyCurrent = allMeasurements.some(m => m.current != null)

              return (
                <div className="border border-neutral-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200">
                        <th className="text-left p-2.5 text-xs font-semibold text-neutral-600">
                          Mått
                        </th>
                        {hasAnyCurrent && (
                          <th className="text-right p-2.5 text-xs font-semibold text-neutral-600">
                            Ditt mått
                          </th>
                        )}
                        <th className="text-right p-2.5 text-xs font-semibold text-neutral-600">
                          Max
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Överkropp header */}
                      <tr className="bg-blue-50/50">
                        <td
                          colSpan={hasAnyCurrent ? 3 : 2}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-700"
                        >
                          Överkropp
                        </td>
                      </tr>
                      {allMeasurements
                        .filter(m => m.group === 'upper')
                        .map(({ label, max, current, infoTitle, infoDesc }) => (
                          <tr key={label} className="border-b border-neutral-100 last:border-b-0">
                            <td className="p-2.5">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-neutral-700">{label}</span>
                                {onShowMeasurementInfo && (
                                  <button
                                    type="button"
                                    onClick={() => onShowMeasurementInfo(infoTitle, infoDesc)}
                                    className="text-neutral-400 hover:text-primary-600 transition-colors cursor-pointer"
                                    aria-label={`Visa information om ${label}`}
                                  >
                                    <Info className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                            {hasAnyCurrent && (
                              <td className="p-2.5 text-right">
                                {current != null ? (
                                  <span className="text-sm font-medium text-neutral-900">
                                    {current.toFixed(1)} cm
                                  </span>
                                ) : (
                                  <span className="text-sm text-neutral-300">—</span>
                                )}
                              </td>
                            )}
                            <td className="p-2.5 text-right">
                              <span className="text-sm font-bold text-blue-700">
                                {max.toFixed(1)} cm
                              </span>
                            </td>
                          </tr>
                        ))}
                      {/* Underkropp header */}
                      <tr className="bg-purple-50/50 border-t border-neutral-200">
                        <td
                          colSpan={hasAnyCurrent ? 3 : 2}
                          className="px-2.5 py-1.5 text-xs font-semibold text-purple-700"
                        >
                          Underkropp
                        </td>
                      </tr>
                      {allMeasurements
                        .filter(m => m.group === 'lower')
                        .map(({ label, max, current, infoTitle, infoDesc }) => (
                          <tr key={label} className="border-b border-neutral-100 last:border-b-0">
                            <td className="p-2.5">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-neutral-700">{label}</span>
                                {onShowMeasurementInfo && (
                                  <button
                                    type="button"
                                    onClick={() => onShowMeasurementInfo(infoTitle, infoDesc)}
                                    className="text-neutral-400 hover:text-primary-600 transition-colors cursor-pointer"
                                    aria-label={`Visa information om ${label}`}
                                  >
                                    <Info className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                            {hasAnyCurrent && (
                              <td className="p-2.5 text-right">
                                {current != null ? (
                                  <span className="text-sm font-medium text-neutral-900">
                                    {current.toFixed(1)} cm
                                  </span>
                                ) : (
                                  <span className="text-sm text-neutral-300">—</span>
                                )}
                              </td>
                            )}
                            <td className="p-2.5 text-right">
                              <span className="text-sm font-bold text-purple-700">
                                {max.toFixed(1)} cm
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )
            })()}
          </div>
        )}
    </div>
  )
}
