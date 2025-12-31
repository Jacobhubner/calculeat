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
}

export interface GeneticPotentialInput {
  heightCm: number
  gender: 'male' | 'female'
  wristCm?: number
  ankleCm?: number
  currentWeight?: number
  currentBodyFat?: number
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
 * Martin Berkhan's Formula (Leangains)
 * Baserat på längd och kön
 * Källa: Leangains.com
 *
 * Formeln justerar maxvikt baserat på längd och kroppsfettprocent:
 * - Vid 5% BF: Längd - (98-101 beroende på längd)
 * - Vid högre BF: Lägg till % ökning för varje 5% över 5%
 */
export function berkhanFormula(
  heightCm: number,
  gender: 'male' | 'female',
  targetBodyFat?: number
): GeneticPotentialResult {
  if (gender === 'female') {
    // För kvinnor, använd enklare formel (85% av män)
    const heightInches = heightCm / 2.54
    const stageWeightLbs = heightInches - 100
    const stageWeightKg = stageWeightLbs * 0.453592
    const adjustedWeight = stageWeightKg * 0.85
    const targetBF = targetBodyFat ? targetBodyFat / 100 : 0.12
    const maxLeanMass = adjustedWeight * (1 - targetBF)

    return {
      formula: 'Martin Berkhan (Leangains)',
      description: 'Baserat på tävlingsvikt vid extremt låg kroppsfett',
      maxLeanMass,
      maxWeight: adjustedWeight,
    }
  }

  // För män: Använd Excel-logiken
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

  // Använd antingen användarens faktiska BF eller 5% som default
  const bf = targetBodyFat ?? 5

  // Justera vikt baserat på kroppsfettprocent
  // För varje 5% över 5 BF%, lägg till en procentuell ökning
  let maxWeight: number
  if (bf <= 5) {
    maxWeight = baseWeight5BF
  } else if (bf <= 10) {
    // Vid 10% BF: Lägg till 5% av basvikten
    maxWeight = baseWeight5BF + baseWeight5BF * 0.05
  } else if (bf <= 15) {
    // Vid 15% BF: Lägg till 10% av basvikten
    maxWeight = baseWeight5BF + baseWeight5BF * 0.1
  } else if (bf <= 20) {
    // Vid 20% BF: Lägg till 15% av basvikten
    maxWeight = baseWeight5BF + baseWeight5BF * 0.15
  } else {
    // Vid 30% BF eller högre: Lägg till 25% av basvikten
    maxWeight = baseWeight5BF + baseWeight5BF * 0.25
  }

  // Om användaren har en exakt BF% mellan intervallen, interpolera
  if (targetBodyFat) {
    if (bf > 5 && bf < 10) {
      // Interpolera mellan 0% och 5% ökning
      const ratio = (bf - 5) / 5
      maxWeight = baseWeight5BF + baseWeight5BF * (0.05 * ratio)
    } else if (bf > 10 && bf < 15) {
      // Interpolera mellan 5% och 10% ökning
      const ratio = (bf - 10) / 5
      maxWeight = baseWeight5BF + baseWeight5BF * (0.05 + 0.05 * ratio)
    } else if (bf > 15 && bf < 20) {
      // Interpolera mellan 10% och 15% ökning
      const ratio = (bf - 15) / 5
      maxWeight = baseWeight5BF + baseWeight5BF * (0.1 + 0.05 * ratio)
    } else if (bf > 20 && bf < 30) {
      // Interpolera mellan 15% och 25% ökning
      const ratio = (bf - 20) / 10
      maxWeight = baseWeight5BF + baseWeight5BF * (0.15 + 0.1 * ratio)
    }
  }

  // Maximal fettfri massa
  const maxLeanMass = maxWeight * (1 - bf / 100)

  return {
    formula: 'Martin Berkhans modell',
    description: 'Baserat på tävlingsvikt vid extremt låg kroppsfett',
    maxLeanMass,
    maxWeight,
  }
}

/**
 * Casey Butt's Formula (2009)
 * Mer avancerad - tar hänsyn till handled och ankel omfång samt kroppsfett
 * Klassificerar överkropp och underkropp separat
 * Källa: WeighTrainer.net
 */
export function caseyButtFormula(
  heightCm: number,
  wristCm: number,
  ankleCm: number,
  gender: 'male' | 'female',
  currentBodyFat?: number
): GeneticPotentialResult {
  // Convert to inches (formulas expect inches)
  const heightInches = heightCm / 2.54
  const wristInches = wristCm / 2.54
  const ankleInches = ankleCm / 2.54

  // Use user's body fat % or default (10% for men, 20% for women)
  const bodyFatPercent = currentBodyFat ?? (gender === 'male' ? 10 : 20)

  // 1. Calculate MLBM (Maximum Lean Body Mass)
  // MLBM = Height^1.5 * (√Wrist / 22.6670 + √Ankle / 17.0104) * (% Body fat / 224 + 1)
  const mlbmLbs =
    Math.pow(heightInches, 1.5) *
    (Math.sqrt(wristInches) / 22.667 + Math.sqrt(ankleInches) / 17.0104) *
    (bodyFatPercent / 224 + 1)

  const mlbmKg = mlbmLbs * 0.453592 // Convert to kg

  // 2. Calculate MBW (Maximum Body Weight)
  // MBW = (MLBM / (100 - % Body fat)) * 100
  const mbwKg = (mlbmKg / (100 - bodyFatPercent)) * 100

  // 3. Calculate MBBW (Maximum Bulked Body Weight)
  // MBBW = MBW * 1.04
  const mbbwKg = mbwKg * 1.04

  // Adjust for women (85% of male values)
  const adjustedMlbm = gender === 'female' ? mlbmKg * 0.85 : mlbmKg
  const adjustedMbw = gender === 'female' ? mbwKg * 0.85 : mbwKg
  const adjustedMbbw = gender === 'female' ? mbbwKg * 0.85 : mbbwKg

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
    maxLeanMass: adjustedMlbm, // MLBM
    maxWeight: adjustedMbw, // MBW
    maxBulkedWeight: adjustedMbbw, // MBBW
    maxMeasurements,
    upperBodyType,
    lowerBodyType,
  }
}

/**
 * Alan Aragon's Model
 * Baserat på nuvarande fettfri massa och träningserfarenhet
 */
export function alanAragonModel(
  currentLeanMassKg: number,
  gender: 'male' | 'female'
): GeneticPotentialResult {
  // Aragon's gains per månad baserat på träningsnivå
  // Referenstabell för olika träningsnivåer

  // Behåll en konservativ maxLeanMass-beräkning för jämförelse
  // (Anta intermediär nivå som genomsnitt: 0.75% per månad)
  const avgMonthlyPercent = 0.0075
  const projectedYears = 10
  const totalGain = currentLeanMassKg * avgMonthlyPercent * 12 * projectedYears
  const maxLeanMass = currentLeanMassKg + totalGain

  // Justera för kvinnor
  const adjustedMaxLeanMass = gender === 'female' ? maxLeanMass * 0.85 : maxLeanMass

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
    maxLeanMass: adjustedMaxLeanMass,
    maxWeight: adjustedMaxLeanMass / 0.9, // Antar 10% kroppsfett
    referenceTable,
  }
}

/**
 * Lyle McDonald's Model
 * Konservativ modell baserad på biologiska gränser och träningsår
 */
export function lyleMcDonaldModel(
  heightCm: number,
  gender: 'male' | 'female'
): GeneticPotentialResult {
  // McDonald's formula:
  // För män: (Längd i cm - 100) = max vikt i kg vid 10% kroppsfett
  // För kvinnor: cirka 85% av män

  const maxWeightKg = gender === 'male' ? heightCm - 100 : (heightCm - 100) * 0.85
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

  // Berkhan - Kräver kroppsfett för meningsfulla resultat
  if (input.currentBodyFat) {
    results.push(berkhanFormula(input.heightCm, input.gender, input.currentBodyFat))
  }

  // Casey Butt - Kräver handled, fotled OCH kroppsfett
  if (input.wristCm && input.ankleCm && input.currentBodyFat) {
    results.push(
      caseyButtFormula(
        input.heightCm,
        input.wristCm,
        input.ankleCm,
        input.gender,
        input.currentBodyFat
      )
    )
  }

  // Lyle McDonald - Visar alltid referenstabell (flyttad till slutet)
  results.push(lyleMcDonaldModel(input.heightCm, input.gender))

  // Alan Aragon - Kräver vikt OCH kroppsfett (flyttad till slutet)
  if (input.currentWeight && input.currentBodyFat) {
    const currentLeanMass = input.currentWeight * (1 - input.currentBodyFat / 100)
    results.push(alanAragonModel(currentLeanMass, input.gender))
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
