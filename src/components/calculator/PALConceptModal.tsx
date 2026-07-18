import { useTranslation } from 'react-i18next'
import { InfoModal } from '@/components/ui/InfoModal'

interface PALConceptModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PALConceptModal({ isOpen, onClose }: PALConceptModalProps) {
  const { t } = useTranslation('tools')
  if (!isOpen) return null

  return (
    <InfoModal
      open
      onClose={onClose}
      title={t('tdeeCalc.palConceptModal.title')}
      subtitle={t('tdeeCalc.palConceptModal.subtitle')}
    >
      <div className="space-y-6">
        {/* Description */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-2">
            {t('tdeeCalc.palConceptModal.description')}
          </h3>
          <p className="text-neutral-700 leading-relaxed">
            {t('tdeeCalc.palConceptModal.descriptionText')}
          </p>
        </div>

        {/* How it works */}
        <div>
          <h3 className="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
            <span className="text-xl">💡</span>
            {t('tdeeCalc.palConceptModal.howItWorksTitle')}
          </h3>
          <div className="space-y-3">
            <p className="text-neutral-700 leading-relaxed">
              {t('tdeeCalc.palConceptModal.howItWorksPara')}
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-neutral-800 font-medium text-center">
                {t('tdeeCalc.palConceptModal.formula')}
              </p>
            </div>
          </div>
        </div>

        {/* Why choose different systems */}
        <div>
          <h3 className="text-lg font-semibold text-neutral-800 mb-3">
            {t('tdeeCalc.palConceptModal.whyDifferentTitle')}
          </h3>
          <p className="text-neutral-700 leading-relaxed mb-3">
            {t('tdeeCalc.palConceptModal.whyDifferentPara1')}
          </p>
          <p className="text-neutral-700 leading-relaxed">
            {t('tdeeCalc.palConceptModal.whyDifferentPara2')}
          </p>
        </div>
      </div>
    </InfoModal>
  )
}
