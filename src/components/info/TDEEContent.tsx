/**
 * TDEE Information Content
 */

export default function TDEEContent() {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Vad är TDEE?</h3>
        <p>
          <strong>TDEE (Total Daily Energy Expenditure)</strong> är den totala mängd energi
          (kalorier) din kropp förbrukar under en hel dag, inklusive alla aktiviteter.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
          <p className="font-medium text-center text-lg">TDEE = BMR × PAL</p>
        </div>
        <p className="mt-3">
          TDEE är det viktigaste måttet för att planera din kalorikonsumtion baserat på ditt mål
          (viktminskning, viktstabilitet, eller viktökning).
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Komponenter av TDEE</h3>
        <p className="mb-3">TDEE består av flera olika komponenter:</p>

        <div className="space-y-3">
          <div className="bg-neutral-50 border-l-4 border-primary-500 p-4">
            <p className="font-medium text-neutral-900">1. BMR/RMR (60-75% av TDEE)</p>
            <p className="text-sm text-neutral-600 mt-1">
              <strong>Basal Metabolic Rate</strong> - Din energiförbrukning i vila. Detta är den
              största komponenten och inkluderar andning, blodcirkulation, cellulär metabolism.
            </p>
          </div>

          <div className="bg-neutral-50 border-l-4 border-accent-500 p-4">
            <p className="font-medium text-neutral-900">2. TEF (10% av TDEE)</p>
            <p className="text-sm text-neutral-600 mt-1">
              <strong>Thermic Effect of Food</strong> - Energi som krävs för att smälta, absorbera
              och lagra mat. Protein har högst TEF (~20-30%), fett lägst (~0-3%).
            </p>
          </div>

          <div className="bg-neutral-50 border-l-4 border-success-500 p-4">
            <p className="font-medium text-neutral-900">3. EAT (15-30% av TDEE)</p>
            <p className="text-sm text-neutral-600 mt-1">
              <strong>Exercise Activity Thermogenesis</strong> - Energi från planerad träning och
              idrott. Detta är det du aktivt kontrollerar genom att träna.
            </p>
          </div>

          <div className="bg-neutral-50 border-l-4 border-orange-500 p-4">
            <p className="font-medium text-neutral-900">4. NEAT (5-15% av TDEE)</p>
            <p className="text-sm text-neutral-600 mt-1">
              <strong>Non-Exercise Activity Thermogenesis</strong> - Energi från all aktivitet som
              INTE är träning: gå, stå, städa, fiol spela, etc. NEAT kan variera enormt mellan
              individer.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Hur använder jag TDEE?</h3>
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-medium text-green-900">Bibehålla vikt</p>
            <p className="text-sm text-neutral-700 mt-1">Ät ungefär lika mycket som din TDEE</p>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="font-medium text-orange-900">Minska vikt (cutting)</p>
            <p className="text-sm text-neutral-700 mt-1">
              Ät <strong>mindre</strong> än din TDEE (10-25% underskott är vanligt)
            </p>
            <ul className="text-sm text-neutral-600 mt-2 space-y-1 list-disc list-inside">
              <li>10-15%: Långsam viktminskning (~0.25-0.5 kg/vecka)</li>
              <li>20-25%: Måttlig viktminskning (~0.5-1 kg/vecka)</li>
              <li>25-30%: Snabb viktminskning (~1+ kg/vecka) - endast kortvarigt</li>
            </ul>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-blue-900">Öka vikt (bulking)</p>
            <p className="text-sm text-neutral-700 mt-1">
              Ät <strong>mer</strong> än din TDEE (5-15% överskott är vanligt)
            </p>
            <ul className="text-sm text-neutral-600 mt-2 space-y-1 list-disc list-inside">
              <li>5-10%: Lean bulk - minimalt fettupplägg</li>
              <li>10-15%: Måttlig bulk - snabbare muskelökning</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Tips för TDEE</h3>
        <ul className="list-disc list-inside space-y-2 text-neutral-700">
          <li>
            <strong>TDEE är en uppskattning</strong> - börja med beräknat värde och justera baserat
            på resultat
          </li>
          <li>
            <strong>Var konsekvent</strong> - följ ditt kaloriintag i minst 2-4 veckor innan du
            justerar
          </li>
          <li>
            <strong>Vikten fluktuerar</strong> - fokusera på trender över veckor, inte dagliga
            variationer
          </li>
          <li>
            <strong>Justera vid behov</strong> - om du inte ser resultat på 3-4 veckor, justera
            kaloriintaget med 100-200 kcal
          </li>
        </ul>
      </section>
    </div>
  )
}
