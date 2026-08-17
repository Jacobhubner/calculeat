/**
 * Förklarar när ett recepts näringsvärden uppdateras — och när de inte gör det.
 *
 * Behövs för att beteendet inte är självklart: receptet räknas om när det
 * SPARAS, inte när en ingrediens ändras. Utan förklaring läses varningstriangeln
 * på receptkortet som ett fel i appen i stället för som en upplysning.
 */

import { useTranslation } from 'react-i18next'
import { AlertTriangle, Check, Lock } from 'lucide-react'
import { InfoModal } from '@/components/ui/InfoModal'

interface Props {
  open: boolean
  onClose: () => void
}

export function RecipeNutritionInfoModal({ open, onClose }: Props) {
  const { t } = useTranslation('recipes')

  return (
    <InfoModal open={open} onClose={onClose} title={t('nutritionInfo.title')} size="2xl">
      <div className="space-y-5">
        <p className="text-sm text-neutral-700 dark:text-neutral-300">{t('nutritionInfo.intro')}</p>

        {/* Du ändrar själv */}
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
          <div className="flex items-start gap-2.5">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-success-600 dark:text-success-400" />
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('nutritionInfo.ownTitle')}
              </h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {t('nutritionInfo.ownBody')}
              </p>
            </div>
          </div>
        </div>

        {/* Någon annan ändrar */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/25">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                {t('nutritionInfo.otherTitle')}
              </h3>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">
                {t('nutritionInfo.otherBody')}
              </p>
            </div>
          </div>
        </div>

        {/* Loggad mat */}
        <div className="rounded-xl border border-neutral-200 p-4 dark:border-neutral-700">
          <div className="flex items-start gap-2.5">
            <Lock className="mt-0.5 h-4 w-4 shrink-0 text-neutral-500 dark:text-neutral-400" />
            <div>
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                {t('nutritionInfo.loggedTitle')}
              </h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                {t('nutritionInfo.loggedBody')}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('nutritionInfo.why')}</p>
      </div>
    </InfoModal>
  )
}
