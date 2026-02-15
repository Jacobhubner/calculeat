/**
 * MetabolicCalibrationGuide - Hjälpdialog för Metabolisk Kalibrering
 * Förklarar hur kalibrering fungerar, när den ska användas, och praktiska tips
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { HelpCircle, CheckCircle, XCircle, Lightbulb, Scale, Calendar, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MetabolicCalibrationGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-5 w-5 text-neutral-500 hover:text-neutral-700 transition-colors" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary-500" />
            Guide: Metabolisk Kalibrering
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          {/* Section 1: What is it? */}
          <section>
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary-500" />
              Vad är metabolisk kalibrering?
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              Metabolisk kalibrering använder dina <strong>verkliga viktförändringar</strong> för
              att beräkna ditt faktiska TDEE. Istället för teoretiska formler justerar systemet
              baserat på vad som faktiskt händer med din kropp.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Systemet använder trendbaserad viktberäkning med medianvärden i start- och slutkluster
              för att dämpa dagliga fluktuationer från vatten, glykogen och tarminnehåll. Avvikande
              mätningar filtreras bort automatiskt.
            </p>
          </section>

          {/* Section 2: The Science */}
          <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <h3 className="font-semibold text-base mb-2">Varför 7700 kcal per kg?</h3>
            <div className="space-y-2 text-neutral-700">
              <p>1 kg kroppsfett ≈ 9000 kcal (ren fett)</p>
              <p className="font-medium">Men viktförlust/ökning inkluderar:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Fett (~70-80%)</li>
                <li>Vatten (~15-20%)</li>
                <li>Glykogen + muskelvävnad (~5-10%)</li>
              </ul>
              <p className="font-medium mt-2 pt-2 border-t border-neutral-300">
                Genomsnitt: <span className="text-primary-600">~7700 kcal per kg</span> är
                vetenskapligt etablerat
              </p>
            </div>
          </section>

          {/* Section 3: When to use */}
          <section>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              När ska du använda kalibreringen?
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5">✓</span>
                <span className="text-neutral-700">
                  Du har ätit <strong>konsekvent i 2+ veckor</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5">✓</span>
                <span className="text-neutral-700">
                  Din vikt rör sig åt <strong>fel håll</strong> (upp när du vill ned, eller tvärtom)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5">✓</span>
                <span className="text-neutral-700">
                  Din vikt <strong>inte ändras</strong> trots underskott/överskott
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5">✓</span>
                <span className="text-neutral-700">
                  Du har minst <strong>4-6 viktmätningar</strong> under vald period
                </span>
              </li>
            </ul>
          </section>

          {/* Section 4: When NOT to use */}
          <section className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-orange-600" />
              Undvik kalibrering när:
            </h3>
            <ul className="space-y-2 text-neutral-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold">×</span>
                <span>
                  Du just börjat en ny diet <strong>(&lt; 2 veckor)</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold">×</span>
                <span>
                  Vikten fluktuerar kraftigt <strong>(&gt;1,5% per vecka)</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold">×</span>
                <span>
                  Du <strong>inte loggar mat</strong> konsekvent
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold">×</span>
                <span>
                  Du är <strong>sjuk, menstruerar, eller extremt stressad</strong>
                </span>
              </li>
            </ul>
          </section>

          {/* Section 5: Practical Tips */}
          <section>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Praktiska Tips
            </h3>

            {/* Sub-section: Consistent weighing */}
            <div className="mb-4 bg-neutral-50 p-3 rounded-lg">
              <h4 className="font-medium mb-2 text-neutral-900">1. Väg dig konsekvent</h4>
              <ul className="space-y-1 text-neutral-700 ml-2">
                <li>
                  • Samma tid på dagen (helst på <strong>morgonen</strong>)
                </li>
                <li>• Efter toalettbesök, före frukost</li>
                <li>• Naken eller i samma kläder</li>
                <li>• Minst 3 gånger per vecka för bäst precision</li>
              </ul>
            </div>

            {/* Sub-section: Time period selection */}
            <div className="mb-4 bg-neutral-50 p-3 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2 text-neutral-900">
                <Calendar className="h-3.5 w-3.5" />
                2. Välj rätt tidsperiod
              </h4>
              <ul className="space-y-1.5 text-neutral-700 ml-2">
                <li>
                  <span className="font-medium">14 dagar:</span> Snabb feedback, lägre precision
                </li>
                <li>
                  <span className="font-medium">21 dagar:</span> Balanserad
                  <span className="text-success-600 font-semibold ml-1">(rekommenderad)</span>
                </li>
                <li>
                  <span className="font-medium">28 dagar:</span> Mest exakt, bra vid menscykel
                </li>
              </ul>
            </div>

            {/* Sub-section: Confidence levels */}
            <div className="mb-4 bg-neutral-50 p-3 rounded-lg">
              <h4 className="font-medium mb-2 text-neutral-900">3. Tillförlitlighetsnivåer</h4>
              <ul className="space-y-1.5 text-neutral-700 ml-2">
                <li>
                  <span className="font-medium text-green-600">Hög:</span> Många mätningar + matlogg
                  = mest pålitligt
                </li>
                <li>
                  <span className="font-medium text-yellow-600">Medel:</span> Tillräcklig data,
                  resultat trovärdigt
                </li>
                <li>
                  <span className="font-medium text-orange-600">Låg:</span> Få mätningar, systemet
                  begränsar justeringen
                </li>
              </ul>
            </div>

            {/* Sub-section: Interpret results */}
            <div className="bg-neutral-50 p-3 rounded-lg">
              <h4 className="font-medium mb-2 text-neutral-900">4. Tolka resultatet</h4>
              <ul className="space-y-1.5 text-neutral-700 ml-2">
                <li>
                  <span className="font-medium">Liten skillnad (&lt;5%):</span> Din TDEE-beräkning
                  var ganska korrekt ✓
                </li>
                <li>
                  <span className="font-medium">Mellan skillnad (5-15%):</span> Vanligt, justera och
                  fortsätt
                </li>
                <li>
                  <span className="font-medium">Stor skillnad (&gt;15%):</span> Kanske du äter
                  mer/mindre än du tror? Dubbelkolla loggning
                </li>
              </ul>
            </div>
          </section>

          {/* Section 6: Data Quality */}
          <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <h3 className="font-semibold text-base mb-2">Datakvalitetsindex (DQI)</h3>
            <p className="text-neutral-700 mb-2">
              Systemet beräknar ett kvalitetsindex som styr hur stor justering som tillåts:
            </p>
            <ul className="space-y-1.5 text-neutral-700 ml-2">
              <li>
                <span className="font-medium text-green-600">Utmärkt (80+):</span> Max ±200 kcal
                justering
              </li>
              <li>
                <span className="font-medium text-blue-600">Bra (60–79):</span> Max ±150 kcal
                justering
              </li>
              <li>
                <span className="font-medium text-yellow-600">Tillräcklig (40–59):</span> Max ±100
                kcal justering
              </li>
              <li>
                <span className="font-medium text-orange-600">Begränsad (&lt;40):</span> Max ±75
                kcal justering
              </li>
            </ul>
            <p className="text-neutral-600 text-xs mt-2">
              Indexet baseras på matloggning (40%), vägningsfrekvens (30%), konsistens i tid (15%)
              och klusterstorlek (15%).
            </p>
          </section>

          {/* Footer tip */}
          <div className="pt-4 border-t border-neutral-200">
            <p className="text-xs text-neutral-500 italic">
              Tips: Kalibrera var 3-4:e vecka för bäst resultat. Vänta minst 14 dagar mellan
              kalibreringar. Vid menscykel kan 28 dagar ge bäst resultat. Du kan ångra den senaste
              kalibreringen om du är osäker.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
