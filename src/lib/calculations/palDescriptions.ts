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
    name: 'Beräkna din aktivitetsnivå',
    description:
      'Det mest detaljerade och vetenskapligt grundade systemet. Beräknar ditt PAL-värde från grunden genom att summera BMR + NEAT + EAT och backgrundsinräknat för TEF. Systemet bygger på MET-värden (Metabolic Equivalent of Task) från vetenskaplig forskning och tar hänsyn till alla komponenter av daglig energiförbrukning: strukturerad träning, dagliga steg och gångtempo, stående arbete, hushållsaktiviteter samt spontan fysisk aktivitet (SPA-faktor baserad på NEAT-litteraturen från Levine, 2002-2015).',
    pros: [
      'Mest exakt och personlig beräkning av alla PAL-system',
      'Baserat på vetenskapliga MET-värden och NEAT-forskning',
      'Tar hänsyn till alla komponenter: träning (EAT), vardagsrörelse (NEAT), och spontan aktivitet (SPA)',
      'Inkluderar TEF (Thermic Effect of Food) i backgrundsberäkningen',
      'Perfekt för varierad livsstil med både träning och vardagsaktivitet',
      'Ger djup förståelse för var din energiförbrukning kommer ifrån',
      'Möjlighet att se exakt hur olika aktiviteter påverkar TDEE',
    ],
    cons: [
      'Kräver mest indata av alla system – kan ta tid att fylla i',
      'Förutsätter att användaren känner till sina aktivitetsmönster',
      'Mer komplex beräkning som kan verka överväldigande för nybörjare',
      'Kräver uppföljning av steg och träningstid för bäst precision',
      'Noggrannheten beror på hur exakt användaren rapporterar sina aktiviteter',
    ],
    bestFor: [
      'Erfarna användare som vill ha maximalt exakt kaloriuppskattning',
      'Personer med tillgång till stegräknare eller smartwatch',
      'De som har god koll på sina tränings- och aktivitetsmönster',
      'Användare som vill förstå sin energiförbrukning i detalj',
      'Personer med varierande veckoschema (vissa dagar aktiva, andra stillasittande)',
      'De som är villiga att investera tid för högsta möjliga precision',
      'Personer som följer strukturerade träningsprogram och kan rapportera MET-värden',
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
