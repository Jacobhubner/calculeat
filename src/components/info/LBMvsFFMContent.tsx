/**
 * LBM vs FFM Information Content
 */

export default function LBMvsFFMContent() {
  return (
    <div className="space-y-4">
      {/* Beskrivning */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Skillnad på LBM och FFM</h3>
        <p>
          <strong>LBM</strong> och <strong>FFM</strong> beskriver kroppens “icke-fettmassa”, men de
          är inte identiska.
        </p>
      </section>

      {/* LBM */}
      <section>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="font-medium text-green-900 mb-2">LBM – Lean Body Mass</p>
          <p className="text-sm text-neutral-700">
            Består av allt i kroppen förutom lagrat kroppsfett, men inkluderar:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-neutral-700">
            <li>Essentiellt fett i organ</li>
            <li>Fett i hjärnan</li>
            <li>Fett i cellmembran</li>
          </ul>
        </div>
      </section>

      {/* FFM */}
      <section>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="font-medium text-blue-900 mb-2">FFM – Fat Free Mass</p>
          <p className="text-sm text-neutral-700">Helt fettfri vävnad, vilket innebär:</p>
          <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-neutral-700">
            <li>Muskler</li>
            <li>Organ</li>
            <li>Vatten</li>
            <li>Skelett</li>
          </ul>
        </div>
      </section>

      {/* Skillnaden */}
      <section>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="font-medium text-yellow-900 mb-2">Skillnaden</p>
          <ul className="text-sm space-y-1 text-neutral-700">
            <li>✓ LBM innehåller lite nödvändigt fett</li>
            <li>✓ FFM är helt fettfritt</li>
            <li>
              ✓ Skillnaden är ca <strong>3–5%</strong>
            </li>
          </ul>
        </div>
      </section>

      {/* Praktisk användning */}
      <section>
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
          <p className="text-sm text-neutral-700">
            👉 De flesta metoder (<strong>DEXA</strong>, kaliper, bioimpedans) uppskattar{' '}
            <strong>FFM</strong>, inte LBM. <br />
            👉 Därför använder många formler – t.ex. <strong>Cunningham</strong> – FFM.
          </p>
        </div>
      </section>
    </div>
  )
}
