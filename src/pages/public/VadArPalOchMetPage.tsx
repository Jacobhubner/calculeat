import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import PALvsMETContent from '@/components/info/PALvsMETContent'

const CANONICAL = 'https://calculeat.se/artiklar/vad-ar-pal-och-met'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Vad är PAL och MET? Aktivitetsnivå och energiförbrukning förklarat',
  description:
    'PAL (Physical Activity Level) och MET (Metabolic Equivalent of Task) är två sätt att mäta aktivitetsnivå. Lär dig hur de används för att räkna ut TDEE och kaloribehov.',
  url: CANONICAL,
  publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
  inLanguage: 'sv-SE',
}

const FAQ_ITEMS = [
  {
    question: 'Vad är PAL och hur väljer jag rätt värde?',
    answer:
      'PAL (Physical Activity Level) är en multiplikator som omvandlar ditt BMR till TDEE. Välj baserat på din totala vardagsaktivitet — inte bara träning. Stillasittande (kontorsarbete, lite promenad): PAL 1,3. Lätt aktiv (träning 1–3 ggr/vecka): 1,5–1,6. Måttligt aktiv (träning 3–5 ggr/vecka): 1,6–1,7. Mycket aktiv (daglig intensiv träning eller fysiskt arbete): 1,9–2,1.',
  },
  {
    question: 'Vad är MET och hur används det?',
    answer:
      'MET (Metabolic Equivalent of Task) mäter intensiteten hos en specifik aktivitet i förhållande till vila (1 MET = vila). Gång i lugn takt är ca 3 MET, löpning ca 8–10 MET, cykling ca 6–8 MET. MET används för att beräkna kalorier för enstaka aktiviteter: Kalorier = MET × vikt (kg) × tid (h).',
  },
  {
    question: 'Ska jag använda PAL eller MET för att räkna ut kalorier?',
    answer:
      'PAL används för att räkna ut ditt totala dagliga kaloribehov (TDEE). MET används för att uppskatta kalorier för en enstaka specifik aktivitet. I praktiken: välj en PAL-faktor som speglar hela din dag och multiplicera med BMR för att få TDEE. Använd MET om du vill se hur mycket en specifik träningssession "kostar" i kalorier.',
  },
  {
    question: 'Varför stämmer inte kalkylatorn när jag ökar träningsdagarna?',
    answer:
      'Kroppen kompenserar ofta ökad planerad träning med minskad spontan rörelse (NEAT — non-exercise activity thermogenesis). Det innebär att ökad träning inte alltid ger ett proportionellt ökat TDEE. Välj en PAL-faktor som återspeglar din totala aktivitetsdag, inte bara träningsdagarna.',
  },
]

const SOURCES = [
  {
    text: 'FAO/WHO/UNU (2001). Human energy requirements. Report of a Joint Expert Consultation.',
  },
  {
    text: 'Ainsworth BE et al. (2011). 2011 Compendium of Physical Activities. Med Sci Sports Exerc.',
  },
  {
    text: 'Levine JA (2004). Non-exercise activity thermogenesis (NEAT). Nutr Rev.',
  },
]

export default function VadArPalOchMetPage() {
  return (
    <>
      <Seo
        title="Vad är PAL och MET? Aktivitetsnivå och energiförbrukning förklarat | CalculEat"
        description="PAL (Physical Activity Level) och MET (Metabolic Equivalent of Task) är två sätt att mäta aktivitetsnivå. Lär dig hur de används för att räkna ut TDEE och kaloribehov."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <ArticleLayout
        title="Vad är PAL och MET? Aktivitetsnivå och energiförbrukning förklarat"
        intro="PAL (Physical Activity Level) är aktivitetsfaktorn som multipliceras med BMR för att ge ditt TDEE — ditt faktiska kaloribehov. MET (Metabolic Equivalent of Task) mäter hur intensiv en specifik aktivitet är i förhållande till vila. Båda används för att beräkna energiförbrukning, men på olika sätt."
        moneyPageHref="/kalkylatorer/tdee-kalkylator"
        moneyPageLabel="Räkna ut ditt TDEE med rätt aktivitetsnivå"
        faqItems={FAQ_ITEMS}
        sources={SOURCES}
        relatedCalculators={[
          { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
          { href: '/kalkylatorer/bmr-kalkylator', label: 'BMR Kalkylator' },
          { href: '/kalkylatorer/kaloriunderskott', label: 'Kaloribrist Kalkylator' },
        ]}
        relatedArticles={[
          { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
          { href: '/artiklar/vad-ar-bmr', label: 'Vad är BMR?' },
          { href: '/artiklar/bmr-vs-tdee', label: 'BMR vs TDEE' },
          { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
        ]}
        breadcrumb={[
          { label: 'Artiklar', href: '/artiklar' },
          { label: 'Vad är PAL och MET?', href: CANONICAL },
        ]}
      >
        <PALvsMETContent />

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Välj rätt PAL för ditt kalorimål
        </h2>
        <p>
          Det vanligaste misstaget vid TDEE-beräkning är att överskatta sin aktivitetsnivå. Om du
          tränar 3 dagar i veckan men sitter stilla resten av dagen är du sannolikt &ldquo;lätt
          aktiv&rdquo; (PAL 1,5–1,6) — inte &ldquo;måttligt aktiv&rdquo;.
        </p>
        <p className="mt-3">
          En praktisk metod: börja med ett konservativt PAL-värde och öka om din vikt sjunker
          snabbare än planerat. Det är lättare att justera upp än att hantera ett för stort
          kaloriunderskott.
        </p>
        <p className="mt-3">
          Prova vår TDEE-kalkylator för att räkna ut ditt kaloribehov med olika aktivitetsnivåer och
          se hur stor skillnaden faktiskt är.
        </p>
      </ArticleLayout>
    </>
  )
}
