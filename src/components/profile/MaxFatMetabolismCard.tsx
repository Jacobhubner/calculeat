/**
 * MaxFatMetabolismCard - Visa maximal fettmetabolism för aktiv profil
 * Visas under resultatkortet i sidopanelen
 */

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoModal } from '@/components/ui/InfoModal'
import { Flame, Info } from 'lucide-react'
import type { Profile } from '@/lib/types'
import { calculateFatFreeMass } from '@/lib/calculations/bodyComposition'
import { calculateMaxFatMetabolism } from '@/lib/calculations/ffmiCalculations'
import MaxFatMetabolismContent from '@/components/info/MaxFatMetabolismContent'

interface MaxFatMetabolismCardProps {
  profile: Profile | null
}

export default function MaxFatMetabolismCard({ profile }: MaxFatMetabolismCardProps) {
  const { t } = useTranslation('body')
  const [showModal, setShowModal] = useState(false)

  if (!profile) return null

  const tdee = profile.tdee

  // Calculate max fat metabolism if we have body fat %, weight, and TDEE
  let maxFatMetabolism = null
  if (profile.body_fat_percentage && profile.weight_kg && tdee) {
    const leanBodyMass = calculateFatFreeMass(profile.weight_kg, profile.body_fat_percentage)
    maxFatMetabolism = calculateMaxFatMetabolism(leanBodyMass, profile.weight_kg, tdee)
  }

  // Don't show if we don't have the required data
  if (!maxFatMetabolism) return null

  return (
    <>
      <Card className="relative">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Flame className="h-5 w-5 text-red-600 dark:text-red-300" />
            {t('maxFat.profileTitle')}
          </CardTitle>
          <button
            onClick={() => setShowModal(true)}
            className="absolute top-4 right-4 p-1 hover:bg-neutral-100 rounded-full transition-colors dark:hover:bg-neutral-800"
            aria-label={t('maxFat.profileInfoAriaLabel')}
          >
            <Info className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
          </button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {t('maxFat.kcalPerDay', { value: maxFatMetabolism.practicalMax })}
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('maxFat.percentOfTdee', { value: maxFatMetabolism.percentOfTDEE })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Information Modal — delat skal, se InfoModal */}
      <InfoModal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={t('maxFat.profileTitle')}
        subtitle={t('maxFat.profileSubtitle')}
      >
        <MaxFatMetabolismContent />
      </InfoModal>
    </>
  )
}
