import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import BMRvsRMRContent from '@/components/info/BMRvsRMRContent'

const CANONICAL = 'https://calculeat.se/artiklar/bmr-vs-rmr'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'BMR vs RMR — vad är skillnaden?',
  description:
    'BMR och RMR mäter båda energiförbrukning i vila men skiljer sig i mätvillkor. Lär dig skillnaden, vilka formler som beräknar vad och varför det spelar roll för din kaloriplanering.',
  url: CANONICAL,
  publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
  inLanguage: 'sv-SE',
}

const FAQ_ITEMS = [
  {
    question: 'Vad är skillnaden mellan BMR och RMR?',
    answer:
      'BMR (Basal Metabolic Rate) mäts under extremt kontrollerade förhållanden — absolut vila, fasta och termoneutral miljö. RMR (Resting Metabolic Rate) mäts i realistisk vila och är vanligtvis 5–10% högre än BMR. I praktiken används termerna ofta synonymt, men de är tekniskt sett olika saker.',
  },
  {
    question: 'Vilken formel ska jag använda — BMR eller RMR?',
    answer:
      'De flesta populära formlerna (Mifflin–St Jeor, Cunningham) beräknar tekniskt sett RMR, men kallas ofta "BMR" i vardagligt bruk. För praktisk kaloriplanering spelar distinktionen liten roll — multiplicera resultatet med din PAL-faktor för att få ditt TDEE.',
  },
  {
    question: 'Räknar Mifflin–St Jeor ut BMR eller RMR?',
    answer:
      'Mifflin–St Jeor beräknar tekniskt RMR, eftersom mätvillkoren i studien inte var lika strikta som för äkta BMR. Detsamma gäller Cunningham-formeln. Harris–Benedict (original och reviderad) och Schofield-formeln beräknar BMR under striktare villkor.',
  },
  {
    question: 'Spelar skillnaden mellan BMR och RMR någon roll i praktiken?',
    answer:
      'Sällan. Skillnaden är 5–10%, och alla formler har en felmarginal på ±10–15% ändå. Det viktigaste är att du väljer en formel och följer trenden i din vikt över tid — justerar upp eller ned baserat på verkligt utfall snarare än att fastna i om formeln är "BMR" eller "RMR".',
  },
  {
    question: 'Varför kallas RMR-formler ofta för BMR-formler?',
    answer:
      'Historisk konvention. Harris–Benedict (1919) använde termen BMR och blev standard. Senare formler, trots att de tekniskt mäter RMR, fortsatte använda "BMR" i folkmun eftersom termen var välkänd. I dag används de synonymt i de flesta sammanhang utanför klinisk forskning.',
  },
]

const SOURCES = [
  {
    text: 'Harris JA & Benedict FG (1919). A biometric study of human basal metabolism. Proc Natl Acad Sci.',
  },
  {
    text: 'Mifflin MD et al. (1990). A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr.',
  },
  {
    text: 'Cunningham JJ (1980). A reanalysis of the factors influencing basal metabolic rate in normal adults. Am J Clin Nutr.',
  },
]

export default function BmrVsRmrPage() {
  return (
    <>
      <Seo
        title="BMR vs RMR — vad är skillnaden? | CalculEat"
        description="BMR och RMR mäter båda energiförbrukning i vila men skiljer sig i mätvillkor. Lär dig skillnaden, vilka formler som beräknar vad och varför det spelar roll."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <ArticleLayout
        title="BMR vs RMR — vad är skillnaden?"
        intro="BMR (Basal Metabolic Rate) och RMR (Resting Metabolic Rate) är två begrepp som ofta används synonymt — men de är tekniskt sett olika saker. Skillnaden handlar om mätvillkor och är vanligtvis 5–10%. Här förklarar vi vad som skiljer dem åt, vilka formler som beräknar vad, och om det spelar någon roll för din kaloriplanering."
        moneyPageHref="/kalkylatorer/bmr-kalkylator"
        moneyPageLabel="Räkna ut ditt BMR/RMR med kalkylatorn"
        faqItems={FAQ_ITEMS}
        sources={SOURCES}
        relatedCalculators={[
          { href: '/kalkylatorer/bmr-kalkylator', label: 'BMR-kalkylator' },
          { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE-kalkylator' },
        ]}
        relatedArticles={[
          { href: '/artiklar/vad-ar-bmr', label: 'Vad är BMR?' },
          { href: '/artiklar/bmr-vs-tdee', label: 'BMR vs TDEE — vad är skillnaden?' },
          { href: '/artiklar/vad-ar-tdee', label: 'Vad är TDEE?' },
        ]}
        breadcrumb={[
          { label: 'Artiklar', href: '/artiklar' },
          { label: 'BMR vs RMR', href: CANONICAL },
        ]}
      >
        <BMRvsRMRContent />
      </ArticleLayout>
    </>
  )
}
