/**
 * Förklarar varför en ny användare bör mäta sin förbrukning innan hon börjar
 * gå ner.
 *
 * VARFÖR DEN FINNS: rekommendationen "börja med fyra veckor underhåll" ser ut
 * som en fördröjning av det användaren faktiskt vill göra. Utan skälet läses
 * den som att appen krånglar. Med skälet blir den det som gör resten av
 * planen träffsäker.
 *
 * SIFFRORNA ÄR HÄMTADE UR KODEN, inte hittade på:
 *  - ±177 kcal vid 14 dagar och ±62 vid 28 står i calibration-quality.ts
 *    (signal/brus-avsnittet), härlett ur vägbrus SD ≈ 0,5 % av kroppsvikten.
 *  - sju loggdagar och 50 % täckning är MIN_LOG_DAYS_FOR_CALIBRATION och
 *    täckningskravet i calibration-constants.ts.
 *  - 2228/1944/1727 kcal och 0,46/0,20 kg per vecka är uträknade för en
 *    kvinna 95 kg, 165 cm, 40 år som väljer "lätt aktiv" men är
 *    stillasittande — ett steg fel på reglaget, alltså 13 %.
 * Låsta med test i MeasureFirstInfo.test.ts.
 */

import { useTranslation } from 'react-i18next'
import { InfoModal } from '@/components/ui/InfoModal'

interface Props {
  open: boolean
  onClose: () => void
}

export function MeasureFirstInfo({ open, onClose }: Props) {
  const { t } = useTranslation('dashboard')

  return (
    <InfoModal
      open={open}
      onClose={onClose}
      title={t('phase.measureModalTitle')}
      subtitle={t('phase.measureModalSubtitle')}
    >
      <div className="space-y-6">
        <p className="leading-relaxed text-neutral-700 dark:text-neutral-200">
          {t('phase.measureIntro')}
        </p>

        {/* Problemet först, med konkreta tal. En abstrakt varning om
            "osäkerhet" ändrar ingens beteende; tre rader som visar hur
            0,46 blir 0,20 gör det. */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-800 dark:text-amber-300">
            <span className="text-xl">⚠</span>
            {t('phase.measureProblemTitle')}
          </h3>
          <p className="leading-relaxed text-neutral-700 dark:text-neutral-200">
            {t('phase.measureProblemBody')}
          </p>
          <ul className="mt-3 space-y-2">
            {(['measureProblemRow1', 'measureProblemRow2', 'measureProblemRow3'] as const).map(
              key => (
                <li key={key} className="flex gap-3">
                  <span className="mt-1 font-bold text-amber-600 dark:text-amber-300">•</span>
                  <span className="flex-1 text-neutral-700 dark:text-neutral-200">
                    {t(`phase.${key}`)}
                  </span>
                </li>
              )
            )}
          </ul>
          <p className="mt-3 rounded-lg bg-neutral-50 p-3 text-sm leading-relaxed text-neutral-700 dark:bg-neutral-900 dark:text-neutral-300">
            {t('phase.measureProblemConclusion')}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            {t('phase.measureSolutionTitle')}
          </h3>
          <p className="leading-relaxed text-neutral-700 dark:text-neutral-200">
            {t('phase.measureSolutionBody')}
          </p>
          <ul className="mt-3 space-y-2">
            {(
              ['measureSolutionPoint1', 'measureSolutionPoint2', 'measureSolutionPoint3'] as const
            ).map(key => (
              <li key={key} className="flex gap-3">
                <span className="mt-1 font-bold text-primary-600 dark:text-primary-300">•</span>
                <span className="flex-1 text-neutral-700 dark:text-neutral-200">
                  {t(`phase.${key}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sist, och tydligt: rekommendationen är inte ett krav. En användare
            som känner sig hindrad slutar lita på verktyget. */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/25">
          <h3 className="mb-1 text-sm font-semibold text-blue-900 dark:text-blue-200">
            {t('phase.measureSkipTitle')}
          </h3>
          <p className="text-sm leading-relaxed text-blue-900/90 dark:text-blue-300">
            {t('phase.measureSkipBody')}
          </p>
        </div>
      </div>
    </InfoModal>
  )
}
