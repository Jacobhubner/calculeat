import { useTranslation } from 'react-i18next'
import { InfoModal } from '@/components/ui/InfoModal'

interface BMRConceptModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function BMRConceptModal({ isOpen, onClose }: BMRConceptModalProps) {
  const { t } = useTranslation('tools')
  if (!isOpen) return null

  const factors = (
    [
      'factor1Plain',
      'factor2Plain',
      'factor3Plain',
      'factor4Plain',
      'factor5Plain',
      'factor6Plain',
    ] as const
  ).map(k => t(`tdeeCalc.bmrConceptModal.${k}`))

  return (
    <InfoModal
      open
      onClose={onClose}
      title={t('tdeeCalc.bmrConceptModal.title')}
      subtitle={t('tdeeCalc.bmrConceptModal.subtitle')}
    >
      <div className="space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2 dark:text-neutral-200">
            {t('tdeeCalc.bmrConceptModal.description')}
          </h3>
          <p className="text-neutral-700 leading-relaxed dark:text-neutral-200">
            {t('tdeeCalc.bmrConceptModal.descriptionText')}
          </p>
        </div>

        {/* Factors that increase BMR */}
        <div>
          <h3 className="text-lg font-semibold text-green-800 mb-3 flex items-center gap-2 dark:text-green-300">
            <span className="text-xl">✓</span>
            {t('tdeeCalc.bmrConceptModal.factorsTitle')}
          </h3>
          <ul className="space-y-2">
            {factors.map((factor, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-green-600 font-bold mt-1 dark:text-green-300">•</span>
                <span className="text-neutral-700 flex-1 dark:text-neutral-200">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </InfoModal>
  )
}
