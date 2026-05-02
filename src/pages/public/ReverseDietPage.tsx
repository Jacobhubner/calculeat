import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'

const CANONICAL = 'https://calculeat.se/artiklar/reverse-diet'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Reverse Diet — Vad det är och hur du ökar kalorier efter diet (2026)',
  description:
    'Reverse diet innebär att du sakta ökar kaloriintaget efter en cut för att återställa metabolism utan att lagra fett. Lär dig när det behövs, hur du gör det och vad forskningen säger.',
  url: CANONICAL,
  publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
  inLanguage: 'sv-SE',
}

const FAQ_ITEMS = [
  {
    question: 'Måste man göra reverse diet efter viktnedgång?',
    answer:
      'Nej — det är inte ett krav. De flesta som avslutar en cut kan gå direkt till underhållsintag utan problem. Reverse diet är mest relevant om du har diäteat aggressivt länge, har tydliga tecken på metabolisk adaptation (vikten planar trots lågt intag, trötthet, hormonella störningar) eller planerar ett nytt mål direkt efter cutten. För kortare eller måttliga dieter räcker det ofta att bara höja till TDEE.',
  },
  {
    question: 'Hur snabbt ska man öka kalorier under reverse diet?',
    answer:
      'Typisk rekommendation är att öka med 50–100 kcal/vecka. Det ger kroppen tid att anpassa sig utan att lagra onödigt fett. En aggressivare ökning (100–200 kcal/vecka) går snabbare och forskning visar att fettupplagringen inte nödvändigtvis är större — men det kräver bättre koll på kroppsvikt och mätningar. Hitta ett tempo du kan hålla och justera om vikten stiger snabbare än 0,2–0,3 kg/vecka.',
  },
  {
    question: 'Går man upp i fett av reverse dieting?',
    answer:
      'Viss viktuppgång är normal och förväntad — framförallt glykogen (kolhydrater lagrade i muskler), vatten och tarminnehåll. Det är inte fett. Om kalorier ökas gradvis och proteinintaget hålls högt (1,6–2,2 g/kg) är fettupplagringen minimal. Vikten kan tillfälligt stiga 1–2 kg de första veckorna utan att det är fett.',
  },
  {
    question: 'Reverse diet vs maintenance — vad är skillnaden?',
    answer:
      'Maintenance innebär att du äter på ditt faktiska TDEE direkt. Reverse diet är processen att ta sig dit gradvis — ett strukturerat program för att höja kaloriintaget steg för steg. Om din metabolism är normalt fungerande kan du hoppa direkt till maintenance. Om du diäteat aggressivt länge och TDEE känns svårt att uppskatta, ger reverse diet en mer kontrollerad övergång.',
  },
  {
    question: 'Hur länge ska en reverse diet pågå?',
    answer:
      'Typiskt 4–12 veckor beroende på hur aggressivt du diäteat och hur stor skillnaden är mellan ditt cut-intag och ditt uppskattade TDEE. Ökar du med 100 kcal/vecka och ska höja 600 kcal tar det 6 veckor. Det finns inget exakt sluttillstånd — du är klar när du äter på (eller nära) ditt TDEE utan att vikten ökar.',
  },
]

const SOURCES = [
  {
    text: 'Trexler ET et al. (2014). Metabolic adaptation to weight loss: implications for the athlete. J Int Soc Sports Nutr.',
  },
  {
    text: 'Dulloo AG & Montani JP (2015). Pathways from dieting to weight regain, to obesity and to the metabolic syndrome: an overview. Obes Rev.',
  },
  {
    text: 'Müller MJ et al. (2015). Metabolic adaptation to caloric restriction and subsequent refeeding: the Minnesota Starvation Experiment revisited. Am J Clin Nutr.',
  },
]

export default function ReverseDietPage() {
  return (
    <>
      <Seo
        title="Reverse Diet — Vad det är och hur du ökar kalorier efter diet (2026) | CalculEat"
        description="Reverse diet innebär att du sakta ökar kaloriintaget efter en cut för att återställa metabolism utan att lagra fett. Praktisk guide med steg-för-steg och vetenskaplig grund."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <ArticleLayout
        title="Reverse Diet — Vad det är och hur du ökar kalorier efter diet"
        intro="En reverse diet är ett strukturerat sätt att höja kaloriintaget efter en cut — gradvis, kontrollerat, utan att lagra onödigt fett. Det är inte en fitness-myt. Det är ett praktiskt verktyg för den som diäteat aggressivt och vill återgå till underhållsintag utan att studsa tillbaka i vikt."
        moneyPageHref="/kalkylatorer/tdee-kalkylator"
        moneyPageLabel="Beräkna ditt underhållsbehov (TDEE) som startpunkt för reverse diet"
        faqItems={FAQ_ITEMS}
        sources={SOURCES}
        relatedCalculators={[
          { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
          { href: '/kalkylatorer/proteinbehov', label: 'Proteinbehov Kalkylator' },
          { href: '/kalkylatorer/cut-kalkylator', label: 'Cut Kalkylator' },
        ]}
        relatedArticles={[
          { href: '/artiklar/kaloribrist', label: 'Hur stor kaloribrist ska man ha?' },
          { href: '/artiklar/bulk-och-cut', label: 'Bulk och Cut — komplett guide' },
          { href: '/artiklar/kaloribehov', label: 'Kaloribehov — komplett guide' },
        ]}
        breadcrumb={[
          { label: 'Artiklar', href: '/artiklar' },
          { label: 'Reverse Diet', href: CANONICAL },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">Vad är reverse diet?</h2>
        <p>
          Reverse diet är processen att gradvis höja kaloriintaget efter en period av kaloribrist
          (cut). Istället för att gå direkt från t.ex. 1600 kcal/dag till 2300 kcal/dag, höjer du
          med 50–100 kcal per vecka tills du når ditt underhållsintag (TDEE).
        </p>
        <p>
          Idén bygger på en verklig fysiologisk mekanism: <strong>adaptiv termogenes</strong> — den
          metaboliska nedreglering som sker under längre perioder av kaloribrist. Kroppen sänker sin
          NEAT (oplanerad rörelse), sköldkörtelhormon och leptinnivåer som svar på energibrist. Det
          gör att ditt verkliga TDEE under cutten är lägre än det var innan.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          När är reverse diet relevant?
        </h2>
        <p>Reverse diet är mest motiverat i dessa situationer:</p>
        <ul className="space-y-3 pl-4 list-disc">
          <li>
            <strong>Du har diäteat aggressivt länge (12+ veckor).</strong> Ju längre och mer
            restriktiv dieten var, desto mer uttalad är den metaboliska adaptationen — och desto
            försiktigare bör övergången vara.
          </li>
          <li>
            <strong>Du har tydliga tecken på adaptiv termogenes:</strong> trötthet, minskad
            prestanda, kall hela tiden, oregelbunden menscykel (kvinnor), platå trots lågt
            kaloriintag.
          </li>
          <li>
            <strong>Du planerar direkt på en ny bulk- eller muskeluppbyggnadsfas.</strong> En
            kontrollerad övergång via reverse diet ger en bättre utgångspunkt för bulken och minskar
            risken för &ldquo;rebound fettupplagring&rdquo; vid plötslig kalorikvinst.
          </li>
          <li>
            <strong>Psykologiskt behov av struktur.</strong> Många finner att ha ett schema för
            ökning — snarare än att bara &ldquo;äta mer&rdquo; — minskar anxiety kring mat efter en
            lång diet.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          När reverse diet inte behövs
        </h2>
        <p>
          Reverse diet är <em>inte</em> nödvändigt i alla situationer och är ibland onödigt
          komplicerat:
        </p>
        <ul className="space-y-2 pl-4 list-disc">
          <li>
            Du har diäteat i ett <strong>måttligt tempo (−300–400 kcal/dag)</strong> under 8–12
            veckor — metabolisk adaptation är troligtvis minimal.
          </li>
          <li>
            Du har inte tappat mer än <strong>5–8% av kroppsvikten</strong> totalt — ingen stor
            hormonell störning förväntas.
          </li>
          <li>
            Du planerar <strong>en längre maintenancefas</strong> (3+ månader) utan nytt viktmål
            direkt — kroppen återhämtar sig naturligt.
          </li>
        </ul>
        <p>
          I dessa fall kan du gå direkt till ditt beräknade TDEE utan att strukturera en formell
          reverse diet.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Reverse diet, diet break och maintenance — vad är skillnaden?
        </h2>
        <div className="space-y-4">
          {[
            {
              term: 'Reverse Diet',
              def: 'Gradvis ökning av kaloriintaget (50–100 kcal/vecka) från cut-intag upp till TDEE. Pågår 4–12 veckor. Används efter en lång eller aggressiv cut.',
              color: 'bg-primary-50 border-primary-200',
            },
            {
              term: 'Diet Break',
              def: 'Kortare period (1–2 veckor) på underhållsintag mitt i en pågående cut. Syftet är att återställa leptin och metabolism tillfälligt — sedan fortsätter dieten. En diet break är inte en reverse diet.',
              color: 'bg-blue-50 border-blue-200',
            },
            {
              term: 'Maintenance',
              def: 'Att äta på ditt TDEE permanent, utan mål om viktförändring. Kan nås direkt eller via reverse diet. Maintenance är slutmålet för reverse diet.',
              color: 'bg-green-50 border-green-200',
            },
          ].map(({ term, def, color }) => (
            <div key={term} className={`rounded-xl border p-4 ${color}`}>
              <div className="font-semibold text-neutral-800 mb-1">{term}</div>
              <div className="text-sm text-neutral-700">{def}</div>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Steg-för-steg: så gör du en reverse diet
        </h2>
        <ol className="space-y-4 pl-4 list-decimal">
          <li>
            <strong>Räkna ut ditt mål-TDEE.</strong> Använd en TDEE-kalkylator baserad på din
            nuvarande vikt, längd, ålder och aktivitetsnivå. Det är ditt slutmål — det kaloriintag
            du gradvis ska ta dig till.
          </li>
          <li>
            <strong>Börja med ditt nuvarande cut-intag.</strong> Om du avslutar cutten på 1 700
            kcal/dag, starta reverse dieten därifrån.
          </li>
          <li>
            <strong>Öka med 50–100 kcal per vecka.</strong> Lägg till kalorierna primärt på
            kolhydrater och fett — proteinintaget behöver inte ökas (håll 1,6–2,2 g/kg).
          </li>
          <li>
            <strong>Följ din vikt varje vecka.</strong> Viss uppgång är normal (vatten, glykogen).
            Om vikten stiger mer än 0,3 kg/vecka under mer än 2 veckor i rad — pausa ökningen en
            vecka och se hur kroppen svarar.
          </li>
          <li>
            <strong>Fortsätt tills du når ditt TDEE.</strong> När du äter på eller nära TDEE och
            vikten är stabil — är reverse dieten klar. Du är nu i maintenance.
          </li>
        </ol>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">Vanliga misstag</h2>
        <ul className="space-y-2 pl-4 list-disc">
          <li>
            <strong>Öka för snabbt.</strong> +200–300 kcal/dag direkt ger snabb fettinlagring om
            metabolismen inte hunnit återhämta sig. Ta det lugnt.
          </li>
          <li>
            <strong>Räkna inte proteinet.</strong> Under reverse diet är det frestande att lägga
            till kalorier via godis eller processad mat. Håll proteinet högt — det skyddar muskler
            och minskar fettinlagringen under kaloristegringen.
          </li>
          <li>
            <strong>Förväxla normal viktuppgång med fettupplagring.</strong> De första 1–2 kg som
            tillkommer är nästan alltid vatten och glykogen, inte fett. Panikera inte.
          </li>
          <li>
            <strong>Skippa reverse diet när det faktiskt behövs.</strong> Att gå från 1 400 till 2
            400 kcal direkt efter 16 veckors aggressiv cut ökar risken för &ldquo;fat
            overshoot&rdquo; — kroppen lagrar oproportionerligt mycket fett som respons på den
            plötsliga energiöverskötten.
          </li>
        </ul>
      </ArticleLayout>
    </>
  )
}
