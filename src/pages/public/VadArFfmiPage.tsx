import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import FFMIContent from '@/components/info/FFMIContent'
import NormalizedFFMIContent from '@/components/info/NormalizedFFMIContent'

const CANONICAL = 'https://calculeat.se/artiklar/vad-ar-ffmi'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Vad är FFMI? Fat-Free Mass Index förklarat',
  description:
    'FFMI (Fat-Free Mass Index) mäter muskelmassa i relation till längd — oberoende av fettprocent. Lär dig vad FFMI är, hur det räknas ut och vad naturliga gränsvärden innebär.',
  url: CANONICAL,
  publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
  inLanguage: 'sv-SE',
}

const FAQ_ITEMS = [
  {
    question: 'Vad är ett bra FFMI-värde?',
    answer:
      'För män anses FFMI 18–20 vara tränad nivå, 20–22 avancerad och över 22 exceptionell. Naturgränsen för män utan dopning är enligt Kouri 1995 ungefär FFMI 25 (normaliserat). För kvinnor är motsvarande gränsvärden lägre — FFMI 16–18 anses avancerat, och naturliga elitidrottare sällan överstiger FFMI 19–20.',
  },
  {
    question: 'Vad är skillnaden mellan FFMI och normaliserat FFMI?',
    answer:
      'FFMI beräknas direkt från muskelmassa och längd. Normaliserat FFMI justerar för längd med formeln FFMI + 6,1 × (1,8 − längd i meter), vilket gör att kortare och längre individer kan jämföras på lika villkor. Normaliserat FFMI är det värde som används vid jämförelser och referenstabeller.',
  },
  {
    question: 'Behöver jag veta min fettprocent för att räkna ut FFMI?',
    answer:
      'Ja — FFMI baseras på din fettfria massa (LBM), som kräver att du vet din fettprocent. Du kan uppskatta din fettprocent med US Navy-metoden (mätband) via vår kroppsfettskalkylator, eller med mer precisa metoder som DEXA. En grov uppskattning ger ett grovt FFMI-värde.',
  },
  {
    question: 'Kan FFMI användas för att identifiera dopninganvändning?',
    answer:
      'FFMI är ett av flera verktyg som används för att bedöma sannolikheten för naturlig muskeluppbyggnad. Kouri et al. (1995) visade att naturliga styrkelyftare sällan överstiger normaliserat FFMI 25, medan dopade ofta låg över 28. Det är inte ett definitivt test — genetik, träningserfarenhet och mätosäkerhet spelar in.',
  },
  {
    question: 'Är FFMI bättre än BMI för muskulösa personer?',
    answer:
      'Ja. BMI kan klassificera muskulösa individer som "överviktiga" trots låg fettprocent. FFMI separerar muskelmassa från fettvävnad och ger en mer rättvisande bild av en vältränad kropp. BMI är ett bra grovt screeningmått, men FFMI är mer meningsfullt för personer som styrketränar aktivt.',
  },
]

const SOURCES = [
  {
    text: 'Kouri EM et al. (1995). Fat-free mass index in users and nonusers of anabolic-androgenic steroids. Clin J Sport Med.',
  },
  {
    text: 'Schutz Y et al. (2002). Fat-free mass index and fat mass index percentiles in Caucasians aged 18–98 y. Int J Obes.',
  },
]

export default function VadArFfmiPage() {
  return (
    <>
      <Seo
        title="Vad är FFMI? Fat-Free Mass Index förklarat | CalculEat"
        description="FFMI (Fat-Free Mass Index) mäter muskelmassa i relation till längd — oberoende av fettprocent. Lär dig vad FFMI är, hur det räknas ut och vad naturliga gränsvärden innebär."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <ArticleLayout
        title="Vad är FFMI? Fat-Free Mass Index förklarat"
        intro="FFMI (Fat-Free Mass Index) mäter din fettfria muskelmassa i relation till längd. Till skillnad från BMI påverkas inte FFMI av din fettprocent — det är ett renodlat mått på muskeluppbyggnad. FFMI används för att bedöma träningsnivå och, i forskning, för att särskilja naturliga idrottare från dopade."
        moneyPageHref="/kalkylatorer/tdee-kalkylator"
        moneyPageLabel="Räkna ut ditt kaloribehov för muskeluppbyggnad"
        faqItems={FAQ_ITEMS}
        sources={SOURCES}
        relatedCalculators={[
          { href: '/kalkylatorer/ffmi-kalkylator', label: 'FFMI Kalkylator' },
          { href: '/kalkylatorer/kroppsfett', label: 'Kroppsfett Kalkylator' },
          { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
          { href: '/kalkylatorer/bulk-kalkylator', label: 'Bulk Kalkylator' },
        ]}
        relatedArticles={[
          { href: '/artiklar/bmi-vs-kroppsfett', label: 'BMI vs Kroppsfett' },
          { href: '/artiklar/vad-ar-bmr', label: 'Vad är BMR?' },
          { href: '/artiklar/bulk-och-cut', label: 'Bulk och Cut' },
          { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
        ]}
        breadcrumb={[
          { label: 'Artiklar', href: '/artiklar' },
          { label: 'Vad är FFMI?', href: CANONICAL },
        ]}
      >
        <FFMIContent />

        <div className="mt-8">
          <NormalizedFFMIContent />
        </div>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Hur förbättrar du ditt FFMI?
        </h2>
        <p>
          FFMI ökar när du bygger muskelmassa — det är enkelt. Det praktiska innebär en kombination
          av konsekvent styrketräning, tillräckligt proteinintag (1,6–2,2 g/kg kroppsvikt) och ett
          lätt kalorisurplus (bulk).
        </p>
        <p className="mt-3">
          Viktigt: att gå ner i fettprocent utan att bygga muskler förbättrar inte FFMI — det
          förblir oförändrat. FFMI mäter enbart fettfri massa, inte hur snygg din kropp ser ut i
          spegeln.
        </p>
        <p className="mt-3">
          Räkna ut ditt TDEE för att sätta rätt kalorimål — antingen ett litet surplus för
          muskeluppbyggnad, eller underhållsintag med fokus på styrketräning.
        </p>
      </ArticleLayout>
    </>
  )
}
