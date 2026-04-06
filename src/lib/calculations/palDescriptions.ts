import type { PALSystem } from '../types'

export interface PALFormulaVariant {
  name: string
  equation?: string
  rows?: string[][]
  measurements?: string
}

export interface PALSystemDescription {
  name: string
  subtitle?: string
  description: string
  descriptionBlocks?: (
    | { type: 'text'; text: string }
    | { type: 'formula'; text: string }
    | { type: 'bullets'; items: string[] }
    | { type: 'image'; src: string; alt: string }
  )[]
  pros: string[]
  cons: string[]
  bestFor: string[]
  formulaVariants?: PALFormulaVariant[]
  sections?: {
    title: string
    blocks: (
      | { type: 'text'; text: string }
      | { type: 'formula'; text: string }
      | { type: 'bullets'; items: string[] }
      | { type: 'heading'; text: string }
      | { type: 'image'; src: string; alt: string }
    )[]
    references?: string[]
  }[]
  references?: string[]
}

export const PAL_SYSTEM_DESCRIPTIONS: Record<PALSystem, PALSystemDescription> = {
  'FAO/WHO/UNU based PAL values': {
    name: 'FAO/WHO/UNU-baserade PAL-värden',
    description:
      'Detta system är mest lämpat för Schofield-formeln då de utvecklades i samma projekt. Systemet bygger på internationell forskning och mätningar av verklig energiförbrukning.',
    formulaVariants: [
      {
        name: 'PAL-värden',
        rows: [
          ['', 'Män', 'Kvinnor'],
          ['Stillasittande', '1,3', '1,3'],
          ['Lätt aktiv', '1,6', '1,5'],
          ['Måttligt aktiv', '1,7', '1,6'],
          ['Mycket aktiv', '2,1', '1,9'],
          ['Extremt aktiv', '2,4', '2,2'],
        ],
      },
    ],
    pros: [
      'Baserat på internationell forskning och mätningar av verklig energiförbrukning',
      'Stabilt, konservativt och tillförlitligt för de flesta',
      'Överensstämmer med dietist- och myndighetsrekommendationer',
      'Väl etablerat inom vetenskaplig forskning',
    ],
    cons: [
      'Mindre flexibelt för träningsmängd och intensitet',
      'Tar inte hänsyn till individuella variationer i träning',
      'Kan underskatta behovet för mycket aktiva personer',
    ],
    bestFor: [
      'Dig som vill ha ett konservativt och forskningsbaserat estimat',
      'Nybörjare som söker en pålitlig grundnivå',
      'Personer som följer officiella näringsrekommendationer',
      'De som använder Schofield-formeln för BMR',
    ],
  },

  'DAMNRIPPED PAL values': {
    name: 'DAMNRIPPED PAL-värden',
    description:
      'Ett detaljerat system som kombinerar vardagsaktivitet och träningsintensitet för mer exakt beräkning. Bygger mer på fitnesspraxis än forskningsstandardisering.',
    formulaVariants: [
      {
        name: 'PAL-värden (Aktivitetsnivå × Träningsintensitet)',
        rows: [
          ['', 'Ingen', 'Lätt', 'Måttlig', 'Kräv.', 'Intens'],
          ['Stillasittande', '1,1', '1,2', '1,35', '1,45', '1,55'],
          ['Lätt aktiv', '1,2', '1,4', '1,45', '1,55', '1,6'],
          ['Måttligt aktiv', '1,4', '1,45', '1,6', '1,65', '1,7'],
          ['Mycket aktiv', '1,6', '1,7', '1,75', '1,8', '1,9'],
          ['Extremt aktiv', '1,8', '1,9', '2,0', '2,1', '2,2'],
        ],
      },
    ],
    pros: [
      'Mycket detaljerat – kombinerar vardagsaktivitet + träningsintensitet',
      'Passar bra för personer som tränar regelbundet',
      'Tar hänsyn till träningens intensitet, inte bara frekvens',
      'Flexibel anpassning efter individuell träningsnivå',
    ],
    cons: [
      'Inte forskningsstandardiserat; bygger mer på fitnesspraxis',
      'Risk att användaren överskattar sin aktivitetsnivå',
      'Kräver god självinsikt om träningsintensitet',
      'Kan ge för höga värden om man inte är realistisk',
    ],
    bestFor: [
      'Aktiva träningsutövare som vet sin intensitetsnivå',
      'Personer som vill ha mer detaljerad kontroll över beräkningen',
      'De som tränar regelbundet med varierande intensitet',
      'Erfarna användare som kan bedöma sin träning realistiskt',
    ],
  },

  'Pro Physique PAL values': {
    name: 'Pro Physique PAL-värden',
    description:
      'Ett coachingbaserat system som tydligt skiljer på vardagsaktivitet (bas-PAL) och träningsenergi. Ger flexibel finjustering baserat på träningsvolym.',
    formulaVariants: [
      {
        name: 'TDEE-formel',
        equation: 'TDEE = (BMR × PAL) + (dagar/vecka × min/dag ÷ 7 × Intensitetsfaktor)',
      },
      {
        name: 'PAL — Vardagsaktivitet',
        rows: [
          ['Stillasittande', '1,15'],
          ['Lätt aktiv', '1,25'],
          ['Måttligt aktiv', '1,35'],
          ['Mycket aktiv', '1,40'],
        ],
      },
      {
        name: 'Intensitetsfaktor — kcal per minut',
        rows: [
          ['Lätt', '5,0'],
          ['Måttlig', '7,5'],
          ['Krävande', '10,0'],
          ['Intensiv', '12,0'],
        ],
      },
    ],
    pros: [
      'Skiljer tydligt på vardagsaktivitet (bas-PAL) och träningsenergi',
      'Mycket användbart för folk som styrketränar och följer program',
      'Ger flexibel finjustering baserat på träningsvolym',
      'Tar hänsyn till både frekvens och duration av träning',
    ],
    cons: [
      'Bas-PAL är medvetet lågt och kan verka förvirrande',
      'Kräver att användaren vet hur intensiva träningspassen är',
      'Inte ett klassiskt PAL-system – mer en coachingmodell',
      'Kan vara komplext för nybörjare',
    ],
    bestFor: [
      'Styrketräningsutövare som följer strukturerade program',
      'Personer som vill separera basaktivitet från träning',
      'De som har god koll på träningsvolym och intensitet',
      'Erfarna tränande som söker precision i sina beräkningar',
    ],
  },

  'Fitness Stuff PAL values': {
    name: 'Fitness Stuff PAL-värden',
    description:
      'En unik modell som tar hänsyn till både träning (EAT) och vardagsrörelse (NEAT). Systemet väger in både veckans träningstimmar och genomsnittligt steglantal, där NEAT har större betydelse för kaloriförbrukningen än strukturerad träning.',
    pros: [
      'Mycket praktisk och personlig – inkluderar både träning och vardagssteg',
      'Bättre för aktiva personer med varierande livsstil',
      'Ger högre precision om användaren vet sina steg och träningstimmar',
      'Tar hänsyn till NEAT som har stor påverkan på TDEE',
      'Strukturerad träning och vardagsrörelse vägs in separat',
    ],
    cons: [
      'Kräver mer indata från användaren',
      'Beräkningen är mer komplex',
      'Kan överskatta TDEE om stegdata inte är korrekt',
      'Kräver noggrann uppföljning av steglantal',
    ],
    bestFor: [
      'Aktiva personer som spårar sina dagliga steg',
      'De som har varierande aktivitetsmönster',
      'Personer med tillgång till stegräknare eller smartwatch',
      'De som vill ha den mest detaljerade kaloriuppskattningen',
      'Användare som förstår skillnaden mellan NEAT och EAT',
    ],
    formulaVariants: [
      {
        name: 'TDEE-formel',
        equation: 'TDEE = (BMR × X) + Y',
      },
      {
        name: 'X — Träningstimmar per vecka',
        rows: [
          ['0–1 tim/vecka', '1,0'],
          ['1–3 tim/vecka', '1,125'],
          ['3–5 tim/vecka', '1,25'],
          ['6–8 tim/vecka', '1,375'],
          ['> 8 tim/vecka', '1,5'],
        ],
      },
      {
        name: 'Y — Steg per dag',
        rows: [
          ['3 000–5 000', '150'],
          ['5 000–7 000', '240'],
          ['7 000–9 000', '330'],
          ['9 000–11 000', '420'],
          ['11 000–13 000', '510'],
          ['> 13 000', '600'],
        ],
      },
    ],
  },

  'Basic internet PAL values': {
    name: 'Grundläggande internet PAL-värden',
    description:
      'Bygger på gamla Harris-Benedict-multipliers som förenklats och spridits. Ett snabbt och enkelt system som används i många online TDEE-räknare.',
    formulaVariants: [
      {
        name: 'PAL-värden',
        rows: [
          ['Stillasittande', '1,2'],
          ['Lätt aktiv', '1,375'],
          ['Måttligt aktiv', '1,55'],
          ['Mycket aktiv', '1,725'],
          ['Extremt aktiv', '1,9'],
        ],
      },
    ],
    pros: [
      'Snabba och enkla att förstå',
      'Används i många TDEE-räknare online (framförallt i de som använder Revised Harris–Benedict)',
      'Bra för nybörjare som vill ha en snabb uppskattning',
      'Låg inlärningskurva',
    ],
    cons: [
      'Härstammar inte från moderna vetenskapliga PAL-mätningar',
      'Kan både över- och underskatta TDEE kraftigt beroende på person',
      'Mindre exakt än moderna forskningsbaserade system',
      'Tar inte hänsyn till individuella variationer',
    ],
    bestFor: [
      'Nybörjare som vill ha en snabb och enkel uppskattning',
      'De som använder Revised Harris-Benedict för BMR',
      'Personer som söker en grundläggande startpunkt',
      'De som vill ha ett enkelt system utan många val',
    ],
  },

  'Beräkna din aktivitetsnivå': {
    name: 'Avancerat PAL-system',
    subtitle: 'MET-baserad energimodell • Typ: Bottom-up TDEE',
    description: '',
    descriptionBlocks: [
      {
        type: 'text',
        text: 'Detta system beräknar total daglig energiförbrukning (TDEE) genom att modellera kroppens huvudsakliga energikomponenter i stället för att använda en fast aktivitetsmultiplikator. Modellen bygger på den etablerade uppdelningen av energiförbrukning i basal metabolism (BMR/RMR), aktivitetsrelaterad energiförbrukning (NEAT + EAT) samt kostens termogena effekt (TEF):',
      },
      {
        type: 'bullets',
        items: [
          'Basal eller vilometabolism (BMR/RMR) ≈ 60 %',
          'Icke-träningsrelaterad aktivitet (NEAT) ≈ 15–30 %',
          'Träningsrelaterad aktivitet (EAT) ≈ 5–10 %',
          'Kostens termogena effekt (TEF) ≈ 8–15 %',
        ],
      },
      {
        type: 'text',
        text: 'Denna uppdelning används brett inom energimetabolismforskning.',
      },
      { type: 'image', src: '/TDEE.png', alt: 'TDEE-komponenter illustration' },
      {
        type: 'text',
        text: 'NEAT (Non-Exercise Activity Thermogenesis) delas här upp i flera delkomponenter för att bättre spegla verklig vardagsaktivitet: gång och steg, stående aktivitet samt hushålls- och arbetsrelaterade rörelser. Dessa uppskattas med hjälp av MET-värden (Metabolic Equivalent of Task) från Compendium of Physical Activities.',
      },
      {
        type: 'text',
        text: 'Metabolic Equivalent of Task (MET) är ett mått på energiförbrukning där 1 MET motsvarar kroppens energiförbrukning i vila (≈ basalmetabolism). När fysisk aktivitet anges i MET-värden inkluderar dessa därför både viloförbrukning och den extra energi som aktiviteten kräver. Till exempel innebär 3,8 MET att kroppen förbrukar 3,8 gånger så mycket energi som i vila. I formeln TDEE = BMR + NEAT + EAT + TEF representerar BMR (basalmetabolism) redan kroppens energiförbrukning i vila. För att undvika att viloförbrukningen räknas två gånger måste energin från fysisk aktivitet därför beräknas som endast den extra energin över vila. Detta görs genom att använda MET − 1 istället för hela MET-värdet. Att använda MET − 1 säkerställer att modellen är fysiologiskt korrekt och att varje komponent i energibalansen representerar en unik del av kroppens energiförbrukning, utan överlappning.',
      },
      {
        type: 'text',
        text: 'Modellen inkluderar även en SPA-faktor (Spontaneous Physical Activity) som representerar biologisk variation i spontana rörelser såsom posturala justeringar, små förflyttningar och fidgeting. Forskning visar att denna typ av aktivitet kan bidra till stora individuella skillnader i energiförbrukning mellan personer med liknande kroppssammansättning.',
      },
      { type: 'text', text: 'Den totala energiförbrukningen beräknas enligt:' },
      { type: 'formula', text: 'TDEE = BMR + NEAT_total + EAT + TEF' },
      {
        type: 'text',
        text: 'TEF utgör ungefär 10 % av TDEE. För att slippa beräkna TEF separat kan man därför lösa ut TDEE direkt genom att justera för dessa 10 %:',
      },
      { type: 'formula', text: 'TDEE = (BMR + NEAT_total + EAT) / 0,9' },
      {
        type: 'text',
        text: 'Det slutliga PAL-värdet (Physical Activity Level) beräknas därefter som:',
      },
      { type: 'formula', text: 'PAL = TDEE / BMR' },
      {
        type: 'text',
        text: 'Genom att modellera varje komponent separat kan systemet ge en mer individualiserad uppskattning av energiförbrukning än traditionella PAL-multiplikatorer.',
      },
    ],
    bestFor: [
      'Användare som vill ha en mer detaljerad uppskattning av energiförbrukning',
      'Personer med stegräknare eller smartwatch',
      'De som tränar regelbundet och kan uppskatta träningsintensitet',
      'Personer med varierande aktivitetsnivå mellan olika dagar',
      'Användare som vill förstå hur olika aktiviteter påverkar deras energibehov',
    ],
    pros: [
      'Mer individualiserad uppskattning än traditionella PAL-faktorer',
      'Baserad på etablerad energifysiologi (BMR + NEAT + EAT + TEF)',
      'Använder MET-värden från vetenskapliga aktivitetskompendier',
      'Tar hänsyn till både träning och vardagsrörelse',
      'Möjliggör uppskattning av energiförbrukning från flera aktivitetskällor',
    ],
    cons: [
      'Kräver mer indata än enklare PAL-system',
      'Självrapporterad aktivitet kan innebära osäkerhet',
      'MET-värden representerar populationsmedelvärden och kan avvika från individens faktiska energiförbrukning',
      'NEAT uppvisar stor individuell variation som är svår att mäta exakt',
      'Resultatet bör därför ses som en uppskattning snarare än en exakt mätning',
    ],
    sections: [
      {
        title: 'Basal metabolism (BMR / RMR)',
        blocks: [
          {
            type: 'text',
            text: 'Basal metabolic rate (BMR) är den energi kroppen kräver för att upprätthålla grundläggande fysiologiska funktioner såsom andning, blodcirkulation och cellulära processer. Den viktigaste determinanten för BMR är fettfri massa, som uppskattas förklara omkring 80 % av variationen i basal metabolism.',
          },
          {
            type: 'text',
            text: 'Hos personer med låg fysisk aktivitet utgör BMR vanligtvis cirka 60 % av total energiförbrukning, och ännu mer hos individer med mycket låg rörelseaktivitet såsom sederade och mekaniskt ventilerade patienter på intensivvårdsavdelningar.',
          },
          {
            type: 'text',
            text: 'BMR mäts under strikt kontrollerade laboratorieförhållanden: efter sömn, i fastande tillstånd, i vila och i termoneutral miljö. I praktiska sammanhang används oftare resting metabolic rate (RMR) som till skillnad från BMR representerar energiförbrukning i vila uppmätt när som helst under dagen och kan skilja sig från BMR med upp till 10 %.',
          },
          {
            type: 'text',
            text: 'Guldstandarden för mätning är indirekt kalorimetri, där syreupptag och koldioxidproduktion omvandlas till energiförbrukning via Weirs ekvation (1949):',
          },
          { type: 'formula', text: 'REE (kcal/dag) = 1.440 × [(VO₂ × 3.941) + (VCO₂ × 1.106)]' },
          { type: 'text', text: 'Där VO₂ och VCO₂ mäts i ml/min.' },
          {
            type: 'text',
            text: 'När indirekt kalorimetri inte är tillgänglig används prediktiva ekvationer såsom Mifflin-St Jeor, Harris-Benedict eller Cunningham, vilka har lägre precision på individnivå.',
          },
        ],
        references: [
          'von Loeffelholz, C., & Birkenfeld, A. L. (2022). Non-Exercise Activity Thermogenesis in Human Energy Homeostasis. In: Endotext [Internet]. South Dartmouth (MA): MDText.com. Tillgänglig från: https://www.ncbi.nlm.nih.gov/books/NBK279077/',
          'Weir, J. B. de V. (1949). New methods for calculating metabolic rate with special reference to protein metabolism. Journal of Physiology, 109(1–2), 1–9.',
        ],
      },
      {
        title: 'NEAT (Non-Exercise Activity Thermogenesis)',
        blocks: [
          {
            type: 'text',
            text: 'NEAT omfattar all energiförbrukning från kroppsrörelser som inte är planerad träning eller vilande metabolism.',
          },
          {
            type: 'text',
            text: 'Hos normalt aktiva individer kan NEAT utgöra cirka 15–30 % av TDEE, men variationen är stor. Hos mycket inaktiva individer kan NEAT vara så lågt som 6–10 %, medan det hos mycket aktiva individer kan överstiga 50 % av den totala energiförbrukningen.',
          },
          {
            type: 'text',
            text: 'NEAT är också den mest variabla komponenten av energiförbrukning mellan individer med liknande kroppsvikt och BMI. Därför är NEAT av särskilt intresse för viktreglering och fettmassa – små skillnader i spontan aktivitet kan under år ge avsevärda energiskillnader.',
          },
          {
            type: 'text',
            text: 'I modellen delas NEAT upp i tre delkomponenter: förflyttning, kroppshållning och övriga spontana rörelser, inklusive fidgeting (små, ofta omedvetna rörelser).',
          },
          {
            type: 'formula',
            text: 'NEAT_total = (NEAT_steps + NEAT_standing + NEAT_household) × SPA_factor',
          },
        ],
        references: [
          'Tzeravini E, Tentolouris A, Kokkinos A, Tentolouris N, Katsilambros N. Diet induced thermogenesis, older and newer data with emphasis on obesity and diabetes mellitus - A narrative review. Metabol Open. 2024 Jun 5;22:100291. doi: 10.1016/j.metop.2024.100291. PMID: 38957623; PMCID: PMC11217690.',
          'von Loeffelholz C, Birkenfeld AL. Non-Exercise Activity Thermogenesis in Human Energy Homeostasis. [Updated 2022 Nov 25]. In: Feingold KR, Adler RA, Ahmed SF, et al., editors. Endotext [Internet]. South Dartmouth (MA): MDText.com, Inc.; 2000-. Available from: https://www.ncbi.nlm.nih.gov/books/NBK279077/',
        ],
      },
      {
        title: 'NEAT_steps (gång och steg)',
        blocks: [
          {
            type: 'text',
            text: 'Praktiska uppskattningar visar att en person på cirka 70 kg förbrukar omkring 40 kcal per 1000 steg (≈0,04 kcal/steg). Energiförbrukningen per steg är ungefär proportionell mot kroppsvikt och påverkas även av gångtempo.',
          },
          { type: 'text', text: 'En förenklad modell:' },
          {
            type: 'formula',
            text: 'NEAT_steps = Steps_per_day × (0,04 / 70 × kroppsvikt) × Tempo_factor',
          },
          {
            type: 'text',
            text: 'Tempo_factor representerar gånghastighet baserat på MET-värden:\nEnergiförbrukningen vid gång ökar med kroppsvikt och gångtempo, vilket kan uppskattas med MET-värden (Ainsworth et al., 2011) där – måttlig takt, 4,5–5,5 km/h, har ett MET-värde om 3,8. — aktuell MET-värde divideras med detta.',
          },
          { type: 'formula', text: 'Tempo_factor = (gångMET − 1) / (3.8 − 1)' },
          { type: 'text', text: 'Då landar man vanligtvis mellan:' },
          { type: 'bullets', items: ['~0,8 långsam gång', '~1,0 normal gång', '~1,2 snabb gång'] },
          {
            type: 'text',
            text: 'Modellen är en praktisk uppskattning som ger en grov bild av energiförbrukning vid vardagsrörelse. Det finns ingen standardiserad peer-review-publicerad formel som exakt använder denna beräkning utan den bygger på etablerade samband mellan kroppsvikt, gånghastighet och energiförbrukning som beskrivs i MET-kompendier och forskning om stegbaserad energimetabolism.',
          },
        ],
        references: [
          'Bassett, D. R., Jr., et al. (2016). Step counting: a review… Sports Medicine, 47(7), 1303–1315.',
          'Ainsworth, B. E., et al. (2011). 2011 Compendium of Physical Activities.',
          'Verywell Fit – Steps to Calories Converter',
          'Omni Calculator – Steps to Calories',
        ],
      },
      {
        title: 'NEAT_standing (stående aktivitet)',
        blocks: [
          {
            type: 'text',
            text: 'Att stå upp ökar energiförbrukningen jämfört med sittande eftersom muskeltonus och blodcirkulation är högre samt att postural stabilisering kräver mer energi.',
          },
          {
            type: 'text',
            text: 'En metaanalys (Saeidifard et al., 2018) visar att stående i genomsnitt ökar energiförbrukningen med cirka 0,15 kcal/minut (~9 kcal/timme) jämfört med sittande. Dock tar inte analysen hänsyn till kroppsvikt. En lätt person och en tung person får samma NEAT_standing i kcal, vilket inte är fysiologiskt korrekt.',
          },
          {
            type: 'text',
            text: 'För en viktjusterad uppskattning kan man använda MET-värden från Compendium of Physical Activities där stående ger ett MET-värde som är 1,3 gånger högre än värdet för stillasittande. För att inkludera kroppsvikt föreslås en MET-baserad modell:',
          },
          { type: 'formula', text: 'NEAT_standing = (1.3 − 1) × kroppsvikt × timmar_stående' },
          {
            type: 'text',
            text: 'Meta-analysvärdet (≈9 kcal/timme) är ett enkelt genomsnitt som passar för populärvetenskapliga uppskattningar medan den MET-baserade metoden tar hänsyn till individens kroppsvikt och kan integreras med andra NEAT-komponenter som steg, hushållsarbete och små rörelser. Denna metod är därför mer användbar i praktiska NEAT-kalkyler, medan metaanalysvärdet fungerar som tumregel för genomsnittspersoner.',
          },
        ],
        references: [
          'Saeidifard F, Medina-Inojosa JR, Supervia M, Olson TP, Somers VK, Erwin PJ, Lopez-Jimenez F. Differences of energy expenditure while sitting versus standing: A systematic review and meta-analysis. Eur J Prev Cardiol. 2018;25(5):522–538.',
          'Ainsworth BE, et al. 2011 Compendium of Physical Activities: A second update of codes and MET values.',
          'Levine JA. Non‑exercise activity thermogenesis (NEAT): environment and biology. American Journal of Physiology – Endocrinology and Metabolism. 2004;286(5):E675‑E685.',
        ],
      },
      {
        title: 'NEAT_household (hushåll och arbete)',
        blocks: [
          {
            type: 'text',
            text: 'NEAT_household omfattar vardagliga aktiviteter såsom städning, matlagning och andra manuella sysslor.',
          },
          { type: 'text', text: 'Energiförbrukningen uppskattas via MET-värden:' },
          {
            type: 'formula',
            text: 'NEAT_household = (hushållsMET  − 1) × kroppsvikt × hushållstimmar',
          },
          {
            type: 'text',
            text: 'MET-värdena representerar populationsmedelvärden och tar inte fullt hänsyn till individuella skillnader i arbetstempo, teknik, belastning eller effektivitet.',
          },
          {
            type: 'text',
            text: 'Självrapportering av vardagsaktivitet är en betydande felkälla. Aktiviteter glöms ofta bort eller underskattas, tidsangivelser är osäkra, fel i rapporterad kroppsvikt påverkar resultatet linjärt. Vid praktisk användning kan den totala osäkerheten i NEAT_household uppskattas till ±20–30 % vid självskattning.',
          },
        ],
        references: [
          'Ainsworth, B. E., et al. (2011; 2024). Compendium of Physical Activities.',
          'Levine, J. A. (2004). Non-exercise activity thermogenesis (NEAT): environment and biology. Am J Physiol Endocrinol Metab.',
        ],
      },
      {
        title: 'Spontan fysisk aktivitet (SPA)',
        blocks: [
          {
            type: 'text',
            text: 'Spontaneous Physical Activity (SPA) omfattar små, lågintensiva, ofta omedvetna rörelser såsom posturala justeringar, fidgeting och små förflyttningar.',
          },
          {
            type: 'text',
            text: 'Experimentella studier med indirekt kalorimetri visar att NEAT uppvisar stor interindividuell variation. I en kontrollerad övermatningsstudie varierade förändringen i NEAT mellan −98 och +692 kcal/dag mellan individer med liknande kroppssammansättning (Levine et al., 1999). Översikter rapporterar att totala skillnader i NEAT mellan individer kan uppgå till flera hundra kilokalorier per dag och i vissa fall över 1000 kcal/dag (Levine, 2002; 2004).',
          },
          {
            type: 'text',
            text: 'Dessa skillnader inkluderar variation i spontan rörelse och postural aktivitet, även om SPA inte alltid separeras från övriga NEAT-komponenter.',
          },
          {
            type: 'text',
            text: 'Eftersom SPA är svår att mäta direkt kan den i energimodeller representeras som en justeringsfaktor:',
          },
          {
            type: 'formula',
            text: 'Total NEAT = (NEAT_steps + NEAT_standing + NEAT_household) × SPA_factor',
          },
          { type: 'text', text: 'Ett konservativt intervall:' },
          {
            type: 'bullets',
            items: [
              '0,95–0,99 låg spontan aktivitet',
              '1,00 genomsnittlig aktivitet',
              '1,01–1,10 hög spontan aktivitet',
              '1,11–1,15 mycket hög spontan aktivitet',
            ],
          },
          {
            type: 'text',
            text: 'Intervallet 0,95–1,15 är baserat på empiriskt observerad variation i NEAT och är inte en standardiserad parameter i litteraturen, utan en förenklad representation av biologisk variation.',
          },
        ],
        references: [
          'Levine JA, Eberhardt NL, Jensen MD. Role of nonexercise activity thermogenesis in resistance to fat gain in humans. Science. 1999;283(5399):212–214.',
          'Levine JA. Nonexercise activity thermogenesis. Proc Nutr Soc. 2002;61(3):371–378.',
          'Levine JA. Non-exercise activity thermogenesis (NEAT): environment and biology. Am J Physiol Endocrinol Metab. 2004;286(5):E675–E685.',
        ],
      },
      {
        title: 'EAT (Exercise Activity Thermogenesis)',
        blocks: [
          {
            type: 'text',
            text: 'EAT representerar energiförbrukning från planerad fysisk träning.',
          },
          { type: 'text', text: 'Den kan uppskattas via MET-värden:' },
          {
            type: 'formula',
            text: 'EAT = (träningsdagar/7) × (träningsminuter/60) × (träningsMET − 1) × kroppsvikt',
          },
          {
            type: 'text',
            text: 'Veckovis träningsvolym kan divideras med 7 för att erhålla ett dagligt genomsnitt.',
          },
          {
            type: 'text',
            text: 'EAT utgör vanligtvis en liten andel av total energiförbrukning hos stillasittande individer (≈ <5 %), men kan öka betydligt vid hög träningsvolym och uppgå till cirka 15–30 % eller mer hos mycket aktiva individer och elitidrottare (Westerterp, 2013; Levine, 2005).',
          },
          {
            type: 'text',
            text: 'MET-värden är populationsbaserade och kan avvika från individens faktiska energiförbrukning. Efterförbränning (EPOC) förekommer främst efter högintensiv träning och bidrar i regel med en mindre andel av den totala träningsenergin vid typiska träningspass (LaForgia et al., 2006).',
          },
        ],
        references: [
          'Ainsworth BE et al. (2011). 2011 Compendium of Physical Activities. Med Sci Sports Exerc. 43(8):1575–1581.',
          'LaForgia J, Withers RT, Gore CJ. (2006). Effects of exercise intensity and duration on the excess post-exercise oxygen consumption. J Sports Sci. 24(12):1247–1264.',
          'Westerterp KR. (2013). Physical activity and physical activity induced energy expenditure in humans: measurement, determinants, and effects. Front Physiol. 4:90.',
          'Levine JA. (2005). Measurement of energy expenditure. Public Health Nutr. 8(7A):1123–1132.',
        ],
      },
      {
        title: 'TEF (Thermic Effect of Food)',
        blocks: [
          {
            type: 'text',
            text: 'TEF är den energi som krävs för digestion, absorption och metabolism av näringsämnen.',
          },
          {
            type: 'text',
            text: 'Under energibalans motsvarar TEF i genomsnitt cirka 10 % av energiintaget, med ett typiskt intervall på 8–15 % beroende på  måltidens sammansättning.',
          },
          {
            type: 'text',
            text: 'Det är mer korrekt att uttrycka TEF som en andel av energiintag snarare än av TEE, eftersom TEF beror direkt på mängden och typen av konsumerad energi.',
          },
          { type: 'text', text: 'TEF varierar mellan makronutrienter:' },
          {
            type: 'bullets',
            items: ['Protein: cirka 20–30 %', 'Kolhydrater: cirka 5–10 %', 'Fett: cirka 0–3 %'],
          },
          {
            type: 'text',
            text: 'Den högre termogena effekten av protein beror på den energikrävande metabolismen av aminosyror, inklusive proteinsyntes och ureabildning. Följaktligen ger måltider med högre proteininnehåll generellt en något högre postprandial energiförbrukning jämfört med fett- eller kolhydratrika måltider, givet samma energimängd. Interindividuell variation förekommer där bland annat kroppssammansättning,  insulinresistens och metabol hälsa påverkar.',
          },
          {
            type: 'text',
            text: 'Dessa intervall är baserade på indirekt kalorimetri och sammanställningar av kontrollerade måltidsstudier (Westerterp, 2004; Halton & Hu, 2004). I denna modell antas en genomsnittlig TEF på 10 %, vilket integreras i TDEE-ekvationen.',
          },
        ],
        references: [
          'Kinabo JL, Durnin JV. Thermic effect of food in man: effect of meal composition, and energy content, Br J Nutr. 1990;64:37–44.',
          'Westerterp KR. (2004). Diet induced thermogenesis. Nutr Metab (Lond). 1:5.',
          'von Loeffelholz C, Birkenfeld AL. (2022). Non-Exercise Activity Thermogenesis in Human Energy Homeostasis. In: Endotext [Internet]. MDText.com.',
        ],
      },
    ],
  },

  'Custom PAL': {
    name: 'Anpassat PAL-värde',
    description:
      'Låter dig ange ditt eget PAL-värde baserat på egna mätningar, erfarenhet eller rekommendationer från nutritionist/tränare. Ger maximal flexibilitet men kräver kunskap om vad som är ett realistiskt PAL-värde.',
    pros: [
      'Maximal flexibilitet och personlig anpassning',
      'Perfekt om du har trackad data över tid',
      'Användbart om du följer rekommendationer från nutritionist',
      'Kan baseras på verklig kaloriförbrukning och viktförändring',
    ],
    cons: [
      'Kräver kunskap om vad som är realistiska PAL-värden',
      'Risk för felaktiga estimat utan erfarenhet',
      'Ingen vägledning från systemet',
      'Lätt att över- eller underskatta',
    ],
    bestFor: [
      'Erfarna användare som vet sitt faktiska PAL-värde',
      'Personer som följer en nutritionists rekommendationer',
      'De som har trackad kaloriintag och viktförändringar över tid',
      'Avancerade användare som förstår PAL-koncept grundligt',
    ],
  },
}
