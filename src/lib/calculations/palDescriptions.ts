import type { PALSystem } from '../types'

export interface PALFormulaVariant {
  name: string
  equation?: string
  rows?: string[][]
  measurements?: string
}

export interface PALSystemDescription {
  name: string
  description: string
  pros: string[]
  cons: string[]
  bestFor: string[]
  formulaVariants?: PALFormulaVariant[]
  sections?: { title: string; content: string }[]
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
    description:
      'MET-baserad energimodell • Typ: Bottom-up TDEE\n\nDetta system beräknar total daglig energiförbrukning (TDEE) genom att modellera kroppens huvudsakliga energikomponenter i stället för att använda en fast aktivitetsmultiplikator. Modellen bygger på den etablerade uppdelningen av energiförbrukning i basal metabolism (BMR/RMR), aktivitetsrelaterad energiförbrukning (NEAT + EAT) samt kostens termogena effekt (TEF).\n\nNEAT (Non-Exercise Activity Thermogenesis) delas här upp i flera delkomponenter för att bättre spegla verklig vardagsaktivitet: gång och steg, stående aktivitet samt hushålls- och arbetsrelaterade rörelser. Dessa uppskattas med hjälp av MET-värden (Metabolic Equivalent of Task) från Compendium of Physical Activities.\n\nMetabolic Equivalent of Task (MET) är ett mått på energiförbrukning där 1 MET motsvarar kroppens energiförbrukning i vila (≈ basalmetabolism). När fysisk aktivitet anges i MET-värden inkluderar dessa därför både viloförbrukning och den extra energi som aktiviteten kräver. Till exempel innebär 3,8 MET att kroppen förbrukar 3,8 gånger så mycket energi som i vila. I formeln TDEE = BMR + NEAT + EAT + TEF representerar BMR (basalmetabolism) redan kroppens energiförbrukning i vila. För att undvika att viloförbrukningen räknas två gånger måste energin från fysisk aktivitet därför beräknas som endast den extra energin över vila. Detta görs genom att använda MET − 1 istället för hela MET-värdet.\n\nModellen inkluderar även en SPA-faktor (Spontaneous Physical Activity) som representerar biologisk variation i spontana rörelser såsom posturala justeringar, små förflyttningar och fidgeting.\n\nDen totala energiförbrukningen beräknas enligt:\nTDEE = (BMR + NEAT_total + EAT) / 0,9\ndär nämnaren 0,9 representerar att kostens termogena effekt (TEF) i genomsnitt motsvarar cirka 10 % av energiintaget.\n\nDet slutliga PAL-värdet beräknas:\nPAL = TDEE / BMR\n\nGenom att modellera varje komponent separat kan systemet ge en mer individualiserad uppskattning av energiförbrukning än traditionella PAL-multiplikatorer.',
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
        title: 'Vetenskaplig bakgrund — Komponenter i energiförbrukningen',
        content:
          'Daglig energiomsättning (Total Daily Energy Expenditure, TDEE) delas vanligen upp i fyra huvudkomponenter:\n• Basal eller vilometabolism (BMR/RMR)\n• Icke-träningsrelaterad aktivitet (NEAT)\n• Träningsrelaterad aktivitet (EAT)\n• Kostens termogena effekt (TEF)',
      },
      {
        title: 'Basal metabolism (BMR / RMR)',
        content:
          'Basal metabolic rate (BMR) är den energi kroppen kräver för att upprätthålla grundläggande fysiologiska funktioner såsom andning, blodcirkulation och cellulära processer. Den viktigaste determinanten för BMR är fettfri massa, som uppskattas förklara omkring 80 % av variationen i basal metabolism.\n\nHos personer med låg fysisk aktivitet utgör BMR vanligtvis cirka 60 % av total energiförbrukning.\n\nBMR mäts under strikt kontrollerade laboratorieförhållanden: efter sömn, i fastande tillstånd, i vila och i termoneutral miljö. I praktiska sammanhang används oftare resting metabolic rate (RMR) som kan skilja sig från BMR med upp till 10 %.\n\nGuldstandarden för mätning är indirekt kalorimetri, där syreupptag och koldioxidproduktion omvandlas till energiförbrukning via Weirs ekvation:\nREE (kcal/dag) = [(VO₂ × 3.941) + (VCO₂ × 1.11)] × 1440\n\nNär indirekt kalorimetri inte är tillgänglig används prediktiva ekvationer såsom Mifflin-St Jeor, Harris-Benedict eller Cunningham.',
      },
      {
        title: 'NEAT (Non-Exercise Activity Thermogenesis)',
        content:
          'NEAT omfattar all energiförbrukning från kroppsrörelser som inte är planerad träning eller vilande metabolism.\n\nHos normalt aktiva individer kan NEAT utgöra cirka 15–30 % av TDEE, men variationen är stor. NEAT är också den mest variabla komponenten av energiförbrukning mellan individer med liknande kroppsvikt och BMI.\n\nI modellen delas NEAT upp i tre delkomponenter:\nNEAT_total = (NEAT_steps + NEAT_standing + NEAT_household) × SPA_factor',
      },
      {
        title: 'NEAT_steps (gång och steg)',
        content:
          'Praktiska uppskattningar visar att en person på cirka 70 kg förbrukar omkring 40 kcal per 1000 steg (≈0,04 kcal/steg). Energiförbrukningen per steg är ungefär proportionell mot kroppsvikt och påverkas även av gångtempo.\n\nNEAT_steps ≈ Steps_per_day × (0,04 / 70 × kroppsvikt) × Tempo_factor\n\nTempo_factor = (gångMET − 1) / (3.8 − 1)\n\nDå landar man vanligtvis mellan:\n• ~0,8 långsam gång\n• ~1,0 normal gång\n• ~1,2 snabb gång\n\nDetta är en praktisk uppskattning som bygger på etablerade samband mellan kroppsvikt, gånghastighet och energiförbrukning.',
      },
      {
        title: 'NEAT_standing (stående aktivitet)',
        content:
          'Att stå upp ökar energiförbrukningen jämfört med sittande eftersom muskeltonus och blodcirkulation är högre samt att postural stabilisering kräver mer energi.\n\nEn metaanalys (Saeidifard et al., 2018) visar att stående i genomsnitt ökar energiförbrukningen med cirka 0,15 kcal/minut (~9 kcal/timme) jämfört med sittande.\n\nFör en viktjusterad uppskattning används MET-värden från Compendium of Physical Activities:\nNEAT_standing = (1.3 − 1) × kroppsvikt × timmar_stående',
      },
      {
        title: 'NEAT_household (hushåll och arbete)',
        content:
          'NEAT_household omfattar vardagliga aktiviteter såsom städning, matlagning och andra manuella sysslor.\n\nNEAT_household = (hushållsMET − 1) × kroppsvikt × hushållstimmar\n\nMET-värdena representerar populationsmedelvärden. Vid praktisk användning kan den totala osäkerheten i NEAT_household uppskattas till ±20–30 % vid självskattning.',
      },
      {
        title: 'Spontan fysisk aktivitet (SPA)',
        content:
          'Spontaneous Physical Activity (SPA) omfattar små, lågintensiva, ofta omedvetna rörelser såsom posturala justeringar, fidgeting och små förflyttningar.\n\nExperimentella studier med indirekt kalorimetri visar att NEAT uppvisar stor interindividuell variation. I en kontrollerad övermatningsstudie varierade förändringen i NEAT mellan −98 och +692 kcal/dag (Levine et al., 1999).\n\nEtt konservativt intervall:\n• 0,95–0,99 låg spontan aktivitet\n• 1,00 genomsnittlig aktivitet\n• 1,01–1,10 hög spontan aktivitet\n• 1,11–1,15 mycket hög spontan aktivitet\n\nIntervallet 0,95–1,15 är en förenklad representation av biologisk variation och är inte en standardiserad parameter i litteraturen.',
      },
      {
        title: 'EAT (Exercise Activity Thermogenesis)',
        content:
          'EAT representerar energiförbrukning från planerad fysisk träning.\n\nEAT = (träningsdagar/7) × (träningsminuter/60) × (träningsMET − 1) × kroppsvikt\n\nVeckovis träningsvolym divideras med 7 för att erhålla ett dagligt genomsnitt. MET-värden är populationsbaserade och kan avvika från individens faktiska energiförbrukning. Efterförbränning (EPOC) förekommer främst efter högintensiv träning.',
      },
      {
        title: 'TEF (Thermic Effect of Food)',
        content:
          'TEF är den energi som krävs för digestion, absorption och metabolism av näringsämnen.\n\nUnder energibalans motsvarar TEF i genomsnitt cirka 10 % av energiintaget, med ett typiskt intervall på 8–15 % beroende på måltidens sammansättning.\n\nTEF varierar mellan makronutrienter:\n• Protein: cirka 20–30 %\n• Kolhydrater: cirka 5–10 %\n• Fett: cirka 0–3 %\n\nI denna modell antas en genomsnittlig TEF på 10 %, vilket integreras i TDEE-ekvationen:\nTDEE = (BMR + NEAT_total + EAT) / 0,9',
      },
    ],
    references: [
      'von Loeffelholz, C., & Birkenfeld, A. L. (2022). Non-Exercise Activity Thermogenesis in Human Energy Homeostasis. In: Endotext [Internet]. South Dartmouth (MA): MDText.com. https://www.ncbi.nlm.nih.gov/books/NBK279077/',
      'Weir, J. B. de V. (1949). New methods for calculating metabolic rate with special reference to protein metabolism. Journal of Physiology, 109(1–2), 1–9.',
      'Tzeravini E, et al. (2024). Diet induced thermogenesis, older and newer data with emphasis on obesity and diabetes mellitus - A narrative review. Metabol Open. 22:100291.',
      'Bassett, D. R., Jr., et al. (2016). Step counting: a review of measurement considerations and health-related applications. Sports Medicine, 47(7), 1303–1315.',
      'Ainsworth, B. E., et al. (2011). 2011 Compendium of Physical Activities. Medicine & Science in Sports & Exercise, 43(8), 1575–1581.',
      'Saeidifard F, et al. (2018). Differences of energy expenditure while sitting versus standing: A systematic review and meta-analysis. Eur J Prev Cardiol. 25(5):522–538.',
      'Levine JA. (2004). Non-exercise activity thermogenesis (NEAT): environment and biology. Am J Physiol Endocrinol Metab. 286(5):E675–E685.',
      'Levine JA, Eberhardt NL, Jensen MD. (1999). Role of nonexercise activity thermogenesis in resistance to fat gain in humans. Science. 283(5399):212–214.',
      'Levine JA. (2002). Nonexercise activity thermogenesis. Proc Nutr Soc. 61(3):371–378.',
      'LaForgia J, Withers RT, Gore CJ. (2006). Effects of exercise intensity and duration on the excess post-exercise oxygen consumption. J Sports Sci. 24(12):1247–1264.',
      'Westerterp KR. (2004). Diet induced thermogenesis. Nutr Metab (Lond). 1:5.',
      'Kinabo JL, Durnin JV. (1990). Thermic effect of food in man: effect of meal composition, and energy content. Br J Nutr. 64:37–44.',
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
