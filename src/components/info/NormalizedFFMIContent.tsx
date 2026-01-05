export default function NormalizedFFMIContent() {
  return (
    <div className="space-y-6 text-neutral-700">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-3">Vad är Normaliserad FFMI?</h3>
        <p>
          <strong>Normaliserad FFMI</strong> är en justering av det vanliga FFMI-värdet för att
          kompensera för skillnader i kroppslängd. Längre personer har naturligt högre FFMI-värden,
          så normaliseringen gör det möjligt att jämföra muskelmassa mer rättvist mellan personer
          med olika längd.
        </p>
      </section>

      <section className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">Hur beräknas Normaliserad FFMI?</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="bg-neutral-50 border border-blue-200 rounded-lg p-3">
            <code className="text-sm">Normaliserad FFMI = FFMI + 6.1 × (1.8 - Längd (m))</code>
          </div>
          <p>Formeln normaliserar alla värden till en referenslängd på 1.8 meter (180 cm).</p>
        </div>
      </section>

      <section>
        <h4 className="font-semibold text-neutral-900 mb-2">Varför normaliseras FFMI?</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>
              <strong>Längre personer</strong> har naturligt högre FFMI-värden på grund av ökad
              muskelmassa i relation till kroppslängd
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>
              <strong>Kortare personer</strong> har naturligt lägre FFMI-värden
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-600">•</span>
            <span>
              Normaliseringen ger en <strong>rättvisare jämförelse</strong> mellan individer
            </span>
          </li>
        </ul>
      </section>

      <section>
        <h4 className="font-semibold text-neutral-900 mb-2">Praktisk tillämpning</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-green-600">•</span>
            <span>Jämföra muskelmassa oberoende av kroppslängd</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600">•</span>
            <span>Bedöma om muskelmassa är inom naturliga gränser</span>
          </li>
          <li className="flex gap-2">
            <span className="text-green-600">•</span>
            <span>Sätta realistiska mål för muskeluppbyggnad</span>
          </li>
        </ul>
      </section>

      <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h4 className="font-semibold text-amber-900 mb-2">⚠ Viktigt att veta</h4>
        <p className="text-sm text-amber-800">
          Precis som FFMI påverkas normaliserad FFMI av noggrannheten i kroppsfettmätningen. En
          felaktig mätning ger felaktiga värden.
        </p>
      </section>
    </div>
  )
}
