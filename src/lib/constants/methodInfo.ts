/**
 * Information om alla kroppssammansättningsmetoder och ekvationer
 * Används för info-modaler i användargränssnittet
 */

import type { BodyCompositionMethod, MethodVariation } from '@/lib/calculations/bodyComposition'

export interface MethodInfo {
  title: string
  description: string
  formula?: string
  requiredMeasurements?: string[]
  notes?: string
  genderSpecific?: 'male' | 'female' | 'both'
  returnsDensity?: boolean
}

export const siriInfo: MethodInfo = {
  title: 'Siri Ekvationen (1961)',
  description:
    'Den mest använda ekvationen för att konvertera kroppsdensitet till kroppsfett%. Utvecklad av William Siri 1961 baserat på studier av vita män.',
  formula: 'Kroppsfett% = (495 / kroppsdensitet) - 450',
  notes:
    'Ger generellt högre värden än Brozek. Anses vara mer exakt för den allmänna befolkningen. Notera att ekvationen är baserad på en specifik population och kan ha begränsningar för vissa grupper.',
  genderSpecific: 'both',
}

export const brozekInfo: MethodInfo = {
  title: 'Brozek Ekvationen (1963)',
  description:
    'Alternativ formel för att konvertera kroppsdensitet till kroppsfett%. Utvecklad av Josef Brozek 1963 baserat på en bredare population.',
  formula: 'Kroppsfett% = (457 / kroppsdensitet) - 414.2',
  notes:
    'Ger ofta något lägre värden än Siri. Baserad på en mer varierad population. Vissa forskare föredrar Brozek för äldre individer.',
  genderSpecific: 'both',
}

export const methodInformation: Record<string, MethodInfo> = {
  'jp3-male': {
    title: 'Jackson/Pollock 3-punkts kaliper (Man)',
    description:
      'En av de mest använda metoderna för att uppskatta kroppsfett hos män. Använder tre hudfålsmätningar för att beräkna kroppsdensitet.',
    formula: 'BD = 1.10938 - 0.0008267×(summa) + 0.0000016×(summa)² - 0.0002574×ålder',
    requiredMeasurements: ['Bröst (pectoral)', 'Buk (abdominal)', 'Lår (thigh)'],
    notes:
      'Densiteten konverteras sedan till kroppsfett% med Siri eller Brozek ekvationen. Mät hudfållar på höger sida av kroppen.',
    genderSpecific: 'male',
    returnsDensity: true,
  },
  'jp3-female': {
    title: 'Jackson/Pollock 3-punkts kaliper (Kvinna)',
    description:
      'En av de mest använda metoderna för att uppskatta kroppsfett hos kvinnor. Använder tre hudfålsmätningar för att beräkna kroppsdensitet.',
    formula: 'BD = 1.0994921 - 0.0009929×(summa) + 0.0000023×(summa)² - 0.0001392×ålder',
    requiredMeasurements: ['Triceps', 'Suprailiac (ovanför höftbenet)', 'Lår (thigh)'],
    notes:
      'Densiteten konverteras sedan till kroppsfett% med Siri eller Brozek ekvationen. Mät hudfållar på höger sida av kroppen.',
    genderSpecific: 'female',
    returnsDensity: true,
  },
  'jp3-female-klader': {
    title: 'Jackson/Pollock 3-punkts kaliper (Kvinna) - Kläder på',
    description:
      'Variant av JP3 för kvinnor som använder tre lättåtkomliga mätpunkter som kan mätas med kläder på.',
    formula: 'BD = 1.089733 - 0.0009245×(summa) + 0.0000025×(summa)² - 0.0000979×ålder',
    requiredMeasurements: ['Triceps', 'Suprailiac (ovanför höftbenet)', 'Buk (abdominal)'],
    notes:
      'Praktisk variant för mätningar i semi-offentliga miljöer. Densiteten konverteras till kroppsfett% med Siri eller Brozek.',
    genderSpecific: 'female',
    returnsDensity: true,
  },
  jp4: {
    title: 'Jackson/Pollock 4-punkts kaliper',
    description:
      'Använder fyra hudfålsmätningar. Finns både densitetsbaserade varianter (endast kvinnor) och en direktformel (båda könen).',
    requiredMeasurements: ['Triceps', 'Suprailiac', 'Buk (abdominal)', 'Lår (thigh)'],
    notes:
      'Densitetsbaserade varianter (S,S²,ålder | S,S²,C | S,S²,ålder,C) är endast för kvinnor. S,S² varianten är tillgänglig för både män och kvinnor.',
    genderSpecific: 'both',
  },
  'jp4-density-female': {
    title: 'Jackson/Pollock 4-punkts - Densitetsbaserad (Kvinna)',
    description:
      'Beräknar kroppsdensitet från fyra hudfålsmätningar. Endast för kvinnor. Flera varianter tillgängliga.',
    formula:
      'S,S²,ålder: BD = 1.096095 - 0.0006952×sum + 0.0000011×sum² - 0.0000714×ålder\n' +
      'S,S²,C: BD = 1.1443913 - 0.0006523×sum + 0.0000014×sum² - 0.0006053×höft_m\n' +
      'S,S²,ålder,C: BD = 1.1454464 - 0.0006558×sum + 0.0000015×sum² - 0.0000604×ålder - 0.0005981×höft_m',
    requiredMeasurements: [
      'Triceps',
      'Suprailiac',
      'Buk (abdominal)',
      'Lår (thigh)',
      'Höft (C-varianter)',
    ],
    genderSpecific: 'female',
    returnsDensity: true,
  },
  'jp4-direct': {
    title: 'Jackson/Pollock 4-punkts kaliper',
    description:
      'Returnerar kroppsfett% direkt (inte densitet). Tillgänglig för både män och kvinnor.',
    formula:
      'Man: 0.29288×sum - 0.0005×sum² + 0.15845×ålder - 5.76377\n' +
      'Kvinna: 0.29669×sum - 0.00043×sum² + 0.02963×ålder + 1.4072',
    requiredMeasurements: ['Triceps', 'Suprailiac', 'Buk (abdominal)', 'Lår (thigh)'],
    notes: 'Returnerar kroppsfett% direkt - ingen densitetskonvertering behövs.',
    genderSpecific: 'both',
    returnsDensity: false,
  },
  jp7: {
    title: 'Jackson/Pollock 7-punkts kaliper',
    description:
      'Den mest omfattande Jackson/Pollock-metoden. Använder sju hudfålsmätningar för högre precision.',
    requiredMeasurements: [
      'Bröst (pectoral)',
      'Buk (abdominal)',
      'Lår (thigh)',
      'Triceps',
      'Subscapular (under skulderblad)',
      'Suprailiac',
      'Midaxillary (mittaxel)',
    ],
    notes:
      'Tillgänglig för både män och kvinnor med olika formler. Anses ge högre precision än 3- och 4-punktsvarianterna.',
    genderSpecific: 'both',
    returnsDensity: true,
  },
  'durnin-womersley': {
    title: 'Durnin/Womersley kaliper',
    description:
      'Brittisk metod från 1974 som använder fyra hudfålsmätningar. Baserad på studier av skotsk population.',
    formula: 'Varierar med ålder och kön. Använder logaritmen av summan av fyra hudfållar.',
    requiredMeasurements: ['Biceps', 'Triceps', 'Subscapular', 'Suprailiac'],
    notes:
      'Olika formler för olika åldersgrupper (17-19, 20-29, 30-39, 40-49, 50+). Densiteten konverteras till kroppsfett% med Siri eller Brozek.',
    genderSpecific: 'both',
    returnsDensity: true,
  },
  parillo: {
    title: 'Parillo kaliper',
    description:
      'Omfattande metod som använder nio hudfålsmätningar. Populär bland bodybuilders och fitnessentusiaster.',
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
    notes:
      'Returnerar kroppsfett% direkt. Formel: (summa av alla mätningar) × 27 ÷ kroppsvikt i pounds = kroppsfett%',
    genderSpecific: 'both',
    returnsDensity: false,
  },
  'covert-bailey': {
    title: 'Covert Bailey måttband',
    description: 'Enkel metod som endast använder måttband. Olika formler för män och kvinnor.',
    requiredMeasurements: ['Midja', 'Handled (män)', 'Höft (kvinnor)', 'Underarm (kvinnor)'],
    notes: 'Praktisk metod som inte kräver kaliper. Lägre precision än hudfållsmätningar.',
    genderSpecific: 'both',
    returnsDensity: false,
  },
  'us-navy': {
    title: 'U.S. Navy kroppsfettformel',
    description:
      'Utvecklad av U.S. Navy för att screena militär personal. Använder enkla måttbandsmätningar.',
    requiredMeasurements: ['Hals', 'Midja', 'Höft (endast kvinnor)', 'Längd'],
    notes:
      'Snabb och enkel metod. Kan vara mindre exakt för individer med ovanlig kroppsbyggnad. Ursprungligen utvecklad för militär screening.',
    genderSpecific: 'both',
    returnsDensity: false,
  },
  ymca: {
    title: 'YMCA måttband',
    description: 'Enkel måttbandsmetod utvecklad av YMCA. Använder midjeomkrets och kroppsvikt.',
    requiredMeasurements: ['Midja', 'Kroppsvikt'],
    notes:
      'Mycket enkel metod lämplig för allmän hälsobedömning. Lägre precision än kalipermätningar.',
    genderSpecific: 'both',
    returnsDensity: false,
  },
  'ymca-modified': {
    title: 'Modifierad YMCA måttband',
    description:
      'Förbättrad version av YMCA-metoden med ytterligare mätningar för högre precision.',
    requiredMeasurements: ['Hals', 'Midja', 'Höft', 'Kroppsvikt'],
    notes: 'Lägg till fler mätpunkter jämfört med standard YMCA för bättre noggrannhet.',
    genderSpecific: 'both',
    returnsDensity: false,
  },
  'heritage-bmi': {
    title: 'Heritage BMI till kroppsfett',
    description:
      'Uppskattar kroppsfett% baserat på BMI, ålder och kön. Utvecklad från Heritage Family Study.',
    formula: 'Använder linjär regression baserat på BMI, ålder och kön',
    requiredMeasurements: ['BMI (beräknas från längd och vikt)', 'Ålder', 'Kön'],
    notes:
      'Enklaste metoden - kräver endast längd, vikt och ålder. Lägst precision. Lämplig för övergripande uppskattningar.',
    genderSpecific: 'both',
    returnsDensity: false,
  },
  'reversed-cunningham': {
    title: 'Omvänd Cunningham ekvation',
    description:
      'Bakåträknar kroppsfett% från BMR (Basal Metabolic Rate) med antagandet att BMR beräknades med Cunningham-ekvationen.',
    requiredMeasurements: ['BMR', 'Kroppsvikt'],
    notes:
      'Experimentell metod. Förutsätter att BMR beräknades korrekt med Cunningham. Kan vara oprecis om andra BMR-formler användes.',
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
