/**
 * BMR vs RMR Information Content
 */

export default function BMRvsRMRContent() {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Vad är BMR?</h3>
        <p>
          <strong>BMR (Basal Metabolic Rate)</strong> är den energi din kropp behöver för att
          upprätthålla grundläggande livsfunktioner i fullständig vila. Detta inkluderar:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Andning och syrgastransport</li>
          <li>Cellulär metabolism</li>
          <li>Blodcirkulation</li>
          <li>Proteinsyntes</li>
          <li>Temperaturreglering</li>
        </ul>
        <p className="mt-2">
          BMR mäts under strikta laboratorieförhållanden: personen är fastande, i fullständig vila,
          i en neutral temperatur, och i liggande position.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Vad är RMR?</h3>
        <p>
          <strong>RMR (Resting Metabolic Rate)</strong> är energiförbrukningen under mer avslappnade
          förhållanden. RMR mäts i vila men kräver inte lika strikta förutsättningar som BMR.
        </p>
        <p className="mt-2">
          RMR är vanligtvis <strong>cirka 10% högre än BMR</strong> eftersom det inkluderar mindre
          aktiviteter som att sitta upp, liten rörelse, och normal matsmältning.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Skillnaden i praktiken</h3>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <p className="font-medium">RMR ≈ BMR × 1.10</p>
          <p className="text-sm">Om din BMR är 1500 kcal, är din RMR cirka 1650 kcal per dag.</p>
        </div>
        <p className="mt-3">
          De flesta kalkylatorer (inklusive denna) beräknar <strong>BMR</strong>, men i praktiken är
          det närmare din <strong>RMR</strong> du upplever i vardagen.
        </p>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Vanliga BMR-formler</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>
            <strong>Harris-Benedict:</strong> Klassisk formel från 1919, reviderad 1984
          </li>
          <li>
            <strong>Mifflin-St Jeor:</strong> Modern formel (1990), mer noggrann för dagens
            befolkning
          </li>
          <li>
            <strong>Katch-McArdle:</strong> Tar hänsyn till kroppsfett%, bäst för atleter
          </li>
          <li>
            <strong>Cunningham:</strong> Lik Katch-McArdle, specifik för aktiva individer
          </li>
        </ul>
      </section>
    </div>
  )
}
