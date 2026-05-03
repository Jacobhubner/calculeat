import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'

const CANONICAL = 'https://calculeat.se/artiklar/bmi-vs-kroppsfett'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'BMI vs Kroppsfett — Vilken mätning stämmer bäst?',
  description:
    'BMI mäter vikt i relation till längd. Kroppsfett mäter faktisk fettprocent. Lär dig när BMI missar och när du behöver ett mer precist mått för att sätta rätt kalorimål.',
  url: CANONICAL,
  publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
  inLanguage: 'sv-SE',
}

const FAQ_ITEMS = [
  {
    question: 'Kan man ha lågt BMI men hög fettprocent?',
    answer:
      'Ja — detta kallas "skinny fat" eller normal-weight obesity. Individer med låg muskelmassa och hög fettprocent kan ha ett BMI i normalintervallet trots en ohälsosam kroppskomposition. BMI ser bara på vikt i relation till längd, inte hur den vikten fördelar sig mellan muskler och fett.',
  },
  {
    question: 'Vilket mått är mer tillförlitligt — BMI eller kroppsfett?',
    answer:
      'Kroppsfett ger en mer komplett bild. BMI är enkelt att räkna ut men missar muskelmassa, ålder och könsspecifika skillnader i fettfördelning. Kroppsfett (mätt med Navy-metoden, DEXA eller hudveck) är ett bättre mått på hälsorisk och kroppskomposition. För de flesta normalviktiga utan extremt hög muskelmassa är BMI ändå en rimlig grov indikator.',
  },
  {
    question: 'Vad är normalt kroppsfett för en man respektive kvinna?',
    answer:
      'Hälsosamma nivåer: Män 10–20%, Kvinnor 18–28%. Atletiska intervall är lägre — män 6–13%, kvinnor 14–20%. Under 6% (män) och 14% (kvinnor) innebär essential fat-nivåer som är ohälsosamt låga. Äldre personer tenderar att ha något högre fettprocent med bibehållen hälsa.',
  },
  {
    question: 'Räcker BMI för att sätta ett kalorimål?',
    answer:
      'Nej — BMI ger ingen information om hur mycket du faktiskt förbränner. Ditt kalorimål baseras på TDEE (total daglig energiförbrukning), som beror på muskelmassa, aktivitetsnivå och metabolik. Två personer med samma BMI kan ha helt olika TDEE. Räkna ut ditt TDEE för att sätta ett träffsäkert kalorimål.',
  },
]

const SOURCES = [
  {
    text: 'Romero-Corral A et al. (2008). Accuracy of body mass index in diagnosing obesity in the adult general population. Int J Obes.',
  },
  {
    text: 'Gallagher D et al. (2000). Healthy percentage body fat ranges: an approach for developing guidelines based on body mass index. Am J Clin Nutr.',
  },
  {
    text: 'Prentice AM & Jebb SA (2001). Beyond body mass index. Obes Rev.',
  },
]

export default function BmiVsKroppsfettPage() {
  return (
    <>
      <Seo
        title="BMI vs Kroppsfett — Vilken mätning stämmer bäst? | CalculEat"
        description="BMI mäter vikt i relation till längd. Kroppsfett mäter faktisk fettprocent. Lär dig när BMI missar och när du behöver ett mer precist mått för att sätta rätt kalorimål."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <ArticleLayout
        title="BMI vs Kroppsfett — Vilken mätning stämmer bäst?"
        intro="BMI (Body Mass Index) är enkelt att räkna ut men mäter bara vikt i relation till längd — inte hur vikten fördelar sig. Kroppsfett mäter den faktiska andelen fett i kroppen och ger en mer komplett bild. Båda har sitt värde, men de svarar på olika frågor."
        moneyPageHref="/kalkylatorer/tdee-kalkylator"
        moneyPageLabel="Räkna ut ditt kaloribehov med TDEE-kalkylatorn"
        faqItems={FAQ_ITEMS}
        sources={SOURCES}
        relatedCalculators={[
          { href: '/kalkylatorer/bmi-kalkylator', label: 'BMI Kalkylator' },
          { href: '/kalkylatorer/kroppsfett', label: 'Kroppsfett Kalkylator' },
          { href: '/kalkylatorer/ffmi-kalkylator', label: 'FFMI Kalkylator' },
          { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
        ]}
        relatedArticles={[
          { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
          { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
        ]}
        breadcrumb={[
          { label: 'Artiklar', href: '/artiklar' },
          { label: 'BMI vs Kroppsfett', href: CANONICAL },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">Vad mäter BMI?</h2>
        <p>
          BMI räknas ut som vikt (kg) delat på längd² (m²). Resultatet placeras i en av fyra
          kategorier: undervikt (under 18,5), normalvikt (18,5–24,9), övervikt (25–29,9) eller fetma
          (30+).
        </p>
        <p className="mt-3">
          Fördelen med BMI är enkelheten — du behöver bara vikt och längd. Nackdelen är att det inte
          skiljer på muskelmassa och fettvävnad. En vältränad person med hög muskelmassa kan hamna i
          &ldquo;övervikt&rdquo; enligt BMI trots låg fettprocent.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">Vad mäter kroppsfett?</h2>
        <p>
          Kroppsfett är andelen av din kroppsvikt som består av fettvävnad. Det mäts med metoder som
          US Navy-metoden (baserad på kroppsmått), hudvecksmätning, bioimpedans eller DEXA
          (röntgen). DEXA är guldstandarden men kräver specialutrustning.
        </p>
        <p className="mt-3">
          Kroppsfett ger en mer precis bild av kroppskomposition — hur mycket som är muskler, fett,
          ben och vätska. Det är särskilt viktigt för personer med hög muskelmassa (idrottare,
          styrkelyftare) där BMI systematiskt överskattar hälsorisken.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Jämförelse: BMI vs Kroppsfett
        </h2>
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-neutral-100">
                <th className="text-left p-3 border border-neutral-200 font-semibold">Egenskap</th>
                <th className="text-left p-3 border border-neutral-200 font-semibold">BMI</th>
                <th className="text-left p-3 border border-neutral-200 font-semibold">
                  Kroppsfett
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                ['Vad mäts?', 'Vikt/längd²', 'Andel fettvävnad'],
                ['Tar hänsyn till muskler?', 'Nej', 'Ja'],
                ['Mätmetod', 'Vikt + längd', 'Kroppsmått / DEXA / bioimpedans'],
                ['Noggrannhet', 'Grov uppskattning', 'Mer precis (metodberoende)'],
                ['Används för?', 'Snabb hälsoindikator', 'Kroppskomposition och mål'],
                ['Kräver utrustning?', 'Nej', 'Måttband (Navy-metod) eller mer'],
              ].map(([prop, bmi, bf]) => (
                <tr key={prop} className="even:bg-neutral-50">
                  <td className="p-3 border border-neutral-200 font-medium text-neutral-700">
                    {prop}
                  </td>
                  <td className="p-3 border border-neutral-200 text-neutral-600">{bmi}</td>
                  <td className="p-3 border border-neutral-200 text-neutral-600">{bf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          När BMI är tillräckligt — och när det missar
        </h2>
        <p>
          BMI fungerar som ett grovt screeningverktyg för befolkningsnivå och för de flesta
          normalviktiga utan extremt hög eller låg muskelmassa. Det är snabbt, gratis och kräver
          ingen utrustning.
        </p>
        <p className="mt-3">BMI är däremot missvisande för:</p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-neutral-700">
          <li>Muskulösa individer (tränade, idrottare, styrkelyftare)</li>
          <li>Äldre med låg muskelmassa men normal vikt (&ldquo;sarcopenic obesity&rdquo;)</li>
          <li>Gravida</li>
          <li>Barn och ungdomar (kräver åldersspecifika referensvärden)</li>
          <li>
            Individer med mycket låg muskelmassa och hög fettprocent (&ldquo;skinny fat&rdquo;)
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Vilket mål ska du använda?
        </h2>
        <p>
          Oavsett vilket mått du tittar på — BMI eller kroppsfett — är ditt kalorimål det praktiska
          verktyget för att nå dit. Kalorimålet bygger på ditt TDEE, inte på BMI eller fettprocent i
          sig. Räkna ut ditt TDEE för att få en siffra du faktiskt kan agera på.
        </p>
      </ArticleLayout>
    </>
  )
}
