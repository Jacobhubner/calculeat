import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../ui/button'
import { Portal } from '../ui/portal'

interface PALConceptModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function PALConceptModal({ isOpen, onClose }: PALConceptModalProps) {
  const { t } = useTranslation('tools')
  if (!isOpen) return null

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
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-accent-500 text-white p-6 rounded-t-2xl flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold">{t('tdeeCalc.palConceptModal.title')}</h2>
              <p className="text-primary-100 mt-1">{t('tdeeCalc.palConceptModal.subtitle')}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
              aria-label={t('tdeeCalc.modal.closeAriaLabel')}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
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

          {/* Footer */}
          <div className="sticky bottom-0 bg-neutral-50 p-6 rounded-b-2xl border-t border-neutral-200">
            <Button onClick={onClose} className="w-full">
              {t('tdeeCalc.modal.close')}
            </Button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
