import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Calculator, TrendingUp, Ruler, Weight, Info, X, AlertCircle } from 'lucide-react'
import FeatureCard from '@/components/FeatureCard'
import StatCard from '@/components/StatCard'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Portal } from '@/components/ui/portal'
import { useActiveProfile } from '@/hooks/useActiveProfile'
import { calculateFFMI, calculateNormalizedFFMI } from '@/lib/calculations/ffmiCalculations'
import { calculateFatFreeMass } from '@/lib/calculations/bodyComposition'
import { BodyFatReferenceTable } from '@/components/body-composition/BodyFatReferenceTable'
import { FFMIReferenceTable } from '@/components/body-composition/FFMIReferenceTable'
import { FFMICategoryTable } from '@/components/body-composition/FFMICategoryTable'
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

  // Utility function för modal rendering
  const renderModal = (
    show: boolean,
    onClose: () => void,
    title: string,
    subtitle: string,
    ContentComponent: React.ComponentType
  ) => {
    if (!show) return null

    return (
      <Portal>
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50"
          onClick={onClose}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-br from-primary-500 to-accent-500 text-white px-6 py-4 flex justify-between items-start rounded-t-2xl">
              <div>
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="text-sm text-white/90 mt-1">{subtitle}</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/90 hover:text-white transition-colors"
                aria-label={t('hub.closeModalAriaLabel')}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="p-6">
              <ContentComponent />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 px-6 py-4 rounded-b-2xl">
              <Button onClick={onClose} className="w-full">
                {t('hub.closeModal')}
              </Button>
            </div>
          </div>
        </div>
      </Portal>
    )
  }

  // Om ingen profil eller data saknas, visa informationsmeddelande
  if (!profile || !bodyFatPercentage || !weight || !height) {
    return (
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-1 md:mb-2">
            {t('hub.title')}
          </h1>
          <p className="text-neutral-600">{t('hub.subtitle')}</p>
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
          <AlertDescription>
            {t('hub.missingDataAlert')}
          </AlertDescription>
        </Alert>

        {/* Visa alltid referenstabellerna även om data saknas */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-neutral-900">{t('hub.referenceValues')}</h2>

          {/* Body Fat % Table (full width) */}
          <div>
            <h3 className="text-base font-semibold text-neutral-800 mb-2">{t('hub.bodyFatTableTitle')}</h3>
            <BodyFatReferenceTable userBodyFat={null} gender={profile?.gender} fullWidthImages />
          </div>

          {/* FFMI Tables side by side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* FFMI Description Categories */}
            <div>
              <h3 className="text-base font-semibold text-neutral-800 mb-2">{t('hub.ffmiCategories')}</h3>
              <FFMICategoryTable userFFMI={null} gender={profile?.gender ?? 'male'} />
            </div>

            {/* FFMI with Body Fat Ranges */}
            <div>
              <h3 className="text-base font-semibold text-neutral-800 mb-2">
                {t('hub.ffmiWithBodyFat')}
              </h3>
              <FFMIReferenceTable
                userFFMI={null}
                userBodyFat={null}
                gender={profile?.gender ?? 'male'}
              />
            </div>
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
        <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-1 md:mb-2">
          {t('hub.title')}
        </h1>
        <p className="text-neutral-600">{t('hub.subtitle')}</p>
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
          <h2 className="text-2xl font-bold text-neutral-900">{t('hub.currentValues')}</h2>

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
                  className="absolute top-2 right-2 p-1 hover:bg-neutral-100 rounded-full transition-colors"
                  aria-label={t('hub.showFFMIInfo')}
                >
                  <Info className="h-4 w-4 text-neutral-600" />
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
                  className="absolute top-2 right-2 p-1 hover:bg-neutral-100 rounded-full transition-colors"
                  aria-label={t('hub.showNormalizedFFMIInfo')}
                >
                  <Info className="h-4 w-4 text-neutral-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Tables Section - Kroppsfett % on left, FFMI tables on right */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left column: Kroppsfett % table - compact */}
            <div>
              <h3 className="text-sm font-semibold text-neutral-800 mb-2">{t('hub.bodyFatTableShort')}</h3>
              <BodyFatReferenceTable
                userBodyFat={bodyFatPercentage}
                gender={profile.gender}
                fullWidthImages
              />
            </div>

            {/* Right column: FFMI tables side by side */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FFMI Description Categories */}
              <div>
                <h3 className="text-base font-semibold text-neutral-800 mb-2">{t('hub.ffmiCategories')}</h3>
                <FFMICategoryTable
                  userFFMI={metrics?.ffmi || null}
                  gender={profile.gender ?? 'male'}
                />
              </div>

              {/* FFMI with Body Fat Ranges */}
              <div>
                <h3 className="text-base font-semibold text-neutral-800 mb-2">
                  {t('hub.ffmiWithBodyFat')}
                </h3>
                <FFMIReferenceTable
                  userFFMI={metrics?.ffmi || null}
                  userBodyFat={bodyFatPercentage}
                  gender={profile.gender ?? 'male'}
                />
              </div>
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
