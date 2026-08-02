import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calculator, TrendingUp, Ruler, Weight, Info, AlertCircle } from 'lucide-react'
import FeatureCard from '@/components/FeatureCard'
import StatCard from '@/components/StatCard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { InfoModal } from '@/components/ui/InfoModal'
import { useActiveProfile } from '@/hooks/useActiveProfile'
import { calculateFFMI, calculateNormalizedFFMI } from '@/lib/calculations/ffmiCalculations'
import { calculateFatFreeMass } from '@/lib/calculations/bodyComposition'
import { BodyFatReferenceTable } from '@/components/body-composition/BodyFatReferenceTable'
import { FFMIInterpretationTable } from '@/components/body-composition/FFMIInterpretationTable'
import FFMIContent from '@/components/info/FFMIContent'
import NormalizedFFMIContent from '@/components/info/NormalizedFFMIContent'

export default function BodyCompositionHubPage() {
  const navigate = useNavigate()
  const { t } = useTranslation('body')
  const { profile } = useActiveProfile()
  const [showFFMIModal, setShowFFMIModal] = useState(false)
  const [showNormalizedFFMIModal, setShowNormalizedFFMIModal] = useState(false)

  // Hämta nödvändig data
  const bodyFatPercentage = profile?.body_fat_percentage
  const weight = profile?.weight_kg
  const height = profile?.height_cm

  // Beräkna alla värden
  const metrics = useMemo(() => {
    if (!bodyFatPercentage || !weight || !height) return null

    const heightM = height / 100
    const leanBodyMass = calculateFatFreeMass(weight, bodyFatPercentage)
    const ffmi = calculateFFMI(leanBodyMass, heightM)
    const normalizedFFMI = calculateNormalizedFFMI(ffmi, heightM)

    return {
      leanBodyMass,
      ffmi,
      normalizedFFMI,
    }
  }, [bodyFatPercentage, weight, height])

  // Delat modal-skal — se InfoModal för den frysta designen
  const renderModal = (
    show: boolean,
    onClose: () => void,
    title: string,
    subtitle: string,
    ContentComponent: React.ComponentType
  ) => (
    <InfoModal open={show} onClose={onClose} title={title} subtitle={subtitle}>
      <ContentComponent />
    </InfoModal>
  )

  // Om ingen profil eller data saknas, visa informationsmeddelande
  if (!profile || !bodyFatPercentage || !weight || !height) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 md:mb-2">
            {t('hub.title')}
          </h1>
          <p className="text-neutral-600 dark:text-neutral-300">{t('hub.subtitle')}</p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            onClick={() => navigate('/app/body-composition/calculate')}
            className="cursor-pointer"
          >
            <FeatureCard
              icon={Calculator}
              title={t('hub.calculateTitle')}
              description={t('hub.calculateDesc')}
              accentColor="primary"
            />
          </div>

          <div
            onClick={() => navigate('/app/body-composition/genetic-potential')}
            className="cursor-pointer"
          >
            <FeatureCard
              icon={TrendingUp}
              title={t('hub.geneticTitle')}
              description={t('hub.geneticDesc')}
              accentColor="accent"
            />
          </div>
        </div>

        {/* Informationsmeddelande */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('hub.missingDataAlert')}</AlertDescription>
        </Alert>

        {/* Visa alltid referenstabellerna även om data saknas */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {t('hub.referenceValues')}
          </h2>

          {/* Body Fat % Table (full width) */}
          <div>
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
              {t('hub.bodyFatTableTitle')}
            </h3>
            <BodyFatReferenceTable userBodyFat={null} gender={profile?.gender} fullWidthImages />
          </div>

          {/* FFMI Interpretation Table */}
          <div>
            <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
              {t('hub.ffmiCategories')}
            </h3>
            <FFMIInterpretationTable gender={profile?.gender ?? 'male'} />
          </div>
        </div>
      </div>
    )
  }

  // Om vi har all data, visa full sida med metrics
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 mb-1 md:mb-2">
          {t('hub.title')}
        </h1>
        <p className="text-neutral-600 dark:text-neutral-300">{t('hub.subtitle')}</p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div onClick={() => navigate('/app/body-composition/calculate')} className="cursor-pointer">
          <FeatureCard
            icon={Calculator}
            title={t('hub.calculateTitle')}
            description={t('hub.calculateDesc')}
            accentColor="primary"
          />
        </div>

        <div
          onClick={() => navigate('/app/body-composition/genetic-potential')}
          className="cursor-pointer"
        >
          <FeatureCard
            icon={TrendingUp}
            title={t('hub.geneticTitle')}
            description={t('hub.geneticDesc')}
            accentColor="accent"
          />
        </div>
      </div>

      {/* Current Stats Section */}
      {metrics && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {t('hub.currentValues')}
          </h2>

          {/* Main layout: Fettfri massa column on left, other cards on right */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left column: Fettfri massa card */}
            <div>
              <StatCard
                title={t('hub.leanMassCard')}
                value={metrics.leanBodyMass.toFixed(1)}
                unit="kg"
                subtitle={t('hub.bodyFatSubtitle', { value: bodyFatPercentage.toFixed(1) })}
                icon={Weight}
                variant="success"
              />
            </div>

            {/* Right column: Other 2 cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1: FFMI with info icon */}
              <div className="relative">
                <StatCard
                  title="FFMI"
                  value={metrics.ffmi.toFixed(1)}
                  icon={TrendingUp}
                  variant="primary"
                />
                <button
                  onClick={() => setShowFFMIModal(true)}
                  className="absolute top-2 right-2 p-1 hover:bg-neutral-100 rounded-full transition-colors dark:hover:bg-neutral-800"
                  aria-label={t('hub.showFFMIInfo')}
                >
                  <Info className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                </button>
              </div>

              {/* Card 2: Normalized FFMI with info icon */}
              <div className="relative">
                <StatCard
                  title={t('hub.normalizedFFMIModalTitle')}
                  value={metrics.normalizedFFMI.toFixed(1)}
                  icon={Ruler}
                  variant="accent"
                />
                <button
                  onClick={() => setShowNormalizedFFMIModal(true)}
                  className="absolute top-2 right-2 p-1 hover:bg-neutral-100 rounded-full transition-colors dark:hover:bg-neutral-800"
                  aria-label={t('hub.showNormalizedFFMIInfo')}
                >
                  <Info className="h-4 w-4 text-neutral-600 dark:text-neutral-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Tables Section - Kroppsfett % on left, FFMI tables on right */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left column: Kroppsfett % table - compact */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                {t('hub.bodyFatTableShort')}
              </h3>
              <BodyFatReferenceTable
                userBodyFat={bodyFatPercentage}
                gender={profile.gender}
                fullWidthImages
              />
            </div>

            {/* Right column: FFMI Interpretation Table */}
            <div className="lg:col-span-3">
              <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                {t('hub.ffmiCategories')}
              </h3>
              <FFMIInterpretationTable
                gender={profile.gender ?? 'male'}
                userFFMI={metrics?.ffmi ?? null}
                userBodyFat={bodyFatPercentage ?? null}
              />
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {renderModal(
        showFFMIModal,
        () => setShowFFMIModal(false),
        t('hub.ffmiModalTitle'),
        t('hub.ffmiModalSubtitle'),
        FFMIContent
      )}

      {renderModal(
        showNormalizedFFMIModal,
        () => setShowNormalizedFFMIModal(false),
        t('hub.normalizedFFMIModalTitle'),
        t('hub.normalizedFFMIModalSubtitle'),
        NormalizedFFMIContent
      )}
    </div>
  )
}
