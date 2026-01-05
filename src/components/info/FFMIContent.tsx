export default function FFMIContent() {
  return (
    <div className="space-y-6 text-neutral-700">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-3">Vad är FFMI?</h3>
        <p>
          <strong>Fat Free Mass Index (FFMI)</strong> är ett mått som beskriver mängden fettfri
          massa (muskler, skelett, organ) i relation till din längd. Det ger en mer rättvis bild av
          muskelmassa än enbart vikt, eftersom det tar hänsyn till kroppslängd.
        </p>
      </section>

      <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Hur beräknas FFMI?</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="bg-neutral-50 border border-blue-200 rounded-lg p-3">
            <code className="text-sm">FFMI = Fettfri massa (kg) / (Längd (m))²</code>
          </div>
          <p>
            Fettfri massa beräknas som: <code>Totalvikt × (1 - Kroppsfett% / 100)</code>
          </p>
        </div>
      </section>

      <section>
        <h4 className="font-semibold text-neutral-900 mb-2">Praktisk tillämpning</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-green-600">•</span>
            <span>Spåra muskeluppbyggnad oberoende av kroppsfett</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600">•</span>
            <span>Jämföra muskelmassa mellan personer med olika längd</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600">•</span>
            <span>Bedöma genetisk muskelpotential</span>
          </li>
        </ul>
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2">⚠ Viktigt att veta</h4>
        <p className="text-sm text-amber-800">
          FFMI påverkas av kroppsfetthaltsmätningens noggrannhet. En felaktig kroppsfettmätning ger
          felaktigt FFMI-värde.
        </p>
      </section>
    </div>
  )
}
