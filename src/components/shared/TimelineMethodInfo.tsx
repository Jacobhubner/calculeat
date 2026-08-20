/**
 * Förklarar hur tidsberäkningen fungerar och vilka källor den vilar på.
 *
 * VARFÖR DEN FINNS: appen ger ett längre svar än de flesta kalkylatorer på
 * nätet för samma indata. Utan förklaring ser det ut som ett fel — särskilt
 * för den som dubbelkollar mot en annan kalkylator och får färre veckor där.
 * Skillnaden är avsiktlig och har stöd i litteraturen, och då ska den gå att
 * granska.
 *
 * FÖRKLARINGEN ÄR ALDRIG PREMIUM (beslut 2026-08-19, efter att ett lås över
 * hela modalen prövats och ångrats): varför beräkningen ser ut som den gör,
 * vad den inte kan, och vilka källor den vilar på är en metod- och
 * källredovisning, inte en funktion. Synlighetsprincipen i PREMIUM_SPEC.md
 * säger att informationen aldrig är premium.
 *
 * DE EXAKTA EKVATIONERNA ÄR DET (2026-08-20): samma gräns som appen redan
 * drar för BMR-formler, PAL-system och kroppskompositionsmetoder — själva
 * formeln är produkten, förklaringen av den är inte det. EquationGate
 * renderar dem inte alls för gratis, så de ligger inte läsbara i DOM:en.
 *
 * FÖLJER BMRFormulaModal: samma rubriknivåer (text-lg font-semibold
 * text-neutral-800 + mb-3), samma punktlistor med färgad markör i flex,
 * samma källkort (bg-neutral-50 med ram) och samma Vancouver-format på
 * referenserna. Modalen ska kännas igen av den som redan läst en
 * formelbeskrivning i kalkylatorn.
 *
 * ANVÄNDS BARA AV MÅLSÄTTNING (GoalCalculatorTool). Docblocket sa tidigare
 * "delad mellan Målsättning och perioder" — det var sant en kort period,
 * men länken i periodräknaren togs bort 2026-08-19 eftersom modalen handlar
 * om tidslinjen, som bara visas i Målsättning.
 *
 * Periodräknaren har en egen, kortare källista med ANDRA källor: Helms och
 * Roberts, som handlar om vilken TAKT som bevarar muskler. Den här modalen
 * handlar om Hall & Chow, alltså varför takten avtar över tid. Två frågor,
 * två underlag — de ska inte slås ihop.
 */

import { useTranslation } from 'react-i18next'
import { InfoModal } from '@/components/ui/InfoModal'
import { EquationGate } from '@/components/premium/EquationGate'

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

/**
 * Ekvationerna som visas i modalen, exakt de som körs i koden:
 *   contestPrep.ts:372 och :470, goalCalculations.ts:151 och :153.
 *
 * Skrivna för läsning, inte för att köras — men varje rad ska gå att
 * jämföra med sin motsvarighet i beräkningsfilerna utan tolkning.
 */
const EQUATIONS = [
  {
    labelKey: 'eqCoreLabel',
    noteKey: 'eqCoreNote',
    lines: [
      'vikt(v) = startvikt × (1 − r)^v',
      '',
      '        ln(målvikt / startvikt)',
      'v  =  ─────────────────────────',
      '            ln(1 − r)',
    ],
  },
  {
    labelKey: 'eqDeltaLabel',
    noteKey: 'eqDeltaNote',
    lines: [
      'kcal/dag   =  TDEE − TDEE × faktor',
      '',
      '              kcal/dag × 7',
      'kg/vecka   =  ─────────────',
      '                  7700',
    ],
  },
  {
    labelKey: 'eqRateLabel',
    noteKey: 'eqRateNote',
    lines: ['r  =  |kg/vecka| / startvikt'],
  },
  {
    labelKey: 'eqTargetLabel',
    noteKey: 'eqTargetNote',
    lines: [
      'fettfri massa  =  vikt × (1 − fett% / 100)',
      'målvikt        =  fettfri massa / (1 − målfett% / 100)',
    ],
  },
  {
    labelKey: 'eqRangeLabel',
    noteKey: 'eqRangeNote',
    lines: [
      '            t × vikt − fettmassa',
      'förlust  =  ────────────────────────',
      '                 t − 1 + f',
      '',
      'slutvikt =  vikt − förlust',
    ],
  },
  {
    labelKey: 'eqGainLabel',
    noteKey: 'eqGainNote',
    lines: ['v  =  |viktförändring| / (kg per vecka)'],
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
                    {/* "20 → 8 %" är kroppsfett, men det stod ingenstans. */}
                    <span className="block text-xs font-normal text-primary-700/80 dark:text-primary-300/80">
                      {t('timelineMethod.table.caseUnit')}
                    </span>
                  </th>
                  {/* Enheten stod tidigare bara i fotnoten, alltså EFTER
                      talen. Den som läser tabellen uppifrån mötte tre
                      kolumner med siffror utan att veta vad de mätte. */}
                  {(['actual', 'fixed', 'ours'] as const).map(col => (
                    <th
                      key={col}
                      className="p-3 text-right text-sm font-semibold text-primary-900 dark:text-primary-200"
                    >
                      {t(`timelineMethod.table.${col}`)}
                      <span className="block text-xs font-normal text-primary-700/80 dark:text-primary-300/80">
                        {t('timelineMethod.table.weeksUnit')}
                      </span>
                    </th>
                  ))}
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

        {/* Tabellen och båda källorna handlar om NEDGÅNG. Utan det här
            avsnittet tror den som planerar en uppgång att beläggen gäller
            hens fall. Blå upplysningsplatta, samma mönster som
            MethodInfoModal använder för neutral information. */}
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/25">
          <h3 className="mb-1 text-sm font-semibold text-blue-900 dark:text-blue-300">
            {t('timelineMethod.gainTitle')}
          </h3>
          <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-300">
            {t('timelineMethod.gainBody')}
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

        {/* Ekvationerna. EquationGate, inte PremiumGate: exakta formler är
            själva värdet och renderas inte alls för gratis — de får inte
            ligga läsbara i DOM:en bakom en oskärpa. Samma nyckel och samma
            komponent som BMR-formlerna och kroppskompositionsmetoderna
            använder. */}
        <div>
          <h3 className="mb-3 text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            {t('timelineMethod.equationsTitle')}
          </h3>
          <p className="mb-3 leading-relaxed text-neutral-700 dark:text-neutral-200">
            {t('timelineMethod.equationsIntro')}
          </p>
          <EquationGate feature="all_tdee_formulas">
            <div className="space-y-4">
              {EQUATIONS.map(eq => (
                <div key={eq.labelKey}>
                  <p className="mb-1 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                    {t(`timelineMethod.${eq.labelKey}`)}
                  </p>
                  {/* overflow-x-auto: ekvationerna är breda och får inte
                      tvinga hela modalen i sidled på mobil. */}
                  <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900">
                    <pre className="whitespace-pre font-mono text-xs leading-relaxed text-neutral-800 dark:text-neutral-200">
                      {eq.lines.join('\n')}
                    </pre>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                    {t(`timelineMethod.${eq.noteKey}`)}
                  </p>
                </div>
              ))}
            </div>
          </EquationGate>
        </div>

        {/* Källkort i exakt samma form som BMRFormulaModal och PALSystemModal. */}
        <div>
          <h3 className="mb-1 text-lg font-semibold text-neutral-800 dark:text-neutral-200">
            {t('timelineMethod.sourcesTitle')}
          </h3>
          {/* Båda källorna handlar om viktnedgång — Hall & Chow 2013 nämner
              inte uppgång alls (kontrollerat i fulltext). Det ska stå, inte
              underförstås. */}
          <p className="mb-3 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
            {t('timelineMethod.gainNote')}
          </p>
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
