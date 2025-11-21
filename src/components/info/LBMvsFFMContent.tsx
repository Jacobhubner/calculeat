/**
 * LBM vs FFM Information Content
 */

export default function LBMvsFFMContent() {
  return (
    <div className="space-y-4">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Vad är FFM?</h3>
        <p>
          <strong>FFM (Fat-Free Mass)</strong> är den totala vikten av allt i din kropp förutom
          fett. FFM inkluderar:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Skelettmuskler</li>
          <li>Skelett och ben</li>
          <li>Vatten och kroppsvätskor</li>
          <li>Organ (hjärta, lever, njurar, etc.)</li>
          <li>Hud och bindväv</li>
        </ul>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
          <p className="font-medium text-center">FFM = Kroppsvikt - Kroppsfett</p>
          <p className="text-sm text-center mt-1 text-neutral-600">
            Om du väger 80 kg med 15% kroppsfett: FFM = 80 - (80 × 0.15) = 68 kg
          </p>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Vad är LBM?</h3>
        <p>
          <strong>LBM (Lean Body Mass)</strong> är nästan samma som FFM, men exkluderar{' '}
          <strong>essentiellt fett</strong>.
        </p>
        <p className="mt-2">
          <strong>Essentiellt fett</strong> är det minsta fett kroppen behöver för att fungera:
        </p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Fett i benmärg</li>
          <li>Fett runt organ (för skydd)</li>
          <li>Fett i nervsystemet</li>
          <li>Reproduktivt fett (särskilt för kvinnor)</li>
        </ul>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3">
          <p className="font-medium">Essentiellt fett:</p>
          <ul className="text-sm mt-1 space-y-1">
            <li>• Män: ~3-5% av kroppsvikten</li>
            <li>• Kvinnor: ~8-12% av kroppsvikten</li>
          </ul>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Skillnaden mellan LBM och FFM
        </h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="font-medium text-yellow-900 mb-2">LBM vs FFM</p>
          <p className="text-sm text-neutral-700">
            FFM inkluderar <strong>allt</strong> som inte är fett, medan LBM exkluderar essentiellt
            fett. I praktiken är skillnaden cirka <strong>3-5%</strong> för män och{' '}
            <strong>8-12%</strong> för kvinnor.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-blue-900 mb-2">FFM (Fat-Free Mass)</p>
            <ul className="text-sm space-y-1 text-neutral-700">
              <li>✓ Allt förutom kroppsfett</li>
              <li>✓ Inkluderar essentiellt fett</li>
              <li>✓ Enklare att beräkna</li>
              <li>✓ Mest använd i forskning</li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-medium text-green-900 mb-2">LBM (Lean Body Mass)</p>
            <ul className="text-sm space-y-1 text-neutral-700">
              <li>✓ Allt förutom icke-essentiellt fett</li>
              <li>✓ Exkluderar essentiellt fett</li>
              <li>✓ Något lägre än FFM</li>
              <li>✓ Används i vissa BMR-formler</li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Exempel på beräkning</h3>
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 space-y-3">
          <div>
            <p className="font-medium text-neutral-900">Man: 80 kg, 15% kroppsfett</p>
            <ul className="text-sm mt-2 space-y-1 text-neutral-700">
              <li>
                • <strong>Kroppsfett:</strong> 80 × 0.15 = 12 kg
              </li>
              <li>
                • <strong>FFM:</strong> 80 - 12 = 68 kg
              </li>
              <li>
                • <strong>Essentiellt fett (4%):</strong> 80 × 0.04 = 3.2 kg
              </li>
              <li>
                • <strong>LBM:</strong> 68 - 3.2 = 64.8 kg
              </li>
            </ul>
          </div>

          <div className="border-t border-neutral-300 pt-3">
            <p className="font-medium text-neutral-900">Kvinna: 65 kg, 25% kroppsfett</p>
            <ul className="text-sm mt-2 space-y-1 text-neutral-700">
              <li>
                • <strong>Kroppsfett:</strong> 65 × 0.25 = 16.25 kg
              </li>
              <li>
                • <strong>FFM:</strong> 65 - 16.25 = 48.75 kg
              </li>
              <li>
                • <strong>Essentiellt fett (10%):</strong> 65 × 0.10 = 6.5 kg
              </li>
              <li>
                • <strong>LBM:</strong> 48.75 - 6.5 = 42.25 kg
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Varför är det viktigt?</h3>
        <ul className="list-disc list-inside space-y-2 text-neutral-700">
          <li>
            <strong>Proteinbehov:</strong> Vissa rekommendationer baseras på FFM/LBM istället för
            total kroppsvikt (t.ex. 2.3 g protein/kg FFM under cutting)
          </li>
          <li>
            <strong>BMR-beräkningar:</strong> Katch-McArdle och Cunningham använder FFM/LBM för mer
            exakta beräkningar
          </li>
          <li>
            <strong>Progress tracking:</strong> Följa FFM/LBM hjälper dig se om du bygger muskler
            eller tappar muskelmassa under viktändring
          </li>
          <li>
            <strong>Kroppskomposition:</strong> Ger en bättre bild av din hälsa än bara kroppsvikt
          </li>
        </ul>
      </section>

      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">I praktiken</h3>
        <p>
          De flesta kalkylatorer (inklusive denna) använder termerna <strong>FFM</strong> och{' '}
          <strong>LBM</strong> synonymt, eftersom skillnaden är så liten (3-12%). För praktiska
          ändamål kan du använda dem utbytbart.
        </p>
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mt-3">
          <p className="text-sm font-medium text-primary-900">
            💡 Tips: När du ser &ldquo;lean mass&rdquo; eller &ldquo;fettfri massa&rdquo; i denna
            app, refererar vi till FFM (Fat-Free Mass).
          </p>
        </div>
      </section>
    </div>
  )
}
