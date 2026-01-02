/**
 * Beräkningar för genetisk muskelpotential
 * Baserat på flera etablerade formler och modeller
 */

export interface GeneticPotentialResult {
  formula: string
  description: string
  maxLeanMass: number // MLBM (Maximum fettfri massa) kg
  maxWeight: number // MBW (Maximum kroppsvikt) kg
  maxBulkedWeight?: number // MBBW (Maximum bulked body weight) kg
  currentProgress?: number // % av genetisk potential
  remainingPotential?: number // kg muskler kvar att bygga
  // Casey Butt specific measurements
  maxMeasurements?: {
    chestCm: number // Bröst
    bicepsCm: number // Biceps
    forearmsCm: number // Underarmar
    neckCm: number // Nacke
    thighsCm: number // Lår
    calvesCm: number // Vader
  }
  upperBodyType?: 'hard' | 'easy' // Handled-baserad klassificering
  lowerBodyType?: 'hard' | 'easy' // Fotled-baserad klassificering
  gainerType?: 'hard' | 'average' | 'easy' // DEPRECATED - use upperBodyType/lowerBodyType
  // Reference tables for Lyle McDonald and Alan Aragon models
  referenceTable?: LyleMcDonaldReference[] | AlanAragonReference[]
  // Casey Butt method metadata
  caseyButtMethod?: 'standard' | 'personalized' // 'standard' = 10%, 'personalized' = användarens BF%
  caseyButtBodyFat?: number // Vilken BF% som användes i MLBM-beräkningen
  caseyButtConversionBodyFat?: number // Vilken BF% som användes för viktkonvertering
}

export interface GeneticPotentialInput {
  heightCm: number
  gender: 'male' | 'female'
  wristCm?: number
  ankleCm?: number
  currentWeight?: number
  currentBodyFat?: number
  caseyButtMethod?: 'standard' | 'personalized' // Val av metod för Casey Butt
}

/**
 * Lyle McDonald referenstabell för årsbaserad muskeltillväxt
 */
export interface LyleMcDonaldReference {
  year: number
  gainPerYearKg: { min: number; max: number }
  gainPerMonthKg: number
}

/**
 * Alan Aragon referenstabell för månadsbaserad muskeltillväxt
 */
export interface AlanAragonReference {
  category: string
  gainPercentMin: number
  gainPercentMax: number
  description: string
}

/**
 * Martin Berkhans modell
 * Baserat på längd och kroppsfett
 * Källa: Leangains.com
 *
 * Formeln beräknar maximal fettfri massa baserat på längd.
 * Använder tävlingsvikt vid 5% kroppsfett som referens.
 * - Vid 5% BF: Längd - (98-101 beroende på längd)
 */
export function berkhanFormula(heightCm: number): GeneticPotentialResult {
  // Basvikt vid 5% BF baserat på längd
  let baseWeight5BF: number
  if (heightCm < 170) {
    baseWeight5BF = heightCm - 98
  } else if (heightCm < 180) {
    baseWeight5BF = heightCm - 99
  } else if (heightCm < 190) {
    baseWeight5BF = heightCm - 100
  } else {
    baseWeight5BF = heightCm - 101
  }

  // Berkhan-modellen definierar genetisk potential vid 5% kroppsfett
  // Detta är en biologisk maxgräns baserad på längd och skelettstruktur
  const maxWeight = baseWeight5BF
  const maxLeanMass = maxWeight * (1 - 5 / 100) // Fettfri massa vid 5% BF

  return {
    formula: 'Martin Berkhans modell',
    description: 'Baserat på tävlingsvikt vid extremt låg kroppsfett',
    maxLeanMass,
    maxWeight,
  }
}

/**
 * Casey Butts modell (2009)
 * Tar hänsyn till skelettstruktur (handled/ankel) och kroppsfett
 * Klassificerar överkropp och underkropp separat
 * Källa: WeighTrainer.net
 */
export function caseyButtFormula(
  heightCm: number,
  wristCm: number,
  ankleCm: number,
  method: 'standard' | 'personalized' = 'standard',
  currentBodyFat?: number
): GeneticPotentialResult {
  // Convert to inches (formulas expect inches)
  const heightInches = heightCm / 2.54
  const wristInches = wristCm / 2.54
  const ankleInches = ankleCm / 2.54

  // Bestäm vilken BF% som ska användas baserat på metod
  // bodyFatForMLBM: Används i MLBM-beräkningen (steg 1)
  // bodyFatForConversion: Används för att konvertera MLBM till faktisk vikt (steg 2)
  let bodyFatForMLBM: number
  let bodyFatForConversion: number
  let actualMethod: 'standard' | 'personalized'

  if (method === 'personalized' && currentBodyFat) {
    // Personaliserad: använd faktisk kroppsfett i BÅDA stegen
    bodyFatForMLBM = currentBodyFat
    bodyFatForConversion = currentBodyFat
    actualMethod = 'personalized'
  } else {
    // Standard: använd 10% för MLBM-beräkning, men användarens faktiska kroppsfett för konvertering
    bodyFatForMLBM = 10
    bodyFatForConversion = currentBodyFat || 10 // Fallback till 10% om data saknas
    actualMethod = 'standard'
  }

  // 1. Calculate MLBM (Maximum Lean Body Mass)
  // MLBM = Height^1.5 * (√Wrist / 22.6670 + √Ankle / 17.0104) * (% Body fat / 224 + 1)
  // För standard-metoden används alltid 10% kroppsfett här som referenspunkt
  const mlbmLbs =
    Math.pow(heightInches, 1.5) *
    (Math.sqrt(wristInches) / 22.667 + Math.sqrt(ankleInches) / 17.0104) *
    (bodyFatForMLBM / 224 + 1)

  const mlbmKg = mlbmLbs * 0.453592 // Convert to kg

  // 2. Calculate MBW (Maximum Body Weight)
  // MBW = (MLBM / (100 - % Body fat)) * 100
  // För standard-metoden används användarens faktiska kroppsfett här
  const mbwKg = (mlbmKg / (100 - bodyFatForConversion)) * 100

  // 3. Calculate MBBW (Maximum Bulked Body Weight)
  // MBBW = MBW * 1.04
  const mbbwKg = mbwKg * 1.04

  // 4. Determine gainer types
  // Upper body (wrist): Hardgainer if Wrist ≤ 0.1045 * Height
  const upperBodyType: 'hard' | 'easy' = wristCm <= 0.1045 * heightCm ? 'hard' : 'easy'

  // Lower body (ankle): Hardgainer if Ankle ≤ 0.1296 * Height
  const lowerBodyType: 'hard' | 'easy' = ankleCm <= 0.1296 * heightCm ? 'hard' : 'easy'

  // 5. Calculate maximum measurements
  let chestInches: number, bicepsInches: number, forearmsInches: number, neckInches: number
  let thighsInches: number, calvesInches: number

  if (upperBodyType === 'easy') {
    // Easygainer formulas for upper body
    chestInches = 1.6817 * wristInches + 1.3759 * ankleInches + 0.3314 * heightInches
    bicepsInches = 1.2033 * wristInches + 0.1236 * heightInches
    forearmsInches = 0.9626 * wristInches + 0.0989 * heightInches
    neckInches = 1.1424 * wristInches + 0.1236 * heightInches
  } else {
    // Hardgainer formulas for upper body
    chestInches = 3.15 * wristInches + 2.54 * ankleInches
    bicepsInches = 2.28 * wristInches
    forearmsInches = 1.83 * wristInches
    neckInches = 2.3 * wristInches
  }

  if (lowerBodyType === 'easy') {
    // Easygainer formulas for lower body
    thighsInches = 1.3868 * ankleInches + 0.1805 * heightInches
    calvesInches = 0.9298 * ankleInches + 0.121 * heightInches
  } else {
    // Hardgainer formulas for lower body
    thighsInches = 2.65 * ankleInches
    calvesInches = 1.8 * ankleInches
  }

  // Convert all measurements to cm
  const maxMeasurements = {
    chestCm: chestInches * 2.54,
    bicepsCm: bicepsInches * 2.54,
    forearmsCm: forearmsInches * 2.54,
    neckCm: neckInches * 2.54,
    thighsCm: thighsInches * 2.54,
    calvesCm: calvesInches * 2.54,
  }

  return {
    formula: 'Casey Butts modell',
    description: 'Tar hänsyn till skelettstruktur (handled/ankel) och kroppsfett',
    maxLeanMass: mlbmKg, // MLBM
    maxWeight: mbwKg, // MBW
    maxBulkedWeight: mbbwKg, // MBBW
    maxMeasurements,
    upperBodyType,
    lowerBodyType,
    caseyButtMethod: actualMethod,
    caseyButtBodyFat: bodyFatForMLBM, // Kroppsfett använt i MLBM-beräkningen
    caseyButtConversionBodyFat: bodyFatForConversion, // Kroppsfett för viktkonvertering
  }
}

/**
 * Alan Aragons ramverk
 * Baserat på nuvarande fettfri massa och träningserfarenhet
 */
export function alanAragonModel(currentLeanMassKg: number): GeneticPotentialResult {
  // Referenstabell för olika träningsnivåer

  // Konservativ maxLeanMass-beräkning för jämförelse
  // (Anta intermediär nivå som genomsnitt: 0.75% per månad)
  const avgMonthlyPercent = 0.0075
  const projectedYears = 10
  const totalGain = currentLeanMassKg * avgMonthlyPercent * 12 * projectedYears
  const maxLeanMass = currentLeanMassKg + totalGain

  // Referenstabell som användaren kan använda för att själv bedöma sin nivå
  const referenceTable: AlanAragonReference[] = [
    {
      category: 'Nybörjare',
      gainPercentMin: 1.0,
      gainPercentMax: 1.5,
      description: '< 1 år av korrekt träning',
    },
    {
      category: 'Intermediär',
      gainPercentMin: 0.5,
      gainPercentMax: 1.0,
      description: '1-3 år av korrekt träning',
    },
    {
      category: 'Avancerad',
      gainPercentMin: 0.25,
      gainPercentMax: 0.5,
      description: '3+ år av korrekt träning',
    },
  ]

  return {
    formula: 'Alan Aragons ramverk',
    description: 'Baserat på träningserfarenhet och månatlig tillväxtpotential',
    maxLeanMass,
    maxWeight: maxLeanMass / 0.9, // Antar 10% kroppsfett
    referenceTable,
  }
}

/**
 * Lyle McDonalds ramverk
 * Teoretiskt ramverk baserat på biologiska gränser och träningsår
 */
export function lyleMcDonaldModel(heightCm: number): GeneticPotentialResult {
  // McDonalds formel:
  // (Längd i cm - 100) = max vikt i kg vid 10% kroppsfett

  const maxWeightKg = heightCm - 100
  const maxLeanMass = maxWeightKg * 0.9 // 10% kroppsfett

  // Referenstabell för potentiell muskeltillväxt per träningsår
  // Konverterat från pounds till kg (1 lb = 0.453592 kg)
  const referenceTable: LyleMcDonaldReference[] = [
    { year: 1, gainPerYearKg: { min: 9, max: 11.3 }, gainPerMonthKg: 0.9 },
    { year: 2, gainPerYearKg: { min: 4.5, max: 5.4 }, gainPerMonthKg: 0.45 },
    { year: 3, gainPerYearKg: { min: 2.3, max: 2.7 }, gainPerMonthKg: 0.23 },
    { year: 4, gainPerYearKg: { min: 0.9, max: 1.4 }, gainPerMonthKg: 0.1 },
  ]

  return {
    formula: 'Lyle McDonalds ramverk',
    description: 'Baserat på träningsår och biologiska begränsningar',
    maxLeanMass,
    maxWeight: maxWeightKg,
    referenceTable,
  }
}

/**
 * Beräkna nuvarande progress mot genetisk potential
 */
export function calculateProgress(
  currentWeight: number,
  currentBodyFat: number,
  maxLeanMass: number
): number {
  const currentLeanMass = currentWeight * (1 - currentBodyFat / 100)
  const progress = (currentLeanMass / maxLeanMass) * 100
  return Math.min(progress, 100) // Cap vid 100%
}

/**
 * Beräkna återstående potential
 */
export function calculateRemainingPotential(
  currentWeight: number,
  currentBodyFat: number,
  maxLeanMass: number
): number {
  const currentLeanMass = currentWeight * (1 - currentBodyFat / 100)
  const remaining = maxLeanMass - currentLeanMass
  return Math.max(remaining, 0)
}

/**
 * Beräkna alla modeller och returnera resultat
 */
export function calculateAllModels(input: GeneticPotentialInput): GeneticPotentialResult[] {
  const results: GeneticPotentialResult[] = []

  // These formulas are designed for men only - return empty array for women
  if (input.gender === 'female') {
    return results
  }

  // Berkhan - Endast längd krävs
  results.push(berkhanFormula(input.heightCm))

  // Casey Butt - Kräver handled och fotled
  if (input.wristCm && input.ankleCm) {
    // Hämta metod från input (default: 'standard')
    const method = input.caseyButtMethod || 'standard'

    results.push(
      caseyButtFormula(input.heightCm, input.wristCm, input.ankleCm, method, input.currentBodyFat)
    )
  }

  // Lyle McDonald - Visar alltid referenstabell (flyttad till slutet)
  results.push(lyleMcDonaldModel(input.heightCm))

  // Alan Aragon - Kräver vikt OCH kroppsfett (flyttad till slutet)
  if (input.currentWeight && input.currentBodyFat) {
    const currentLeanMass = input.currentWeight * (1 - input.currentBodyFat / 100)
    results.push(alanAragonModel(currentLeanMass))
  }

  // Lägg till progress om nuvarande data finns
  if (input.currentWeight && input.currentBodyFat) {
    results.forEach(result => {
      result.currentProgress = calculateProgress(
        input.currentWeight!,
        input.currentBodyFat!,
        result.maxLeanMass
      )
      result.remainingPotential = calculateRemainingPotential(
        input.currentWeight!,
        input.currentBodyFat!,
        result.maxLeanMass
      )
    })
  }

  return results
}

/**
 * Få rekommenderad målvikt vid olika kroppsfett %
 */
export function getTargetWeights(maxLeanMass: number): Array<{ bodyFat: number; weight: number }> {
  const bodyFatLevels = [5, 8, 10, 12, 15, 18, 20, 25]

  return bodyFatLevels.map(bf => ({
    bodyFat: bf,
    weight: maxLeanMass / (1 - bf / 100),
  }))
}
