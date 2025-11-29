import type { BMRFormula } from '../types'

export interface BMRFormulaDescription {
  name: string
  year: string
  type: string
  description: string
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
    pros: [
      'Kombinerar styrkor från både Cunningham (fettfri massa) och Mifflin-St Jeor (könsspecifik)',
    ],
    cons: ['Kräver att du känner till din kroppsfettprocent'],
    references: [],
  },
}
