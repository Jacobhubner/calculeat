/**
 * Information om alla kroppssammansättningsmetoder och ekvationer
 * Används för info-modaler i användargränssnittet
 */

import type { BodyCompositionMethod, MethodVariation } from '@/lib/calculations/bodyComposition'

export interface FormulaVariant {
  gender?: 'Män' | 'Kvinnor' | 'Båda'
  name: string
  equation: string
  measurements: string
  reference?: string
}

export interface MethodInfo {
  title: string
  year?: string
  description: string
  formula?: string
  formulaVariants?: FormulaVariant[]
  requiredMeasurements?: string[]
  notes?: string
  pros?: string[]
  cons?: string[]
  references?: string[]
  betterFor?: string[]
  genderSpecific?: 'male' | 'female' | 'both'
  returnsDensity?: boolean
}

export const siriInfo: MethodInfo = {
  title: 'Siri-ekvationen',
  year: '1961',
  description:
    'Siri-ekvationen används för att omvandla kroppsdensitet till kroppsfettprocent enligt tvåkompartment-modellen (fettmassa + fettfri massa). Den är den mest etablerade och citerade formeln inom forskning och klinisk praxis.',
  formula: 'Kroppsfett% = (495 ÷ Kroppsdensitet) − 450',
  pros: [
    'Tenderar att ge något högre fettprocent än Brozek',
    'Lämplig för individer med normal till låg kroppsfettprocent',
    'Kan överskatta fettprocent hos magra, muskulösa individer eller äldre med låg bentäthet',
    'Standardval i de flesta forsknings- och kliniska sammanhang',
  ],
  references: [
    'Siri WE. Body composition from fluid spaces and density: analysis of methods. I: Brozek J, Henschel A (editors). Techniques for measuring body composition. Washington DC: National Academy of Sciences; 1961. pp 223-244.',
  ],
  genderSpecific: 'both',
}

export const brozekInfo: MethodInfo = {
  title: 'Brozek-ekvationen',
  year: '1963',
  description:
    'Brozek-ekvationen är en alternativ formel som också omvandlar kroppsdensitet till kroppsfettprocent med tvåkompartment-modellen. Den har något annorlunda antaganden om den fettfria massans densitet.',
  formula: 'Kroppsfett% = (457 ÷ Kroppsdensitet) − 414,2',
  pros: [
    'Ger ofta något lägre fettprocent än Siri',
    'Lämplig för magra och muskulösa individer eftersom den bättre tar hänsyn till högre andel fettfri massa',
    'Mindre känslig för överskattning hos låg fettprocent, men fortfarande begränsad för äldre eller personer med extrem kroppssammansättning',
    'Kan användas som alternativ till Siri beroende på individens kroppstyp',
  ],
  references: [
    'Brozek J, Grande F, Anderson JT, Keys A. Densitometric analysis of body composition: revision of some quantitative assumptions. Ann N Y Acad Sci. 1963;110:113-40.',
  ],
  genderSpecific: 'both',
}

export const methodInformation: Record<string, MethodInfo> = {
  'jp3-male': {
    title: 'Jackson-Pollock 3-punkts kalipermetod',
    year: 'män: 1978, kvinnor: 1980, kläder på: 1985',
    description:
      'Jackson–Pollocks 3-punkts hudvecksekvation är en av de mest använda metoderna för att uppskatta kroppsfettprocent, eftersom den är enkel, snabb och relativt tillförlitlig.\n\nMetoden tenderar dock att underskatta kroppsfettprocenten hos relativt smala personer (män under ca 15 % kroppsfett och kvinnor under ca 25 %). Den är därför mer träffsäker för personer med högre kroppsfettprocent.\n\nEkvationerna är baserade på ett urval med åldrarna 18–61 år för män och 18–55 år för kvinnor.',
    formulaVariants: [
      {
        gender: 'Män',
        name: 'S, S², ålder',
        equation: 'D = 1,10938 − 0,0008267×ΣS + 0,0000016×ΣS² − 0,0002574×ålder',
        measurements: 'ΣS = bröst + buk + lår',
      },
      {
        gender: 'Män',
        name: 'S, S², ålder, C',
        equation:
          'D = 1,099075 − 0,0008209×ΣS + 0,0000026×ΣS² − 0,0002017×ålder\n    − 0,005675×Cw + 0,018586×Cf',
        measurements: 'ΣS = bröst + buk + lår\nCw = omkrets midja (m)\nCf = omkrets underarm (m)',
      },
      {
        gender: 'Män',
        name: 'Kläder på',
        equation: 'D = 1,1125025 − 0,0013125×ΣS + 0,0000055×ΣS² − 0,000244×ålder',
        measurements: 'ΣS = bröst + triceps + subskapulärt',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², ålder',
        equation: 'D = 1,0994921 − 0,0009929×ΣS + 0,0000023×ΣS² − 0,0001392×ålder',
        measurements: 'ΣS = triceps + suprailiakalt + lår',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², C',
        equation: 'D = 1,1466399 − 0,00093×ΣS + 0,0000028×ΣS² − 0,0006171×C',
        measurements: 'ΣS = triceps + suprailiakalt + lår\nC = omkrets höft (cm)',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², ålder, C',
        equation:
          'D = 1,1470292 − 0,0009376×ΣS + 0,000003×ΣS² − 0,0001156×ålder\n    − 0,0005839×C',
        measurements: 'ΣS = triceps + suprailiakalt + lår\nC = omkrets höft (cm)',
      },
      {
        gender: 'Kvinnor',
        name: 'Kläder på',
        equation: 'D = 1,089733 − 0,0009245×ΣS + 0,0000025×ΣS² − 0,0000979×ålder',
        measurements: 'ΣS = triceps + suprailiakalt + buk',
      },
    ],
    requiredMeasurements: ['Bröst (pectoral)', 'Buk (abdominal)', 'Lår (thigh)'],
    betterFor: ['Män med högre kroppsfett (>15%)', 'Kvinnor med högre kroppsfett (>25%)'],
    genderSpecific: 'both',
    returnsDensity: true,
    references: [
      'Jackson AS, Pollock ML. Generalized equations for predicting body density of men. Br J Nutr. 1978;40(3):497–504.',
      'Jackson AS, Pollock ML, Ward A. Generalized equations for predicting body density of women. Med Sci Sports Exerc. 1980;12(3):175–181.',
      'Jackson AS, Pollock M. Practical assessment of body composition. Physician Sport Med. 1985;13:76',
    ],
  },
  'jp3-female': {
    title: 'Jackson-Pollock 3-punkts kalipermetod',
    year: 'män: 1978, kvinnor: 1980, kläder på: 1985',
    description:
      'Jackson–Pollocks 3-punkts hudvecksekvation är en av de mest använda metoderna för att uppskatta kroppsfettprocent, eftersom den är enkel, snabb och relativt tillförlitlig.\n\nMetoden tenderar dock att underskatta kroppsfettprocenten hos relativt smala personer (män under ca 15 % kroppsfett och kvinnor under ca 25 %). Den är därför mer träffsäker för personer med högre kroppsfettprocent.\n\nEkvationerna är baserade på ett urval med åldrarna 18–61 år för män och 18–55 år för kvinnor.',
    formulaVariants: [
      {
        gender: 'Män',
        name: 'S, S², ålder',
        equation: 'D = 1,10938 − 0,0008267×ΣS + 0,0000016×ΣS² − 0,0002574×ålder',
        measurements: 'ΣS = bröst + buk + lår',
      },
      {
        gender: 'Män',
        name: 'S, S², ålder, C',
        equation:
          'D = 1,099075 − 0,0008209×ΣS + 0,0000026×ΣS² − 0,0002017×ålder\n    − 0,005675×Cw + 0,018586×Cf',
        measurements: 'ΣS = bröst + buk + lår\nCw = omkrets midja (m)\nCf = omkrets underarm (m)',
      },
      {
        gender: 'Män',
        name: 'Kläder på',
        equation: 'D = 1,1125025 − 0,0013125×ΣS + 0,0000055×ΣS² − 0,000244×ålder',
        measurements: 'ΣS = bröst + triceps + subskapulärt',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², ålder',
        equation: 'D = 1,0994921 − 0,0009929×ΣS + 0,0000023×ΣS² − 0,0001392×ålder',
        measurements: 'ΣS = triceps + suprailiakalt + lår',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², C',
        equation: 'D = 1,1466399 − 0,00093×ΣS + 0,0000028×ΣS² − 0,0006171×C',
        measurements: 'ΣS = triceps + suprailiakalt + lår\nC = omkrets höft (cm)',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², ålder, C',
        equation:
          'D = 1,1470292 − 0,0009376×ΣS + 0,000003×ΣS² − 0,0001156×ålder\n    − 0,0005839×C',
        measurements: 'ΣS = triceps + suprailiakalt + lår\nC = omkrets höft (cm)',
      },
      {
        gender: 'Kvinnor',
        name: 'Kläder på',
        equation: 'D = 1,089733 − 0,0009245×ΣS + 0,0000025×ΣS² − 0,0000979×ålder',
        measurements: 'ΣS = triceps + suprailiakalt + buk',
      },
    ],
    requiredMeasurements: ['Triceps', 'Suprailiac (ovanför höftbenet)', 'Lår (thigh)'],
    betterFor: ['Män med högre kroppsfett (>15%)', 'Kvinnor med högre kroppsfett (>25%)'],
    genderSpecific: 'both',
    returnsDensity: true,
    references: [
      'Jackson AS, Pollock ML. Generalized equations for predicting body density of men. Br J Nutr. 1978;40(3):497–504.',
      'Jackson AS, Pollock ML, Ward A. Generalized equations for predicting body density of women. Med Sci Sports Exerc. 1980;12(3):175–181.',
      'Jackson AS, Pollock M. Practical assessment of body composition. Physician Sport Med. 1985;13:76',
    ],
  },
  'jp3-female-klader': {
    title: 'Jackson-Pollock 3-punkts kalipermetod (kläder på)',
    year: '1985',
    description:
      'En variant av 3-punktsmetoden som är lämplig om individen vill behålla kläderna på vid mätning. Metoden bygger på samma principer som den traditionella 3-punktsmetoden.',
    requiredMeasurements: ['Triceps', 'Suprailiac (ovanför höftbenet)', 'Buk (abdominal)'],
    betterFor: ['Personer som föredrar mätningar med kläder på'],
    genderSpecific: 'female',
    returnsDensity: true,
  },
  jp4: {
    title: 'Jackson-Pollock 4-punkts kalipermetod',
    year: 'densitetsbaserad kvinnor: 1980, direktformel: okänt',
    description:
      'Jackson–Pollocks 4-punkts hudvecksekvation är marginellt mer exakt än 3-punktsmetoden, men tenderar även den att något underskatta kroppsfettprocenten hos relativt smala personer.\n\nMetoden fungerar därför bättre för individer med måttlig till högre kroppsfettprocent.',
    formulaVariants: [
      {
        gender: 'Män',
        name: 'S, S² (okänd källa)',
        equation: 'Kroppsfett% = 0,29288×ΣS − 0,0005×ΣS² + 0,15845×ålder − 5,76377',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², ålder',
        equation: 'D = 1,096095 − 0,0006952×ΣS + 0,0000011×ΣS² − 0,0000714×ålder',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², C',
        equation: 'D = 1,1443913 − 0,0006523×ΣS + 0,0000014×ΣS² − 0,0006053×C',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår\nC = omkrets höft (cm)',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², ålder, C',
        equation:
          'D = 1,1454464 − 0,0006558×ΣS + 0,0000015×ΣS² − 0,0000604×ålder\n    − 0,0005981×C',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår\nC = omkrets höft (cm)',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S² (okänd källa)',
        equation: 'Kroppsfett% = 0,29669×ΣS − 0,00043×ΣS² + 0,02963×ålder + 1,4072',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår',
      },
    ],
    requiredMeasurements: ['Triceps', 'Suprailiac', 'Buk (abdominal)', 'Lår (thigh)'],
    betterFor: ['Personer med högre kroppsfett som vill ha något mer precision'],
    genderSpecific: 'both',
    references: [
      'Jackson AS, Pollock ML, Ward A. Generalized equations for predicting body density of women. Med Sci Sports Exerc. 1980;12(3):175–181.',
    ],
  },
  'jp4-density-female': {
    title: 'Jackson-Pollock 4-punkts kalipermetod',
    year: '1980',
    description:
      'Jackson–Pollocks 4-punkts hudvecksekvation är marginellt mer exakt än 3-punktsmetoden, men tenderar även den att något underskatta kroppsfettprocenten hos relativt smala personer.\n\nMetoden fungerar därför bättre för individer med måttlig till högre kroppsfettprocent.',
    formulaVariants: [
      {
        gender: 'Män',
        name: 'S, S² (okänd källa)',
        equation: 'Kroppsfett% = 0,29288×ΣS − 0,0005×ΣS² + 0,15845×ålder − 5,76377',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², ålder',
        equation: 'D = 1,096095 − 0,0006952×ΣS + 0,0000011×ΣS² − 0,0000714×ålder',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², C',
        equation: 'D = 1,1443913 − 0,0006523×ΣS + 0,0000014×ΣS² − 0,0006053×C',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår\nC = omkrets höft (cm)',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², ålder, C',
        equation:
          'D = 1,1454464 − 0,0006558×ΣS + 0,0000015×ΣS² − 0,0000604×ålder\n    − 0,0005981×C',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår\nC = omkrets höft (cm)',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S² (okänd källa)',
        equation: 'Kroppsfett% = 0,29669×ΣS − 0,00043×ΣS² + 0,02963×ålder + 1,4072',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår',
      },
    ],
    requiredMeasurements: [
      'Triceps',
      'Suprailiac',
      'Buk (abdominal)',
      'Lår (thigh)',
      'Höft (C-varianter)',
    ],
    betterFor: ['Personer med högre kroppsfett som vill ha något mer precision'],
    genderSpecific: 'female',
    returnsDensity: true,
    references: [
      'Jackson AS, Pollock ML, Ward A. Generalized equations for predicting body density of women. Med Sci Sports Exerc. 1980;12(3):175–181.',
    ],
  },
  'jp4-direct': {
    title: 'Jackson-Pollock 4-punkts kalipermetod',
    description:
      'Jackson–Pollocks 4-punkts hudvecksekvation är marginellt mer exakt än 3-punktsmetoden, men tenderar även den att något underskatta kroppsfettprocenten hos relativt smala personer.\n\nMetoden fungerar därför bättre för individer med måttlig till högre kroppsfettprocent.\n\nDenna variant (direktformel S,S²) har ett okänt ursprung men används som en vedertagen metod inom kroppssammansättningsmätning.',
    formulaVariants: [
      {
        gender: 'Män',
        name: 'S, S² (okänd källa)',
        equation: 'Kroppsfett% = 0,29288×ΣS − 0,0005×ΣS² + 0,15845×ålder − 5,76377',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², ålder',
        equation: 'D = 1,096095 − 0,0006952×ΣS + 0,0000011×ΣS² − 0,0000714×ålder',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², C',
        equation: 'D = 1,1443913 − 0,0006523×ΣS + 0,0000014×ΣS² − 0,0006053×C',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår\nC = omkrets höft (cm)',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², ålder, C',
        equation:
          'D = 1,1454464 − 0,0006558×ΣS + 0,0000015×ΣS² − 0,0000604×ålder\n    − 0,0005981×C',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår\nC = omkrets höft (cm)',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S² (okänd källa)',
        equation: 'Kroppsfett% = 0,29669×ΣS − 0,00043×ΣS² + 0,02963×ålder + 1,4072',
        measurements: 'ΣS = triceps + suprailiakalt + buk + lår',
      },
    ],
    requiredMeasurements: ['Triceps', 'Suprailiac', 'Buk (abdominal)', 'Lår (thigh)'],
    betterFor: ['Personer med högre kroppsfett som vill ha något mer precision'],
    genderSpecific: 'both',
    returnsDensity: false,
    references: [
      'Jackson AS, Pollock ML, Ward A. Generalized equations for predicting body density of women. Med Sci Sports Exerc. 1980;12(3):175–181.',
    ],
  },
  jp7: {
    title: 'Jackson-Pollock 7-punkts kalipermetod',
    year: 'män: 1978, kvinnor: 1980',
    description:
      'Jackson–Pollocks 7-punkts hudvecksekvation är inte nämnvärt mer exakt än 3-punktsmetoden, men kräver betydligt mer tid och fler mätningar. Den tenderar också att underskatta kroppsfettprocenten hos relativt smala personer.\n\nDärför är det i de flesta fall mer praktiskt att använda 3-punktsmetoden.',
    formulaVariants: [
      {
        gender: 'Män',
        name: 'S, S², ålder',
        equation: 'D = 1,112 − 0,00043499×ΣS + 0,00000055×ΣS² − 0,00028826×ålder',
        measurements:
          'ΣS = bröst + buk + lår + triceps + subskapulärt + suprailiakalt + midaxillärt',
      },
      {
        gender: 'Män',
        name: 'S, S², ålder, C',
        equation:
          'D = 1,101 − 0,0004115×ΣS + 0,00000069×ΣS² − 0,00022631×ålder\n    − 0,0059239×Cw + 0,0190632×Cf',
        measurements:
          'ΣS = bröst + buk + lår + triceps + subskapulärt + suprailiakalt + midaxillärt\nCw = omkrets midja (m)\nCf = omkrets underarm (m)',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², ålder',
        equation: 'D = 1,097 − 0,00046971×ΣS + 0,00000056×ΣS² − 0,00012828×ålder',
        measurements:
          'ΣS = bröst + buk + lår + triceps + subskapulärt + suprailiakalt + midaxillärt',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², C',
        equation: 'D = 1,147 − 0,00042359×ΣS + 0,00000061×ΣS² − 0,000652×C',
        measurements:
          'ΣS = bröst + buk + lår + triceps + subskapulärt + suprailiakalt + midaxillärt\nC = omkrets höft (cm)',
      },
      {
        gender: 'Kvinnor',
        name: 'S, S², ålder, C',
        equation:
          'D = 1,147 − 0,0004293×ΣS + 0,00000065×ΣS² − 0,00009975×ålder\n    − 0,00062415×C',
        measurements:
          'ΣS = bröst + buk + lår + triceps + subskapulärt + suprailiakalt + midaxillärt\nC = omkrets höft (cm)',
      },
    ],
    requiredMeasurements: [
      'Bröst (pectoral)',
      'Buk (abdominal)',
      'Lår (thigh)',
      'Triceps',
      'Subscapular (under skulderblad)',
      'Suprailiac',
      'Midaxillary (mittaxel)',
    ],
    betterFor: ['Personer som vill ha mest möjliga datapunkter trots längre mättid'],
    genderSpecific: 'both',
    returnsDensity: true,
    references: [
      'Jackson AS, Pollock ML. Generalized equations for predicting body density of men. Br J Nutr. 1978;40(3):497–504.',
      'Jackson AS, Pollock ML, Ward A. Generalized equations for predicting body density of women. Med Sci Sports Exerc. 1980;12(3):175–181.',
    ],
  },
  'durnin-womersley': {
    title: 'Durnin-Womersley kalipermetod',
    year: '1974',
    description:
      'Durnin–Womersleys 4-punkts hudvecksekvation kan ge korrekta resultat för vissa individer, men upplevs av många som att den överskattar kroppsfettprocenten.\n\nEkvationerna är baserade på ett urval med åldrarna 17–72 år för män och 16–68 år för kvinnor.\n\nAv den anledningen rekommenderas ofta mer tillförlitliga metoder, såsom Jackson–Pollock 3-punkts kalipermetod eller U.S. Navy-metoden.',
    formulaVariants: [
      {
        gender: 'Män',
        name: 'Alla åldersgrupper',
        equation:
          '17–19 år:  D = 1,162  − 0,063×log₁₀(ΣS)\n20–29 år:  D = 1,1631 − 0,0632×log₁₀(ΣS)\n30–39 år:  D = 1,1422 − 0,0544×log₁₀(ΣS)\n40–49 år:  D = 1,162  − 0,07×log₁₀(ΣS)\n≥50 år:    D = 1,1715 − 0,0779×log₁₀(ΣS)',
        measurements: 'ΣS = biceps + triceps + subskapulärt + suprailiakalt',
      },
      {
        gender: 'Kvinnor',
        name: 'Alla åldersgrupper',
        equation:
          '16–19 år:  D = 1,1549 − 0,0678×log₁₀(ΣS)\n20–29 år:  D = 1,1599 − 0,0717×log₁₀(ΣS)\n30–39 år:  D = 1,1423 − 0,0632×log₁₀(ΣS)\n40–49 år:  D = 1,1333 − 0,0612×log₁₀(ΣS)\n≥50 år:    D = 1,1339 − 0,0645×log₁₀(ΣS)',
        measurements: 'ΣS = biceps + triceps + subskapulärt + suprailiakalt',
      },
    ],
    requiredMeasurements: ['Biceps', 'Triceps', 'Subscapular', 'Suprailiac'],
    betterFor: ['Personer som vill testa en äldre europeisk metod'],
    genderSpecific: 'both',
    returnsDensity: true,
    references: [
      'Durnin JVGA, Womersley J. Body fat assessed from total body density and its estimation from skinfold thickness: measurements on 481 men and women aged from 16 to 72 years. Br J Nutr. 1974;32(1):77–97.',
    ],
  },
  parillo: {
    title: 'Parrillo kalipermetod',
    year: '1993',
    description:
      'Parrillos 9-punkts hudvecksekvation är bristfälligt studerad, vilket gör det svårt att bedöma dess noggrannhet i jämförelse med andra metoder.\n\nDärför rekommenderas i regel mer etablerade metoder, såsom Jackson–Pollock 3-punkts kalipermetod eller U.S. Navy-metoden.',
    formulaVariants: [
      {
        gender: 'Män',
        name: 'Samma formel för båda kön',
        equation: 'Kroppsfett% = (ΣS × 27) / kroppsvikt (lbs)',
        measurements:
          'ΣS = bröst + buk + lår + biceps + triceps + subskapulärt + suprailiakalt + ländrygg + vad',
      },
    ],
    requiredMeasurements: [
      'Bröst (pectoral)',
      'Buk (abdominal)',
      'Lår (thigh)',
      'Biceps',
      'Triceps',
      'Subscapular',
      'Suprailiac',
      'Nedre rygg (lower back)',
      'Vad (calf)',
    ],
    betterFor: ['Bodybuilders som vill följa tradition i sin subkultur'],
    genderSpecific: 'both',
    returnsDensity: false,
    references: [
      'Parrillo J, Greenwood-Robinson M. High Performance Bodybuilding. New York: Perigee Books; 1993.',
    ],
  },
  'covert-bailey': {
    title: 'Covert Bailey-metoden',
    year: 'okänt ursprung (efter 1978)',
    description:
      'Alla mätningar ska utföras vid respektive kroppsdelars bredaste punkt.\n\nFormeln populariserades av fitnessförfattaren Covert Bailey i Fit or Fat? (1978). Resonemangen om hemestimering av kroppsfett utvecklades vidare i Smart Exercise (1994) och sammanställdes i senare upplagor av The Ultimate Fit or Fat (1999). Metoden publicerades i populär träningslitteratur och saknar en dokumenterad första publicering i vetenskapliga tidskrifter eller formell valideringsstudie.',
    formulaVariants: [
      {
        gender: 'Män',
        name: 'Alla åldersgrupper',
        equation:
          '≤30 år:  Kroppsfett% = midja + 0,5×höft − 3×underarm − handled\n>30 år:  Kroppsfett% = midja + 0,5×höft − 2,7×underarm − handled',
        measurements: 'Alla mått i tum (inches)',
      },
      {
        gender: 'Kvinnor',
        name: 'Alla åldersgrupper',
        equation:
          '≤30 år:  Kroppsfett% = höft + 0,8×lår − 2×vad − handled\n>30 år:  Kroppsfett% = höft + lår − 2×vad − handled',
        measurements: 'Alla mått i tum (inches)',
      },
    ],
    requiredMeasurements: ['Midja', 'Handled (män)', 'Höft (kvinnor)', 'Underarm (kvinnor)'],
    betterFor: ['Personer som inte har tillgång till kaliper'],
    genderSpecific: 'both',
    returnsDensity: false,
  },
  'us-navy': {
    title: 'U.S. Navy kroppsfettformel',
    year: '1984',
    description:
      'Denna metod är relativt noggrann, men tenderar att överskatta kroppsfettprocenten hos relativt smala personer. Den lämpar sig därför bäst för män över ca 15 % kroppsfett och kvinnor över ca 25 %.\n\nInom den amerikanska militären används kroppsfettprocent – snarare än kroppsvikt – som huvudkriterium vid antagning. Formlerna används för att avgöra om en individ uppfyller kraven.',
    formulaVariants: [
      {
        gender: 'Män',
        name: '',
        equation: 'Kroppsfett% = 86,010×log₁₀(midja − hals) − 70,041×log₁₀(längd) + 36,76',
        measurements: 'Alla mått i tum (inches)',
      },
      {
        gender: 'Kvinnor',
        name: '',
        equation: 'Kroppsfett% = 163,205×log₁₀(midja + höft − hals) − 97,684×log₁₀(längd) − 78,387',
        measurements: 'Alla mått i tum (inches)',
      },
    ],
    requiredMeasurements: ['Hals', 'Midja', 'Höft (endast kvinnor)', 'Längd'],
    betterFor: ['Personer med normal till hög kroppsfett som vill ha en snabb måttbandsmetod'],
    genderSpecific: 'both',
    returnsDensity: false,
    references: [
      'Hodgdon JA, Beckett MB. Prediction of percent body fat for U.S. Navy men and women from body circumferences and height. Report No. 84-29. San Diego: Naval Health Research Center; 1984.',
    ],
  },
  ymca: {
    title: 'YMCA-metoden',
    description:
      'Denna metod utvecklades av YMCA som ett enkelt sätt att uppskatta kroppsfettprocent med hjälp av endast kroppsvikt och midjemått.',
    formulaVariants: [
      {
        gender: 'Båda',
        name: '',
        equation: 'Kroppsfett% = ((4,15×midja − 0,082×vikt − kön) / vikt) × 100',
        measurements: 'Midja i tum (inches), vikt i lbs\nkön = 98,42 för män, 76,76 för kvinnor',
      },
    ],
    requiredMeasurements: ['Midja', 'Kroppsvikt'],
    betterFor: ['Personer som vill ha en mycket snabb övergripande uppskattning'],
    genderSpecific: 'both',
    returnsDensity: false,
  },
  'ymca-modified': {
    title: 'Modifierad YMCA-metoden',
    description:
      'En förbättrad version av YMCA-metoden med ytterligare mätningar för högre precision. Använder fler mätpunkter än standard YMCA.',
    formulaVariants: [
      {
        gender: 'Män',
        name: '',
        equation: 'Kroppsfett% = ((−0,082×vikt + 4,15×midja − 94,42) / vikt) × 100',
        measurements: 'Midja i tum (inches), vikt i lbs',
      },
      {
        gender: 'Kvinnor',
        name: '',
        equation:
          'Kroppsfett% = ((0,268×vikt − 0,318×handled + 0,157×midja\n    + 0,245×höft − 0,434×underarm − 8,987) / vikt) × 100',
        measurements: 'Alla omkretssmått i tum (inches), vikt i lbs',
      },
    ],
    requiredMeasurements: ['Hals', 'Midja', 'Höft', 'Kroppsvikt'],
    betterFor: ['Personer som vill ha bättre precision än YMCA men behålla enkelheten'],
    genderSpecific: 'both',
    returnsDensity: false,
  },
  'heritage-bmi': {
    title: 'Heritage BMI till kroppsfett',
    year: '1991',
    description:
      'Uppskattar kroppsfett% baserat på BMI, ålder och kön.\n\nOriginalformeln publicerades av Deurenberg et al. (1991) och använder ett könskoefficient-system. Utöver originalformeln finns en senare empirisk variant som cirkulerar i fitness- och kalkylatorappar som är kalibrerad mot andra dataset och ger något bättre passform i vissa populationer, men saknar ett tydligt originalpaper.',
    formulaVariants: [
      {
        gender: 'Båda',
        name: 'Deurenberg originalformel (1991)',
        equation: 'Kroppsfett% = 1,20×BMI + 0,23×ålder − 10,8×kön − 5,4',
        measurements:
          'kön = 1 för män, 0 för kvinnor\nBMI beräknas automatiskt från längd och vikt',
      },
      {
        gender: 'Båda',
        name: 'Modifierad variant (okänd källa)',
        equation: 'Kroppsfett% = 1,39×BMI + 0,16×ålder − kön',
        measurements:
          'kön = 19,34 för män, 9 för kvinnor\nBMI beräknas automatiskt från längd och vikt',
      },
    ],
    requiredMeasurements: ['BMI (beräknas från längd och vikt)', 'Ålder', 'Kön'],
    genderSpecific: 'both',
    returnsDensity: false,
    references: [
      'Deurenberg P, Weststrate JA, Seidell JC. Body mass index as a measure of body fatness: age- and sex-specific prediction formulas. Br J Nutr. 1991;65(2):105–114.',
    ],
  },
  'reversed-cunningham': {
    title: 'Omvänd Cunningham ekvation',
    year: '1980',
    description:
      'Bakåträknar kroppsfett% från RMR/BMR (Resting/Basal Metabolic Rate) med antagandet att metabolismen följer Cunningham-ekvationen.\n\nOm inget BMR/RMR-värde finns tillgängligt används Mifflin-St Jeor-ekvationen för att uppskatta RMR baserat på längd, vikt, ålder och kön.',
    formulaVariants: [
      {
        name: 'Steg 1 — Cunningham',
        equation: 'BMR = 370 + 21,6×fettfri massa (kg)',
        measurements: 'Omvänd: fettfri massa = (BMR − 370) / 21,6',
      },
      {
        name: 'Steg 2 — Kroppsfett%',
        equation: 'Kroppsfett% = (1 − fettfri massa / kroppsvikt) × 100',
        measurements: 'Samma formel för båda kön',
      },
    ],
    requiredMeasurements: ['BMR eller längd/vikt/ålder/kön', 'Kroppsvikt'],
    genderSpecific: 'both',
    returnsDensity: false,
    references: [
      'Cunningham JJ. A reanalysis of the factors influencing basal metabolic rate in normal adults. Am J Clin Nutr. 1980;33(11):2372–2374.',
    ],
  },
}

/**
 * Hämta metodinformation baserat på metod och variation
 */
export function getMethodInfo(
  method: BodyCompositionMethod,
  variation?: MethodVariation
): MethodInfo | null {
  // Special cases för JP3
  if (method === 'Jackson/Pollock 3 Caliper Method (Male)') {
    return methodInformation['jp3-male']
  }
  if (method === 'Jackson/Pollock 3 Caliper Method (Female)') {
    if (variation === 'Kläder på') {
      return methodInformation['jp3-female-klader']
    }
    return methodInformation['jp3-female']
  }

  // JP4 variations
  if (method === 'Jackson/Pollock 4 Caliper Method') {
    if (variation === 'S, S²') {
      return methodInformation['jp4-direct']
    }
    // Densitetsbaserade varianter (endast kvinnor)
    return methodInformation['jp4-density-female']
  }

  // JP7
  if (method === 'Jackson/Pollock 7 Caliper Method') {
    return methodInformation['jp7']
  }

  // Övriga metoder
  if (method === 'Durnin/Womersley Caliper Method') {
    return methodInformation['durnin-womersley']
  }
  if (method === 'Parillo Caliper Method') {
    return methodInformation['parillo']
  }
  if (method === 'Covert Bailey Measuring Tape Method') {
    return methodInformation['covert-bailey']
  }
  if (method === 'U.S. Navy Body Fat Formula') {
    return methodInformation['us-navy']
  }
  if (method === 'YMCA Measuring Tape Method') {
    return methodInformation['ymca']
  }
  if (method === 'Modified YMCA Measuring Tape Method') {
    return methodInformation['ymca-modified']
  }
  if (method === 'Heritage BMI to Body Fat Method') {
    return methodInformation['heritage-bmi']
  }
  if (method === 'Reversed Cunningham equation') {
    return methodInformation['reversed-cunningham']
  }

  return null
}
