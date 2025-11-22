/**
 * TDEE Information Content
 */

export default function TDEEContent() {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Vad är TDEE?</h3>
        <p>
          <strong>TDEE (Total Daily Energy Expenditure)</strong> är ditt totala dagliga energibehov
          – summan av all energi kroppen förbrukar under en dag.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
          <p className="font-medium text-center text-lg">TDEE = RMR × PAL</p>
        </div>
        <p className="mt-3">
          TDEE är det centrala värdet för viktkontroll och används för att planera energiintag
          beroende på mål (viktminskning, viktstabilitet eller viktökning).
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Komponenter av TDEE</h3>
        <p className="mb-3">TDEE består av flera olika komponenter:</p>

        <div className="space-y-3">
          <div className="bg-neutral-50 border-l-4 border-primary-500 p-4">
            <p className="font-medium text-neutral-900">1. REE (RMR / BMR) (största komponenten)</p>
            <p className="text-sm text-neutral-600 mt-1">
              <strong>Resting Energy Expenditure</strong> – energiförbrukning i vila. Vanligtvis
              60–75 % av TDEE hos vuxna, men andelen minskar vid hög fysisk aktivitet.
            </p>
          </div>

          <div className="bg-neutral-50 border-l-4 border-orange-500 p-4">
            <p className="font-medium text-neutral-900">2. NEAT (mest variabel)</p>
            <p className="text-sm text-neutral-600 mt-1">
              <strong>Non-Exercise Activity Thermogenesis</strong> – vardagsrörelse som inte är
              träning (gå, stå, städa). Kan stå för 10–50 % av TDEE beroende på livsstil och yrke.
            </p>
          </div>

          <div className="bg-neutral-50 border-l-4 border-success-500 p-4">
            <p className="font-medium text-neutral-900">3. EAT (träning)</p>
            <p className="text-sm text-neutral-600 mt-1">
              <strong>Exercise Activity Thermogenesis</strong> – energi från planerad träning. Låg
              (&lt;5 %) hos stillasittande men kan utgöra 15–30 % eller mer hos elitidrottare.
            </p>
          </div>

          <div className="bg-neutral-50 border-l-4 border-accent-500 p-4">
            <p className="font-medium text-neutral-900">4. TEF (matens termiska effekt)</p>
            <p className="text-sm text-neutral-600 mt-1">
              <strong>Thermic Effect of Food</strong> – energi som krävs för att smälta och lagra
              mat. Relativt konstant (8–12 %), men påverkas av kostens sammansättning.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Hur använder man TDEE?</h3>
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-medium text-green-900">⚖️ Bibehålla vikt</p>
            <p className="text-sm text-neutral-700 mt-1">
              Ät ungefär lika mycket som din TDEE. Det är definitionen av energibalans: energi in =
              energi ut.
            </p>
            <p className="text-sm text-neutral-600 mt-1">
              Små dagliga variationer är normala, men över tid bör intaget matcha TDEE för
              viktstabilitet.
            </p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="font-medium text-orange-900">🔻 Viktminskning (cutting)</p>
            <p className="text-sm text-neutral-700 mt-1">
              Ät <strong>mindre</strong> än din TDEE. Rekommenderat underskott: 10–25 %.
            </p>
            <ul className="text-sm text-neutral-600 mt-2 space-y-1 list-disc list-inside">
              <li>10–15 %: Långsam, hållbar viktminskning (~0.25–0.5 kg/vecka)</li>
              <li>20–25 %: Måttlig viktminskning (~0.5–1 kg/vecka)</li>
              <li>25–30 %: Snabb viktminskning (&gt;1 kg/vecka) – endast kortvarigt</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-blue-900">🔺 Viktökning (bulking)</p>
            <p className="text-sm text-neutral-700 mt-1">
              Ät <strong>mer</strong> än din TDEE. Rekommenderat överskott: 5–15 %.
            </p>
            <ul className="text-sm text-neutral-600 mt-2 space-y-1 list-disc list-inside">
              <li>5–10 %: Lean bulk – långsam viktökning (~0.25–0.5 kg/vecka)</li>
              <li>10–15 %: Måttlig bulk – snabbare muskelökning (~0.5–0.75 kg/vecka)</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Tips för TDEE</h3>
        <ul className="list-disc list-inside space-y-2 text-neutral-700">
          <li>
            <strong>TDEE är en uppskattning</strong> – börja med beräknat värde och justera baserat
            på resultat
          </li>
          <li>
            <strong>Var konsekvent</strong> – följ ditt kaloriintag i minst 2–4 veckor innan du
            justerar
          </li>
          <li>
            <strong>Vikten fluktuerar</strong> – fokusera på trender över veckor, inte dagliga
            variationer
          </li>
          <li>
            <strong>Justera vid behov</strong> – om du inte ser resultat på 3–4 veckor, justera
            kaloriintaget med 100–200 kcal
          </li>
        </ul>
      </section>
    </div>
  )
}
