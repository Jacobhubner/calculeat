export default function MaxFatMetabolismContent() {
  return (
    <div className="space-y-6 text-neutral-700">
      <section>
        <h3 className="text-lg font-semibold text-neutral-900 mb-3">Vetenskaplig grund</h3>
        <p className="mb-4">
          Alpert (2005) kom fram till att fettvävnad kan leverera energi till fettfri massa upp till
          cirka 290 kJ/kg fett/dag (≈ 69 kcal/kg/dag) i verkliga experiment, och att det teoretiska
          maximala flödet är 358 kJ/kg fett/dag (≈ 86 kcal/kg/dag) om all FFM skyddas. Detta värde
          representerar alltså det maximala energiflödet från fettväv, och inte direkt fettförlust.
        </p>
        <p className="mb-4">
          I praktiska tränings- och dietkalkyler vill vissa källor omvandla Alperts värde till ett
          dagligt &ldquo;säkerhetsunderskott&rdquo; för fettförlust. För detta används ofta en
          konservativ andel av 69 kcal/kg/dag, omkring 40–45 %, för att kompensera för att kroppen
          inte kan utnyttja all energi direkt på grund av basal metabolism, termisk effekt av mat
          och ineffektiviteter i oxidation. Det ger ungefär 31 kcal/kg fett/dag, vilket ofta används
          som ett praktiskt tak för daglig fettförlust i populära sammanställningar.
        </p>
        <p>
          Denna förenklade approximation förekommer bland annat i Lyle McDonalds
          populärvetenskapliga texter, såsom The Rapid Fat Loss Handbook och artiklar på hans blogg,
          samt i &ldquo;Burn the Fat Blog&rdquo; av Tom Venuto, där värdet presenteras som en
          riktlinje för hur mycket fett som realistiskt kan mobiliseras per dag. Det är viktigt att
          notera att detta inte är ett direkt empiriskt mått från Alpert, utan en tolkning och
          konservativ omräkning för praktiskt bruk i fitness‑ och dietlitteratur.
        </p>
      </section>

      <section className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h4 className="font-semibold text-red-900 mb-2">Detta är INTE:</h4>
        <ul className="text-sm text-red-800 space-y-1 ml-4">
          <li>• En direkt mätning från Alpert-studien (det är en praktisk tolkning)</li>
          <li>• En garanterad fettförlusthastighet</li>
          <li>• Ett löfte om muskelbevarande</li>
          <li>• En optimal dietrekommendation</li>
        </ul>
        <p className="text-sm text-red-800 mt-3">
          <strong>Det är:</strong> Ett praktiskt verktyg för att uppskatta ett säkert
          kaloriunderskott baserat på vetenskaplig forskning och praktisk erfarenhet.
        </p>
      </section>

      <section>
        <h4 className="font-semibold text-neutral-900 mb-2">Källor</h4>
        <div className="text-xs text-neutral-600 space-y-2">
          <p>
            <strong>Vetenskaplig grund:</strong> Alpert SS. A limit on the energy transfer rate from
            the human fat store in hypophagia. Journal of Theoretical Biology. 2005 Mar
            7;233(1):1–13. doi: 10.1016/j.jtbi.2004.09.015. Epub 2004 Dec 8. PMID: 15615615.
          </p>
          <p>
            <strong>Praktisk tolkning:</strong> Lyle McDonald (The Rapid Fat Loss Handbook), Tom
            Venuto (Burn the Fat Blog)
          </p>
        </div>
      </section>
    </div>
  )
}
