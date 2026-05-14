import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'

const CANONICAL = 'https://calculeat.se/artiklar/hur-mater-man-kroppsfett'

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Hur mäter man kroppsfett? Metoder, noggrannhet och vad siffrorna betyder',
  description:
    'Lär dig de vanligaste metoderna för att mäta kroppsfett — DEXA, hydrodensitometri, bioimpedans, kaliper och Navy-metoden — och vad som faktiskt är en bra kroppsfett-procent.',
  url: CANONICAL,
  publisher: { '@type': 'Organization', name: 'CalculEat', url: 'https://calculeat.se' },
  inLanguage: 'sv-SE',
}

const FAQ_ITEMS = [
  {
    question: 'Vilken metod för kroppsfettmätning är mest träffsäker?',
    answer:
      'DEXA (dual-energy X-ray absorptiometry) och hydrodensitometri (undervattenvägning) anses som guldstandard med en felmarginal på ±1–2%. Bioimpedans och kaliper är mindre exakta (±3–5%) men tillräckliga för att följa trenden över tid. För de flesta räcker en konsekvent metod — det är förändringen som spelar roll, inte det absoluta värdet.',
  },
  {
    question: 'Hur noggrann är bioimpedansvågen hemma?',
    answer:
      'Hemma-vågar med bioimpedans har ofta en felmarginal på ±3–5 procentenheter och påverkas kraftigt av hydrering, senaste måltid och tid på dygnet. Mät alltid under samma förhållanden — på morgonen, fastande och efter toalettbesök — för att minimera variationen.',
  },
  {
    question: 'Vad är en bra kroppsfett-procent?',
    answer:
      'Det beror på mål och livsstil. För de flesta vuxna är normalzonen det naturliga utgångsläget — 18–24% för män och 25–31% för kvinnor — och den är fullt förenlig med god hälsa utan särskild livsstilsdisciplin. BMI fångar inte detta — en muskulös person kan ha högt BMI men låg kroppsfett-procent, medan en smal person kan ha normalt BMI men hög andel kroppsfett (så kallad "normal weight obesity"). Det är därför kroppsfett-procent ger en mer relevant bild av hälsa och kroppssammansättning.',
  },
  {
    question: 'Kan jag använda måttband istället för en dyr mätare?',
    answer:
      'Ja. US Navy-metoden använder midja, nacke och (för kvinnor) höfter för att uppskatta kroppsfett med en felmarginal på ca ±3–4%. Det är gratis, enkelt att göra hemma och tillräckligt träffsäkert för att följa sin trend — vilket är det viktigaste.',
  },
  {
    question: 'Hur ofta bör jag mäta mitt kroppsfett?',
    answer:
      'Var 4–8 vecka är lagom för de flesta. Tätare mätningar ger inte mer information eftersom kroppsfett förändras långsamt — men skapar lätt onödig fixering vid siffror. Fokusera på trenden över månader snarare än veckovisa svängningar.',
  },
]

const SOURCES = [
  {
    text: 'Heymsfield SB, et al. (2015). Human Body Composition. 3rd ed. Human Kinetics.',
  },
  {
    text: 'Deurenberg P, et al. (1991). Body mass index as a measure of body fatness: age- and sex-specific prediction formulas. Br J Nutr. 65(2):105–114.',
  },
  {
    text: 'Hodgdon JA & Beckett MB (1984). Prediction of percent body fat for U.S. Navy men and women from body circumference and height. Naval Health Research Center.',
  },
  {
    text: 'Siri WE. (1961). Body composition from fluid spaces and density: analysis of methods. In: Brozek J, Henschel A (eds). Techniques for measuring body composition. Washington DC: National Academy of Sciences. pp 223–244.',
  },
  {
    text: 'Lohman TG (1992). Advances in body composition assessment. Human Kinetics.',
  },
  {
    text: 'Lee SY & Gallagher D (2008). Assessment methods in human body composition. Curr Opin Clin Nutr Metab Care. 11(5):566–572.',
  },
]

export default function HurMatarManKroppsfettPage() {
  return (
    <>
      <Seo
        title="Hur mäter man kroppsfett? Metoder och noggrannhet förklarat | CalculEat"
        description="Lär dig de vanligaste metoderna för att mäta kroppsfett — DEXA, bioimpedans, kaliper och Navy-metoden — och vad som är en bra kroppsfett-procent."
        canonical={CANONICAL}
        type="article"
      />
      <JsonLd schema={PAGE_SCHEMA} />

      <ArticleLayout
        title="Hur mäter man kroppsfett?"
        intro="Kroppsvikt säger lite om kroppen — kroppsfett-procent säger mer. Två personer kan väga exakt lika mycket men ha helt olika kroppssammansättning. Här går vi igenom de vanligaste metoderna för att mäta kroppsfett, hur exakta de är och vad siffrorna faktiskt betyder."
        moneyPageHref="/kalkylatorer/kroppsfett"
        moneyPageLabel="Räkna ut din kroppsfett-procent med Navy-metoden"
        faqItems={FAQ_ITEMS}
        sources={SOURCES}
        relatedCalculators={[
          { href: '/kalkylatorer/kroppsfett', label: 'Kroppsfett Kalkylator' },
          { href: '/kalkylatorer/ffmi-kalkylator', label: 'FFMI Kalkylator' },
          { href: '/kalkylatorer/tdee-kalkylator', label: 'TDEE Kalkylator' },
        ]}
        relatedArticles={[
          {
            href: '/artiklar/bmi-vs-kroppsfett',
            label: 'BMI vs kroppsfett — vilket mått är bättre?',
          },
          { href: '/artiklar/vad-ar-ffmi', label: 'Vad är FFMI?' },
          { href: '/artiklar/lbm-vs-ffm', label: 'LBM vs FFM — vad är skillnaden?' },
          { href: '/artiklar/bulk-och-cut', label: 'Bulk och cut' },
        ]}
        breadcrumb={[
          { label: 'Artiklar', href: '/artiklar' },
          { label: 'Hur mäter man kroppsfett?', href: CANONICAL },
        ]}
      >
        <h2 className="text-xl font-semibold text-neutral-900 mt-6 mb-3">
          Varför mäta kroppsfett?
        </h2>
        <p>
          Kroppsvikt är ett trubbigt mått. En person som tappar fett och bygger muskler kan se
          vikten stå still — eller till och med öka — trots att kroppen förändras i rätt riktning.
          Kroppsfett-procent ger en bättre bild av vad som faktiskt händer.
        </p>
        <p className="mt-3">
          Kroppsfett mäts som andelen fettvävnad av totalvikten. Resten är fettfri massa (FFM):
          muskler, skelett, organ och vatten. Det är fördelningen mellan dessa som avgör hälsa,
          prestation och utseende — inte totalvikten i sig.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Referensvärden — vad är normalt?
        </h2>
        <p>
          De vanligaste kategoriseringarna för kroppsfett-procent (American Council on Exercise):
        </p>

        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-neutral-200 overflow-hidden">
            <div className="bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">
              Män
            </div>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Essentiellt fett', '2–5%'],
                  ['Athletic', '6–13%'],
                  ['Fitness', '14–17%'],
                  ['Normal', '18–24%'],
                  ['Övervikt', '25%+'],
                ].map(([label, range]) => (
                  <tr key={label} className="border-t border-neutral-100">
                    <td className="px-4 py-2 text-neutral-700">{label}</td>
                    <td className="px-4 py-2 text-neutral-500 text-right">{range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-lg border border-neutral-200 overflow-hidden">
            <div className="bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">
              Kvinnor
            </div>
            <table className="w-full text-sm">
              <tbody>
                {[
                  ['Essentiellt fett', '10–13%'],
                  ['Athletic', '14–20%'],
                  ['Fitness', '21–24%'],
                  ['Normal', '25–31%'],
                  ['Övervikt', '32%+'],
                ].map(([label, range]) => (
                  <tr key={label} className="border-t border-neutral-100">
                    <td className="px-4 py-2 text-neutral-700">{label}</td>
                    <td className="px-4 py-2 text-neutral-500 text-right">{range}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <p className="mt-3 text-sm text-neutral-600">
          Essentiellt fett är biologiskt nödvändigt — det finns i organ, hjärna och cellmembran och
          ska aldrig underskridas.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Mätmetoder — från guldstandard till hemmalösning
        </h2>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          DEXA — guldstandard (felmarginal ±1–2%)
        </h3>
        <p>
          DEXA (dual-energy X-ray absorptiometry) är den mest exakta tillgängliga metoden utanför
          laboratorium. En låg-dos röntgenstråle skiljer på fett, muskler och benmassa i hela
          kroppen och ger en detaljerad karta — inklusive hur fettet fördelar sig regionalt (buk,
          ben, armar).
        </p>
        <p className="mt-3">
          <strong>Fördelar:</strong> Extremt exakt, mäter även benmineraldensitet, reproducerbar.
          <br />
          <strong>Nackdelar:</strong> Kostar 500–1 500 kr, kräver klinik, svagt
          strålningsexponering. Passar bäst för baseline-mätning och uppföljning var 6–12 månader.
        </p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          Hydrodensitometri — undervattenvägning (felmarginal ±1–3%)
        </h3>
        <p>
          Historiskt ansedd som guldstandard. Kroppen vägs under vatten — skillnaden mot luftvikt
          ger kroppsdensitet som omräknas till kroppsfett via Siri-ekvationen (1961). I dag nästan
          helt ersatt av DEXA för praktiskt bruk.
        </p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          Bioimpedans — BIA (felmarginal ±3–5%)
        </h3>
        <p>
          En svag elektrisk ström leds genom kroppen. Fett leder ström sämre än muskler och vatten,
          och motståndet används för att uppskatta kroppsfett. Finns i allt från hemma-vågar till
          kliniska InBody-maskiner.
        </p>
        <p className="mt-3">
          Noggrannheten varierar kraftigt med hydrering, senaste måltid, koffein och tid på dygnet.
          En InBody på klinik är avsevärt mer tillförlitlig än en hemma-våg.
        </p>
        <p className="mt-3">
          <strong>Tips:</strong> Mät alltid på morgonen, fastande och efter toalettbesök — samma tid
          varje gång. Det minimerar variabiliteten och gör trenden meningsfull.
        </p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          Måttbandsmetoder (felmarginal ±3–5%)
        </h3>
        <p>
          Flera formler beräknar kroppsfett enbart från kroppsmått med ett måttband — inga
          specialinstrument behövs. Den vanligaste är US Navy-metoden (Hodgdon &amp; Beckett, 1984),
          som mäter midjeomfång, nackens omkrets och (för kvinnor) höftomfång och beräknar
          kroppsfett via en logaritmisk formel. Andra måttbandsbaserade metoder använder olika
          kombinationer av mätpunkter och ger något varierande resultat.
        </p>
        <p className="mt-3">
          Fördelen är att det är helt gratis och kan göras hemma. Noggrannheten är tillräcklig för
          att följa trenden, vilket är det viktigaste för de flesta.
        </p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          Kalipermetoder (felmarginal ±3–5%)
        </h3>
        <p>
          Kaliper mäter hudveckstjocklek på specifika punkter — vanligen 3, 4 eller 7 mätpunkter
          beroende på protokoll (t.ex. Jackson-Pollock). Resultaten matas in i en formel som
          uppskattar total kroppsfett-procent. Noggrannheten beror mycket på mätarens teknik och
          konsekvens — en erfaren tränare eller nutritionist ger mer tillförlitliga resultat än
          självmätning.
        </p>

        <h3 className="text-base font-semibold text-neutral-900 mt-6 mb-2">
          Profilbaserad uppskattning
        </h3>
        <p>
          Med profildata — ålder, kön, BMI och aktivitetsnivå — kan kroppsfett uppskattas via
          populationsbaserade formler (t.ex. Deurenberg). Det kräver inga mätinstrument alls men ger
          den lägsta individuella precisionen och passar bäst som grov orientering.
        </p>
        <p className="mt-3">
          Ett kompletterande sätt att kalibrera sin uppskattning är att jämföra med referensbilder —
          fotografier av verkliga kroppar med känd uppmätt kroppsfett-procent. Det ger en visuell
          förankring som siffror ensamt inte ger.
        </p>

        <h2 className="text-xl font-semibold text-neutral-900 mt-8 mb-3">
          Vilken metod ska du välja?
        </h2>
        <p>Det beror på vad du vill uppnå och vilka resurser du har:</p>
        <ul className="space-y-2 pl-4 list-disc mt-3">
          <li>
            <strong>Bästa precision:</strong> DEXA — gör en baseline-mätning och uppföljning var 3–6
            månader.
          </li>
          <li>
            <strong>Regelbunden hemmauppföljning:</strong> Måttbandsmetod, kalipermätning eller en
            konsekvent bioimpedansvåg under identiska förhållanden varje gång.
          </li>
          <li>
            <strong>Klinisk uppföljning:</strong> InBody (BIA) på gym eller klinik — mer
            tillförlitlig än hemma-vågar.
          </li>
          <li>
            <strong>Snabb orientering utan instrument:</strong> Profilbaserad uppskattning eller
            jämförelse med referensbilder ger en grov men snabb bild.
          </li>
        </ul>
        <p className="mt-3">
          Med ett personligt konto i CalculEat får du tillgång till samtliga metoder — flera
          måttbandsformler, kaliperprotokoll och profilbaserad uppskattning — samt referensbilder
          för visuell kalibrering. Det gör det enkelt att välja rätt metod för din situation och
          följa trenden över tid på ett ställe.
        </p>
        <p className="mt-3">
          Det absoluta värdet är alltid mindre viktigt än trenden. Välj en metod, håll dig till den
          och mät under identiska förhållanden varje gång.
        </p>
      </ArticleLayout>
    </>
  )
}
