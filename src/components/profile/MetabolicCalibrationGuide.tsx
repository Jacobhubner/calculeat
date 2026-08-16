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
import {
  HelpCircle,
  CheckCircle,
  XCircle,
  Scale,
  Info,
  AlertTriangle,
  BookOpen,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MetabolicCalibrationGuide() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <HelpCircle className="h-5 w-5 text-neutral-500 hover:text-neutral-700 transition-colors dark:text-neutral-400 dark:hover:text-neutral-200" />
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
            <p className="text-neutral-700 leading-relaxed dark:text-neutral-200">
              Metabolisk kalibrering uppskattar ditt faktiska <strong>underhålls-TDEE</strong> — hur
              många kalorier din kropp förbrukar för att hålla vikten stabil — genom att analysera
              hur din kroppsvikt förändras i relation till ditt faktiska kaloriintag över tid.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2 dark:text-neutral-200">
              <strong>Viktigt att förstå:</strong> Kalibreringen estimerar din faktiska
              energiförbrukning, inte ditt kalorimål. Ditt kaloriintervall räknas sedan om
              automatiskt utifrån ditt valda energimål (bibehåll vikt, gå ner, gå upp). Det är
              alltså två separata steg.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2 dark:text-neutral-200">
              Istället för att enbart använda uppskattningar från BMR-formler och aktivitetsnivåer
              använder systemet verklig data från din loggning. Det gör att kalibreringen kan fånga
              upp individuella skillnader som standardformler missar — som NEAT-variation,
              termogenes och metabol adaptation.
            </p>
          </section>

          {/* Section 2: How does it work? */}
          <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700">
            <h3 className="font-semibold text-base mb-2">Hur beräkningen fungerar</h3>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-200">
              <div>
                <p>Kalibreringen bygger på energibalansprincipen:</p>
                <p className="text-neutral-600 italic ml-2 mt-1 dark:text-neutral-400">
                  Energi in − energi ut = förändring i kroppens energilager.
                </p>
              </div>
              <p>
                Om vikten förändras över tid kan vi uppskatta hur stort ditt faktiska energibehov
                är. I förenklad form:
              </p>
              <p className="font-medium text-primary-600 text-center py-1 dark:text-primary-300">
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
              <div>
                <p className="font-medium">Varför loggningen är det känsligaste steget</p>
                <p className="mt-1">
                  Ett fel i det loggade intaget slår igenom <strong>rakt av</strong> i resultatet:
                  loggar du 200 kcal för lite blir ditt TDEE 200 kcal för lågt. Ett fel i vikten
                  däremot fördelas över hela perioden — ett halvkilos mätfel över fyra veckor
                  motsvarar bara ungefär 140 kcal.
                </p>
                <p className="mt-1">
                  Det är därför loggningen väger tyngst av allt i systemet. Forskning som jämför
                  självrapporterat intag mot mätningar med dubbelmärkt vatten visar att de flesta
                  underskattar sitt intag med 12–27 %, oftast utan att märka det — glömda tillbehör
                  som olja och dressing, drycker, eller portioner som är större än de ser ut.
                </p>
                <p className="mt-1">
                  Systemet jämför därför din logg med vad vågen säger. Om vikten tyder på ett
                  betydligt högre intag än du loggat begränsas justeringen, och du får veta hur stor
                  skillnaden är. Värdet räknas medvetet <em>inte</em> upp automatiskt — vi vet inte
                  vad som saknas, och en gissning skulle bara dölja osäkerheten.
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
            <p className="text-neutral-700 leading-relaxed dark:text-neutral-200">
              Istället för att jämföra två enskilda vägningar beräknar systemet en trendlinje
              (linjär regression) genom alla viktmätningar i perioden. Det ger ett stabilare estimat
              av den verkliga viktförändringen och mäter dessutom hur stark och konsekvent trenden
              är.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2 dark:text-neutral-200">
              Som robusthetskontroll beräknas även en alternativ trend med{' '}
              <strong>Theil–Sen-estimatorn</strong>, som tar medianen av alla möjliga parvisa slopes
              mellan mätpunkterna. Den är mer okänslig för enstaka extremvärden än linjär
              regression. Om de två metoderna visar tydligt olika resultat kan systemet varna för
              att viktutvecklingen var oregelbunden under perioden.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2 dark:text-neutral-200">
              Som ytterligare diagnostik beräknas en exponentiellt utjämnad trend (EMA). Den används
              inte som primär beräkningsmetod utan enbart för att detektera kraftigt icke-linjär
              viktutveckling — t.ex. en refeed-period mitt i perioden.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2 dark:text-neutral-200">
              Viktmätningar som avviker kraftigt från själva trendlinjen filtreras automatiskt bort
              innan trendberäkningen, för att minska påverkan från enstaka extrema mätningar.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2 dark:text-neutral-200">
              Att jämförelsen sker mot <em>trenden</em> och inte mot dina viktvärden i allmänhet är
              avgörande när vikten faktiskt förändras. Går du ner ett par kilo under en månad ligger
              dina vägningar naturligt utspridda över ett brett spann, och då skulle en enstaka
              avvikande mätning inte sticka ut alls i jämförelse med resten. Mot trendlinjen syns
              den däremot direkt.
            </p>
          </section>

          {/* Section 4: Data quality */}
          <section>
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-primary-500" />
              Hur datakvalitet påverkar resultatet
            </h3>
            <p className="text-neutral-700 leading-relaxed dark:text-neutral-200">
              Alla kalibreringar får ett <strong>Data Quality Index (DQI)</strong> som bedömer hur
              pålitlig datan är. Det beräknas från tre faktorer:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-2 text-neutral-700 dark:text-neutral-200">
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
            <p className="text-neutral-700 leading-relaxed mt-2 dark:text-neutral-200">
              Därutöver dämpas hela poängen av <strong>periodens längd</strong>: 28 dagar räknas
              fullt, 21 dagar till 90 % och 14 dagar till 75 %. Skälet står under{' '}
              <em>Val av tidsperiod</em> nedan. Dämpningen är avsiktligt multiplikativ — en längre
              period kan alltså inte kompensera för att du loggat lite.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2 dark:text-neutral-200">
              DQI styr direkt hur stor justering som tillåts: från ±75 kcal vid låg kvalitet till
              ±200 kcal vid hög. Det innebär att bättre data inte bara ger ett mer tillförlitligt
              resultat — det ger också möjlighet till snabbare konvergens mot ditt faktiska TDEE.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2 dark:text-neutral-200">
              Matloggen påverkar dessutom den <strong>tillförlitlighetsnivå</strong> som visas med
              resultatet. Är färre än 60 % av dagarna loggade sänks nivån ett steg, även om
              vikthistoriken i sig är perfekt — annars skulle ett resultat byggt på tunn loggdata se
              lika säkert ut som ett byggt på fullständig.
            </p>
            <div className="mt-3 p-3 bg-neutral-100 rounded text-neutral-600 text-xs dark:bg-neutral-800 dark:text-neutral-400">
              <p className="font-medium mb-1">Val av tidsperiod — och varför längre är bättre</p>
              <p>
                Du kan välja mellan 14, 21 och 28 dagar. <strong>28 dagar är referensen.</strong>{' '}
                Kortare perioder sänker datakvaliteten och därmed hur mycket ditt TDEE får justeras
                — 14 dagar får ungefär tre fjärdedelar av full poäng.
              </p>
              <p className="mt-1.5">Det finns två skäl, och de är oberoende av varandra:</p>
              <p className="mt-1.5">
                <strong>1. Tidig viktnedgång är mest vatten.</strong> När du drar ner på kalorierna
                töms först kroppens glykogen, och varje gram glykogen binder 3–4 gram vatten. I en
                kontrollerad avdelningsstudie tappade deltagarna 1,6 kg de första femton dagarna —
                men bara 0,2 kg av det var fett, en skillnad som inte ens var statistiskt säker. En
                kort period mäter alltså till stor del hur mycket vätska du gjort dig av med, inte
                hur mycket energi du faktiskt gjort av med.
              </p>
              <p className="mt-1.5">
                <strong>2. Mätbruset späds ut av tiden.</strong> Din vikt svänger från dag till dag
                oavsett vad du äter. Det felet delas på antalet dagar i perioden — så samma
                vägosäkerhet ger ungefär tre gånger större fel i TDEE på 14 dagar som på 28.
              </p>
              <p className="mt-1.5">
                Kortare perioder än 14 dagar erbjuds inte alls: då blir de dagliga svängningarna
                lika stora som den verkliga trenden.
              </p>
            </div>
          </section>

          {/* Section 5: Clamping and convergence */}
          <section className="bg-neutral-50 p-4 rounded-lg border border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700">
            <h3 className="font-semibold text-base mb-2">Begränsning av extrema justeringar</h3>
            <div className="space-y-3 text-neutral-700 dark:text-neutral-200">
              <div>
                <p className="font-medium">Justeringsgränser (clamp)</p>
                <p className="mt-1">
                  Kalibreringen begränsar hur mycket TDEE kan ändras i en enskild uppdatering via
                  två separata gränser som båda måste uppfyllas:
                </p>
                <ul className="mt-1 ml-4 list-disc space-y-1">
                  <li>
                    <strong>Datakvalitetstaket</strong> — begränsar hur långt det kalibrerade värdet
                    får avvika från vad data faktiskt visar. Storleken styrs av DQI och ligger
                    mellan ±75 kcal (låg kvalitet) och ±200 kcal (utmärkt kvalitet).
                  </li>
                  <li>
                    <strong>Konvergenstaket</strong> — begränsar hur snabbt TDEE får röra sig från
                    din nuvarande nivå per period, oavsett datakvalitet. Storleken beror på
                    periodens längd (12–20 % av nuvarande TDEE).
                  </li>
                </ul>
                <p className="mt-1">
                  Den snävare av de två gränserna avgör det slutliga resultatet. Om en justering
                  begränsas visas vilket tak som var bindande i varningsmeddelandet. TDEE sätts
                  aldrig under 1 200 eller över 5 000 kcal oavsett vad beräkningen visar.
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
            <p className="text-neutral-700 leading-relaxed dark:text-neutral-200">
              Eftersom verklig viktdata innehåller variation beräknar modellen ett{' '}
              <strong>90%-konfidensintervall</strong> för TDEE-uppskattningen. Det innebär att om du
              upprepade samma kalibrering med liknande data, skulle det sanna underhålls-TDEE hamna
              inom intervallet i 90% av fallen.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2 dark:text-neutral-200">
              Intervallets bredd bestäms av tre konkreta osäkerhetskällor:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-2 mt-1 text-neutral-700 dark:text-neutral-200">
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
            <p className="text-neutral-700 leading-relaxed mt-2 dark:text-neutral-200">
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
              <CheckCircle className="h-4 w-4 text-success-600 dark:text-success-300" />
              När bör du använda metabolisk kalibrering?
            </h3>
            <p className="text-neutral-700 mb-2 dark:text-neutral-200">
              Kalibreringen fungerar bäst när du har samlat in tillräckligt med konsekvent data.
            </p>
            <div className="mb-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900">
              <p className="font-medium text-neutral-800 dark:text-neutral-100">
                Detta krävs för att kalibrering ska gå att göra
              </p>
              <ul className="mt-1.5 list-disc space-y-1 pl-4 text-neutral-700 dark:text-neutral-200">
                <li>
                  Minst <strong>4 vägningar</strong> spridda över perioden (fler för längre
                  perioder)
                </li>
                <li>
                  Minst <strong>7 loggade dagar</strong> — utan loggat intag kan TDEE bara gissas
                  utifrån ditt mål, inte mätas
                </li>
                <li>
                  Loggningen måste täcka <strong>minst halva mätperioden</strong>. Sju loggdagar i
                  början av en månad säger inget om den vikt som mätts i slutet — de två måste
                  beskriva samma tid
                </li>
              </ul>
              <p className="mt-2 text-neutral-600 text-xs dark:text-neutral-400">
                Saknas något av detta visas i stället hur långt du har kvar. Kraven finns för att
                ett resultat byggt på för tunn data är sämre än inget resultat alls.
              </p>
            </div>
            <p className="text-neutral-700 font-medium mb-1 dark:text-neutral-200">
              Det här gör resultatet ännu bättre:
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5 dark:text-success-300">✓</span>
                <span className="text-neutral-700 dark:text-neutral-200">
                  Du har loggat ditt kaloriintag i minst <strong>2–3 veckor</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5 dark:text-success-300">✓</span>
                <span className="text-neutral-700 dark:text-neutral-200">
                  Du väger dig regelbundet (helst <strong>morgon före frukost</strong>)
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5 dark:text-success-300">✓</span>
                <span className="text-neutral-700 dark:text-neutral-200">
                  Du har loggat <strong>majoriteten av dagarna</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5 dark:text-success-300">✓</span>
                <span className="text-neutral-700 dark:text-neutral-200">
                  Du loggar <strong>även helger</strong> — helgdagar ligger ofta högre än vardagar,
                  och saknas de skattas din förbrukning för lågt. Systemet upptäcker sådan
                  snedvridning och begränsar då justeringen
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-success-600 mt-0.5 dark:text-success-300">✓</span>
                <span className="text-neutral-700 dark:text-neutral-200">
                  Din vikt <strong>förändras inte som förväntat</strong>
                </span>
              </li>
            </ul>
          </section>

          {/* Section 8: When NOT to use */}
          <section className="bg-orange-50 p-4 rounded-lg border border-orange-200 dark:bg-orange-900/25 dark:border-orange-800">
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <XCircle className="h-4 w-4 text-orange-600 dark:text-orange-300" />
              När bör kalibrering undvikas?
            </h3>
            <p className="text-neutral-700 mb-2 dark:text-neutral-200">
              Kalibrering kan bli missvisande om datan inte representerar en stabil period.
            </p>
            <p className="text-neutral-700 font-medium mb-1 dark:text-neutral-200">
              Undvik att kalibrera när:
            </p>
            <ul className="space-y-2 text-neutral-700 dark:text-neutral-200">
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold dark:text-orange-300">×</span>
                <span>
                  Du precis startat en ny diet <strong>(&lt;2 veckor)</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold dark:text-orange-300">×</span>
                <span>
                  Du nyligen <strong>ändrat träningsvolym kraftigt</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold dark:text-orange-300">×</span>
                <span>
                  Du har loggat mat <strong>mycket oregelbundet</strong>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5 font-bold dark:text-orange-300">×</span>
                <span>
                  Viktmätningar saknas under <strong>stora delar av perioden</strong>
                </span>
              </li>
            </ul>
          </section>

          {/* Section 9: Important */}
          <section className="bg-blue-50 p-4 rounded-lg border border-blue-200 dark:bg-blue-900/25 dark:border-blue-800">
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              Viktigt att förstå
            </h3>
            <p className="text-neutral-700 leading-relaxed dark:text-neutral-200">
              Metabolisk kalibrering är en långsiktig finjustering, inte en snabb korrigering.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2 dark:text-neutral-200">
              Kroppsvikt påverkas dagligen av många faktorer som inte är kopplade till
              fettförändring. Därför är modellen medvetet konservativ och trendbaserad — den
              kombinerar klustrad viktförändring, regressionstrend och datakvalitetsvägning, vilket
              gör den mer robust än appar som enbart jämför start- och slutvikt eller använder enkla
              rullande medelvärden.
            </p>
            <p className="text-neutral-700 leading-relaxed mt-2 dark:text-neutral-200">
              Ju mer konsekvent du loggar mat och vikt över tid, desto mer exakt kan systemet
              uppskatta ditt verkliga energibehov.
            </p>
          </section>

          {/* Section 10: Sources */}
          <section>
            <h3 className="font-semibold text-base mb-2 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary-500" />
              Källor
            </h3>
            <p className="text-neutral-600 text-xs leading-relaxed mb-3 dark:text-neutral-400">
              Siffrorna i modellen är hämtade ur publicerad forskning. Där evidens saknas står det
              uttryckligen — vi hittar hellre på en osäkerhet än en siffra.
            </p>
            <ul className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400">
              <li>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Energi per kilo kroppsvikt
                </span>
                <br />
                Hall KD. <em>What is the required energy deficit per unit weight loss?</em> Int J
                Obes 2008;32(3):573–576. doi:10.1038/sj.ijo.0803720 — visar att tumregeln 7 700
                kcal/kg bygger på ett antagande om ren fettvävnad, och att energikostnaden i själva
                verket beror på hur mycket kroppsfett man har från början.
              </li>
              <li>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Vad tidig viktnedgång består av
                </span>
                <br />
                Hall KD et al. Am J Clin Nutr 2016;104(2):324–333. doi:10.3945/ajcn.116.133561 —
                kontrollerad avdelningsstudie (n=17): 1,6 kg viktnedgång de första femton dagarna,
                varav endast 0,2 kg fett.
                <br />
                Thomas DM et al. J Acad Nutr Diet 2014. doi:10.1016/j.jand.2014.02.003 — CALERIE:
                energitätheten i viktförändringen var 4 858 kcal/kg vid vecka 4 mot 6 569 vid vecka
                24.
              </li>
              <li>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Viktuppgångens sammansättning
                </span>
                <br />
                Bray GA, Bouchard C. <em>
                  The biology of human overfeeding: a systematic review.
                </em>{' '}
                Obes Rev 2020;21(9):e13040. doi:10.1111/obr.13040 — över 19 överutfodringsgrupper
                bestod 61 % av viktuppgången av fett.
              </li>
              <li>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Underrapportering av kaloriintag
                </span>
                <br />
                Trabulsi J, Schoeller DA. Am J Physiol Endocrinol Metab 2001;281(5):E891–899.
                doi:10.1152/ajpendo.2001.281.5.E891 — jämförelse mot dubbelmärkt vatten.
                <br />
                Nature Food 2024. doi:10.1038/s43016-024-01089-5 — 6 497 mätningar med dubbelmärkt
                vatten; underrapportering på 12–27 % beroende på metod och grupp.
              </li>
              <li>
                <span className="font-medium text-neutral-700 dark:text-neutral-300">
                  Dag-till-dag-variation i kroppsvikt
                </span>
                <br />
                Schneditz D et al. Ren Fail 2023. doi:10.1080/0886022X.2023.2273421 —
                standardavvikelse omkring 0,5 % av kroppsvikten vid morgonvägning fastande.{' '}
                <em>
                  Observera: studien följer en enda person över lång tid, så siffran ska läsas som
                  en storleksordning, inte ett exakt värde för alla.
                </em>
              </li>
            </ul>
            <div className="mt-3 p-3 bg-neutral-50 rounded border border-neutral-200 text-xs text-neutral-600 dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-400">
              <p className="font-medium mb-1">Där evidensen inte räcker</p>
              <p>
                Vi har inte hittat någon publicerad studie som mäter hur energitätheten varierar med
                nedgångens <em>hastighet</em>. Den justering modellen gör där är en rimlig
                härledning, inte ett studieresultat, och den behandlas som osäker i beräkningen.
              </p>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  )
}
