/**
 * PAL vs MET Information Content
 */

export default function PALvsMETContent() {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Vad är PAL?</h3>
        <p>
          <strong>PAL (Physical Activity Level)</strong> är en multiplikator som beskriver din
          totala energiförbrukning relativt din BMR över en hel dag.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
          <p className="font-medium text-center">TDEE = BMR × PAL</p>
        </div>
        <p className="mt-3">
          PAL-värden tar hänsyn till <strong>all aktivitet</strong> under en 24-timmarsperiod,
          inklusive:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Arbetsaktivitet (kontorsjobb vs fysiskt arbete)</li>
          <li>Träning och idrott</li>
          <li>Vardagsaktiviteter (städning, promenader)</li>
          <li>Sömn och vila</li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Typiska PAL-värden</h3>
        <div className="space-y-2">
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
            <p className="font-medium">1.2-1.4: Stillasittande</p>
            <p className="text-sm text-neutral-600">Kontorsjobb, minimal rörelse</p>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
            <p className="font-medium">1.5-1.6: Lätt aktiv</p>
            <p className="text-sm text-neutral-600">Kontorsjobb + lätt träning 1-3 dagar/vecka</p>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
            <p className="font-medium">1.7-1.8: Måttligt aktiv</p>
            <p className="text-sm text-neutral-600">Träning 3-5 dagar/vecka</p>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
            <p className="font-medium">1.9-2.2: Mycket aktiv</p>
            <p className="text-sm text-neutral-600">Intensiv träning 6-7 dagar/vecka</p>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-3">
            <p className="font-medium">2.3+: Extremt aktiv</p>
            <p className="text-sm text-neutral-600">Proffsidrottare, fysiskt krävande arbete</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Vad är MET?</h3>
        <p>
          <strong>MET (Metabolic Equivalent of Task)</strong> är ett mått på energiförbrukningen för
          en <strong>specifik aktivitet</strong> vid ett specifikt tillfälle.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
          <p className="font-medium">1 MET = energi i vila (≈ 1 kcal/kg/timme)</p>
        </div>
        <p className="mt-3">Exempel på MET-värden för olika aktiviteter:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>
            <strong>1 MET:</strong> Sittande, vila
          </li>
          <li>
            <strong>3-4 MET:</strong> Promenad i normalt tempo
          </li>
          <li>
            <strong>6-8 MET:</strong> Jogging, cykling
          </li>
          <li>
            <strong>10+ MET:</strong> Löpning, intensiv styrketräning
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">PAL vs MET - Skillnaden</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-blue-900 mb-2">PAL</p>
            <ul className="text-sm space-y-1 text-neutral-700">
              <li>✓ Helhetsbild över en hel dag</li>
              <li>✓ Används för att beräkna TDEE</li>
              <li>✓ Ett värde per dag (1.2-2.5)</li>
              <li>✓ Tar hänsyn till all aktivitet</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-medium text-green-900 mb-2">MET</p>
            <ul className="text-sm space-y-1 text-neutral-700">
              <li>✓ Specifik aktivitet vid en tidpunkt</li>
              <li>✓ Används för att beräkna kalorier för enskild aktivitet</li>
              <li>✓ Varierar per aktivitet (1-20+ MET)</li>
              <li>✓ Mäter intensitet av en aktivitet</li>
            </ul>
          </div>
        </div>
        <p className="mt-3">
          <strong>Sammanfattning:</strong> PAL beskriver din genomsnittliga aktivitetsnivå över en
          dag, medan MET beskriver intensiteten av en specifik aktivitet.
        </p>
      </section>
    </div>
  )
}
