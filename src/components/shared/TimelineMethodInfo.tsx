/**
 * Förklarar hur tidsberäkningen fungerar och vilka källor den vilar på.
 *
 * VARFÖR DEN FINNS: appen ger ett längre svar än de flesta kalkylatorer på
 * nätet för samma indata. Utan förklaring ser det ut som ett fel — särskilt
 * för den som dubbelkollar mot en annan kalkylator och får färre veckor där.
 * Skillnaden är avsiktlig och har stöd i litteraturen, och då ska den gå att
 * granska.
 *
 * ALDRIG PREMIUM (beslut 2026-08-19, efter att ett lås prövats och ångrats):
 * detta är en metod- och källredovisning, inte en funktion. Synlighets-
 * principen i PREMIUM_SPEC.md säger att informationen aldrig är premium.
 *
 * FÖLJER BMRFormulaModal: samma rubriknivåer (text-lg font-semibold
 * text-neutral-800 + mb-3), samma punktlistor med färgad markör i flex,
 * samma källkort (bg-neutral-50 med ram) och samma Vancouver-format på
 * referenserna. Modalen ska kännas igen av den som redan läst en
 * formelbeskrivning i kalkylatorn.
 *
 * Delad mellan Målsättning och perioder: båda använder samma modell, så de
 * ska förklara den på samma sätt.
 */

import { useTranslation } from 'react-i18next'
import { InfoModal } from '@/components/ui/InfoModal'

interface Props {
  open: boolean
  onClose: () => void
}

/**
 * Jämförelsen som ligger bakom modellvalet. Talen är låsta med test i
 * TimelineMethodInfo.test.ts — en förklaring som appen själv motsäger vore
 * värre än ingen förklaring alls.
 */
const COMPARISON_ROWS = [
  { start: '80 kg', from: 20, to: 8, actual: 22, fixed: 20, ours: 22 },
  { start: '100 kg', from: 25, to: 12, actual: 27, fixed: 26, ours: 28 },
  { start: '120 kg', from: 35, to: 15, actual: 49, fixed: 45, ours: 51 },
] as const

/**
 * Vancouver-format med doi och PMID, identiskt med bmrDescriptions.ts —
 * appens etablerade sätt att ange en vetenskaplig källa.
 */
const REFERENCES = [
  {
    citation:
      'Hall KD, Chow CC. Why is the 3500 kcal per pound weight loss rule wrong? Int J Obes (Lond). 2013 Dec;37(12):1614. doi: 10.1038/ijo.2013.112. PMID: 23774459.',
    noteKey: 'source1',
  },
  {
    citation:
      'Hall KD, Sacks G, Chandramohan D, Chow CC, Wang YC, Gortmaker SL, Swinburn BA. Quantification of the effect of energy imbalance on bodyweight. Lancet. 2011 Aug 27;378(9793):826-37. doi: 10.1016/S0140-6736(11)60812-X. PMID: 21872751.',
    noteKey: 'source2',
  },
] as const

export function TimelineMethodInfo({ open, onClose }: Props) {
  const { t } = useTranslation('tools')

  return (
    <InfoModal
      open={open}
      onClose={onClose}
      title={t('timelineMethod.title')}
      subtitle={t('timelineMethod.subtitle')}
    >
      <div className="space-y-6">
        <p className="leading-relaxed text-neutral-700 dark:text-neutral-200">
          {t('timelineMethod.intro')}
        </p>

        {/* Principen först — allt annat följer av att takten avtar. */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            {t('timelineMethod.principleTitle')}
          </h3>
          <p className="leading-relaxed text-neutral-700 dark:text-neutral-200">
            {t('timelineMethod.principleBody')}
          </p>
          <ul className="mt-3 space-y-2">
            {(
              ['principlePoint1', 'principlePoint2', 'principlePoint3', 'principlePoint4'] as const
            ).map(key => (
              <li key={key} className="flex gap-3">
                <span className="mt-1 font-bold text-primary-600 dark:text-primary-300">•</span>
                <span className="flex-1 text-neutral-700 dark:text-neutral-200">
                  {t(`timelineMethod.${key}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Konkreta tal slår en abstrakt förklaring. "Verkligt" är en
            simulering vecka för vecka där förbrukningen räknas om varje
            vecka — alltså det som faktiskt händer. */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            {t('timelineMethod.comparisonTitle')}
          </h3>
          <p className="mb-3 leading-relaxed text-neutral-700 dark:text-neutral-200">
            {t('timelineMethod.comparisonBody')}
          </p>

          <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-700">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-primary-300 bg-primary-100 dark:border-primary-800 dark:bg-primary-900/40">
                  <th className="p-3 text-left text-sm font-semibold text-primary-900 dark:text-primary-200">
                    {t('timelineMethod.table.case')}
                  </th>
                  <th className="p-3 text-right text-sm font-semibold text-primary-900 dark:text-primary-200">
                    {t('timelineMethod.table.actual')}
                  </th>
                  <th className="p-3 text-right text-sm font-semibold text-primary-900 dark:text-primary-200">
                    {t('timelineMethod.table.fixed')}
                  </th>
                  <th className="p-3 text-right text-sm font-semibold text-primary-900 dark:text-primary-200">
                    {t('timelineMethod.table.ours')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-850">
                {COMPARISON_ROWS.map(row => (
                  <tr
                    key={row.start}
                    className="border-b border-primary-100 transition-colors last:border-b-0 hover:bg-primary-50 dark:border-neutral-700 dark:hover:bg-primary-900/25"
                  >
                    <td className="p-3 text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {row.start}
                      <span className="font-normal text-neutral-500 dark:text-neutral-400">
                        {' '}
                        {row.from}&nbsp;→&nbsp;{row.to}&nbsp;%
                      </span>
                    </td>
                    <td className="p-3 text-right text-sm font-medium tabular-nums text-neutral-800 dark:text-neutral-200">
                      {row.actual}
                    </td>
                    {/* Enda kolumnen som avviker från verkligheten — och den
                        avviker alltid nedåt. Amber, samma färg som appen
                        annars använder för "viktigt att veta". */}
                    <td className="p-3 text-right text-sm tabular-nums text-amber-700 dark:text-amber-300">
                      {row.fixed}
                    </td>
                    <td className="p-3 text-right text-sm font-semibold tabular-nums text-primary-700 dark:text-primary-300">
                      {row.ours}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs italic leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t('timelineMethod.tableNote')}
          </p>
        </div>

        {/* Vad beräkningen INTE kan. Utan detta låter den mer exakt än den
            är — och en tidsuppskattning som låter exakt är just det som gör
            att folk tappar förtroendet när verkligheten avviker. */}
        <div>
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-800 dark:text-amber-300">
            <span className="text-xl">⚠</span>
            {t('timelineMethod.limitsTitle')}
          </h3>
          <ul className="space-y-2">
            {(['limitsPoint1', 'limitsPoint2', 'limitsPoint3'] as const).map(key => (
              <li key={key} className="flex gap-3">
                <span className="mt-1 font-bold text-amber-600 dark:text-amber-300">•</span>
                <span className="flex-1 text-neutral-700 dark:text-neutral-200">
                  {t(`timelineMethod.${key}`)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Källkort i exakt samma form som BMRFormulaModal och PALSystemModal. */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            {t('timelineMethod.sourcesTitle')}
          </h3>
          <div className="space-y-3">
            {REFERENCES.map(ref => (
              <div
                key={ref.noteKey}
                className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400"
              >
                <p className="leading-relaxed">{ref.citation}</p>
                <p className="mt-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-500">
                  {t(`timelineMethod.${ref.noteKey}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </InfoModal>
  )
}
