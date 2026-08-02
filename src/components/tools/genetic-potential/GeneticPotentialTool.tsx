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

// Map internal formula names (Swedish, used as data keys) to locale keys
const formulaLocaleKeyMap: Record<string, string> = {
  'Martin Berkhans modell': 'martinBerkhan',
  'Casey Butts modell': 'caseyButt',
  'Alan Aragons ramverk': 'alanAragon',
  'Lyle McDonalds ramverk': 'lyleMcDonald',
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
      <BackToHubButton hubPath="/app/body-composition" hubLabel={t('geneticPotential.hubLabel')} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">
            {t('geneticPotential.header.title')}
          </h2>
          <p className="text-neutral-600 dark:text-neutral-300 mt-1">
            {t('geneticPotential.header.description')}
          </p>
        </div>
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
        >
          {t('geneticPotential.header.badge')}
        </Badge>
      </div>

      {/* Warning if user is female - these formulas are designed for men only */}
      {profileData?.gender === 'female' && (
        <Alert
          variant="default"
          className="border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
        >
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-900 dark:text-red-300">
            <p className="font-medium mb-2">{t('geneticPotential.maleOnly.title')}</p>
            <p>{t('geneticPotential.maleOnly.description')}</p>
          </AlertDescription>
        </Alert>
      )}

      {/* Info if body fat percentage is missing - optional but recommended */}
      {profileData?.gender === 'male' && !profileData?.body_fat_percentage && (
        <Alert
          variant="default"
          className="border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/25"
        >
          <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-300" />
          <AlertDescription className="text-blue-900 dark:text-blue-300">
            <p className="font-medium mb-2">{t('geneticPotential.addBodyFatTip.title')}</p>
            <p>{t('geneticPotential.addBodyFatTip.description')}</p>
            <Link
              to="/app/profile"
              className="inline-block mt-2 underline font-medium hover:text-blue-700 dark:hover:text-blue-200"
            >
              {t('geneticPotential.addBodyFatTip.link')}
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Info Alert - only show for males */}
      {profileData?.gender === 'male' && (
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/25">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-300 mt-0.5 shrink-0" />
              <div className="text-sm text-blue-900 dark:text-blue-300">
                <p className="font-medium mb-1">{t('geneticPotential.infoCard.title')}</p>
                <p className="text-blue-700 dark:text-blue-300">
                  {t('geneticPotential.infoCard.description')}
                </p>
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
                  {results.map((result, index) => {
                    const key = formulaLocaleKeyMap[result.formula]
                    return (
                      <Button
                        key={index}
                        variant={selectedFormulaIndex === index ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedFormulaIndex(index)}
                      >
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {key ? t(`geneticPotential.formulaNames.${key}` as any) : result.formula}
                      </Button>
                    )
                  })}
                </div>

                {/* Casey Butt metodväljare - visa bara när Casey Butt är vald */}
                {results[selectedFormulaIndex].formula === 'Casey Butts modell' && (
                  <>
                    {/* Om Casey Butts modell - informationsruta */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden dark:bg-blue-900/25 dark:border-blue-800">
                      <button
                        onClick={() => setShowCaseyButtInfo(!showCaseyButtInfo)}
                        className="w-full p-4 flex justify-between items-center hover:bg-blue-100 transition-colors dark:hover:bg-blue-900/40"
                      >
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                          {t('geneticPotential.caseyButtInfo.toggleTitle')}
                        </h4>
                        {showCaseyButtInfo ? (
                          <ChevronUp className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-blue-700 dark:text-blue-300" />
                        )}
                      </button>
                      {showCaseyButtInfo && (
                        <div className="px-4 pb-4 space-y-2">
                          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                            {t('geneticPotential.caseyButtInfo.para1')}
                          </p>
                          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                            {t('geneticPotential.caseyButtInfo.para2')}
                          </p>
                          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                            {t('geneticPotential.caseyButtInfo.para3')}
                          </p>
                          <p className="text-xs font-semibold text-blue-800 dark:text-blue-300 mt-2">
                            {t('geneticPotential.caseyButtInfo.formulaLabel')}
                          </p>
                          <div className="overflow-x-auto rounded-lg border border-blue-200 dark:border-blue-800">
                            <table className="w-full text-xs">
                              <tbody>
                                <tr className="bg-blue-100 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-300">
                                  <td className="px-3 py-1.5" colSpan={2}>
                                    {t('geneticPotential.caseyButtInfo.step1Header')}
                                  </td>
                                </tr>
                                <tr className="bg-white dark:bg-neutral-850">
                                  <td
                                    className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono"
                                    colSpan={2}
                                  >
                                    {t('geneticPotential.caseyButtInfo.step1Formula')}
                                  </td>
                                </tr>
                                <tr className="bg-blue-50 dark:bg-blue-900/25">
                                  <td
                                    className="px-3 py-1.5 text-blue-700 dark:text-blue-300"
                                    colSpan={2}
                                  >
                                    {t('geneticPotential.caseyButtInfo.step1Vars')}
                                  </td>
                                </tr>
                                <tr className="bg-blue-100 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-300">
                                  <td className="px-3 py-1.5" colSpan={2}>
                                    {t('geneticPotential.caseyButtInfo.step2Header')}
                                  </td>
                                </tr>
                                <tr className="bg-white dark:bg-neutral-850">
                                  <td
                                    className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono"
                                    colSpan={2}
                                  >
                                    {t('geneticPotential.caseyButtInfo.step2Formula')}
                                  </td>
                                </tr>
                                <tr className="bg-blue-100 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-300">
                                  <td className="px-3 py-1.5" colSpan={2}>
                                    {t('geneticPotential.caseyButtInfo.step3Header')}
                                  </td>
                                </tr>
                                <tr className="bg-white dark:bg-neutral-850">
                                  <td
                                    className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono"
                                    colSpan={2}
                                  >
                                    {t('geneticPotential.caseyButtInfo.step3Formula')}
                                  </td>
                                </tr>
                                <tr className="bg-blue-100 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-300">
                                  <td className="px-3 py-1.5" colSpan={2}>
                                    {t('geneticPotential.caseyButtInfo.hardgainerHeader')}
                                  </td>
                                </tr>
                                <tr className="bg-white dark:bg-neutral-850">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.upperBodyLabel')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    {t('geneticPotential.caseyButtInfo.upperBodyFormula')}
                                  </td>
                                </tr>
                                <tr className="bg-blue-50 dark:bg-blue-900/25">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.lowerBodyLabel')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    {t('geneticPotential.caseyButtInfo.lowerBodyFormula')}
                                  </td>
                                </tr>
                                <tr className="bg-blue-100 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-300">
                                  <td className="px-3 py-1.5">
                                    {t('geneticPotential.caseyButtInfo.easygainerHeader')}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-blue-500 dark:text-blue-400 font-normal text-xs">
                                    {t('geneticPotential.caseyButtInfo.easygainerVars')}
                                  </td>
                                </tr>
                                <tr className="bg-white dark:bg-neutral-850">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.chest')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    1,6817×W + 1,3759×A + 0,3314×H
                                  </td>
                                </tr>
                                <tr className="bg-blue-50 dark:bg-blue-900/25">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.biceps')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    1,2033×W + 0,1236×H
                                  </td>
                                </tr>
                                <tr className="bg-white dark:bg-neutral-850">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.forearms')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    0,9626×W + 0,0989×H
                                  </td>
                                </tr>
                                <tr className="bg-blue-50 dark:bg-blue-900/25">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.neck')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    1,1424×W + 0,1236×H
                                  </td>
                                </tr>
                                <tr className="bg-white dark:bg-neutral-850">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.thighs')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    1,3868×A + 0,1805×H
                                  </td>
                                </tr>
                                <tr className="bg-blue-50 dark:bg-blue-900/25">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.calves')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    0,9298×A + 0,1210×H
                                  </td>
                                </tr>
                                <tr className="bg-blue-100 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-300">
                                  <td className="px-3 py-1.5">
                                    {t('geneticPotential.caseyButtInfo.hardgainerHeader2')}
                                  </td>
                                  <td className="px-3 py-1.5 text-right text-blue-500 dark:text-blue-400 font-normal text-xs">
                                    {t('geneticPotential.caseyButtInfo.hardgainerVars')}
                                  </td>
                                </tr>
                                <tr className="bg-white dark:bg-neutral-850">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.chest')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    3,15×W + 2,54×A
                                  </td>
                                </tr>
                                <tr className="bg-blue-50 dark:bg-blue-900/25">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.biceps')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    2,28×W
                                  </td>
                                </tr>
                                <tr className="bg-white dark:bg-neutral-850">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.forearms')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    1,83×W
                                  </td>
                                </tr>
                                <tr className="bg-blue-50 dark:bg-blue-900/25">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.neck')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    2,30×W
                                  </td>
                                </tr>
                                <tr className="bg-white dark:bg-neutral-850">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.thighs')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    2,65×A
                                  </td>
                                </tr>
                                <tr className="bg-blue-50 dark:bg-blue-900/25">
                                  <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">
                                    {t('geneticPotential.caseyButtInfo.calves')}
                                  </td>
                                  <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                                    1,80×A
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <p className="text-xs text-blue-700 dark:text-blue-300 italic mt-3">
                            {t('geneticPotential.caseyButtInfo.source')}
                          </p>
                          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed mt-3">
                            {t('geneticPotential.caseyButtInfo.ambiguityNote')}
                          </p>
                          <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed font-medium whitespace-pre-line">
                            {t('geneticPotential.caseyButtInfo.alternativesLabel')}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Input fields för wrist och ankle */}
                    <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-lg dark:bg-neutral-900 dark:border-neutral-700">
                      <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                        {t('geneticPotential.caseyButtInputs.sectionTitle')}
                      </h4>
                      <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-4">
                        {currentMeasurement?.wrist || currentMeasurement?.ankle
                          ? t('geneticPotential.caseyButtInputs.descWithData')
                          : t('geneticPotential.caseyButtInputs.descWithoutData')}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5">
                            <Label htmlFor="wrist-input">
                              {t('geneticPotential.caseyButtInputs.wristLabel')}{' '}
                              <span className="text-neutral-500 dark:text-neutral-400">(cm)</span>
                            </Label>
                            <button
                              type="button"
                              onClick={() => {
                                setModalContent({
                                  title: t('geneticPotential.caseyButtInputs.wristInfoTitle'),
                                  description: t('geneticPotential.caseyButtInputs.wristInfoDesc'),
                                })
                                setShowModal(true)
                              }}
                              className="text-neutral-400 hover:text-primary-600 transition-colors cursor-pointer dark:text-neutral-400 dark:hover:text-primary-400"
                              aria-label={t('geneticPotential.caseyButtInputs.wristAriaLabel')}
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
                              {t('geneticPotential.caseyButtInputs.ankleLabel')}{' '}
                              <span className="text-neutral-500 dark:text-neutral-400">(cm)</span>
                            </Label>
                            <button
                              type="button"
                              onClick={() => {
                                setModalContent({
                                  title: t('geneticPotential.caseyButtInputs.ankleInfoTitle'),
                                  description: t('geneticPotential.caseyButtInputs.ankleInfoDesc'),
                                })
                                setShowModal(true)
                              }}
                              className="text-neutral-400 hover:text-primary-600 transition-colors cursor-pointer dark:text-neutral-400 dark:hover:text-primary-400"
                              aria-label={t('geneticPotential.caseyButtInputs.ankleAriaLabel')}
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
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900/25 dark:border-blue-800">
                      <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
                        {t('geneticPotential.caseyButtMethod.sectionTitle')}
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
                              <span className="font-medium text-blue-900 dark:text-blue-300">
                                {t('geneticPotential.caseyButtMethod.standardLabel')}
                              </span>
                              <button
                                type="button"
                                onClick={e => {
                                  e.preventDefault()
                                  setShowStandardInfo(true)
                                }}
                                className="text-blue-600 hover:text-blue-800 transition-colors dark:text-blue-300 dark:hover:text-blue-200"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              {t('geneticPotential.caseyButtMethod.standardDesc')}
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
                              <span className="font-medium text-blue-900 dark:text-blue-300">
                                {t('geneticPotential.caseyButtMethod.personalizedLabel')}
                              </span>
                              <button
                                type="button"
                                onClick={e => {
                                  e.preventDefault()
                                  setShowPersonalizedInfo(true)
                                }}
                                className="text-blue-600 hover:text-blue-800 transition-colors dark:text-blue-300 dark:hover:text-blue-200"
                              >
                                <Info className="h-4 w-4" />
                              </button>
                            </div>
                            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                              {t('geneticPotential.caseyButtMethod.personalizedDesc')}
                              {!profileData?.body_fat_percentage && (
                                <span className="block mt-1 text-amber-700 dark:text-amber-300 font-medium">
                                  {t('geneticPotential.caseyButtMethod.missingBodyFat')}
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
                          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-neutral-850"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 rounded-t-2xl flex justify-between items-start dark:bg-neutral-850 dark:border-neutral-700">
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                              {t('geneticPotential.standardModal.title')}
                            </h2>
                            <button
                              onClick={() => setShowStandardInfo(false)}
                              className="text-neutral-500 hover:text-neutral-700 transition-colors p-1 rounded-full hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800"
                              aria-label={t('geneticPotential.measurementModal.closeAriaLabel')}
                            >
                              <X className="h-6 w-6" />
                            </button>
                          </div>
                          <div className="p-6 space-y-6">
                            <div>
                              <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                                {t('geneticPotential.standardModal.descriptionTitle')}
                              </h3>
                              <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                <p className="mb-3">
                                  {t('geneticPotential.standardModal.description')}
                                </p>
                                <ol className="list-decimal list-inside mb-3 space-y-2">
                                  <li>
                                    <strong>MLBM (Maximum Lean Body Mass)</strong>{' '}
                                    {t('geneticPotential.standardModal.step1')}
                                  </li>
                                  <li>
                                    {t('geneticPotential.standardModal.step2Pre')}{' '}
                                    <strong>
                                      {t('geneticPotential.standardModal.step2Label')}
                                    </strong>{' '}
                                    {t('geneticPotential.standardModal.step2Post')}
                                  </li>
                                </ol>
                                <p className="mb-3">{t('geneticPotential.standardModal.step3')}</p>
                                <p>{t('geneticPotential.standardModal.step4')}</p>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">
                                {t('geneticPotential.standardModal.prosTitle')}
                              </h3>
                              <ul className="space-y-2">
                                {(['pro1', 'pro2', 'pro3', 'pro4'] as const).map(k => (
                                  <li key={k} className="flex gap-3">
                                    <span className="text-green-600 font-bold mt-1">✅</span>
                                    <span className="text-neutral-700 dark:text-neutral-300 flex-1">
                                      {t(`geneticPotential.standardModal.${k}`)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-3">
                                {t('geneticPotential.standardModal.consTitle')}
                              </h3>
                              <ul className="space-y-2">
                                {(['con1', 'con2'] as const).map(k => (
                                  <li key={k} className="flex gap-3">
                                    <span className="text-red-600 font-bold mt-1">❌</span>
                                    <span className="text-neutral-700 dark:text-neutral-300 flex-1">
                                      {t(`geneticPotential.standardModal.${k}`)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="sticky bottom-0 bg-neutral-50 p-6 rounded-b-2xl border-t border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700">
                            <Button onClick={() => setShowStandardInfo(false)} className="w-full">
                              {t('geneticPotential.standardModal.close')}
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
                          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto dark:bg-neutral-850"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="sticky top-0 bg-white border-b border-neutral-200 p-6 rounded-t-2xl flex justify-between items-start dark:bg-neutral-850 dark:border-neutral-700">
                            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                              {t('geneticPotential.personalizedModal.title')}
                            </h2>
                            <button
                              onClick={() => setShowPersonalizedInfo(false)}
                              className="text-neutral-500 hover:text-neutral-700 transition-colors p-1 rounded-full hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-neutral-800"
                              aria-label={t('geneticPotential.measurementModal.closeAriaLabel')}
                            >
                              <X className="h-6 w-6" />
                            </button>
                          </div>
                          <div className="p-6 space-y-6">
                            <div>
                              <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                                {t('geneticPotential.personalizedModal.descriptionTitle')}
                              </h3>
                              <div className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
                                <p className="mb-3">
                                  {t('geneticPotential.personalizedModal.para1')}
                                </p>
                                <p className="mb-3">
                                  {t('geneticPotential.personalizedModal.para2')}
                                </p>
                              </div>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-green-800 dark:text-green-300 mb-3">
                                {t('geneticPotential.personalizedModal.prosTitle')}
                              </h3>
                              <ul className="space-y-2">
                                {(['pro1', 'pro2'] as const).map(k => (
                                  <li key={k} className="flex gap-3">
                                    <span className="text-green-600 font-bold mt-1">✅</span>
                                    <span className="text-neutral-700 dark:text-neutral-300 flex-1">
                                      {t(`geneticPotential.personalizedModal.${k}`)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-3">
                                {t('geneticPotential.personalizedModal.consTitle')}
                              </h3>
                              <ul className="space-y-2">
                                {(['con1', 'con2', 'con3'] as const).map(k => (
                                  <li key={k} className="flex gap-3">
                                    <span className="text-red-600 font-bold mt-1">❌</span>
                                    <span className="text-neutral-700 dark:text-neutral-300 flex-1">
                                      {t(`geneticPotential.personalizedModal.${k}`)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                          <div className="sticky bottom-0 bg-neutral-50 p-6 rounded-b-2xl border-t border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700">
                            <Button
                              onClick={() => setShowPersonalizedInfo(false)}
                              className="w-full"
                            >
                              {t('geneticPotential.personalizedModal.close')}
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
                  <CardTitle className="text-lg">
                    {t('geneticPotential.currentStatus.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600 dark:text-neutral-300">
                        {t('geneticPotential.currentStatus.weight')}
                      </span>
                      <span className="font-medium">
                        {(currentMeasurement?.weight_kg || profileData.weight_kg)?.toFixed(1)} kg
                      </span>
                    </div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-neutral-600 dark:text-neutral-300">
                        {t('geneticPotential.currentStatus.bodyFat')}
                      </span>
                      <span className="font-medium">
                        {profileData.body_fat_percentage.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600 dark:text-neutral-300">
                        {t('geneticPotential.currentStatus.leanMass')}
                      </span>
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
                        <span className="text-neutral-600 dark:text-neutral-300">
                          {t('geneticPotential.currentStatus.progress')}
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

                  {results[selectedFormulaIndex].remainingPotential !== undefined &&
                    (() => {
                      const remaining = results[selectedFormulaIndex].remainingPotential!
                      const isOver = remaining < 0
                      return (
                        <div className="pt-4 border-t dark:border-neutral-700">
                          <p className="text-sm text-neutral-600 dark:text-neutral-300 mb-1">
                            {isOver
                              ? t('geneticPotential.exceedingPotential')
                              : t('geneticPotential.remainingPotential')}
                          </p>
                          <p
                            className={`text-2xl font-bold ${isOver ? 'text-orange-500 dark:text-orange-300' : 'text-green-600 dark:text-green-400'}`}
                          >
                            {isOver ? '+' : '+'}
                            {Math.abs(remaining).toFixed(1)} kg
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
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full dark:bg-neutral-850"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-neutral-200 px-6 py-4 flex justify-between items-start rounded-t-2xl dark:bg-neutral-850 dark:border-neutral-700">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
                  {modalContent.title}
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-300 mt-1">
                  {t('geneticPotential.measurementModal.instruction')}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-neutral-500 hover:text-neutral-700 transition-colors dark:text-neutral-400 dark:hover:text-neutral-200"
                aria-label={t('geneticPotential.measurementModal.closeAriaLabel')}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line leading-relaxed">
                {modalContent.description}
              </p>
            </div>
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 rounded-b-2xl dark:bg-neutral-850 dark:border-neutral-700">
              <Button onClick={() => setShowModal(false)} className="w-full">
                {t('geneticPotential.measurementModal.close')}
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
  const { t } = useTranslation('tools')
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mt-4 space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden dark:bg-blue-900/25 dark:border-blue-800">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex justify-between items-center hover:bg-blue-100 transition-colors dark:hover:bg-blue-900/40"
        >
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
            {t('geneticPotential.lyleMcDonald.toggleTitle')}
          </h4>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-blue-700 dark:text-blue-300" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-700 dark:text-blue-300" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 space-y-2">
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              {t('geneticPotential.lyleMcDonald.para1')}
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              {t('geneticPotential.lyleMcDonald.para2')}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 italic">
              {t('geneticPotential.lyleMcDonald.source')}
            </p>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('geneticPotential.lyleMcDonald.tableTitle')}
        </h4>
        <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-3">
          {t('geneticPotential.lyleMcDonald.tableSubtitle')}
        </p>
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-primary-100 border-b-2 border-primary-300 dark:bg-primary-900/40 dark:border-primary-800">
              <th className="text-left p-3 text-sm font-semibold text-primary-900 dark:text-primary-200">
                {t('geneticPotential.lyleMcDonald.colYear')}
              </th>
              <th className="text-right p-3 text-sm font-semibold text-primary-900 dark:text-primary-200">
                {t('geneticPotential.lyleMcDonald.colGainYear')}
              </th>
              <th className="text-right p-3 text-sm font-semibold text-primary-900 dark:text-primary-200">
                {t('geneticPotential.lyleMcDonald.colGainMonth')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-850">
            {referenceTable.map((row, index) => (
              <tr
                key={index}
                className="border-b border-primary-100 hover:bg-primary-50 transition-colors dark:border-neutral-700 dark:hover:bg-primary-900/25"
              >
                <td className="p-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                  {row.year === 4 ? t('geneticPotential.lyleMcDonald.yearPlus') : row.year}
                </td>
                <td className="p-3 text-sm text-right font-semibold text-primary-700 dark:text-primary-300">
                  {row.gainPerYearKg.min}–{row.gainPerYearKg.max}
                </td>
                <td className="p-3 text-sm text-right text-neutral-600 dark:text-neutral-300">
                  {row.year === 4 ? '—' : row.gainPerMonthKg.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 italic">
          {t('geneticPotential.lyleMcDonald.footNote')}
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
  const { t } = useTranslation('tools')
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="mt-4 space-y-4">
      {/* Informationsruta med bakgrund */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden dark:bg-blue-900/25 dark:border-blue-800">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full p-4 flex justify-between items-center hover:bg-blue-100 transition-colors dark:hover:bg-blue-900/40"
        >
          <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
            {t('geneticPotential.alanAragon.toggleTitle')}
          </h4>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-blue-700 dark:text-blue-300" />
          ) : (
            <ChevronDown className="h-5 w-5 text-blue-700 dark:text-blue-300" />
          )}
        </button>
        {isExpanded && (
          <div className="px-4 pb-4 space-y-2">
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              {t('geneticPotential.alanAragon.para1')}
            </p>
            <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
              {t('geneticPotential.alanAragon.para2')}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 italic">
              {t('geneticPotential.alanAragon.source')}
            </p>
          </div>
        )}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          {t('geneticPotential.alanAragon.tableTitle')}
        </h4>
        <p className="text-xs text-neutral-600 dark:text-neutral-300 mb-3">
          {t('geneticPotential.alanAragon.tableSubtitle')}
        </p>
        <table className="w-full border-collapse rounded-lg overflow-hidden shadow-sm">
          <thead>
            <tr className="bg-primary-100 border-b-2 border-primary-300 dark:bg-primary-900/40 dark:border-primary-800">
              <th className="text-left p-3 text-sm font-semibold text-primary-900 dark:text-primary-200">
                {t('geneticPotential.alanAragon.colCategory')}
              </th>
              <th className="text-right p-3 text-sm font-semibold text-primary-900 dark:text-primary-200">
                {t('geneticPotential.alanAragon.colGainPercent')}
              </th>
              {currentWeight && (
                <th className="text-right p-3 text-sm font-semibold text-primary-900 dark:text-primary-200">
                  {t('geneticPotential.alanAragon.colExample')}
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-neutral-850">
            {referenceTable.map((row, index) => (
              <tr
                key={index}
                className="border-b border-primary-100 hover:bg-primary-50 transition-colors dark:border-neutral-700 dark:hover:bg-primary-900/25"
              >
                <td className="p-3">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      {row.category}
                    </div>
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      {row.description}
                    </div>
                  </div>
                </td>
                <td className="p-3 text-sm text-right font-semibold text-primary-700 dark:text-primary-300">
                  {row.gainPercentMin}–{row.gainPercentMax}%
                </td>
                {currentWeight && (
                  <td className="p-3 text-sm text-right text-neutral-600 dark:text-neutral-300">
                    {((currentWeight * row.gainPercentMin) / 100).toFixed(2)}–
                    {((currentWeight * row.gainPercentMax) / 100).toFixed(2)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 italic">
          {t('geneticPotential.alanAragon.footNote')}
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
        <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden dark:bg-blue-900/25 dark:border-blue-800">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-4 flex justify-between items-center hover:bg-blue-100 transition-colors dark:hover:bg-blue-900/40"
          >
            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300">
              {t('geneticPotential.berkhanInfo.toggleTitle')}
            </h4>
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            ) : (
              <ChevronDown className="h-5 w-5 text-blue-700 dark:text-blue-300" />
            )}
          </button>
          {isExpanded && (
            <div className="px-4 pb-4 space-y-2">
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                {t('geneticPotential.berkhanInfo.para1')}
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                {t('geneticPotential.berkhanInfo.para2')}
              </p>
              <div className="overflow-x-auto rounded-lg border border-blue-200 dark:border-blue-800 my-1">
                <table className="w-full text-xs">
                  <tbody>
                    <tr className="bg-blue-100 text-blue-600 font-medium dark:bg-blue-900/40 dark:text-blue-300">
                      <td className="px-3 py-1.5">{t('geneticPotential.berkhanTableHeight')}</td>
                      <td className="px-3 py-1.5 font-mono text-right">
                        {t('geneticPotential.berkhanTableCompWeight')}
                      </td>
                    </tr>
                    <tr className="bg-white dark:bg-neutral-850">
                      <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">&lt; 170 cm</td>
                      <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                        {t('geneticPotential.berkhanTableRow1')}
                      </td>
                    </tr>
                    <tr className="bg-blue-50 dark:bg-blue-900/25">
                      <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">170–179 cm</td>
                      <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                        {t('geneticPotential.berkhanTableRow2')}
                      </td>
                    </tr>
                    <tr className="bg-white dark:bg-neutral-850">
                      <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">180–189 cm</td>
                      <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                        {t('geneticPotential.berkhanTableRow3')}
                      </td>
                    </tr>
                    <tr className="bg-blue-50 dark:bg-blue-900/25">
                      <td className="px-3 py-1.5 text-blue-800 dark:text-blue-300">≥ 190 cm</td>
                      <td className="px-3 py-1.5 text-blue-900 dark:text-blue-200 font-mono text-right">
                        {t('geneticPotential.berkhanTableRow4')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                {t('geneticPotential.berkhanInfo.para3')}
              </p>
              <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                {t('geneticPotential.berkhanInfo.para4')}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 italic">
                {t('geneticPotential.berkhanInfo.source')}
              </p>
            </div>
          )}
        </div>
      )}

      {result.formula === 'Casey Butts modell' ? (
        result.maxLeanMass === 0 ? (
          // Visa meddelande när mått saknas
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 dark:bg-yellow-900/25 dark:border-yellow-800">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-300 mt-0.5 shrink-0" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                  {t('geneticPotential.caseyButtMissing.title')}
                </h4>
                <p className="text-xs text-yellow-800 dark:text-yellow-300 leading-relaxed">
                  {t('geneticPotential.caseyButtMissing.description')}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Visa resultat när mått finns
          <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-3 dark:from-green-900/25 dark:to-blue-900/25 dark:border-green-800">
            <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-3">
              {result.caseyButtMethod === 'personalized'
                ? t('geneticPotential.capacityAtCurrentBF', {
                    bf: result.caseyButtBodyFat?.toFixed(1),
                  })
                : t('geneticPotential.estimatedMaxPotential')}
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  {t('geneticPotential.caseyButtResults.mlbmLabel')}
                </p>
                <p className="text-lg font-bold text-green-700 dark:text-green-300">
                  {result.maxLeanMass.toFixed(1)} kg
                </p>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300">
                    {t('geneticPotential.caseyButtResults.mbwLabel')}
                  </p>
                  {currentBodyFat && (
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-400">
                      {t('geneticPotential.caseyButtResults.mbwAtBF', {
                        bf: currentBodyFat.toFixed(1),
                      })}
                    </p>
                  )}
                </div>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {result.maxWeight.toFixed(1)} kg
                </p>
              </div>
              {result.maxBulkedWeight && (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-neutral-600 dark:text-neutral-300">
                      {t('geneticPotential.caseyButtResults.mbbwLabel')}
                    </p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-400">
                      {t('geneticPotential.caseyButtResults.mbbwNote')}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
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
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-3 dark:from-green-900/25 dark:to-blue-900/25 dark:border-green-800">
          <div className="space-y-2">
            {/* Lean mass - primary info */}
            <div>
              <p className="text-xs text-neutral-600 dark:text-neutral-300">
                {t('geneticPotential.resultCard.maxLeanMassLabel')}
              </p>
              <p className="text-xl font-bold text-green-700 dark:text-green-300">
                {result.maxLeanMass.toFixed(1)} kg
              </p>
            </div>

            {/* Current body fat weight - secondary info */}
            {weightAtCurrentBF && currentBodyFat && (
              <div className="pt-2 border-t border-green-200 dark:border-green-800">
                <p className="text-xs text-neutral-600 dark:text-neutral-300">
                  {t('geneticPotential.resultCard.atCurrentBF', { bf: currentBodyFat.toFixed(1) })}
                </p>
                <p className="text-lg font-semibold text-primary-700 dark:text-primary-300">
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
          <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 mb-2">
            {t('geneticPotential.resultCard.targetWeightsTitle')}
          </h4>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
            {t('geneticPotential.resultCard.targetWeightsSubtitle')}
          </p>
          <div className="grid grid-cols-5 gap-2 text-center">
            {targetWeights.slice(0, 10).map(target => {
              const isCurrentBF = currentBodyFat && Math.abs(target.bodyFat - currentBodyFat) < 1

              // Gradient colors based on BF% (lower BF = more green/lean)
              const getColorClasses = (bf: number) => {
                if (bf <= 10)
                  return 'from-green-50 to-green-100 border-green-300 dark:from-green-900/25 dark:to-green-900/40 dark:border-green-800'
                if (bf <= 15)
                  return 'from-blue-50 to-blue-100 border-blue-300 dark:from-blue-900/25 dark:to-blue-900/40 dark:border-blue-800'
                if (bf <= 20)
                  return 'from-yellow-50 to-yellow-100 border-yellow-300 dark:from-yellow-900/25 dark:to-yellow-900/40 dark:border-yellow-800'
                return 'from-orange-50 to-orange-100 border-orange-300 dark:from-orange-500/15 dark:to-orange-500/10 dark:border-orange-700/60'
              }

              return (
                <div
                  key={target.bodyFat}
                  className={`rounded-lg p-2 border ${
                    isCurrentBF
                      ? 'bg-gradient-to-br from-primary-100 to-primary-200 border-primary-500 ring-1 ring-primary-400 dark:from-primary-900/40 dark:to-primary-900/60 dark:border-primary-600'
                      : `bg-gradient-to-br ${getColorClasses(target.bodyFat)}`
                  }`}
                >
                  <p
                    className={`text-xs font-medium ${isCurrentBF ? 'text-primary-700 dark:text-primary-300' : 'text-neutral-600 dark:text-neutral-300'}`}
                  >
                    {target.bodyFat}%
                  </p>
                  <p
                    className={`font-bold text-sm ${isCurrentBF ? 'text-primary-900 dark:text-primary-200' : 'text-neutral-900 dark:text-neutral-100'}`}
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
            <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-100">
              {t('geneticPotential.bodyType.sectionTitle')}
            </h4>

            {/* Upper body classification */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3 dark:bg-blue-900/25 dark:border-blue-800">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-300">
                  {t('geneticPotential.bodyType.upperBodyLabel')}
                </p>
                <Badge variant={result.upperBodyType === 'easy' ? 'default' : 'secondary'}>
                  {result.upperBodyType === 'hard'
                    ? t('geneticPotential.bodyType.hardgainer')
                    : t('geneticPotential.bodyType.easygainer')}
                </Badge>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                {result.upperBodyType === 'hard'
                  ? t('geneticPotential.bodyType.upperHardDesc')
                  : t('geneticPotential.bodyType.upperEasyDesc')}
              </p>
            </div>

            {/* Lower body classification */}
            <div className="bg-purple-50 border-2 border-purple-200 rounded-lg p-3 dark:bg-purple-900/25 dark:border-purple-800">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-medium text-purple-900 dark:text-purple-300">
                  {t('geneticPotential.bodyType.lowerBodyLabel')}
                </p>
                <Badge variant={result.lowerBodyType === 'easy' ? 'default' : 'secondary'}>
                  {result.lowerBodyType === 'hard'
                    ? t('geneticPotential.bodyType.hardgainer')
                    : t('geneticPotential.bodyType.easygainer')}
                </Badge>
              </div>
              <p className="text-xs text-purple-700 dark:text-purple-300">
                {result.lowerBodyType === 'hard'
                  ? t('geneticPotential.bodyType.lowerHardDesc')
                  : t('geneticPotential.bodyType.lowerEasyDesc')}
              </p>
            </div>

            {/* Measurements table */}
            <h4 className="font-medium text-sm text-neutral-900 dark:text-neutral-100 mt-4 mb-3">
              {t('geneticPotential.maxMeasurements.sectionTitle')}
            </h4>

            {(() => {
              const allMeasurements = [
                {
                  label: t('geneticPotential.maxMeasurements.chest'),
                  max: result.maxMeasurements.chestCm,
                  current: undefined,
                  group: 'upper' as const,
                  infoTitle: t('geneticPotential.maxMeasurements.chestInfoTitle'),
                  infoDesc: t('geneticPotential.maxMeasurements.chestInfoDesc'),
                },
                {
                  label: t('geneticPotential.maxMeasurements.biceps'),
                  max: result.maxMeasurements.bicepsCm,
                  current: undefined,
                  group: 'upper' as const,
                  infoTitle: t('geneticPotential.maxMeasurements.bicepsInfoTitle'),
                  infoDesc: t('geneticPotential.maxMeasurements.bicepsInfoDesc'),
                },
                {
                  label: t('geneticPotential.maxMeasurements.forearms'),
                  max: result.maxMeasurements.forearmsCm,
                  current: currentMeasurement?.forearm,
                  group: 'upper' as const,
                  infoTitle: t('geneticPotential.maxMeasurements.forearmsInfoTitle'),
                  infoDesc: t('geneticPotential.maxMeasurements.forearmsInfoDesc'),
                },
                {
                  label: t('geneticPotential.maxMeasurements.neck'),
                  max: result.maxMeasurements.neckCm,
                  current: currentMeasurement?.neck,
                  group: 'upper' as const,
                  infoTitle: t('geneticPotential.maxMeasurements.neckInfoTitle'),
                  infoDesc: t('geneticPotential.maxMeasurements.neckInfoDesc'),
                },
                {
                  label: t('geneticPotential.maxMeasurements.thighs'),
                  max: result.maxMeasurements.thighsCm,
                  current: currentMeasurement?.thigh_circ,
                  group: 'lower' as const,
                  infoTitle: t('geneticPotential.maxMeasurements.thighsInfoTitle'),
                  infoDesc: t('geneticPotential.maxMeasurements.thighsInfoDesc'),
                },
                {
                  label: t('geneticPotential.maxMeasurements.calves'),
                  max: result.maxMeasurements.calvesCm,
                  current: currentMeasurement?.calf_circ,
                  group: 'lower' as const,
                  infoTitle: t('geneticPotential.maxMeasurements.calvesInfoTitle'),
                  infoDesc: t('geneticPotential.maxMeasurements.calvesInfoDesc'),
                },
              ]

              const hasAnyCurrent = allMeasurements.some(m => m.current != null)

              return (
                <div className="border border-neutral-200 rounded-lg overflow-hidden dark:border-neutral-700">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-neutral-50 border-b border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700">
                        <th className="text-left p-2.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                          {t('geneticPotential.maxMeasurements.colMeasurement')}
                        </th>
                        {hasAnyCurrent && (
                          <th className="text-right p-2.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                            {t('geneticPotential.maxMeasurements.colYours')}
                          </th>
                        )}
                        <th className="text-right p-2.5 text-xs font-semibold text-neutral-600 dark:text-neutral-300">
                          {t('geneticPotential.maxMeasurements.colMax')}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Överkropp header */}
                      <tr className="bg-blue-50/50 dark:bg-blue-900/25">
                        <td
                          colSpan={hasAnyCurrent ? 3 : 2}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 dark:text-blue-300"
                        >
                          {t('geneticPotential.maxMeasurements.upperBody')}
                        </td>
                      </tr>
                      {allMeasurements
                        .filter(m => m.group === 'upper')
                        .map(({ label, max, current, infoTitle, infoDesc }) => (
                          <tr
                            key={label}
                            className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-700"
                          >
                            <td className="p-2.5">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                  {label}
                                </span>
                                {onShowMeasurementInfo && (
                                  <button
                                    type="button"
                                    onClick={() => onShowMeasurementInfo(infoTitle, infoDesc)}
                                    className="text-neutral-400 hover:text-primary-600 transition-colors cursor-pointer dark:text-neutral-400 dark:hover:text-primary-400"
                                    aria-label={t('geneticPotential.maxMeasurements.ariaLabel', {
                                      label,
                                    })}
                                  >
                                    <Info className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                            {hasAnyCurrent && (
                              <td className="p-2.5 text-right">
                                {current != null ? (
                                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                    {current.toFixed(1)} cm
                                  </span>
                                ) : (
                                  <span className="text-sm text-neutral-300 dark:text-neutral-600">
                                    —
                                  </span>
                                )}
                              </td>
                            )}
                            <td className="p-2.5 text-right">
                              <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                {max.toFixed(1)} cm
                              </span>
                            </td>
                          </tr>
                        ))}
                      {/* Underkropp header */}
                      <tr className="bg-purple-50/50 border-t border-neutral-200 dark:bg-purple-900/25 dark:border-neutral-700">
                        <td
                          colSpan={hasAnyCurrent ? 3 : 2}
                          className="px-2.5 py-1.5 text-xs font-semibold text-purple-700 dark:text-purple-300"
                        >
                          {t('geneticPotential.maxMeasurements.lowerBody')}
                        </td>
                      </tr>
                      {allMeasurements
                        .filter(m => m.group === 'lower')
                        .map(({ label, max, current, infoTitle, infoDesc }) => (
                          <tr
                            key={label}
                            className="border-b border-neutral-100 last:border-b-0 dark:border-neutral-700"
                          >
                            <td className="p-2.5">
                              <div className="flex items-center gap-1">
                                <span className="text-sm text-neutral-700 dark:text-neutral-300">
                                  {label}
                                </span>
                                {onShowMeasurementInfo && (
                                  <button
                                    type="button"
                                    onClick={() => onShowMeasurementInfo(infoTitle, infoDesc)}
                                    className="text-neutral-400 hover:text-primary-600 transition-colors cursor-pointer dark:text-neutral-400 dark:hover:text-primary-400"
                                    aria-label={t('geneticPotential.maxMeasurements.ariaLabel', {
                                      label,
                                    })}
                                  >
                                    <Info className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </td>
                            {hasAnyCurrent && (
                              <td className="p-2.5 text-right">
                                {current != null ? (
                                  <span className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                    {current.toFixed(1)} cm
                                  </span>
                                ) : (
                                  <span className="text-sm text-neutral-300 dark:text-neutral-600">
                                    —
                                  </span>
                                )}
                              </td>
                            )}
                            <td className="p-2.5 text-right">
                              <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
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
