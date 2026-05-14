import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'

const CANONICAL = 'https://calculeat.se/artiklar/lbm-vs-ffm'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'LBM vs FFM — vad är skillnaden mellan Lean Body Mass och Fat Free Mass?',
  description:
    'LBM (Lean Body Mass) och FFM (Fat Free Mass) beskriver kroppens icke-fettmassa men är inte identiska. Lär dig skillnaden och varför det spelar roll för träning och kroppssammansättning.',
  url: CANONICAL,
  publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
  inLanguage: 'sv-SE',
}

const FAQ_ITEMS = [
  {
    question: 'Vad är skillnaden mellan LBM och FFM?',
    answer:
      'LBM (Lean Body Mass) inkluderar allt i kroppen förutom lagrat kroppsfett — men inkluderar ändå essentiellt fett i organ, hjärnan och cellmembran. FFM (Fat Free Mass) är helt fettfri vävnad: muskler, organ, vatten och skelett. Skillnaden är i praktiken ca 3–5%.',
  },
  {
    question: 'Vilket mått använder kalkylatorer — LBM eller FFM?',
    answer:
      'De flesta mätmetoder (DEXA, kaliper, bioimpedans) uppskattar FFM, inte LBM. Därför använder formler som Cunningham-ekvationen FFM som indata. Om en kalkylator frågar efter "fettfri massa" avses alltså FFM.',
  },
  {
    question: 'Spelar skillnaden mellan LBM och FFM roll i praktiken?',
    answer:
      'För de flesta praktiska ändamål — BMR-beräkning, proteinbehov, träningsplanering — är skillnaden på 3–5% försumbar. Det är viktigare att veta vilket mått din mätmetod faktiskt returnerar, så att du matchar rätt värde till rätt formel.',
  },
  {
    question: 'Varför inkluderar LBM essentiellt fett?',
    answer:
      'Essentiellt fett är nödvändigt för kroppens funktion — det finns i hjärnan, cellmembran och organ och kan inte tas bort utan att kroppen slutar fungera. Det räknas därför inte som "överskottsfett" och ingår i LBM men inte i FFM.',
  },
]

const SOURCES = [
  {
    text: 'Heymsfield SB, et al. (2015). Human Body Composition. 3rd ed. Human Kinetics.',
  },
  {
    text: 'Wang Z, et al. (1992). The five-level model: a new approach to organizing body-composition research. Am J Clin Nutr. 56(1):19–28.',
  },
  {
    text: 'Cunningham JJ. (1991). Body composition as a determinant of energy expenditure: a synthetic review and a proposed general prediction equation. Am J Clin Nutr. 54(6):963–969.',
  },
]

export default function LbmVsFfmPage() {
  return (
    <>
      <Seo
        title="LBM vs FFM — skillnaden mellan Lean Body Mass och Fat Free Mass | CalculEat"
        description="LBM och FFM beskriver båda kroppens icke-fettmassa men är inte identiska. Lär dig vad som skiljer dem åt och vilket mått du ska använda i dina beräkningar."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <ArticleLayout
        title="LBM vs FFM — vad är skillnaden?"
        intro="LBM (Lean Body Mass) och FFM (Fat Free Mass) används ofta som synonymer, men de mäter inte exakt samma sak. Båda beskriver kroppens icke-fettmassa — men definitionen av 'fett' skiljer sig åt på ett sätt som faktiskt spelar roll när du väljer formel eller tolkar ett mätresultat."
        moneyPageHref="/kalkylatorer/kroppsfett"
        moneyPageLabel="Räkna ut din kroppssammansättning med vår kalkylator"
        faqItems={FAQ_ITEMS}
        sources={SOURCES}
        relatedCalculators={[
          { href: '/kalkylatorer/kroppsfett', label: 'Kroppsfett Kalkylator' },
          { href: '/kalkylatorer/ffmi-kalkylator', label: 'FFMI Kalkylator' },
          { href: '/kalkylatorer/bmr-kalkylator', label: 'BMR Kalkylator' },
        ]}
        relatedArticles={[
          { href: '/artiklar/vad-ar-ffmi', label: 'Vad är FFMI?' },
          { href: '/artiklar/bmi-vs-kroppsfett', label: 'BMI vs kroppsfett' },
          { href: '/artiklar/vad-ar-bmr', label: 'Vad är BMR?' },
        ]}
        breadcrumb={[
          { label: 'Artiklar', href: '/artiklar' },
          { label: 'LBM vs FFM', href: CANONICAL },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          Vad är LBM — Lean Body Mass?
        </h2>
        <p>
          LBM är allt i kroppen förutom lagrat kroppsfett. Det låter som en enkel definition, men
          nyckeln ligger i ordet <em>lagrat</em>: LBM inkluderar det fett som kroppen inte kan
          undvara — essentiellt fett.
        </p>
        <p className="mt-3">Essentiellt fett finns i:</p>
        <ul className="space-y-1 pl-4 list-disc mt-2">
          <li>Organ (hjärta, lever, njurar)</li>
          <li>Hjärnan och nervsystemet</li>
          <li>Cellmembran i hela kroppen</li>
        </ul>
        <p className="mt-3">
          Detta fett är strukturellt och funktionellt nödvändigt — det kan inte reduceras utan att
          kroppens grundläggande processer störs. Det räknas därför som en del av den
          &ldquo;magra&rdquo; massan i LBM-definitionen.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Vad är FFM — Fat Free Mass?
        </h2>
        <p>
          FFM är en striktare definition: helt fettfri vävnad. Inget fett inkluderas — inte ens det
          essentiella. FFM består av:
        </p>
        <ul className="space-y-1 pl-4 list-disc mt-2">
          <li>Muskler</li>
          <li>Organ (utan fettvävnad)</li>
          <li>Kroppsvätska och vatten</li>
          <li>Skelett och mineraler</li>
        </ul>
        <p className="mt-3">
          FFM är alltså en renare biokemisk definition — den massa du skulle ha kvar om allt fett
          eliminerats, inklusive det som kroppen faktiskt behöver.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">Skillnaden i praktiken</h2>
        <div className="bg-neutral-100 border border-neutral-200 rounded-lg px-4 py-3 my-4 space-y-1 text-sm">
          <p>
            <strong>LBM</strong> — inkluderar essentiellt fett (organ, hjärna, cellmembran)
          </p>
          <p>
            <strong>FFM</strong> — helt fettfritt, ingen form av fett inkluderas
          </p>
          <p className="text-neutral-600">Skillnaden: ca 3–5% av kroppsvikten</p>
        </div>
        <p>
          För en person på 80 kg med 15% kroppsfett innebär det att LBM är ca 2–3 kg högre än FFM. I
          de flesta praktiska sammanhang — beräkning av kaloribehov, proteinintag eller träningslast
          — är den skillnaden försumbar. Men det är viktigt att veta vilket mått en given formel
          förväntar sig.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Vilket mått ska du använda?
        </h2>
        <p>
          De flesta mätmetoder — DEXA, bioimpedans och kaliper — returnerar FFM, inte LBM. Det är
          FFM som är standardmåttet i forskning och klinisk praxis.
        </p>
        <p className="mt-3">
          Praktisk konsekvens: om en formel ber om &ldquo;fettfri massa&rdquo; är det FFM du ska
          mata in — alltså värdet du får direkt från din mätning. Cunningham-ekvationen för RMR är
          ett typiskt exempel: den bygger på FFM och ger mer exakta resultat för vältränade
          individer än Mifflin-St Jeor, som enbart använder totalvikt.
        </p>
        <p className="mt-3">
          Om du inte vet vilket mått din mätmetod ger — anta FFM. Det är den vanligaste outputen och
          matchar de formler du sannolikt kommer att använda.
        </p>
      </ArticleLayout>
    </>
  )
}
