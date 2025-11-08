/**
 * Helper functions för hälsoberäkningar
 */

/**
 * Beräkna ålder från födelsedatum
 */
export function calculateAge(birthDate: Date | string): number {
  const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate
  const today = new Date()

  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()

  // Justera om födelsedag inte passerats än i år
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }

  return age
}

/**
 * Beräkna BMI (Body Mass Index)
 */
export function calculateBMI(weight: number, height: number): number {
  if (weight <= 0 || height <= 0) {
    throw new Error('Vikt och längd måste vara positiva värden')
  }

  // height är i cm, konvertera till meter
  const heightInMeters = height / 100
  const bmi = weight / (heightInMeters * heightInMeters)

  return Math.round(bmi * 10) / 10 // En decimal
}

/**
 * Få BMI-kategori baserat på WHO-standarder
 */
export function getBMICategory(bmi: number): 'undervikt' | 'normalvikt' | 'övervikt' | 'fetma' {
  if (bmi < 18.5) return 'undervikt'
  if (bmi < 25) return 'normalvikt'
  if (bmi < 30) return 'övervikt'
  return 'fetma'
}

/**
 * Beräkna idealvikt-intervall baserat på längd (BMI 18.5-25)
 */
export function calculateIdealWeightRange(height: number): {
  min: number
  max: number
} {
  if (height <= 0) {
    throw new Error('Längd måste vara ett positivt värde')
  }

  const heightInMeters = height / 100

  const minWeight = 18.5 * heightInMeters * heightInMeters
  const maxWeight = 25 * heightInMeters * heightInMeters

  return {
    min: Math.round(minWeight),
    max: Math.round(maxWeight),
  }
}

/**
 * Konvertera kalorier till viktförändring
 * 7700 kcal ≈ 1 kg kroppsvikt
 */
export function caloriesToWeight(calories: number): number {
  const CALORIES_PER_KG = 7700
  return calories / CALORIES_PER_KG
}

/**
 * Konvertera viktförändring till kalorier
 */
export function weightToCalories(weight: number): number {
  const CALORIES_PER_KG = 7700
  return weight * CALORIES_PER_KG
}

/**
 * Beräkna fettfri massa (Lean Body Mass)
 */
export function calculateLeanBodyMass(weight: number, bodyFatPercentage: number): number {
  if (weight <= 0) {
    throw new Error('Vikt måste vara ett positivt värde')
  }

  if (bodyFatPercentage < 0 || bodyFatPercentage > 100) {
    throw new Error('Kroppsfett% måste vara mellan 0 och 100')
  }

  const bodyFatDecimal = bodyFatPercentage / 100
  return Math.round(weight * (1 - bodyFatDecimal) * 10) / 10
}

/**
 * Estimera kroppsfett% baserat på BMI och kön (grov uppskattning)
 * Använd endast om verklig kroppsfett% inte är tillgänglig
 */
export function estimateBodyFatFromBMI(
  bmi: number,
  age: number,
  gender: 'male' | 'female'
): number {
  // Deurenberg formel
  let bodyFat: number

  if (gender === 'male') {
    bodyFat = 1.2 * bmi + 0.23 * age - 16.2
  } else {
    bodyFat = 1.2 * bmi + 0.23 * age - 5.4
  }

  // Begränsa till rimliga värden
  return Math.max(5, Math.min(50, Math.round(bodyFat * 10) / 10))
}

/**
 * Konvertera vikt mellan kg och lbs
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10
}

/**
 * Konvertera längd mellan cm och inches
 */
export function cmToInches(cm: number): number {
  return Math.round(cm * 0.393701 * 10) / 10
}

export function inchesToCm(inches: number): number {
  return Math.round((inches / 0.393701) * 10) / 10
}

/**
 * Formatera datum till svensk stil
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('sv-SE')
}

/**
 * Validera att ett värde är inom ett intervall
 */
export function validateRange(value: number, min: number, max: number, fieldName: string): void {
  if (value < min || value > max) {
    throw new Error(`${fieldName} måste vara mellan ${min} och ${max}`)
  }
}
