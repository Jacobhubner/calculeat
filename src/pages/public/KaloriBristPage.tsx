import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'

const CANONICAL = 'https://calculeat.se/artiklar/kaloribrist'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Hur stor kaloribrist ska man ha för viktnedgång?',
  description:
    'Hur stor kaloribrist är lagom för viktnedgång utan att tappa muskler? Lär dig vetenskapliga riktlinjer för tempo, protein och hållbar kaloribrist.',
  url: CANONICAL,
  publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
  inLanguage: 'sv-SE',
}

const FAQ_ITEMS = [
  {
    question: 'Hur stor kaloribrist ger 1 kg viktnedgång per vecka?',
    answer:
      '1 kg fett innehåller ca 7 700 kcal. För att tappa 1 kg/vecka krävs ett underskott på ca 1 100 kcal/dag — vilket är mycket aggressivt och innebär hög risk för muskelmassaförlust. 0,5 kg/vecka (ca 550 kcal/dag i underskott) är ett mer hållbart tempo.',
  },
  {
    question: 'Kan man äta för lite och ändå inte gå ner i vikt?',
    answer:
      'Ja, adaptiv termogenes kan bromsa viktnedgången vid lång kaloribrist. Kroppen sänker sin NEAT och metabolism. Lösning: ta en "diet break" på 1–2 veckor på underhållsintag för att återställa metabolism, sedan fortsätt.',
  },
  {
    question: 'Hur mycket protein behöver man under kaloribrist?',
    answer:
      '1,6–2,2 g protein per kg kroppsvikt per dag är rekommenderat för att bevara muskelmassa under kaloribrist. Vid aggressivare kaloribrist eller intensiv träning, sikta på övre delen av intervallet (2,0–2,2 g/kg).',
  },
  {
    question: 'Är det farligt med kaloribrist?',
    answer:
      'En måttlig kaloribrist (300–500 kcal/dag) är inte farlig för friska vuxna. En mycket stor brist (>1000 kcal/dag) ökar risken för muskelmassaförlust, nutritionsbrist, trötthet och hormonella störningar. Rådfråga sjukvård vid extrem restriktion eller om du har underliggande sjukdomar.',
  },
]

const SOURCES = [
  {
    text: 'Helms ER et al. (2014). Evidence-based recommendations for natural bodybuilding contest preparation. J Int Soc Sports Nutr.',
  },
  {
    text: 'Hall KD et al. (2012). Quantification of the effect of energy imbalance on bodyweight. Lancet.',
  },
  {
    text: 'Trexler ET et al. (2014). Metabolic adaptation to weight loss: implications for the athlete. J Int Soc Sports Nutr.',
  },
]

export default function KaloriBristPage() {
  return (
    <>
      <Seo
        title="Hur stor kaloribrist ska man ha för viktnedgång? | CalculEat"
        description="Hur stor kaloribrist är lagom? Vetenskapliga riktlinjer för tempo, protein och hållbar viktnedgång utan att tappa muskler."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <ArticleLayout
        title="Hur stor kaloribrist ska man ha för viktnedgång?"
        intro="En kaloribrist på 300–500 kcal per dag under ditt TDEE är det vetenskapligt rekommenderade tempot för hållbar viktnedgång utan att tappa muskler. Det ger ca 0,3–0,5 kg viktnedgång per vecka — tillräckligt snabbt för att se resultat, tillräckligt långsamt för att kroppen ska anpassa sig hälsosamt."
        moneyPageHref="/kalkylatorer/kaloriunderskott"
        moneyPageLabel="Räkna ut ditt exakta kaloriintag med kaloribrist-kalkylatorn"
        faqItems={FAQ_ITEMS}
        sources={SOURCES}
        relatedCalculators={[
          { href: '/kalkylatorer/kaloriunderskott', label: 'Kaloribrist Kalkylator' },
          { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
        ]}
        relatedArticles={[
          { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
          { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
          { href: '/artiklar/bulk-och-cut', label: 'Bulk och cut' },
        ]}
        breadcrumb={[
          { label: 'Artiklar', href: '/artiklar' },
          { label: 'Kaloribrist', href: CANONICAL },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          Varför spelar tempo roll?
        </h2>
        <p>
          Viktnedgång handlar inte enbart om att gå ner i vikt på vågen — det handlar om att behålla
          muskelmassa och tappa fett. Går du ned för snabbt ökar andelen muskelmassa du förlorar,
          vilket försämrar din ämnesomsättning på lång sikt och gör det svårare att hålla vikten
          efteråt.
        </p>
        <p>
          <strong>Tumregel:</strong> Tappa inte mer än 0,5–1% av kroppsvikten per vecka.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Tre nivåer av kaloribrist
        </h2>
        <div className="space-y-4">
          {[
            {
              title: 'Mild: 200–300 kcal/dag',
              tempo: 'ca 0,2–0,3 kg/vecka',
              desc: 'Lämplig nybörjare, nära tävling eller om du har lite fett att tappa. Mycket låg risk för muskelmassaförlust.',
              color: 'bg-green-50 border-green-200',
            },
            {
              title: 'Måttlig: 300–500 kcal/dag',
              tempo: 'ca 0,3–0,5 kg/vecka',
              desc: 'Den vetenskapliga standarden. Balans mellan tempo och muskelmassabevarande. Funkar för de flesta.',
              color: 'bg-blue-50 border-blue-200',
            },
            {
              title: 'Aggressiv: 500–1000 kcal/dag',
              tempo: 'ca 0,5–1 kg/vecka',
              desc: 'Acceptabelt vid hög fettprocent. Kräver högt proteinintag (2,0–2,2 g/kg) och styrketräning för att skydda muskelmassa.',
              color: 'bg-yellow-50 border-yellow-200',
            },
          ].map(({ title, tempo, desc, color }) => (
            <div key={title} className={`rounded-xl border p-4 ${color}`}>
              <div className="font-semibold text-neutral-800 mb-1">{title}</div>
              <div className="text-xs text-neutral-500 mb-2">Tempo: {tempo}</div>
              <div className="text-sm text-neutral-700">{desc}</div>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Proteinets roll under kaloribrist
        </h2>
        <p>
          Det viktigaste du kan göra för att bevara muskelmassa under en diet är tillräckligt
          proteinintag. Forskning stöder 1,6–2,2 g protein per kg kroppsvikt per dag.
        </p>
        <p>
          Protein har också hög mättnadseffekt och hög TEF (ca 25–30% av proteinkalorierna används
          till att smälta proteinet) — vilket gör det extra värdefullt under kaloribrist.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Adaptiv termogenes — varför planar vikten ut?
        </h2>
        <p>
          Vid lång kaloribrist sänker kroppen sin ämnesomsättning som ett försvar mot svält. Du rör
          dig instinktivt mindre (NEAT minskar) och BMR sjunker något. Det är normalt och inte ett
          tecken på att något är fel.
        </p>
        <p>
          <strong>Lösning:</strong> Ta en &ldquo;diet break&rdquo; på 1–2 veckor på underhållsintag
          (ditt TDEE) var 8–12 vecka. Det återställer hormonbalansen, minskar adaptiv termogenes och
          gör nästa dietfas effektivare.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">Praktisk checklista</h2>
        <ul className="space-y-2 pl-4 list-disc">
          <li>Räkna ut ditt TDEE med kalkylator</li>
          <li>Dra av 400 kcal för ett bra starttempo</li>
          <li>Ät 1,8–2,2 g protein per kg kroppsvikt</li>
          <li>Träna styrka 2–4 ggr/vecka för att skydda muskelmassa</li>
          <li>Justera kalorimålet var 2–3 vecka baserat på verklig viktutveckling</li>
          <li>Planera in diet break var 8–12 vecka</li>
        </ul>
      </ArticleLayout>
    </>
  )
}
