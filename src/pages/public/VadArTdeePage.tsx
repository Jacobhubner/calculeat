import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'

const CANONICAL = 'https://calculeat.se/artiklar/vad-ar-tdee'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Vad är TDEE? Totalt dagligt energibehov förklarat',
  description:
    'TDEE (Total Daily Energy Expenditure) är den totala mängden kalorier din kropp förbränner per dag. Lär dig vad TDEE är, hur det beräknas och hur du använder det för viktnedgång eller muskeluppbyggnad.',
  url: CANONICAL,
  publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
  inLanguage: 'sv-SE',
}

const FAQ_ITEMS = [
  {
    question: 'Är TDEE detsamma som kaloribehov?',
    answer:
      'Ja, i praktiken används begreppen synonymt. TDEE är den vetenskapliga termen för ditt totala dagliga energibehov — det antal kalorier du förbränner under ett dygn inkl. all aktivitet.',
  },
  {
    question: 'Hur noggrant är en TDEE-kalkylator?',
    answer:
      'Felmarginal är typiskt ±10–15%. Individuella faktorer som muskelmassa, hormonbalans och metabolism påverkar det verkliga värdet. Använd resultatet som startpunkt och justera efter hur din vikt faktiskt förändras under 2–3 veckor.',
  },
  {
    question: 'Vad är skillnaden mellan BMR och TDEE?',
    answer:
      'BMR är kalorierna din kropp förbränner i absolut vila — enbart för att hålla organ igång. TDEE är BMR plus all aktivitet (träning, rörelse, matsmältning). TDEE är alltid högre och är det relevanta talet för kaloriplanering.',
  },
  {
    question: 'Hur förändras TDEE med åldern?',
    answer:
      'Med åldern sjunker BMR gradvis (ca 1–2% per decennium) pga. minskad muskelmassa. Det sänker TDEE. Regelbunden styrketräning kan bromsa denna minskning markant genom att bevara muskelmassa.',
  },
  {
    question: 'Varför kan två personer med samma vikt ha så olika kaloribehov?',
    answer:
      'Den viktigaste anledningen är NEAT — spontan rörelse utanför gymmet. I kontrollerade studier har skillnaden i NEAT mellan individer med liknande kroppssammansättning uppmätts till över 1 000 kcal/dag (Levine et al., 1999). En person som fidgetar, reser sig ofta och tar trapporna bränner avsevärt mer än någon som är stilla — även om de tränar lika mycket. Muskelmassa, hormonbalans och genetik spelar också roll.',
  },
]

const SOURCES = [
  { text: 'FAO/WHO/UNU (2001). Human energy requirements. Report of a Joint Expert Consultation.' },
  {
    text: 'von Loeffelholz C, Birkenfeld AL. (2022). Non-Exercise Activity Thermogenesis in Human Energy Homeostasis. In: Endotext [Internet]. MDText.com. https://www.ncbi.nlm.nih.gov/books/NBK279077/',
  },
  {
    text: 'Levine JA. (2004). Non-exercise activity thermogenesis (NEAT): environment and biology. Am J Physiol Endocrinol Metab. 286(5):E675–E685.',
  },
  {
    text: 'Levine JA, Eberhardt NL, Jensen MD. (1999). Role of nonexercise activity thermogenesis in resistance to fat gain in humans. Science. 283(5399):212–214.',
  },
  { text: 'Westerterp KR. (2004). Diet induced thermogenesis. Nutr Metab (Lond). 1:5.' },
  {
    text: 'Ainsworth BE, et al. (2011). 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575–1581.',
  },
  {
    text: 'Westerterp KR. (2013). Physical activity and physical activity induced energy expenditure in humans: measurement, determinants, and effects. Front Physiol. 4:90.',
  },
  {
    text: 'Weir JB de V. (1949). New methods for calculating metabolic rate with special reference to protein metabolism. Journal of Physiology. 109(1–2):1–9.',
  },
]

export default function VadArTdeePage() {
  return (
    <>
      <Seo
        title="Vad är TDEE? Totalt dagligt energibehov förklarat | CalculEat"
        description="TDEE (Total Daily Energy Expenditure) är de kalorier din kropp förbränner per dag. Lär dig hur TDEE beräknas och hur du använder det för viktnedgång eller muskeluppbyggnad."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <ArticleLayout
        title="Vad är TDEE? Totalt dagligt energibehov förklarat"
        intro="TDEE (Total Daily Energy Expenditure) är den totala mängden kalorier din kropp förbränner under ett dygn, inklusive all rörelse och aktivitet. Det är ditt underhållsbehov — och utgångspunkten för att räkna kalorier oavsett om målet är viktnedgång, muskeluppbyggnad eller att hålla vikten."
        moneyPageHref="/kalkylatorer/tdee-kalkylator"
        moneyPageLabel="Räkna ut ditt TDEE direkt med vår gratis kalkylator"
        faqItems={FAQ_ITEMS}
        sources={SOURCES}
        relatedCalculators={[
          { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
          { href: '/kalkylatorer/bmr-kalkylator', label: 'BMR Kalkylator' },
          { href: '/kalkylatorer/bmi-kalkylator', label: 'BMI Kalkylator' },
        ]}
        relatedArticles={[
          { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
          { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
          { href: '/artiklar/bulk-och-cut', label: 'Bulk och cut' },
        ]}
        breadcrumb={[
          { label: 'Artiklar', href: '/artiklar' },
          { label: 'Vad är TDEE?', href: CANONICAL },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          De fyra komponenterna i TDEE
        </h2>
        <p>
          TDEE beräknas som summan av fyra fysiologiska komponenter. Varje komponent representerar
          en unik del av kroppens energiförbrukning utan överlappning:
        </p>
        <div className="bg-neutral-100 border border-neutral-200 rounded-lg px-4 py-3 my-4">
          <p className="text-sm font-mono text-neutral-800">TDEE = BMR + NEAT + EAT + TEF</p>
        </div>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          BMR — Basalmetabolism (ca 60–75% av TDEE)
        </h3>
        <p>
          BMR (Basal Metabolic Rate) är den energi kroppen kräver för att upprätthålla grundläggande
          fysiologiska funktioner i absolut vila — andning, blodcirkulation, temperaturreglering och
          cellulära processer. Den viktigaste determinanten för BMR är fettfri massa, som uppskattas
          förklara omkring 80% av variationen.
        </p>
        <p className="mt-3">
          BMR mäts under strikt kontrollerade laboratorieförhållanden: efter sömn, i fastande
          tillstånd och i termoneutral miljö. I praktiska sammanhang används oftare RMR (Resting
          Metabolic Rate), uppmätt när som helst under dagen, vilket kan skilja sig från BMR med upp
          till 10%. De flesta online-kalkylatorer — inklusive CalculEat — beräknar tekniskt sett
          RMR, men använder termen BMR i vardagligt bruk.
        </p>
        <p className="mt-3">
          Guldstandarden för mätning är indirekt kalorimetri via Weirs ekvation (1949). När det inte
          är tillgängligt används prediktiva ekvationer som Mifflin-St Jeor, Harris-Benedict eller
          Cunningham, vilka har en felmarginal på ±10–15% på individnivå.
        </p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          NEAT — Non-Exercise Activity Thermogenesis (15–30%)
        </h3>
        <p>
          NEAT omfattar all energiförbrukning från kroppsrörelser som inte är planerad träning:
          gång, stående, hushållsarbete, fidgeting och posturala justeringar. Det är den mest
          variabla komponenten — och den mest underskattade.
        </p>
        <p className="mt-3">
          Hos normalt aktiva individer utgör NEAT ca 15–30% av TDEE, men variationen är extrem. Hos
          mycket inaktiva individer kan NEAT vara så lågt som 6–10%, medan det hos rörliga individer
          kan överstiga 50% av total energiförbrukning. I en kontrollerad övermatningsstudie
          varierade förändringen i NEAT mellan −98 och +692 kcal/dag mellan individer med liknande
          kroppssammansättning (Levine et al., 1999). Totala skillnader i NEAT mellan individer kan
          uppgå till över 1 000 kcal/dag.
        </p>
        <p className="mt-3">
          Det förklarar varför två personer med identisk vikt och träningsrutin kan ha så olika
          kaloribehov — skillnaden sitter i spontan rörelse utanför gymmet, inte i träningspassen.
        </p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          EAT — Exercise Activity Thermogenesis (5–10%)
        </h3>
        <p>
          EAT representerar energiförbrukning från planerad fysisk träning. Det utgör vanligtvis en
          förvånansvärt liten andel av TDEE — under 5% hos stillasittande individer. Vid hög
          träningsvolym kan EAT öka till 15–30% eller mer hos elitidrottare (Westerterp, 2013).
        </p>
        <p className="mt-3">
          EAT uppskattas via MET-värden (Metabolic Equivalent of Task) från Compendium of Physical
          Activities. Viktigt: MET-värden inkluderar viloförbrukning. Eftersom BMR redan ingår i
          TDEE-formeln räknas enbart den <em>extra</em> energin över vila — det vill säga (MET − 1),
          inte hela MET-värdet. Att använda hela MET-värdet skulle innebära att viloförbrukningen
          räknas dubbelt.
        </p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          TEF — Thermic Effect of Food (8–15%)
        </h3>
        <p>
          TEF är den energi som krävs för digestion, absorption och metabolism av näringsämnen.
          Under energibalans motsvarar TEF i genomsnitt ca 10% av energiintaget, med ett typiskt
          intervall på 8–15% beroende på måltidets sammansättning.
        </p>
        <p className="mt-3">TEF varierar markant mellan makronutrienter:</p>
        <ul className="space-y-1 pl-4 list-disc mt-2">
          <li>
            <strong>Protein: ca 20–30%</strong> — aminosyrametabolism och ureabildning är
            energikrävande
          </li>
          <li>
            <strong>Kolhydrater: ca 5–10%</strong>
          </li>
          <li>
            <strong>Fett: ca 0–3%</strong> — låg termogen effekt
          </li>
        </ul>
        <p className="mt-3">
          Den praktiska konsekvensen: ett proteinrikt kostmönster ger genuint något högre
          energiförbrukning vid samma kaloriintag jämfört med ett fettdominerat kostmönster
          (Westerterp, 2004; Halton &amp; Hu, 2004).
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">Hur beräknas TDEE?</h2>
        <p>Det enklaste sättet är metoden BMR × PAL-faktor:</p>
        <ol className="space-y-2 pl-4 list-decimal mt-3">
          <li>Räkna ut BMR med Mifflin-St Jeor (rekommenderas för friska vuxna)</li>
          <li>
            Multiplicera med en PAL-faktor (Physical Activity Level) som speglar din aktivitetsnivå
          </li>
        </ol>
        <p className="mt-3">
          Exempel: BMR 1 800 kcal × PAL 1,55 (måttligt aktiv) = <strong>2 790 kcal TDEE</strong>.
        </p>
        <p className="mt-3">
          CalculEat använder Mifflin-St Jeor + fem PAL-nivåer (1,2–1,9). Ett mer detaljerat
          alternativ är att modellera varje komponent separat: BMR + NEAT (steg, stående, hushåll) +
          EAT + TEF — det ger en mer individualiserad uppskattning men kräver mer indata.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Hur använder man TDEE i praktiken?
        </h2>
        <p>
          TDEE är ditt <em>underhållsbehov</em>. Beroende på mål:
        </p>
        <ul className="space-y-2 pl-4 list-disc mt-2">
          <li>
            <strong>Viktnedgång:</strong> Ät 300–500 kcal under TDEE → ca 0,3–0,5 kg/vecka
          </li>
          <li>
            <strong>Muskeluppbyggnad:</strong> Ät 200–400 kcal över TDEE → lean bulk med minimal
            fettupplagring
          </li>
          <li>
            <strong>Underhåll:</strong> Ät på TDEE → stabil vikt
          </li>
        </ul>
        <p className="mt-3">
          Kalkylatorn ger en uppskattning med en felmarginal på ±10–15%. Följ upp din vikt under 2–3
          veckor och justera om resultatet inte stämmer med förväntan. Det är den mest
          tillförlitliga metoden — verklig vikttrend slår alltid formelbaserade estimat.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Varför sjunker TDEE under en diet?
        </h2>
        <p>
          Adaptiv termogenes — kroppen sänker sin metabolism som svar på långvarig kaloribrist. Det
          sker på flera nivåer: NEAT minskar (kroppen rör sig instinktivt mindre), BMR sjunker något
          och matsmältningens effektivitet ökar. NEAT är den komponent som reagerar snabbast och
          störst — och det är också därför viktnedgång bromsar upp trots oförändrat intag.
        </p>
        <p className="mt-3">
          Lösning: ta regelbundna &ldquo;diet breaks&rdquo; (kortare perioder på underhållsintag)
          för att motverka adaptionen, och prioritera styrketräning för att bevara muskelmassa och
          hålla BMR uppe.
        </p>
      </ArticleLayout>
    </>
  )
}
