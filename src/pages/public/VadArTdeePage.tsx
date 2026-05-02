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
]

const SOURCES = [
  { text: 'FAO/WHO/UNU (2001). Human energy requirements. Report of a Joint Expert Consultation.' },
  { text: 'Levine JA (2004). Non-exercise activity thermogenesis (NEAT). Nutr Rev.' },
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
        <p>TDEE består av fyra delar:</p>
        <ul className="space-y-3 pl-4 list-disc">
          <li>
            <strong>BMR — Basalmetabolism (60–75% av TDEE):</strong> De kalorier kroppen förbränner
            i absolut vila för att hålla organ, hjärna och hjärta igång. Styrs av ålder, kön, vikt
            och muskelmassa.
          </li>
          <li>
            <strong>EAT — Exercise Activity Thermogenesis (15–30%):</strong> Kalorier från planerad
            träning och motion. Varierar enormt — en stillasittande dag vs. ett långt löppass
            skiljer hundratals kcal.
          </li>
          <li>
            <strong>NEAT — Non-Exercise Activity Thermogenesis (5–15%):</strong> Oplanerad rörelse:
            att gå, stå, fidgeta, handla. Mycket underskattat — skillnaden mellan en
            &ldquo;aktiv&rdquo; och &ldquo;stillasittande&rdquo; person utanför gymmet kan vara
            500–1000 kcal/dag.
          </li>
          <li>
            <strong>TEF — Thermic Effect of Food (ca 10%):</strong> Energi det kostar att smälta och
            metabolisera maten. Protein har högst TEF (20–30% av kalorierna i proteinet), fett lägst
            (0–3%).
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">Hur beräknas TDEE?</h2>
        <p>
          Steg 1: Räkna ut BMR med en beprövad formel, exv. Mifflin-St Jeor. Steg 2: Multiplicera
          med en PAL-faktor (Physical Activity Level) som speglar din aktivitetsnivå.
        </p>
        <p>
          Exempel: BMR 1 800 kcal × PAL 1.6 (lätt aktiv) = <strong>2 880 kcal TDEE</strong>.
        </p>
        <p>
          Det finns flera PAL-system med olika granularitet — från enkla faktorer (1.2–1.9) till
          detaljerade beräkningar baserade på träningsdagar, intensitet och antal steg. Vår
          TDEE-kalkylator använder FAO/WHO/UNU-systemet som är vetenskapligt validerat.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Hur använder man TDEE i praktiken?
        </h2>
        <p>
          TDEE är ditt <em>underhållsbehov</em>. Beroende på mål:
        </p>
        <ul className="space-y-2 pl-4 list-disc">
          <li>
            <strong>Viktnedgång:</strong> Ät 300–500 kcal under TDEE → ca 0,3–0,5 kg/vecka
          </li>
          <li>
            <strong>Muskeluppbyggnad:</strong> Ät 200–400 kcal över TDEE → liten bulk med minimal
            fettupplagring
          </li>
          <li>
            <strong>Underhåll:</strong> Ät på TDEE → stabil vikt
          </li>
        </ul>
        <p>
          Kalkylatorn ger en uppskattning. Följ upp din vikt under 2–3 veckor och justera om
          resultatet inte stämmer med förväntan.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Varför sjunker TDEE under en diet?
        </h2>
        <p>
          Adaptiv termogenes — kroppen sänker sin metabolism som svar på lång kaloribrist.
          Konsekvenser: NEAT minskar (kroppen rör sig instinktivt mindre), BMR sjunker något och
          matsmältningens effektivitet ökar. Det är en av anledningarna till att viktnedgång bromsar
          upp trots oförändrat intag. Lösning: ta regelbundna &ldquo;diet breaks&rdquo; (kortare
          perioder på underhållsintag) för att återställa metabolism.
        </p>
      </ArticleLayout>
    </>
  )
}
