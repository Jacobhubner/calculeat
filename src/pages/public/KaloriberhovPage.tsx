import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'

const CANONICAL = 'https://calculeat.se/artiklar/kaloribehov'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Hur räknar man ut sitt kaloribehov? Komplett guide (2026)',
  description:
    'Lär dig hur du räknar ut ditt individuella kaloribehov — från BMR och TDEE till kaloribrist och bulk. Komplett guide med vetenskaplig grund.',
  url: CANONICAL,
  publisher: {
    '@type': 'Organization',
    name: 'CalculEat',
    url: 'https://calculeat.se',
  },
  inLanguage: 'sv-SE',
}

const FAQ_ITEMS = [
  {
    question: 'Hur räknar man ut sitt kaloribehov?',
    answer:
      'Räkna ut ditt BMR (basalmetabolism) med Mifflin-St Jeor-formeln och multiplicera sedan med en aktivitetsfaktor (PAL) för att få ditt TDEE. TDEE är ditt underhållsbehov — det antal kalorier du behöver äta för att hålla vikten stabil.',
  },
  {
    question: 'Är 1200 kcal per dag tillräckligt?',
    answer:
      'För de flesta vuxna är 1200 kcal/dag för lågt och leder till för stor kaloribrist, muskelmassaförlust och nutritionsbrist. De flesta behöver minst 1500–2000+ kcal beroende på storlek och aktivitetsnivå. Räkna ut ditt TDEE och dra av max 500 kcal för en hälsosam viktnedgång.',
  },
  {
    question: 'Hur påverkar träning kaloribehovet?',
    answer:
      'Träning ökar din TDEE via EAT (planerad träning). Men kroppen kan kompensera med minskad NEAT (oplanerad rörelse). Praktiskt tumregel: lägg inte in hela träningskalorier som "extra" — välj en aktivitetsfaktor som återspeglar din totala aktivitetsnivå.',
  },
  {
    question: 'Hur snabbt kan man gå ner i vikt utan att tappa muskler?',
    answer:
      'Ca 0,5–1% av kroppsvikten per vecka är ett bra tempo för att minimera muskelmassaförlust. För en person på 80 kg innebär det ca 0,4–0,8 kg/vecka. Det kräver en kaloribrist på 400–800 kcal/dag kombinerat med tillräckligt proteinintag (ca 1,6–2,2 g/kg kroppsvikt).',
  },
]

const SOURCES = [
  {
    text: 'Mifflin MD et al. (1990). A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr.',
  },
  { text: 'FAO/WHO/UNU (2001). Human energy requirements. Report of a Joint Expert Consultation.' },
  {
    text: 'Hall KD et al. (2012). Quantification of the effect of energy imbalance on bodyweight. Lancet.',
  },
]

export default function KaloriberhovPage() {
  return (
    <>
      <Seo
        title="Hur räknar man ut sitt kaloribehov? Komplett guide (2026) | CalculEat"
        description="Lär dig hur du räknar ut ditt individuella kaloribehov — från BMR och TDEE till kaloribrist och bulk. Vetenskaplig grund, praktiska tips."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <ArticleLayout
        title="Hur räknar man ut sitt kaloribehov? Komplett guide"
        intro="Ditt kaloribehov beror på din basalmetabolism (BMR), aktivitetsnivå och ditt mål — viktnedgång, underhåll eller muskeluppbyggnad. Den här guiden förklarar steg för steg hur du räknar ut ditt individuella kaloribehov med vetenskapliga metoder."
        moneyPageHref="/kalkylatorer/tdee-kalkylator"
        moneyPageLabel="Räkna ut ditt kaloribehov direkt med vår TDEE-kalkylator"
        faqItems={FAQ_ITEMS}
        sources={SOURCES}
        relatedCalculators={[
          { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
          { href: '/kalkylatorer/kaloriunderskott', label: 'Kaloribrist Kalkylator' },
          { href: '/kalkylatorer/bmi-kalkylator', label: 'BMI Kalkylator' },
        ]}
        relatedArticles={[
          { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
          { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
          { href: '/artiklar/bulk-och-cut', label: 'Bulk och cut — kalorier för muskeluppbyggnad' },
        ]}
        breadcrumb={[
          { label: 'Artiklar', href: '/artiklar' },
          { label: 'Kaloribehov', href: CANONICAL },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          Steg 1: Räkna ut din BMR
        </h2>
        <p>
          BMR (Basal Metabolic Rate, basalmetabolism) är de kalorier din kropp förbränner i absolut
          vila — enbart för att hålla hjärta, hjärna och organ igång. Det är grunden för alla
          kaloriuträkningar.
        </p>
        <p>
          Den mest använda och validerade formeln för de flesta vuxna är{' '}
          <strong>Mifflin-St Jeor</strong>:
        </p>
        <ul className="space-y-1 pl-4 list-disc">
          <li>
            <strong>Män:</strong> BMR = (9,99 × vikt) + (6,25 × längd) − (4,92 × ålder) + 5
          </li>
          <li>
            <strong>Kvinnor:</strong> BMR = (9,99 × vikt) + (6,25 × längd) − (4,92 × ålder) − 161
          </li>
        </ul>
        <p className="text-sm text-neutral-500">Vikt i kg, längd i cm, ålder i år.</p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Steg 2: Räkna ut ditt TDEE med aktivitetsfaktor
        </h2>
        <p>
          TDEE (Total Daily Energy Expenditure) är ditt totala kaloribehov — BMR multiplicerat med
          din PAL-faktor (Physical Activity Level).
        </p>
        <div className="overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full text-sm">
            <thead className="bg-neutral-50 border-b border-neutral-200">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-neutral-700">Aktivitetsnivå</th>
                <th className="px-4 py-3 text-left font-medium text-neutral-700">
                  Multiplier (män)
                </th>
                <th className="px-4 py-3 text-left font-medium text-neutral-700">
                  Multiplier (kvinnor)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {[
                ['Stillasittande (kontorsjobb)', '1.3', '1.3'],
                ['Lätt aktiv (1–3 pass/vecka)', '1.6', '1.5'],
                ['Måttligt aktiv (3–5 pass/vecka)', '1.7', '1.6'],
                ['Mycket aktiv (6–7 pass/vecka)', '2.1', '1.9'],
                ['Extremt aktiv (hårt fysiskt jobb + träning)', '2.4', '2.2'],
              ].map(([level, m, f]) => (
                <tr key={level}>
                  <td className="px-4 py-3 text-neutral-700">{level}</td>
                  <td className="px-4 py-3 text-neutral-600">{m}</td>
                  <td className="px-4 py-3 text-neutral-600">{f}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          Exempel: En man, 30 år, 80 kg, 180 cm, tränar 4 gånger/vecka.
          <br />
          BMR = (9,99 × 80) + (6,25 × 180) − (4,92 × 30) + 5 = 1 895 kcal
          <br />
          TDEE = 1 895 × 1,7 = <strong>3 222 kcal/dag</strong>
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Steg 3: Justera för ditt mål
        </h2>

        <h3 className="font-semibold text-neutral-800 mb-2">Viktnedgång (cut)</h3>
        <p>
          Ät 300–500 kcal under ditt TDEE. Det ger ca 0,3–0,5 kg viktnedgång per vecka —
          tillräckligt långsamt för att behålla muskelmassa. Kombinera med tillräckligt protein
          (1,6–2,2 g/kg) för bästa resultat.
        </p>

        <h3 className="font-semibold text-neutral-800 mt-4 mb-2">Muskeluppbyggnad (bulk)</h3>
        <p>
          Ät 200–400 kcal över ditt TDEE. Det ger ett litet överskott för muskeltillväxt med
          minimalt fettupplagrande. Mer än 500 kcal/dag i överskott leder ofta till onödig
          fettupplagring.
        </p>

        <h3 className="font-semibold text-neutral-800 mt-4 mb-2">Underhåll</h3>
        <p>
          Matcha ditt TDEE. Bra under pausperioder, rehabilitering eller för att stabilisera vikt
          efter en längre kur.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Varför stämmer inte alltid kalkylatorn?
        </h2>
        <p>
          TDEE-kalkylatorer ger en uppskattning med en felmarginal på typiskt ±10–15%. Faktorer som
          påverkar det verkliga värdet:
        </p>
        <ul className="space-y-1 pl-4 list-disc">
          <li>Muskelmassa (mer muskler = högre BMR)</li>
          <li>Sköldkörtelhormon och annan hormonbalans</li>
          <li>Sömnkvalitet</li>
          <li>Matens termiska effekt (proteiner kräver mer energi att smälta)</li>
          <li>Adaptiv termogenes (kroppen sänker metabolism vid lång kaloribrist)</li>
        </ul>
        <p>
          <strong>Praktiskt råd:</strong> Använd kalkylatorn som startpunkt. Följ upp din vikt under
          2–3 veckor och justera kalorimålet om du inte ser förväntat resultat.
        </p>
      </ArticleLayout>
    </>
  )
}
