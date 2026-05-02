import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'

const CANONICAL = 'https://calculeat.se/artiklar/bulk-och-cut'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Bulk och Cut — Kalorier för muskeluppbyggnad och fettförbränning',
  description:
    'Lär dig hur bulk och cut fungerar, hur mycket kalorier du ska äta i varje fas och hur du optimerar för muskeluppbyggnad och fettförbränning.',
  url: CANONICAL,
  publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
  inLanguage: 'sv-SE',
}

const FAQ_ITEMS = [
  {
    question: 'Vad är bulk och cut?',
    answer:
      'Bulk och cut är två faser i ett träningscykel. Under bulk äter du i kalorioverskott för att maximera muskeluppbyggnad. Under cut äter du i kaloribrist för att tappa fett och bevara muskelmassa. Alternativen är "recomp" (äta på underhåll, bygga muskler och tappa fett långsamt) eller "mini cut" (kortare, aggressivare fettförbrännig).',
  },
  {
    question: 'Hur många kalorier ska man äta på bulk?',
    answer:
      'En "lean bulk" på 200–400 kcal över TDEE ger optimal muskeluppbyggnad med minimal fettupplagring. Mer än 500 kcal i överskott leder ofta till onödig fettupplagring utan proportionellt mer muskeltillväxt.',
  },
  {
    question: 'Hur länge ska man bulka innan man cutter?',
    answer:
      'En typisk bulkfas är 3–6 månader. Avsluta bulk när fettprocenten blivit för hög (ca 15–18% för män, 25–30% för kvinnor). Cutfasen bör vara tillräckligt lång för att tappa tillbaka till önskad fettprocent utan att stressa kroppen.',
  },
  {
    question: 'Kan man bygga muskler och tappa fett samtidigt?',
    answer:
      'Ja — "body recomposition" fungerar, men kräver tid och är mest effektivt för nybörjare, personer med hög fettprocent eller de som återkommer till träning efter ett uppehåll. Erfarna atleter med låg fettprocent får bättre resultat av separata bulk- och cutfaser.',
  },
  {
    question: 'Hur mycket protein behöver man under bulk?',
    answer:
      '1,6–2,2 g protein per kg kroppsvikt per dag. Protein stimulerar muskelproteinsyntes och skyddar mot fettupplagring. Under bulk räcker ofta den nedre delen av intervallet (1,6–1,8 g/kg).',
  },
]

const SOURCES = [
  {
    text: 'Morton RW et al. (2018). A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength in healthy adults. Br J Sports Med.',
  },
  {
    text: 'Barakat C et al. (2020). Body Recomposition: Can Trained Individuals Build Muscle and Lose Fat at the Same Time? Strength Cond J.',
  },
]

export default function BulkOchCutPage() {
  return (
    <>
      <Seo
        title="Bulk och Cut — Kalorier för muskeluppbyggnad och fettförbränning | CalculEat"
        description="Hur bulk och cut fungerar, hur många kalorier du ska äta i varje fas och hur du optimerar din träningscykel för muskeluppbyggnad och fettförbränning."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <ArticleLayout
        title="Bulk och Cut — Kalorier för muskeluppbyggnad och fettförbränning"
        intro="Bulk och cut är de två faserna i en klassisk träningscykel. Under bulk äter du i kalorioverskott för att maximera muskeluppbyggnad. Under cut äter du i kaloribrist för att tappa fett och bevara den muskelmassa du byggt. Nyckeln är att veta exakt hur stora överskott och underskott du ska sikta på."
        moneyPageHref="/kalkylatorer/tdee-kalkylator"
        moneyPageLabel="Räkna ut ditt TDEE — startpunkten för både bulk och cut"
        faqItems={FAQ_ITEMS}
        sources={SOURCES}
        relatedCalculators={[{ href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' }]}
        relatedArticles={[
          { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
          { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
          { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
        ]}
        breadcrumb={[
          { label: 'Artiklar', href: '/artiklar' },
          { label: 'Bulk och cut', href: CANONICAL },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          Bulk — muskeluppbyggnad
        </h2>
        <p>
          Under bulk äter du mer kalorier än du förbränner. Det skapar ett anabolt klimat där
          kroppen har råd att bygga muskelvävnad. Utan kalorioverskott är muskeluppbyggnad möjlig
          men avsevärt långsammare.
        </p>

        <h3 className="font-semibold text-neutral-800 mt-4 mb-2">Lean bulk (rekommenderat)</h3>
        <p>
          <strong>200–400 kcal/dag över TDEE.</strong> Optimal balans mellan muskeltillväxt och
          minimal fettupplagring. Förväntat tempo: ca 0,2–0,4 kg per vecka (varav en stor del är
          muskler de första månaderna).
        </p>

        <h3 className="font-semibold text-neutral-800 mt-4 mb-2">Aggressiv bulk</h3>
        <p>
          <strong>500–1000+ kcal/dag över TDEE.</strong> Snabbare viktuppgång men stor andel är
          fett. Fungerar för hardgainers och nybörjare men leder för erfarna atleter mest till
          fettupplagring som måste cuttats bort igen.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">Cut — fettförbränning</h2>
        <p>
          Under cut äter du under ditt TDEE för att tappa fett, med målet att bevara maximal
          muskelmassa. Det kräver disciplin, tillräckligt protein och styrketräning.
        </p>

        <h3 className="font-semibold text-neutral-800 mt-4 mb-2">Hållbar cut</h3>
        <p>
          <strong>300–500 kcal/dag under TDEE.</strong> Rekommenderat tempo för de flesta. Ger
          0,3–0,5 kg/vecka med god muskelmassabevaranfring.
        </p>

        <h3 className="font-semibold text-neutral-800 mt-4 mb-2">Mini cut</h3>
        <p>
          <strong>500–750 kcal/dag under TDEE, kortare period (4–8 veckor).</strong> Aggressivare
          men tidsbegränsad — minskar risken för adaptiv termogenes. Kräver högt protein och
          styrketräning.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Body Recomposition — alternativet
        </h2>
        <p>
          Istället för separata bulk/cut-faser kan man äta runt underhållsintag och långsamt bygga
          muskler och tappa fett <em>samtidigt</em>. Det är långsammare men undviker yo-yo-effekten.
        </p>
        <p>
          Fungerar bäst för: nybörjare, personer med hög fettprocent, och de som återkommer efter
          träningsuppehåll. Erfarna atleter med låg fettprocent får bättre resultat av separata
          faser.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Hur vet du när du ska byta fas?
        </h2>
        <ul className="space-y-2 pl-4 list-disc">
          <li>
            <strong>Avsluta bulk när:</strong> Fettprocenten blivit för hög (ca 15–18% för män,
            25–30% för kvinnor). Styrkan planar ut trots kalorioverskott.
          </li>
          <li>
            <strong>Avsluta cut när:</strong> Du nått önskad fettprocent. Viktnedgången planar ut
            trots kaloribrist. Prestationsförmågan sjunker markant.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">Praktisk guide</h2>
        <ol className="space-y-2 pl-5 list-decimal">
          <li>Räkna ut ditt TDEE med kalkylatorn</li>
          <li>Bulk: lägg till 300 kcal → ditt bulkintag</li>
          <li>Cut: dra av 400 kcal → ditt cutintag</li>
          <li>Ät 1,8–2,2 g protein/kg i båda faserna</li>
          <li>Träna styrka 3–4 ggr/vecka</li>
          <li>Justera kalorimålet var 2–3 vecka baserat på verklig viktutveckling</li>
        </ol>
      </ArticleLayout>
    </>
  )
}
