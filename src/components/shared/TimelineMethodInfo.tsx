/**
 * Förklarar hur tidsberäkningen fungerar och varför den skiljer sig från de
 * flesta kalkylatorer på nätet.
 *
 * VARFÖR DEN FINNS: appen ger ett längre svar än konkurrenterna för samma
 * indata. Utan förklaring ser det ut som ett fel — särskilt för den som
 * dubbelkollar mot en annan kalkylator och får färre veckor där. Skillnaden
 * är avsiktlig och har stöd i litteraturen, och då ska den gå att granska.
 *
 * Delad mellan Målsättning och perioder: båda använder samma modell sedan
 * 2026-08-19, så de ska förklara den på samma sätt.
 */

import { useTranslation } from 'react-i18next'
import { InfoModal } from '@/components/ui/InfoModal'

interface Props {
  open: boolean
  onClose: () => void
}

export function TimelineMethodInfo({ open, onClose }: Props) {
  const { t } = useTranslation('tools')

  return (
    <InfoModal open={open} onClose={onClose} title={t('timelineMethod.title')} size="2xl">
      <div className="space-y-5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
        <p>{t('timelineMethod.intro')}</p>

        <section className="space-y-2">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {t('timelineMethod.linearTitle')}
          </h3>
          <p>{t('timelineMethod.linearBody')}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {t('timelineMethod.whyWrongTitle')}
          </h3>
          <p>{t('timelineMethod.whyWrongBody')}</p>
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {t('timelineMethod.ourModelTitle')}
          </h3>
          <p>{t('timelineMethod.ourModelBody')}</p>

          {/* Konkreta tal slår en abstrakt förklaring. Siffrorna kommer från
              en simulering vecka för vecka med TDEE omräknat ur Mifflin-St
              Jeor — samma jämförelse som ligger bakom modellvalet. */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs tabular-nums">
              <thead>
                <tr className="border-b border-neutral-200 text-left dark:border-neutral-700">
                  <th className="py-1.5 pr-3 font-medium">{t('timelineMethod.table.case')}</th>
                  <th className="py-1.5 pr-3 font-medium">{t('timelineMethod.table.actual')}</th>
                  <th className="py-1.5 pr-3 font-medium">{t('timelineMethod.table.linear')}</th>
                  <th className="py-1.5 font-medium">{t('timelineMethod.table.ours')}</th>
                </tr>
              </thead>
              <tbody className="text-neutral-600 dark:text-neutral-400">
                {[
                  ['80 kg, 20 → 8 %', '22', '20', '22'],
                  ['100 kg, 25 → 12 %', '27', '26', '28'],
                  ['120 kg, 35 → 15 %', '49', '45', '51'],
                ].map(([fall, sanning, linjar, var_]) => (
                  <tr key={fall} className="border-b border-neutral-100 dark:border-neutral-800">
                    <td className="py-1.5 pr-3">{fall}</td>
                    <td className="py-1.5 pr-3">{sanning}</td>
                    <td className="py-1.5 pr-3 text-error-600 dark:text-error-400">{linjar}</td>
                    <td className="py-1.5 font-medium text-neutral-800 dark:text-neutral-200">
                      {var_}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            {t('timelineMethod.tableNote')}
          </p>
        </section>

        <section className="space-y-2">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {t('timelineMethod.sourcesTitle')}
          </h3>
          <ul className="space-y-2 text-xs">
            <li>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                Hall KD, Chow CC (2013).
              </span>{' '}
              Why is the 3500 kcal per pound weight loss rule wrong?{' '}
              <span className="italic">Int J Obes</span> 37(12). PMID 23774459.
              <br />
              <span className="text-neutral-500 dark:text-neutral-400">
                {t('timelineMethod.source1')}
              </span>
            </li>
            <li>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">
                Hall KD m.fl. (2011).
              </span>{' '}
              Quantification of the effect of energy imbalance on bodyweight.{' '}
              <span className="italic">Lancet</span> 378(9793):826–37. PMID 21872751.
              <br />
              <span className="text-neutral-500 dark:text-neutral-400">
                {t('timelineMethod.source2')}
              </span>
            </li>
          </ul>
        </section>

        {/* Ärlighet om vad modellen INTE gör. Utan detta stycket låter
            beräkningen mer exakt än den är, vilket är samma fel som den
            linjära modellen gjorde — bara i andra riktningen. */}
        <section className="space-y-2 rounded-lg bg-neutral-50 p-4 dark:bg-neutral-900">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
            {t('timelineMethod.limitsTitle')}
          </h3>
          <p className="text-xs">{t('timelineMethod.limitsBody')}</p>
        </section>
      </div>
    </InfoModal>
  )
}
