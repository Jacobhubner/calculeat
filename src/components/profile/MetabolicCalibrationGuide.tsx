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
            Guide: Metabolisk kalibrering
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
              Metabolisk kalibrering uppskattar ditt faktiska <strong>Maintenance-TDEE</strong>{' '}
              (Total Daily Energy Expenditure) genom att analysera hur din kroppsvikt förändras i
              relation till ditt faktiska kaloriintag över tid.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Istället för att enbart använda uppskattningar från BMR-formler och aktivitetsnivåer
              använder systemet verklig data från din loggning för att justera ditt energibehov.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Kalibreringen analyserar bland annat:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
              <li>Trendbaserad viktutveckling över tid</li>
              <li>Genomsnittligt kaloriintag under perioden</li>
              <li>Hur konsekvent du loggat din mat</li>
              <li>Hur regelbundet du vägt dig</li>
              <li>Hur stabil vikttrenden är</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Dagliga viktfluktuationer från exempelvis vätska, salt, glykogen eller maginnehåll
              filtreras bort genom trendanalys och avvikelsehantering.
            </p>
          </section>

          {/* Section 2: How does it work? */}
          <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <h3 className="font-semibold text-base mb-2">Hur beräkningen fungerar</h3>
            <div className="space-y-2 text-neutral-700">
              <p>Kalibreringen bygger på energibalansprincipen:</p>
              <p className="text-neutral-600 italic ml-2">
                Energi in − energi ut = förändring i kroppens energilager.
              </p>
              <p>
                Om vikten förändras över tid kan vi därför uppskatta hur stort ditt faktiska
                energibehov är.
              </p>
              <p>I förenklad form används sambandet:</p>
              <p className="font-medium text-primary-600 text-center py-1">
                TDEE ≈ Genomsnittliga kalorier − (trendbaserad viktförändring × kcal per kg / antal
                dagar)
              </p>
              <p>
                Ett kilogram kroppsvikt motsvarar i genomsnitt ungefär{' '}
                <strong>6 500–7 700 kcal</strong> beroende på hur stor del av viktförändringen som
                består av fett, glykogen och vätska. Modellen använder ett dynamiskt värde inom
                detta spann beroende på hur snabbt vikten förändras.
              </p>
            </div>
          </section>

          {/* Section 3: Trend calculation */}
          <section>
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary-500" />
              Hur vikttrenden beräknas
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              Istället för att jämföra två enskilda vägningar beräknar systemet en trendlinje genom
              alla viktmätningar i perioden.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Detta görs med en statistisk metod (linjär regression) som:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
              <li>använder alla mätpunkter</li>
              <li>minskar påverkan från enstaka extrema värden</li>
              <li>ger ett stabilare estimat av den verkliga viktförändringen</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-2">Metoden beräknar även:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
              <li>hur stark vikttrenden är</li>
              <li>hur mycket vikten varierar runt trenden</li>
              <li>hur väl datapunkterna följer en konsekvent riktning</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Om viktdata är mycket brusig eller inkonsekvent reduceras kalibreringens
              tillförlitlighet.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Som extra kontroll jämförs även regressionstrenden med en glidande medeltrend. Om
              dessa två skiljer sig kraftigt kan systemet varna för att viktförändringen är
              oregelbunden (t.ex. efter refeed, vätskeretention eller andra kortsiktiga effekter).
            </p>
          </section>

          {/* Section 4: Data quality */}
          <section>
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary-500" />
              Hur datakvalitet påverkar resultatet
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              Alla kalibreringar får ett <strong>Data Quality Index (DQI)</strong> som bedömer hur
              pålitlig datan är.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Detta index påverkas bland annat av:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
              <li>hur många dagar du loggat mat</li>
              <li>hur konsekvent kalorier registrerats</li>
              <li>hur regelbundet du vägt dig</li>
              <li>hur jämnt mätningarna är fördelade över perioden</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-2">Högre datakvalitet innebär:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
              <li>större justeringar kan tillåtas</li>
              <li>snävare konfidensintervall</li>
              <li>högre tillförlitlighet i resultatet</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Vid låg datakvalitet begränsar systemet automatiskt hur mycket TDEE får justeras.
            </p>
          </section>

          {/* Section 5: Clamping and convergence */}
          <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <h3 className="font-semibold text-base mb-2">Begränsning av extrema justeringar</h3>
            <div className="space-y-3 text-neutral-700">
              <div>
                <p className="font-medium">Justeringsgränser (clamp)</p>
                <p className="mt-1">
                  Kalibreringen begränsar hur mycket TDEE kan ändras i en enskild uppdatering.
                  Maximal justering beror på datakvaliteten och ligger normalt mellan ungefär:
                </p>
                <p className="font-medium text-primary-600 text-center py-1">
                  ±75 kcal till ±200 kcal
                </p>
                <p>
                  Detta förhindrar att tillfälliga viktförändringar ger orimliga TDEE-förändringar.
                </p>
              </div>
              <div>
                <p className="font-medium">Gradvis konvergens</p>
                <p className="mt-1">
                  Om kalibreringen föreslår en ny TDEE-nivå närmar sig systemet denna nivå gradvis
                  över flera kalibreringar, istället för att direkt ersätta värdet. Detta gör
                  modellen stabilare över tid.
                </p>
              </div>
              <div>
                <p className="font-medium">Historikvägning</p>
                <p className="mt-1">
                  Tidigare kalibreringar används också som referenspunkt. Äldre kalibreringar får
                  dock minskad vikt över tid, särskilt om datakvaliteten var låg.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Confidence intervals */}
          <section>
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary-500" />
              Osäkerhet och konfidensintervall
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              Eftersom verklig viktdata innehåller variation beräknar modellen även ett{' '}
              <strong>konfidensintervall</strong> för TDEE-uppskattningen.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">Intervallet baseras på:</p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
              <li>variation i viktmätningarna</li>
              <li>antal datapunkter</li>
              <li>hur väl vikttrenden passar modellen</li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Detta ger en uppskattning av hur stor osäkerheten i beräkningen är.
            </p>
          </section>

          {/* Section 7: When to use */}
          <section>
            <h3 className="font-semibold text-base mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              När bör du använda metabolisk kalibrering?
            </h3>
            <p className="text-neutral-700 mb-2">
              Kalibreringen fungerar bäst när du har samlat in tillräckligt med konsekvent data.
            </p>
            <p className="text-neutral-700 font-medium mb-1">Bra förutsättningar:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5">✓</span>
                <span className="text-neutral-700">
                  Du har loggat ditt kaloriintag i minst <strong>2–3 veckor</strong>
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
                  Du har loggat <strong>majoriteten av dagarna</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5">✓</span>
                <span className="text-neutral-700">
                  Din vikt <strong>förändras inte som förväntat</strong>
                </span>
              </li>
            </ul>
          </section>

          {/* Section 8: When NOT to use */}
          <section className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-orange-600" />
              När bör kalibrering undvikas?
            </h3>
            <p className="text-neutral-700 mb-2">
              Kalibrering kan bli missvisande om datan inte representerar en stabil period.
            </p>
            <p className="text-neutral-700 font-medium mb-1">Undvik att kalibrera när:</p>
            <ul className="space-y-2 text-neutral-700">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold">×</span>
                <span>
                  Du precis startat en ny diet <strong>(&lt;2 veckor)</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold">×</span>
                <span>
                  Du nyligen <strong>ändrat träningsvolym kraftigt</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold">×</span>
                <span>
                  Du har loggat mat <strong>mycket oregelbundet</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold">×</span>
                <span>
                  Viktmätningar saknas under <strong>stora delar av perioden</strong>
                </span>
              </li>
            </ul>
          </section>

          {/* Section 9: Important */}
          <section className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              Viktigt att förstå
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              Metabolisk kalibrering är en långsiktig finjustering, inte en snabb korrigering.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Kroppsvikt påverkas dagligen av många faktorer som inte är kopplade till
              fettförändring. Därför är modellen medvetet konservativ och trendbaserad.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Ju mer konsekvent du loggar mat och vikt över tid, desto mer exakt kan systemet
              uppskatta ditt verkliga energibehov.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
