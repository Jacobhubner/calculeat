import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import BMRvsRMRContent from '@/components/info/BMRvsRMRContent'

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
        <BMRvsRMRContent />

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
            Multiplicera med din <strong>aktivitetsfaktor (PAL)</strong> — stillasittande (×1,3)
            till mycket aktiv (×2,1 eller mer).
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
