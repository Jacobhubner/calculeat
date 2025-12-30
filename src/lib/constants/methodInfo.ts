/**
 * Information om alla kroppssammansättningsmetoder och ekvationer
 * Används för info-modaler i användargränssnittet
 */

import type { BodyCompositionMethod, MethodVariation } from '@/lib/calculations/bodyComposition'

export interface MethodInfo {
  title: string
  year?: string
  description: string
  formula?: string
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
    year: 'män: 1978, kvinnor: 1980',
    description:
      'Jackson–Pollocks 3-punkts hudvecksekvation är en av de mest använda metoderna för att uppskatta kroppsfettprocent, eftersom den är enkel, snabb och relativt tillförlitlig.\n\nMetoden tenderar dock att underskatta kroppsfettprocenten hos relativt smala personer (män under ca 15 % kroppsfett och kvinnor under ca 25 %). Den är därför mer träffsäker för personer med högre kroppsfettprocent.\n\nEkvationerna är baserade på ett urval med åldrarna 18–61 år för män och 18–55 år för kvinnor.',
    requiredMeasurements: ['Bröst (pectoral)', 'Buk (abdominal)', 'Lår (thigh)'],
    betterFor: ['Personer med högre kroppsfett (>15%)'],
    genderSpecific: 'male',
    returnsDensity: true,
  },
  'jp3-female': {
    title: 'Jackson-Pollock 3-punkts kalipermetod',
    year: 'män: 1978, kvinnor: 1980',
    description:
      'Jackson–Pollocks 3-punkts hudvecksekvation är en av de mest använda metoderna för att uppskatta kroppsfettprocent, eftersom den är enkel, snabb och relativt tillförlitlig.\n\nMetoden tenderar dock att underskatta kroppsfettprocenten hos relativt smala personer (män under ca 15 % kroppsfett och kvinnor under ca 25 %). Den är därför mer träffsäker för personer med högre kroppsfettprocent.\n\nEkvationerna är baserade på ett urval med åldrarna 18–61 år för män och 18–55 år för kvinnor.',
    requiredMeasurements: ['Triceps', 'Suprailiac (ovanför höftbenet)', 'Lår (thigh)'],
    betterFor: ['Personer med högre kroppsfett (>25%)'],
    genderSpecific: 'female',
    returnsDensity: true,
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
    requiredMeasurements: ['Triceps', 'Suprailiac', 'Buk (abdominal)', 'Lår (thigh)'],
    betterFor: ['Personer med högre kroppsfett som vill ha något mer precision'],
    genderSpecific: 'both',
  },
  'jp4-density-female': {
    title: 'Jackson-Pollock 4-punkts kalipermetod',
    year: '1980',
    description:
      'Jackson–Pollocks 4-punkts hudvecksekvation är marginellt mer exakt än 3-punktsmetoden, men tenderar även den att något underskatta kroppsfettprocenten hos relativt smala personer.\n\nMetoden fungerar därför bättre för individer med måttlig till högre kroppsfettprocent.',
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
  },
  'jp4-direct': {
    title: 'Jackson-Pollock 4-punkts kalipermetod',
    description:
      'Jackson–Pollocks 4-punkts hudvecksekvation är marginellt mer exakt än 3-punktsmetoden, men tenderar även den att något underskatta kroppsfettprocenten hos relativt smala personer.\n\nMetoden fungerar därför bättre för individer med måttlig till högre kroppsfettprocent.\n\nDenna variant (direktformel S,S²) har ett okänt ursprung men används som en vedertagen metod inom kroppssammansättningsmätning.',
    requiredMeasurements: ['Triceps', 'Suprailiac', 'Buk (abdominal)', 'Lår (thigh)'],
    betterFor: ['Personer med högre kroppsfett som vill ha något mer precision'],
    genderSpecific: 'both',
    returnsDensity: false,
  },
  jp7: {
    title: 'Jackson-Pollock 7-punkts kalipermetod',
    year: 'män: 1978, kvinnor: 1980',
    description:
      'Jackson–Pollocks 7-punkts hudvecksekvation är inte nämnvärt mer exakt än 3-punktsmetoden, men kräver betydligt mer tid och fler mätningar. Den tenderar också att underskatta kroppsfettprocenten hos relativt smala personer.\n\nDärför är det i de flesta fall mer praktiskt att använda 3-punktsmetoden.',
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
  },
  'durnin-womersley': {
    title: 'Durnin-Womersley kalipermetod',
    year: '1974',
    description:
      'Durnin–Womersleys 4-punkts hudvecksekvation kan ge korrekta resultat för vissa individer, men upplevs av många som att den överskattar kroppsfettprocenten.\n\nEkvationerna är baserade på ett urval med åldrarna 17–72 år för män och 16–68 år för kvinnor.\n\nAv den anledningen rekommenderas ofta mer tillförlitliga metoder, såsom Jackson–Pollock 3-punkts kalipermetod eller U.S. Navy-metoden.',
    requiredMeasurements: ['Biceps', 'Triceps', 'Subscapular', 'Suprailiac'],
    betterFor: ['Personer som vill testa en äldre europeisk metod'],
    genderSpecific: 'both',
    returnsDensity: true,
  },
  parillo: {
    title: 'Parrillo kalipermetod',
    year: '1993',
    description:
      'Parrillos 9-punkts hudvecksekvation är bristfälligt studerad, vilket gör det svårt att bedöma dess noggrannhet i jämförelse med andra metoder.\n\nDärför rekommenderas i regel mer etablerade metoder, såsom Jackson–Pollock 3-punkts kalipermetod eller U.S. Navy-metoden.',
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
  },
  'covert-bailey': {
    title: 'Covert Bailey-metoden',
    year: '1999',
    description:
      'Alla mätningar ska utföras vid respektive kroppsdelars bredaste punkt.\n\nDetta är en av de nyare metoderna för uppskattning av kroppsfettprocent och kräver flera olika kroppsmått för att kunna användas.',
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
    requiredMeasurements: ['Hals', 'Midja', 'Höft (endast kvinnor)', 'Längd'],
    betterFor: ['Personer med normal till hög kroppsfett som vill ha en snabb måttbandsmetod'],
    genderSpecific: 'both',
    returnsDensity: false,
  },
  ymca: {
    title: 'YMCA-metoden',
    description:
      'Denna metod utvecklades av YMCA som ett enkelt sätt att uppskatta kroppsfettprocent med hjälp av endast kroppsvikt och midjemått.',
    requiredMeasurements: ['Midja', 'Kroppsvikt'],
    betterFor: ['Personer som vill ha en mycket snabb övergripande uppskattning'],
    genderSpecific: 'both',
    returnsDensity: false,
  },
  'ymca-modified': {
    title: 'Modifierad YMCA-metoden',
    description:
      'En förbättrad version av YMCA-metoden med ytterligare mätningar för högre precision. Använder fler mätpunkter än standard YMCA.',
    requiredMeasurements: ['Hals', 'Midja', 'Höft', 'Kroppsvikt'],
    betterFor: ['Personer som vill ha bättre precision än YMCA men behålla enkelheten'],
    genderSpecific: 'both',
    returnsDensity: false,
  },
  'heritage-bmi': {
    title: 'Heritage BMI till kroppsfett',
    description:
      'Uppskattar kroppsfett% baserat på BMI, ålder och kön. Utvecklad från Heritage Family Study.',
    requiredMeasurements: ['BMI (beräknas från längd och vikt)', 'Ålder', 'Kön'],
    notes:
      'Enklaste metoden - kräver endast längd, vikt och ålder. Lägst precision. Lämplig för övergripande uppskattningar.',
    genderSpecific: 'both',
    returnsDensity: false,
  },
  'reversed-cunningham': {
    title: 'Omvänd Cunningham ekvation',
    description:
      'Bakåträknar kroppsfett% från RMR/BMR (Resting/Basal Metabolic Rate) med antagandet att metabolismen följer Cunningham-ekvationen.\n\nOm inget BMR/RMR-värde finns tillgängligt används Mifflin-St Jeor-ekvationen för att uppskatta RMR baserat på längd, vikt, ålder och kön.',
    requiredMeasurements: ['BMR eller längd/vikt/ålder/kön', 'Kroppsvikt'],
    genderSpecific: 'both',
    returnsDensity: false,
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
