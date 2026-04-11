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
              Metabolisk kalibrering uppskattar ditt faktiska <strong>underhålls-TDEE</strong> — hur
              många kalorier din kropp förbrukar för att hålla vikten stabil — genom att analysera
              hur din kroppsvikt förändras i relation till ditt faktiska kaloriintag över tid.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              <strong>Viktigt att förstå:</strong> Kalibreringen estimerar din faktiska
              energiförbrukning, inte ditt kalorimål. Ditt kaloriintervall räknas sedan om
              automatiskt utifrån ditt valda energimål (bibehåll vikt, gå ner, gå upp). Det är
              alltså två separata steg.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Istället för att enbart använda uppskattningar från BMR-formler och aktivitetsnivåer
              använder systemet verklig data från din loggning. Det gör att kalibreringen kan fånga
              upp individuella skillnader som standardformler missar — som NEAT-variation,
              termogenes och metabol adaptation.
            </p>
          </section>

          {/* Section 2: How does it work? */}
          <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <h3 className="font-semibold text-base mb-2">Hur beräkningen fungerar</h3>
            <div className="space-y-3 text-neutral-700">
              <div>
                <p>Kalibreringen bygger på energibalansprincipen:</p>
                <p className="text-neutral-600 italic ml-2 mt-1">
                  Energi in − energi ut = förändring i kroppens energilager.
                </p>
              </div>
              <p>
                Om vikten förändras över tid kan vi uppskatta hur stort ditt faktiska energibehov
                är. I förenklad form:
              </p>
              <p className="font-medium text-primary-600 text-center py-1">
                TDEE ≈ Genomsnittliga kalorier − (viktförändring × kcal per kg / antal dagar)
              </p>
              <p>
                Ett kilogram kroppsvikt motsvarar ungefär <strong>6 500–7 700 kcal</strong> beroende
                på om förändringen består av fett, glykogen eller vätska. Modellen använder ett
                dynamiskt värde inom detta spann beroende på hur snabbt vikten förändras.
              </p>
              <div>
                <p className="font-medium">Hur start- och slutvikt bestäms</p>
                <p className="mt-1">
                  Systemet jämför inte en enskild startvägning med en slutvägning. Istället delas
                  perioden in i en första och en sista tredjedel, och{' '}
                  <strong>medianen av alla mätningar</strong> i varje del används som start-
                  respektive slutvikt. Det innebär att enstaka extrema vägningar — t.ex. efter ett
                  stort middagsmål eller en träningsdag med hög vattenretention — inte kan snedvrida
                  resultatet på samma sätt som om bara en mätning per ände hade använts.
                </p>
              </div>
              <div>
                <p className="font-medium">Hur kaloriintaget uppskattas</p>
                <p className="mt-1">
                  Kalibreringen använder ditt loggade kaloriintag som primär datakälla. Om inte alla
                  dagar är loggade används en svag statistisk korrektion mot ditt kalorimål — ju
                  fler dagar som saknar logg, desto något större vikt får kalorimålet i beräkningen.
                  I praktiken dominerar loggad data nästan alltid.
                </p>
                <p className="mt-1">
                  Systemet detekterar också om loggningen verkar selektiv — det vill säga om du
                  tenderar att bara logga dagar med lägre intag. Om det mönstret identifieras
                  minskas tilliten till loggdatan och korrektionen mot kalorimålet anpassas. Det
                  skyddar mot att kalibreringen föreslår ett för lågt TDEE baserat på biased data.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Trend calculation */}
          <section>
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary-500" />
              Hur vikttrenden beräknas
            </h3>
            <p className="text-neutral-700 leading-relaxed">
              Istället för att jämföra två enskilda vägningar beräknar systemet en trendlinje
              (linjär regression) genom alla viktmätningar i perioden. Det ger ett stabilare estimat
              av den verkliga viktförändringen och mäter dessutom hur stark och konsekvent trenden
              är.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Som robusthetskontroll beräknas även en alternativ trend med{' '}
              <strong>Theil–Sen-estimatorn</strong>, som tar medianen av alla möjliga parvisa slopes
              mellan mätpunkterna. Den är mer okänslig för enstaka extremvärden än linjär
              regression. Om de två metoderna visar tydligt olika resultat kan systemet varna för
              att viktutvecklingen var oregelbunden under perioden.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Som ytterligare diagnostik beräknas en exponentiellt utjämnad trend (EMA). Den används
              inte som primär beräkningsmetod utan enbart för att detektera kraftigt icke-linjär
              viktutveckling — t.ex. en refeed-period mitt i perioden.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Viktmätningar som avviker kraftigt från resten av datan filtreras automatiskt bort
              innan trendberäkningen, för att minska påverkan från enstaka extrema mätningar.
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
              pålitlig datan är. Det beräknas från tre faktorer:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-neutral-700">
              <li>
                <strong>Matloggskvalitet (45%)</strong> — andelen loggade dagar och hur konsekvent
                kalorier registrerats
              </li>
              <li>
                <strong>Vägningsfrekvens (35%)</strong> — hur regelbundet du vägt dig; 50% av
                dagarna ger fullt utslag
              </li>
              <li>
                <strong>Klusterstorlek (20%)</strong> — hur många mätningar som finns i periodens
                start- och slutkluster
              </li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-2">
              DQI styr direkt hur stor justering som tillåts: från ±75 kcal vid låg kvalitet till
              ±200 kcal vid hög. Det innebär att bättre data inte bara ger ett mer tillförlitligt
              resultat — det ger också möjlighet till snabbare konvergens mot ditt faktiska TDEE.
            </p>
            <div className="mt-3 p-3 bg-neutral-100 rounded text-neutral-600 text-xs">
              <p className="font-medium mb-1">Val av tidsperiod</p>
              <p>
                Du kan välja mellan 14, 21 och 28 dagar. Längre perioder ger mer data och tillåter
                något större justeringar. Kortare perioder än 14 dagar används inte — signal/brus-
                förhållandet blir då för svagt för att ge tillförlitliga estimat, eftersom dagliga
                viktsvängningar kan vara lika stora som den faktiska vikttrendförändringen.
              </p>
            </div>
          </section>

          {/* Section 5: Clamping and convergence */}
          <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
            <h3 className="font-semibold text-base mb-2">Begränsning av extrema justeringar</h3>
            <div className="space-y-3 text-neutral-700">
              <div>
                <p className="font-medium">Justeringsgränser (clamp)</p>
                <p className="mt-1">
                  Kalibreringen begränsar hur mycket TDEE kan ändras i en enskild uppdatering.
                  Maximal justering beror på datakvaliteten och ligger normalt mellan:
                </p>
                <p className="font-medium text-primary-600 text-center py-1">
                  ±75 kcal till ±200 kcal
                </p>
                <p>
                  TDEE sätts aldrig under 1 200 eller över 5 000 kcal oavsett vad beräkningen visar
                  — dessa är absoluta fysiologiska gränser. Clampen förhindrar att tillfälliga
                  viktförändringar ger orimliga TDEE-hopp.
                </p>
              </div>
              <div>
                <p className="font-medium">Gradvis konvergens</p>
                <p className="mt-1">
                  Om kalibreringen föreslår en ny TDEE-nivå och clampen <em>inte</em> triggas,
                  utjämnas resultatet mjukt mot de senaste 1–3 tidigare kalibreringarna. Om alla
                  tidigare kalibreringar pekar i samma riktning följer systemet den trenden med
                  minimal dämpning istället för att bromsa. Triggas clampen används det begränsade
                  värdet direkt utan ytterligare utjämning.
                </p>
              </div>
              <div>
                <p className="font-medium">Historikvägning</p>
                <p className="mt-1">
                  Tidigare kalibreringar används som referenspunkt men inte hur gamla som helst.
                  Kalibreringar äldre än 90 dagar exkluderas om datakvaliteten var låg, och äldre än
                  180 dagar om kvaliteten var hög. Det innebär att om du inte kalibrerat på länge
                  startar systemet i praktiken om med minimal historikpåverkan.
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
              Eftersom verklig viktdata innehåller variation beräknar modellen ett{' '}
              <strong>90%-konfidensintervall</strong> för TDEE-uppskattningen. Det innebär att om du
              upprepade samma kalibrering med liknande data, skulle det sanna underhålls-TDEE hamna
              inom intervallet i 90% av fallen.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Intervallets bredd bestäms av tre konkreta osäkerhetskällor:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700">
              <li>
                <strong>Viktvariation</strong> — hur mycket vikten svänger runt trendlinjen
                (residualvarians från regressionen); hög dag-till-dag-variation ger brett intervall
              </li>
              <li>
                <strong>Kalorilogg-osäkerhet</strong> — uppskattad till ±20% av snittkalorier,
                viktat mot antal loggade dagar; färre loggade dagar ger bredare intervall
              </li>
              <li>
                <strong>Autokorrelation</strong> — dagliga vikter är inte oberoende av varandra (en
                hög mätning idag påverkar troligtvis morgondagens), vilket vidgar intervallet med en
                korrigeringsfaktor
              </li>
            </ul>
            <p className="text-neutral-700 leading-relaxed mt-2">
              Om kroppsvikten är mycket stabil under perioden kan konfidensintervallet bli relativt
              brett. Det beror på att dagliga viktvariationer från vätska, salt och glykogen då kan
              vara lika stora som den faktiska trendförändringen — systemet har helt enkelt svårt
              att skilja signal från brus. Det är ett ärligt svar på datan, inte ett tecken på att
              kalibreringen är fel.
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
              fettförändring. Därför är modellen medvetet konservativ och trendbaserad — den
              kombinerar klustrad viktförändring, regressionstrend och datakvalitetsvägning, vilket
              gör den mer robust än appar som enbart jämför start- och slutvikt eller använder enkla
              rullande medelvärden.
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
