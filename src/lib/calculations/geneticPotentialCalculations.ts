/**
 * Beräkningar för genetisk muskelpotential
 * Baserat på flera etablerade formler och modeller
 */

export interface GeneticPotentialResult {
  formula: string
  description: string
  maxLeanMass: number // kg
  maxWeight: number // kg vid olika kroppsfett %
  currentProgress?: number // % av genetisk potential
  remainingPotential?: number // kg muskler kvar att bygga
  // Casey Butt specific measurements
  maxMeasurements?: {
    armCm: number // Max arm circumference
    chestCm: number // Max chest circumference
    calfCm: number // Max calf circumference
  }
  gainerType?: 'hard' | 'average' | 'easy' // Based on bone structure
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
 * Martin Berkhan's Formula (Leangains)
 * Baserat på längd och kön
 * Källa: Leangains.com
 */
export function berkhanFormula(
  heightCm: number,
  gender: 'male' | 'female'
): GeneticPotentialResult {
  const heightInches = heightCm / 2.54

  // Berkhan's formula: Stage weight (lbs) = height (inches) - 100
  // Vid cirka 5% kroppsfett för män
  const stageWeightLbs = heightInches - 100
  const stageWeightKg = stageWeightLbs * 0.453592

  // Justera för kvinnor (cirka 15% lägre muskelmassa)
  const adjustedWeight = gender === 'female' ? stageWeightKg * 0.85 : stageWeightKg

  // Maximal fettfri massa vid 5% BF för män, 12% för kvinnor
  const targetBodyFat = gender === 'male' ? 0.05 : 0.12
  const maxLeanMass = adjustedWeight * (1 - targetBodyFat)

  return {
    formula: 'Martin Berkhan (Leangains)',
    description: 'Baserat på tävlingsvikt vid extremt låg kroppsfett',
    maxLeanMass,
    maxWeight: adjustedWeight,
  }
}

/**
 * Casey Butt's Formula
 * Mer avancerad - tar hänsyn till handled och ankel omfång
 * Källa: WeighTrainer.net
 */
export function caseyButtFormula(
  heightCm: number,
  wristCm: number,
  ankleCm: number,
  gender: 'male' | 'female'
): GeneticPotentialResult {
  const heightInches = heightCm / 2.54
  const wristInches = wristCm / 2.54
  const ankleInches = ankleCm / 2.54

  // Casey Butt's formula för max vikt vid 10% kroppsfett
  // Max Weight = H^1.5 × (√W × 0.45 + √A × 0.45) × 0.01 (i pounds)
  const maxWeightLbs =
    Math.pow(heightInches, 1.5) *
    (Math.sqrt(wristInches) * 0.45 + Math.sqrt(ankleInches) * 0.45) *
    0.01

  const maxWeightKg = maxWeightLbs * 0.453592

  // Justera för kvinnor
  const adjustedWeight = gender === 'female' ? maxWeightKg * 0.85 : maxWeightKg

  // Max lean mass vid 10% BF för män, 20% för kvinnor
  const targetBodyFat = gender === 'male' ? 0.1 : 0.2
  const maxLeanMass = adjustedWeight * (1 - targetBodyFat)

  // Calculate max body measurements (Casey Butt's formulas)
  // Max Arm = Wrist × 2.5
  // Max Chest = 1.48 × (Height^0.57 × Wrist^0.29)
  // Max Calf = Ankle × 1.55
  const maxArmInches = wristInches * 2.5
  const maxChestInches = 1.48 * Math.pow(heightInches, 0.57) * Math.pow(wristInches, 0.29)
  const maxCalfInches = ankleInches * 1.55

  const maxMeasurements = {
    armCm: maxArmInches * 2.54,
    chestCm: maxChestInches * 2.54,
    calfCm: maxCalfInches * 2.54,
  }

  // Determine gainer type based on wrist-to-ankle ratio
  // Smaller wrists relative to ankles = harder gainer (ectomorph)
  // Larger wrists relative to ankles = easier gainer (mesomorph/endomorph)
  const wristAnkleRatio = wristInches / ankleInches
  let gainerType: 'hard' | 'average' | 'easy'
  if (wristAnkleRatio < 0.73) {
    gainerType = 'hard' // Ectomorph - thinner bone structure
  } else if (wristAnkleRatio > 0.78) {
    gainerType = 'easy' // Mesomorph/Endomorph - thicker bone structure
  } else {
    gainerType = 'average'
  }

  return {
    formula: 'Casey Butt',
    description: 'Tar hänsyn till skelettstruktur (handled/ankel)',
    maxLeanMass,
    maxWeight: adjustedWeight,
    maxMeasurements,
    gainerType,
  }
}

/**
 * Alan Aragon's Model
 * Baserat på nuvarande fettfri massa och träningserfarenhet
 */
export function alanAragonModel(
  currentLeanMassKg: number,
  trainingYears: number,
  gender: 'male' | 'female'
): GeneticPotentialResult {
  // Aragon's gains per månad baserat på träningsnivå
  // Nybörjare: 1-1.5% av kroppsvikt per månad
  // Intermediär: 0.5-1% av kroppsvikt per månad
  // Avancerad: 0.25-0.5% av kroppsvikt per månad

  let monthlyGainPercent: number
  if (trainingYears < 1) {
    monthlyGainPercent = 0.0125 // 1.25% avg
  } else if (trainingYears < 3) {
    monthlyGainPercent = 0.0075 // 0.75% avg
  } else {
    monthlyGainPercent = 0.00375 // 0.375% avg
  }

  // Estimera potential baserat på 10 års träning
  const remainingYears = Math.max(0, 10 - trainingYears)
  const totalGain = currentLeanMassKg * monthlyGainPercent * 12 * remainingYears

  const maxLeanMass = currentLeanMassKg + totalGain

  // Justera för kvinnor
  const adjustedMaxLeanMass = gender === 'female' ? maxLeanMass * 0.85 : maxLeanMass

  return {
    formula: 'Alan Aragon Model',
    description: 'Baserat på träningserfarenhet och nuvarande status',
    maxLeanMass: adjustedMaxLeanMass,
    maxWeight: adjustedMaxLeanMass / 0.9, // Antar 10% kroppsfett
    remainingPotential: totalGain,
  }
}

/**
 * Lyle McDonald's Model
 * Konservativ modell baserad på biologiska gränser
 */
export function lyleMcDonaldModel(
  heightCm: number,
  gender: 'male' | 'female'
): GeneticPotentialResult {
  // McDonald's formula:
  // För män: (Längd i cm - 100) = max vikt i kg vid 10% kroppsfett
  // För kvinnor: cirka 85% av män

  const maxWeightKg = gender === 'male' ? heightCm - 100 : (heightCm - 100) * 0.85

  const targetBodyFat = gender === 'male' ? 0.1 : 0.2
  const maxLeanMass = maxWeightKg * (1 - targetBodyFat)

  return {
    formula: 'Lyle McDonald Model',
    description: 'Konservativ modell baserad på biologiska begränsningar',
    maxLeanMass,
    maxWeight: maxWeightKg,
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

  // Berkhan (alltid tillgänglig)
  results.push(berkhanFormula(input.heightCm, input.gender))

  // McDonald (alltid tillgänglig)
  results.push(lyleMcDonaldModel(input.heightCm, input.gender))

  // Casey Butt (kräver handled/ankel)
  if (input.wristCm && input.ankleCm) {
    results.push(caseyButtFormula(input.heightCm, input.wristCm, input.ankleCm, input.gender))
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
