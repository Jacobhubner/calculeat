/**
 * BMR vs RMR Information Content
 */

export default function BMRvsRMRContent() {
  return (
    <div className="space-y-6">
      {/* Vad är BMR & RMR */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Vad är BMR och RMR?</h3>
        <p>
          <strong>BMR och RMR</strong> beskriver kroppens energiförbrukning i vila – alltså hur
          mycket energi din kropp förbränner när du inte rör dig alls.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
          <p className="font-medium text-center text-neutral-900">
            BMR &amp; RMR = Energiförbrukning i vila
          </p>
        </div>
      </section>

      {/* BMR */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">BMR – Basal Metabolic Rate</h3>
        <p>
          <strong>BMR</strong> är energiförbrukningen i <em>absolut vila</em>. Det är kroppens
          &ldquo;lägsta möjliga&rdquo; energibehov för att hålla dig vid liv.
        </p>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-3 space-y-2">
          <p className="font-medium text-neutral-800">BMR inkluderar:</p>
          <ul className="list-disc list-inside space-y-1 text-sm text-neutral-700">
            <li>Andning och syrgastransport</li>
            <li>Blodcirkulation</li>
            <li>Temperaturreglering</li>
            <li>Organens arbete</li>
            <li>Cellernas grundläggande processer</li>
          </ul>
        </div>
      </section>

      {/* RMR */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          RMR – Resting Metabolic Rate
        </h3>
        <p>
          <strong>RMR</strong> är energiförbrukningen i <em>realistisk vila</em>. Du är vaken,
          avslappnad och stilla – men kroppen behöver ändå energi för att hålla hållning, temperatur
          och basal muskelspänning.
        </p>
        <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mt-3">
          <p className="font-medium text-center text-neutral-900">
            RMR är vanligtvis 5–10% högre än BMR
          </p>
        </div>
        <p className="mt-3 text-neutral-900">RMR används oftast inom:</p>
        <ul className="list-disc list-inside mt-2 space-y-1 text-sm text-neutral-700">
          <li>Forskning</li>
          <li>Klinisk vardag</li>
          <li>Kost- och träningsappar</li>
          <li>Online-kalkylatorer</li>
        </ul>
      </section>

      {/* Ekvationer */}
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Vilka ekvationer räknar ut vad?
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="font-medium text-blue-900 mb-2">Formler som beräknar RMR</p>
            <ul className="list-disc list-inside text-sm space-y-1 text-neutral-700">
              <li>Mifflin–St Jeor</li>
              <li>Cunningham</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-medium text-neutral-900 mb-2">Formler som beräknar BMR</p>
            <ul className="list-disc list-inside text-sm space-y-1 text-neutral-700">
              <li>Harris–Benedict (original &amp; reviderad)</li>
              <li>Schofield</li>
              <li>Henry (Oxford)</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}
