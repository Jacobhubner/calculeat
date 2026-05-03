import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'

const CANONICAL = 'https://calculeat.se/artiklar/bmr-vs-tdee'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'BMR vs TDEE — Vad är skillnaden och vilken ska du använda?',
  description:
    'BMR är din viloförbränning. TDEE är vad du faktiskt förbränner per dag. Lär dig skillnaden och varför du alltid ska räkna kalorier utifrån TDEE — inte BMR.',
  url: CANONICAL,
  publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
  inLanguage: 'sv-SE',
}

const FAQ_ITEMS = [
  {
    question: 'Vilken siffra ska jag använda för kaloriplanering — BMR eller TDEE?',
    answer:
      'Alltid TDEE. BMR är enbart viloförbränningen — den täcker inte din rörelse, matsmältning eller träning. TDEE inkluderar allt och är det faktiska antalet kalorier du förbränner per dag. Sätter du ett kalorimål baserat på BMR skapar du ett okontrollerat stort underskott som leder till muskelmassaförlust och metabolisk adaptation.',
  },
  {
    question: 'Kan jag äta på BMR för att gå ner i vikt snabbt?',
    answer:
      'Det är inte rekommenderat. Att äta på BMR innebär ett extremt kaloriunderskott för de flesta — ofta 700–1200 kcal under TDEE. Det leder till snabb viktnedgång men med stor förlust av muskelmassa, trötthet och hormonella störningar. En hållbar viktnedgång bygger på ett måttligt underskott om 300–500 kcal under ditt TDEE.',
  },
  {
    question: 'Hur mycket högre är TDEE jämfört med BMR?',
    answer:
      'Det beror på aktivitetsnivå. För en stillasittande person är TDEE ungefär 30% högre än BMR (×1,3). En måttligt aktiv person har ett TDEE som är 60–70% högre (×1,6–1,7). En mycket aktiv person kan ha ett TDEE mer än dubbelt sitt BMR. Det är aktivitetsfaktorn (PAL) som avgör skillnaden.',
  },
  {
    question: 'Vad är PAL och hur påverkar det TDEE?',
    answer:
      'PAL (Physical Activity Level) är en multiplikator som används för att räkna om BMR till TDEE. Den spänner från 1,3 (stillasittande) till 2,4 (extremt aktiv). Du räknar: TDEE = BMR × PAL. PAL tar hänsyn till all rörelse under dagen — inte bara planerad träning utan även promenad, stående arbete och spontan aktivitet (NEAT).',
  },
  {
    question: 'Är BMR och RMR samma sak?',
    answer:
      'Nästan, men inte exakt. BMR (Basal Metabolic Rate) mäts under strikta laboratorieförhållanden — absolut vila, fasta och neutral temperatur. RMR (Resting Metabolic Rate) mäts under mer avslappnade förhållanden och är i praktiken 10–20% högre. I vardagsbruk används begreppen ofta synonymt, och de flesta kalkylatorer beräknar tekniskt sett RMR men kallar det BMR.',
  },
]

const SOURCES = [
  {
    text: 'Mifflin MD et al. (1990). A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr.',
  },
  {
    text: 'FAO/WHO/UNU (2001). Human energy requirements. Report of a Joint Expert Consultation.',
  },
  {
    text: 'Levine JA (2004). Non-exercise activity thermogenesis (NEAT). Nutr Rev.',
  },
]

export default function BmrVsTdeePage() {
  return (
    <>
      <Seo
        title="BMR vs TDEE — Vad är skillnaden och vilken ska du använda? | CalculEat"
        description="BMR är din viloförbränning. TDEE är vad du faktiskt förbränner per dag. Lär dig skillnaden och varför du alltid ska räkna kalorier utifrån TDEE — inte BMR."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <ArticleLayout
        title="BMR vs TDEE — Vad är skillnaden och vilken ska du använda?"
        intro="BMR är viloförbränningen — de kalorier din kropp behöver i absolut vila. TDEE är vad du faktiskt förbränner under en hel dag, inklusive rörelse, träning och matsmältning. Det är en viktig skillnad: du ska alltid planera kalorier utifrån TDEE, aldrig BMR."
        moneyPageHref="/kalkylatorer/tdee-kalkylator"
        moneyPageLabel="Räkna ut ditt TDEE direkt — gratis kalkylator"
        faqItems={FAQ_ITEMS}
        sources={SOURCES}
        relatedCalculators={[
          { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
          { href: '/kalkylatorer/bmr-kalkylator', label: 'BMR Kalkylator' },
          { href: '/kalkylatorer/kaloriunderskott', label: 'Kaloribrist Kalkylator' },
        ]}
        relatedArticles={[
          { href: '/artiklar/vad-ar-bmr', label: 'Vad är BMR?' },
          { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
          { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
          { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
        ]}
        breadcrumb={[
          { label: 'Artiklar', href: '/artiklar' },
          { label: 'BMR vs TDEE', href: CANONICAL },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">Vad är BMR?</h2>
        <p>
          BMR (Basal Metabolic Rate) är de kalorier din kropp förbränner i absolut vila — utan
          rörelse, matsmältning eller yttre aktivitet. Det är energin som går till att hålla hjärta,
          lungor, hjärna och organ igång.
        </p>
        <p className="mt-3">
          BMR räknas ut med formler som Mifflin-St Jeor eller Harris-Benedict, baserat på kön,
          ålder, vikt och längd. Det är utgångspunkten för alla kaloriberäkningar — men det är inte
          siffran du ska äta på.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">Vad är TDEE?</h2>
        <p>
          TDEE (Total Daily Energy Expenditure) är de kalorier du faktiskt förbränner under en dag —
          inklusive all rörelse och aktivitet. TDEE beräknas som:
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 text-center font-medium text-neutral-900">
          TDEE = BMR × Aktivitetsfaktor (PAL)
        </div>
        <p className="mt-3">
          PAL (Physical Activity Level) spänner från 1,3 för stillasittande till 2,1 eller mer för
          mycket aktiva. TDEE inkluderar planerad träning (EAT), spontan rörelse (NEAT) och
          matsmältningens energikostnad (TEF).
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Jämförelse: BMR vs TDEE
        </h2>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-100">
                <th className="text-left p-3 border border-neutral-200 font-semibold">Egenskap</th>
                <th className="text-left p-3 border border-neutral-200 font-semibold">BMR</th>
                <th className="text-left p-3 border border-neutral-200 font-semibold">TDEE</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Vad mäts?', 'Viloförbränning', 'Total daglig förbränning'],
                ['Inkluderar aktivitet?', 'Nej', 'Ja'],
                ['Inkluderar träning?', 'Nej', 'Ja'],
                ['Inkluderar matsmältning?', 'Nej', 'Ja (TEF)'],
                ['Används för?', 'Beräkningsgrund', 'Kalorimål och planering'],
                ['Typisk nivå (70 kg, aktiv)', '~1 600 kcal', '~2 500 kcal'],
              ].map(([prop, bmr, tdee]) => (
                <tr key={prop} className="even:bg-neutral-50">
                  <td className="p-3 border border-neutral-200 font-medium text-neutral-700">
                    {prop}
                  </td>
                  <td className="p-3 border border-neutral-200 text-neutral-600">{bmr}</td>
                  <td className="p-3 border border-neutral-200 text-neutral-600">{tdee}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Varför du alltid ska använda TDEE
        </h2>
        <p>
          Planerar du kalorier utifrån BMR skapar du ett okontrollerat underskott. Exempel: en
          person med BMR 1 700 kcal och TDEE 2 400 kcal som äter 1 700 kcal tror att de är i
          underhåll — men är egentligen i ett 700 kcal-underskott.
        </p>
        <p className="mt-3">
          Det leder till snabb viktnedgång i början, men med stor muskelmassaförlust och metabolisk
          adaptation. Kroppen sänker BMR för att spara energi, vilket gör det svårare att hålla
          viktnedgången.
        </p>
        <p className="mt-3">
          Rätt approach: räkna ut ditt TDEE och skapa ett kontrollerat underskott om{' '}
          <strong>300–500 kcal/dag</strong> — tillräckligt för hållbar viktnedgång utan att offra
          muskelmassa.
        </p>
      </ArticleLayout>
    </>
  )
}
