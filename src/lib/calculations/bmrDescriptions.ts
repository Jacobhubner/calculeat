import type { BMRFormula } from '../types'

export interface BMRFormulaVariant {
  gender: 'Män' | 'Kvinnor' | 'Båda'
  name: string
  equation: string
  measurements: string
}

export interface BMRFormulaDescription {
  name: string
  year: string
  type: string
  description: string
  formulaVariants?: BMRFormulaVariant[]
  pros: string[]
  cons: string[]
  references: string[]
}

export const BMR_FORMULA_DESCRIPTIONS: Record<BMRFormula, BMRFormulaDescription> = {
  'Mifflin-St Jeor equation': {
    name: 'Mifflin-St Jeor-ekvationen',
    year: '1990',
    type: 'RMR',
    description:
      'En av de mest validerade och använda formlerna för att beräkna basalmetabolism hos friska vuxna.',
    formulaVariants: [
      {
        gender: 'Båda',
        name: '',
        equation: 'RMR = 9,99×vikt + 6,25×längd − 4,92×ålder + kön',
        measurements: 'Vikt i kg, längd i cm, ålder i år\nkön = +5 för män, −161 för kvinnor',
      },
    ],
    pros: [
      'Validerad över olika BMI-intervall - fungerar konsekvent bra hos normalviktiga, överviktiga och feta individer',
      'Flera metaanalyser (t.ex. Frankenfield et al., 2005) visar att Mifflin-St Jeor är den mest noggranna RMR-prediktorn för friska, icke-feta och feta vuxna i USA och västerländska populationer',
    ],
    cons: [
      'Likt många prediktiva ekvationer tar den inte hänsyn till fettfri massa, så den kan underskatta RMR hos mycket muskulösa individer (t.ex. atleter)',
    ],
    references: [
      'Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO. A new predictive equation for resting energy expenditure in healthy individuals. Am J Clin Nutr. 1990 Feb;51(2):241-7. doi: 10.1093/ajcn/51.2.241. PMID: 2305711.',
      'Frankenfield D, Roth-Yousey L, Compher C. Comparison of predictive equations for resting metabolic rate in healthy nonobese and obese adults: a systematic review. J Am Diet Assoc. 2005 May;105(5):775-89. doi: 10.1016/j.jada.2005.02.005. PMID: 15883556.',
    ],
  },

  'Cunningham equation': {
    name: 'Cunningham (Katch och McArdle)-ekvationen',
    year: '1991',
    type: 'RMR',
    description:
      'Utvecklad av Cunningham och populariserad av Katch och McArdle i sin lärobok om träningsfysiologi.',
    formulaVariants: [
      {
        gender: 'Båda',
        name: '',
        equation: 'RMR = 370 + 21,6×FFM',
        measurements: 'FFM = fettfri massa (kg)',
      },
    ],
    pros: [
      'Anses vara mer noggrann för individer med låg kroppsfettsprocent eller hög muskelmassa, såsom atleter',
      'Tar hänsyn till att muskler kräver mer energi att underhålla jämfört med fettceller',
    ],
    cons: ['Kräver att du känner till din kroppsfettprocent för att kunna användas'],
    references: [
      'Cunningham JJ. Body composition as a determinant of energy expenditure: a synthetic review and a proposed general prediction equation. Am J Clin Nutr. 1991 Dec;54(6):963-9. doi: 10.1093/ajcn/54.6.963. PMID: 1957828.',
    ],
  },

  'Oxford/Henry equation': {
    name: 'Oxford/Henry-ekvationen',
    year: '2005',
    type: 'BMR',
    description:
      'Till skillnad från de äldre Schofield-ekvationerna (som används av FAO/WHO/UNU) exkluderade Oxford-ekvationerna biased italiensk data (som hade ovanligt höga BMR-värden).',
    formulaVariants: [
      {
        gender: 'Män',
        name: '',
        equation:
          '< 3 år:   BMR = 28,2×vikt + 859×längd − 371\n3–9 år:  BMR = 15,1×vikt + 74,2×längd + 306\n10–17 år: BMR = 15,6×vikt + 266×längd + 299\n18–29 år: BMR = 14,4×vikt + 313×längd + 113\n30–59 år: BMR = 11,4×vikt + 541×längd − 137\n≥ 60 år:  BMR = 11,4×vikt + 541×längd − 256',
        measurements: 'Vikt i kg, längd i m',
      },
      {
        gender: 'Kvinnor',
        name: '',
        equation:
          '< 3 år:   BMR = 30,4×vikt + 703×längd − 287\n3–9 år:  BMR = 15,9×vikt + 210×längd + 349\n10–17 år: BMR = 9,4×vikt + 249×längd + 462\n18–29 år: BMR = 10,4×vikt + 615×längd − 282\n30–59 år: BMR = 8,18×vikt + 502×längd − 11,6\n≥ 60 år:  BMR = 8,52×vikt + 421×längd + 10,7',
        measurements: 'Vikt i kg, längd i m',
      },
    ],
    pros: ['Ger lägre, mer noggranna BMR-uppskattningar för många globala populationer'],
    cons: [
      'Kan underskatta behov i populationer där fysisk aktivitetsnivå eller muskelmassa är hög',
    ],
    references: [
      'Henry CJ. Basal metabolic rate studies in humans: measurement and development of new equations. Public Health Nutr. 2005 Oct;8(7A):1133-52. doi: 10.1079/phn2005801. PMID: 16277825.',
    ],
  },

  'Schofield equation': {
    name: 'Schofield (FAO/WHO/UNU)-ekvationen',
    year: '1985',
    type: 'BMR',
    description:
      'Utvecklad av W.N. Schofield som en del av en studie beställd av FAO och WHO för att standardisera energibehov världen över.',
    formulaVariants: [
      {
        gender: 'Män',
        name: '',
        equation:
          '< 3 år:   BMR = 60,9×vikt − 54\n3–9 år:  BMR = 22,7×vikt + 495\n10–17 år: BMR = 17,5×vikt + 651\n18–29 år: BMR = 15,3×vikt + 679\n30–59 år: BMR = 11,6×vikt + 879\n≥ 60 år:  BMR = 13,5×vikt + 487',
        measurements: 'Vikt i kg',
      },
      {
        gender: 'Kvinnor',
        name: '',
        equation:
          '< 3 år:   BMR = 61,0×vikt − 51\n3–9 år:  BMR = 22,5×vikt + 499\n10–17 år: BMR = 12,2×vikt + 746\n18–29 år: BMR = 14,7×vikt + 496\n30–59 år: BMR = 8,7×vikt + 829\n≥ 60 år:  BMR = 10,5×vikt + 596',
        measurements: 'Vikt i kg',
      },
    ],
    pros: [
      'Baserad på 7 173 försökspersoner från 114 studier - en av de mest omfattande BMR-datamängderna tillgängliga på 1980-talet',
      'Förblir en av de mest använda ekvationerna för att uppskatta energibehov, särskilt i kliniska och folkhälsomiljöer',
    ],
    cons: [
      'Överestimering av BMR hos kvinnor över 18 år, vuxna med lägre kroppsvikt och personer från tropiska regioner',
      'Överrepresentation av italienska försökspersoner (47% av datan), som hade högre BMR än genomsnittet',
      'Underrepresentation av tropiska populationer (t.ex. Indien, Filippinerna, Brasilien), vilket leder till systematisk överestimering av BMR hos många grupper',
    ],
    references: [
      'Schofield WN. Predicting basal metabolic rate, new standards and review of previous work. Hum Nutr Clin Nutr. 1985;39 Suppl 1:5-41. PMID: 4044297.',
      'https://www.fao.org/4/aa040e/AA040E06.htm#ch6',
      'Henry CJ. Basal metabolic rate studies in humans: measurement and development of new equations. Public Health Nutr. 2005 Oct;8(7A):1133-52. doi: 10.1079/phn2005801. PMID: 16277825.',
    ],
  },

  'Revised Harris-Benedict equation': {
    name: 'Reviderad Harris-Benedict (Roza och Shizgal)-ekvationen',
    year: '1984',
    type: 'BMR',
    description:
      '1984 reviderades de ursprungliga Harris-Benedict-ekvationerna med ny data av Roza och Shizgal.',
    formulaVariants: [
      {
        gender: 'Män',
        name: '',
        equation: 'BMR = 88,362 + 13,397×vikt + 4,799×längd − 5,677×ålder',
        measurements: 'Vikt i kg, längd i cm, ålder i år',
      },
      {
        gender: 'Kvinnor',
        name: '',
        equation: 'BMR = 447,593 + 9,247×vikt + 3,098×längd − 4,330×ålder',
        measurements: 'Vikt i kg, längd i cm, ålder i år',
      },
    ],
    pros: [
      'I jämförelser med faktisk energiförbrukning visade sig de reviderade ekvationerna vara mer noggranna än originalet',
    ],
    cons: [
      'Mindre noggrann för individer med atypisk kroppssammansättning (t.ex. mycket magra eller feta)',
      'I flera valideringsstudier har Mifflin-St Jeor-ekvationen överträffat Roza och Shizgal när det gäller att förutsäga BMR, särskilt i moderna populationer med högre andel övervikt och fetma',
    ],
    references: [
      'Roza AM, Shizgal HM. The Harris Benedict equation reevaluated: resting energy requirements and the body cell mass. Am J Clin Nutr. 1984 Jul;40(1):168-82. doi: 10.1093/ajcn/40.1.168. PMID: 6741850.',
    ],
  },

  'Original Harris-Benedict equation': {
    name: 'Original Harris-Benedict-ekvationen',
    year: '1918, 1919',
    type: 'BMR',
    description:
      'Harris-Benedict-formeln var banbrytande 1918 och lade grunden för metabolisk forskning. 1919-publikationen är mer omfattande och citeras ofta som det grundläggande arbetet för att uppskatta basalmetabolism (BMR).',
    formulaVariants: [
      {
        gender: 'Män',
        name: '',
        equation: 'BMR = 66,473 + 13,7516×vikt + 5,0033×längd − 6,755×ålder',
        measurements: 'Vikt i kg, längd i cm, ålder i år',
      },
      {
        gender: 'Kvinnor',
        name: '',
        equation: 'BMR = 655,0955 + 9,5634×vikt + 1,8496×längd − 4,6756×ålder',
        measurements: 'Vikt i kg, längd i cm, ålder i år',
      },
    ],
    pros: ['Historiskt viktigt arbete som lade grunden för BMR-beräkningar'],
    cons: [
      'Tenderar att överskatta BMR, särskilt hos kvinnor och de med lägre fettfri massa - ofta överestimerar med 4% till 21% beroende på individ',
      'Jämfört med nyare formler som Mifflin-St Jeor (1990) presterar Harris-Benedict sämre',
    ],
    references: [
      'Harris JA, Benedict FG. A Biometric Study of Human Basal Metabolism. Proc Natl Acad Sci U S A. 1918 Dec;4(12):370-3. doi: 10.1073/pnas.4.12.370. PMID: 16576330; PMCID: PMC1091498.',
      'Harris, J. A., & Benedict, F. G. (1919). A Biometric Study of Basal Metabolism in Man. Washington, D.C.: Carnegie Institution of Washington.',
    ],
  },

  'MacroFactor standard equation': {
    name: 'MacroFactor Standard-ekvationen',
    year: '2024',
    type: 'RMR/BMR',
    description:
      'Baserad på Oxford/Henry-ekvationen och Cunningham-ekvationen. Tar hänsyn till icke-linjär skalning av metabolism.',
    formulaVariants: [
      {
        gender: 'Båda',
        name: '',
        equation: 'RMR = 129,6×vikt⁰·⁵⁵ + 0,011×längd² − ålderfaktor×ålder − 213,8×könsfaktor',
        measurements:
          'Vikt i kg, längd i cm, ålder i år\nålderfaktor = 1,96 (≤ 60 år), 4,9 (> 60 år)\nkönsfaktor = 0 för män, 1 för kvinnor',
      },
    ],
    pros: [
      'Tar hänsyn till att metabolismen inte skalar linjärt med kroppsvikt - om någon väger dubbelt så mycket bränner de inte nödvändigtvis dubbelt så många kalorier',
      'Modern formel utvecklad med hänsyn till aktuell forskningsdata',
    ],
    cons: ['Relativt ny formel med begränsad långsiktig validering'],
    references: [],
  },

  'MacroFactor FFM equation': {
    name: 'MacroFactor FFM-ekvationen',
    year: '2024',
    type: 'RMR',
    description:
      'Variant av MacroFactor-ekvationen som använder fettfri massa (FFM) för mer precisa beräkningar.',
    formulaVariants: [
      {
        gender: 'Båda',
        name: '',
        equation: 'RMR = 50,2×FFM⁰·⁷ + 40,5×(FFM⁰·⁷ × FM⁰·⁰⁶⁶) − ålderfaktor×ålder',
        measurements:
          'FFM = fettfri massa (kg)\nFM = fettmassa (kg)\nålderfaktor = 1,1 (≤ 60 år), 2,75 (> 60 år)',
      },
    ],
    pros: [
      'Bättre än "Standard" om du känner till din kroppsfettsprocent',
      'Tar hänsyn till icke-linjär skalning av metabolism',
    ],
    cons: ['Kräver att du känner till din kroppsfettprocent'],
    references: [],
  },

  'MacroFactor athlete equation': {
    name: 'MacroFactor Atlet-ekvationen',
    year: '2024',
    type: 'RMR',
    description:
      'Specialanpassad för atleter som tränar intensivt minst sju timmar per vecka. Atleter har högre RMR eftersom de tenderar att vara magrare och ha mer muskelmassa än icke-atleter.',
    formulaVariants: [
      {
        gender: 'Båda',
        name: '',
        equation: 'RMR = 40,4×FFM⁰·⁹³²',
        measurements: 'FFM = fettfri massa (kg)',
      },
    ],
    pros: [
      'Speciellt utformad för atleter som spenderar minst sju timmar per vecka med intensiv träning',
      'Tar hänsyn till att massan av högmetabola organ (särskilt hjärta, njurar och lever) hos atleter skalar starkare med övergripande kroppsstorlek än relationen som observeras hos icke-atleter',
    ],
    cons: [
      'Kräver att du känner till din kroppsfettprocent',
      'Endast lämplig för individer med mycket hög träningsvolym (7+ timmar intensiv träning per vecka)',
    ],
    references: [],
  },

  'Fitness Stuff Podcast equation': {
    name: 'Fitness Stuff Podcast-ekvationen',
    year: 'Okänt. Tidigt 2020-tal (?)',
    type: 'RMR',
    description:
      'Baserad på Cunningham-ekvationen och Mifflin-St Jeor-ekvationen. Denna ekvation använder Cunningham-ekvationen som bas för att uppskatta RMR, men kombinerar könsdelen av ekvationen som Mifflin-St Jeor har.',
    formulaVariants: [
      {
        gender: 'Båda',
        name: '',
        equation: 'RMR = (370 + 21,6×FFM + könsfaktor) × ålderfaktor',
        measurements:
          'FFM = fettfri massa (kg)\nkönsfaktor = +5 för män, −161 för kvinnor\nålderfaktor = 1,0 (≤ 60 år), 0,9 (> 60 år)',
      },
    ],
    pros: [
      'Kombinerar styrkor från både Cunningham (fettfri massa) och Mifflin-St Jeor (könsspecifik)',
    ],
    cons: ['Kräver att du känner till din kroppsfettprocent'],
    references: [],
  },
}
