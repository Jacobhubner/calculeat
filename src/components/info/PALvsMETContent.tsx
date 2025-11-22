/**
 * PAL vs MET Information Content
 */

export default function PALvsMETContent() {
  return (
    <div className="space-y-4">
      {/* Intro */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Vad är PAL och MET?</h3>
        <p>
          <strong>PAL och MET</strong> används för att uppskatta energiförbrukning – men på olika
          sätt.
        </p>
      </section>

      {/* PAL */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          PAL – Physical Activity Level
        </h3>
        <p>
          <strong>PAL</strong> är en multiplikator som beskriver din totala energiförbrukning
          relativt ditt BMR/RMR över en hel dag.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
          <p className="font-medium text-center">TDEE = RMR × PAL</p>
        </div>
        <p className="mt-3">
          PAL-värden tar hänsyn till <strong>all aktivitet</strong> under en 24-timmarsperiod.
        </p>
      </section>

      {/* MET */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          MET – Metabolic Equivalent of Task
        </h3>
        <p>
          <strong>MET</strong> är ett mått på energiförbrukningen för en{' '}
          <strong>specifik aktivitet</strong> vid ett specifikt tillfälle.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
          <p className="font-medium">1 MET = energi i vila (≈ 1 kcal/kg/timme)</p>
        </div>
      </section>

      {/* Skillnaden */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">PAL vs MET – Skillnaden</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-blue-900 mb-2">PAL</p>
            <ul className="text-sm space-y-1 text-neutral-700">
              <li>✓ Helhetsbild över en hel dag</li>
              <li>✓ Används för att beräkna TDEE</li>
              <li>✓ Ett värde per dag (1.2–2.5)</li>
              <li>✓ Tar hänsyn till all aktivitet</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-medium text-green-900 mb-2">MET</p>
            <ul className="text-sm space-y-1 text-neutral-700">
              <li>✓ Specifik aktivitet vid en tidpunkt</li>
              <li>✓ Används för att beräkna kalorier för enskild aktivitet</li>
              <li>✓ Varierar per aktivitet (1–20+ MET)</li>
              <li>✓ Mäter intensitet av en aktivitet</li>
            </ul>
          </div>
        </div>
      </section>

      {/* När används vad */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">När används vad?</h3>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            Dagligt energibehov → <strong>RMR × PAL</strong>
          </li>
          <li>
            Träningspass → <strong>MET × vikt × tid</strong>
          </li>
        </ul>
      </section>

      {/* Rätt sätt att kombinera MET med PAL */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Rätt sätt att kombinera MET</h3>
        <p>
          MET beskriver aktivitetens intensitet. För att lägga till träning ovanpå din dagliga nivå
          använder du rätt formel beroende på om ditt <strong>PAL</strong> redan inkluderar träning
          eller ej.
        </p>
        <div className="space-y-3 mt-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-blue-900">PAL inkluderar träning</p>
            <p className="text-sm text-neutral-700 mt-1">RMR × PAL + RMR × (MET − 1) × tid</p>
            <p className="text-xs text-neutral-600 mt-2">
              MET − 1 lägger endast till den extra energin över vila, eftersom träningens “vilodel”
              redan ingår i PAL.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-medium text-green-900">PAL baseras på vardag (ingen träning)</p>
            <p className="text-sm text-neutral-700 mt-1">RMR × PAL + RMR × MET × tid</p>
            <p className="text-xs text-neutral-600 mt-2">
              Här läggs hela MET-kostnaden till, eftersom din PAL endast avser vardagsaktivitet utan
              träningspass.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
