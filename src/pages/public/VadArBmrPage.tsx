import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'

const CANONICAL = 'https://calculeat.se/artiklar/vad-ar-bmr'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Vad är BMR? Basalmetabolism förklarat',
  description:
    'BMR (Basal Metabolic Rate) är de kalorier din kropp förbränner i absolut vila. Lär dig vad BMR är, hur det skiljer sig från TDEE och varför du aldrig ska äta på ditt BMR.',
  url: CANONICAL,
  publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
  inLanguage: 'sv-SE',
}

const FAQ_ITEMS = [
  {
    question: 'Vad är skillnaden mellan BMR och TDEE?',
    answer:
      'BMR är de kalorier din kropp förbränner i absolut vila — enbart för att hålla hjärta, lungor och organ igång. TDEE (Total Daily Energy Expenditure) är BMR plus all aktivitet under dagen: träning, promenader, matsmältning och spontan rörelse. TDEE är alltid högre än BMR och är det relevanta talet för kaloriplanering.',
  },
  {
    question: 'Kan jag äta på mitt BMR för att gå ner i vikt?',
    answer:
      'Nej — det rekommenderas aldrig att äta på BMR-nivå. BMR är vad kroppen behöver i absolut vila. Att äta bara på BMR ger ett extremt stort kaloriunderskott, leder till muskelmassaförlust, hormonella störningar och metabolisk adaptation. Räkna ut ditt TDEE och dra av max 500 kcal/dag för en säker och hållbar viktnedgång.',
  },
  {
    question: 'Varför skiljer sig BMR-formler åt?',
    answer:
      'Olika formler bygger på olika studiegrupper och mätmetoder. Mifflin-St Jeor (1990) anses generellt mest träffsäker för friska vuxna. Harris-Benedict (1919, reviderad 1984) är äldre men fortfarande använd. Cunningham tar hänsyn till muskelmassa och är bättre för mycket muskulösa individer. Ingen formel är perfekt — alla ger uppskattningar med en felmarginal på ±10–15%.',
  },
  {
    question: 'Vad händer med BMR om jag tappar muskler?',
    answer:
      'BMR sjunker. Muskelvävnad är metaboliskt aktiv och förbränner fler kalorier i vila än fettvävnad. Tappar du muskelmassa — exempelvis via aggressiv kalorirestrik­tion utan styrketräning — sjunker ditt BMR och därmed ditt TDEE. Det gör det svårare att bibehålla viktnedgången. Tillräckligt proteinintag (1,6–2,2 g/kg) och styrketräning under en cut bevarar muskelmassan.',
  },
  {
    question: 'Hur ökar jag mitt BMR?',
    answer:
      'Det effektivaste sättet är att öka muskelmassa via styrketräning — muskelceller förbränner mer kalorier i vila än fettceller. Högproteinintag stöder muskeluppbyggnad och har dessutom en viss termisk effekt (TEF). Att undvika långa perioder av extrem kaloribegränsning skyddar muskelmassan och håller BMR uppe på sikt.',
  },
]

const SOURCES = [
  {
    text: 'Harris JA & Benedict FG (1919). A biometric study of human basal metabolism. Proc Natl Acad Sci.',
  },
  {
    text: 'Mifflin MD et al. (1990). A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr.',
  },
  {
    text: 'Roza AM & Shizgal HM (1984). The Harris Benedict equation reevaluated: resting energy requirements and the body cell mass. Am J Clin Nutr.',
  },
  {
    text: 'Weir JB de V. (1949). New methods for calculating metabolic rate with special reference to protein metabolism. Journal of Physiology. 109(1–2):1–9.',
  },
  {
    text: 'FAO/WHO/UNU (2001). Human energy requirements. Report of a Joint Expert Consultation.',
  },
  {
    text: 'Cunningham JJ. (1991). Body composition as a determinant of energy expenditure. Am J Clin Nutr. 54(6):963–969.',
  },
]

export default function VadArBmrPage() {
  return (
    <>
      <Seo
        title="Vad är BMR? Basalmetabolism förklarat | CalculEat"
        description="BMR (Basal Metabolic Rate) är de kalorier din kropp förbränner i absolut vila. Lär dig vad BMR är, hur det skiljer sig från TDEE och varför du aldrig ska äta på ditt BMR."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <ArticleLayout
        title="Vad är BMR? Basalmetabolism förklarat"
        intro="BMR (Basal Metabolic Rate) är de kalorier din kropp förbränner i absolut vila — utan rörelse, mat eller aktivitet. Det är kroppens minimala energibehov för att hålla hjärta, lungor, hjärna och organ igång. BMR är grunden för att räkna ut ditt faktiska kaloribehov, men det är inte siffran du ska äta på."
        moneyPageHref="/kalkylatorer/tdee-kalkylator"
        moneyPageLabel="Räkna ut ditt faktiska kaloribehov med TDEE-kalkylatorn"
        faqItems={FAQ_ITEMS}
        sources={SOURCES}
        relatedCalculators={[
          { href: '/kalkylatorer/bmr-kalkylator', label: 'BMR Kalkylator' },
          { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
          { href: '/kalkylatorer/kaloriunderskott', label: 'Kaloribrist Kalkylator' },
        ]}
        relatedArticles={[
          { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
          { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
          { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
        ]}
        breadcrumb={[
          { label: 'Artiklar', href: '/artiklar' },
          { label: 'Vad är BMR?', href: CANONICAL },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          Vad bestämmer ditt BMR?
        </h2>
        <p>
          Den viktigaste determinanten för BMR är fettfri massa (FFM) — muskler, organ och skelett.
          Fettfri massa uppskattas förklara omkring 80% av variationen i BMR mellan individer. Det
          förklarar varför vältränade personer med hög muskelmassa har ett högre BMR än personer med
          samma totalvikt men mer kroppsfett.
        </p>
        <p className="mt-3">
          Hos personer med låg fysisk aktivitet utgör BMR vanligtvis cirka 60% av total
          energiförbrukning, och ännu mer hos individer med mycket låg rörelseaktivitet såsom
          sederade och mekaniskt ventilerade patienter på intensivvårdsavdelningar.
        </p>
        <p className="mt-3">
          Övriga faktorer som påverkar BMR: ålder (BMR sjunker ca 1–2% per decennium från
          30-årsåldern pga. minskad muskelmassa), kön (män har i genomsnitt högre BMR per kg
          kroppsvikt tack vare högre andel muskelmassa) samt hormonbalans (framför allt
          sköldkörtelhormoner).
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Hur mäts och beräknas BMR?
        </h2>
        <p>
          BMR mäts under strikt kontrollerade laboratorieförhållanden: efter sömn, i fastande
          tillstånd och i termoneutral miljö. Guldstandarden är indirekt kalorimetri via Weirs
          ekvation (1949), som beräknar energiförbrukning från syreförbrukning och
          koldioxidproduktion.
        </p>
        <p className="mt-3">
          I praktiska sammanhang används oftare RMR (Resting Metabolic Rate), uppmätt när som helst
          under dagen, vilket kan skilja sig från BMR med upp till 10%. De flesta
          online-kalkylatorer — inklusive CalculEat — beräknar tekniskt sett RMR, men använder
          termen BMR i vardagligt bruk.
        </p>
        <p className="mt-3">
          När direkt mätning inte är tillgängligt används prediktiva ekvationer. De vanligaste är:
        </p>
        <ul className="space-y-1 pl-4 list-disc mt-2">
          <li>
            <strong>Mifflin-St Jeor (1990)</strong> — rekommenderas för friska vuxna, ger bäst
            träffsäkerhet i moderna populationer
          </li>
          <li>
            <strong>Harris-Benedict (reviderad 1984)</strong> — äldre men fortfarande vanlig
          </li>
          <li>
            <strong>Cunningham (1991)</strong> — beräknar RMR baserat på fettfri massa, bättre för
            vältränade individer
          </li>
        </ul>
        <p className="mt-3">
          Alla prediktiva formler har en felmarginal på ±10–15% på individnivå. Verklig vikttrend
          under 2–3 veckor är alltid ett mer tillförlitligt mått än formelbaserade estimat.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Varför ska du inte äta på ditt BMR?
        </h2>
        <p>
          BMR är det absoluta minimum — inte ett kalorimål. Att äta exakt på BMR innebär att du ger
          kroppen precis vad den behöver för att överleva i absolut vila, men ingenting till
          rörelse, matsmältning eller normal daglig aktivitet.
        </p>
        <p className="mt-3">
          Konsekvenserna av att äta på BMR under längre tid inkluderar förlust av muskelmassa,
          trötthet, hormonella störningar och metabolisk adaptation — kroppen sänker sitt eget BMR
          för att spara energi. Det gör viktnedgången allt svårare.
        </p>
        <p className="mt-3">
          Det rätta är att räkna ut ditt <strong>TDEE</strong> (BMR × aktivitetsfaktor) och skapa
          ett måttligt underskott därifrån — typiskt 300–500 kcal/dag för hållbar viktnedgång.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Från BMR till kalorimål — steg för steg
        </h2>
        <ol className="list-decimal list-inside space-y-2 text-neutral-800">
          <li>
            Räkna ut ditt <strong>BMR</strong> med Mifflin-St Jeor-formeln (ålder, kön, vikt,
            längd).
          </li>
          <li>
            Multiplicera med din <strong>aktivitetsfaktor (PAL)</strong> — stillasittande (×1,2)
            till extremt aktiv (×1,9).
          </li>
          <li>
            Resultatet är ditt <strong>TDEE</strong> — ditt underhållsbehov.
          </li>
          <li>
            Dra av <strong>300–500 kcal/dag</strong> för viktnedgång, eller lägg till 200–300
            kcal/dag för muskeluppbyggnad.
          </li>
        </ol>
      </ArticleLayout>
    </>
  )
}
