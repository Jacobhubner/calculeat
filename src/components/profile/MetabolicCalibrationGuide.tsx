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
import { HelpCircle, CheckCircle, XCircle, Scale, Info, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MetabolicCalibrationGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-5 w-5 text-neutral-500 hover:text-neutral-700 transition-colors" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <Scale className="h-5 w-5 text-primary-500" />
            Guide: Metabolisk Kalibrering
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-sm overflow-y-auto max-h-[70vh] pr-1">
          {/* Section 1: What is it? */}
          <section>
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary-500" />
              Vad är metabolisk kalibrering?
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              Metabolisk kalibrering beräknar ditt faktiska <strong>Maintenance-TDEE</strong>{' '}
              baserat på hur din kropp faktiskt reagerar på ditt kaloriintag över tid.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Istället för att enbart använda teoretiska formler analyserar systemet:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
              <li>Trendbaserad viktutveckling (inte enskilda vägningar)</li>
              <li>Genomsnittligt kaloriintag under perioden</li>
              <li>Datakvalitet och konsekvens i loggningen</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Dagliga fluktuationer från vätska, salt och glykogen filtreras bort genom
              trendberäkning och avvikelsehantering.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Resultatet är ett stabilt och biologiskt rimligt estimat av ditt energibehov.
            </p>
          </section>

          {/* Section 2: How does it work? */}
          <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <h3 className="font-semibold text-base mb-2">Hur fungerar beräkningen?</h3>
            <div className="space-y-2 text-neutral-700">
              <p>I grunden bygger modellen på energibalansprincipen:</p>
              <p className="font-medium text-primary-600 text-center py-1">
                TDEE ≈ Genomsnittliga kalorier − (trendbaserad viktförändring × 7700 / dagar)
              </p>
              <p>
                1 kg kroppsvikt motsvarar i genomsnitt cirka <strong>7700 kcal</strong> när man tar
                hänsyn till att viktförändring består av fett, vatten och viss muskelmassa.
              </p>
              <p className="mt-2">Den faktiska modellen:</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>Använder trendvikt istället för råa mätningar</li>
                <li>Justerar gradvis istället för att ersätta värdet direkt</li>
                <li>Begränsar extrema justeringar</li>
                <li>Vägs mot tidigare uppskattning för stabilitet</li>
              </ul>
              <p className="mt-2">
                Detta gör systemet robust mot brus och kortsiktiga svängningar.
              </p>
            </div>
          </section>

          {/* Section 3: Data quality */}
          <section>
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary-500" />
              Datakvalitet och precision
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              Kalibreringens tillförlitlighet beror på kvaliteten i din data.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">Systemet tar hänsyn till:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
              <li>Hur många dagar du loggat</li>
              <li>Hur konsekvent kaloriintaget registrerats</li>
              <li>Hur stabil vikttrenden är</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Vid låg signal (mycket liten viktförändring) eller ojämn loggning begränsas
              justeringen automatiskt.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2 font-medium">
              Ju bättre data – desto mer exakt kalibrering.
            </p>
          </section>

          {/* Section 4: When to use */}
          <section>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              När bör du använda kalibrering?
            </h3>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5">✓</span>
                <span className="text-neutral-700">
                  Du har följt ditt kaloriintag i minst <strong>2–3 veckor</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5">✓</span>
                <span className="text-neutral-700">
                  Du väger dig regelbundet (helst <strong>morgon före frukost</strong>)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5">✓</span>
                <span className="text-neutral-700">
                  Din vikt <strong>rör sig inte som förväntat</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5">✓</span>
                <span className="text-neutral-700">
                  Du har loggat <strong>majoriteten av dagarna</strong>
                </span>
              </li>
            </ul>
          </section>

          {/* Section 5: When NOT to use */}
          <section className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-orange-600" />
              Undvik kalibrering när:
            </h3>
            <ul className="space-y-2 text-neutral-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold">×</span>
                <span>
                  Du just börjat en ny diet <strong>(&lt;2 veckor)</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold">×</span>
                <span>
                  Du nyligen <strong>ändrat träningsmängd kraftigt</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold">×</span>
                <span>
                  Du <strong>inte loggat mat</strong> konsekvent
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold">×</span>
                <span>
                  Du väger dig <strong>mycket oregelbundet</strong>
                </span>
              </li>
            </ul>
          </section>

          {/* Section 6: Important to understand */}
          <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              Viktigt att förstå
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              Kalibrering är en långsiktig finjustering — inte en snabb korrigering.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Systemet är medvetet konservativt och begränsar stora justeringar för att undvika
              överreaktion på tillfälliga viktförändringar.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Kroppen förändras gradvis – och modellen speglar det.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
