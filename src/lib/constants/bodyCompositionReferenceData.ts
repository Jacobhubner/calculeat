/**
 * Reference data for body composition visualizations
 * Based on American Council on Exercise (ACE) guidelines and FFMI research
 */

export interface BodyFatCategory {
  category: string
  men: string
  women: string
}

export interface FFMIWithBodyFatRange {
  ffmiMen: string
  bodyFatMen: string
  ffmiWomen: string
  bodyFatWomen: string
  description: string
  colorClass?: string // For highlighting
}

export interface FFMIDescriptionCategory {
  description: string
  men: string
  women: string
  colorClass?: string // For highlighting
}

/**
 * Body Fat % Categories (American Council on Exercise)
 */
export const BODY_FAT_CATEGORIES_ACE: BodyFatCategory[] = [
  {
    category: 'Essentiellt fett',
    men: '2–5%',
    women: '10–13%',
  },
  {
    category: 'Atlet',
    men: '6–13%',
    women: '14–20%',
  },
  {
    category: 'Fitness (vältränad)',
    men: '14–17%',
    women: '21–24%',
  },
  {
    category: 'Hälsosamt medel',
    men: '18–24%',
    women: '25–31%',
  },
  {
    category: 'Överviktig',
    men: '≥ 25%',
    women: '≥ 32%',
  },
]

/**
 * Fat Free Mass Index (FFMI) with Body Fat Ranges
 */
export const FFMI_WITH_BODY_FAT_RANGES: FFMIWithBodyFatRange[] = [
  {
    ffmiMen: '17–18',
    bodyFatMen: '10–18%',
    ffmiWomen: '14–15',
    bodyFatWomen: '20–25%',
    description: 'Smal',
    colorClass: 'bg-blue-50',
  },
  {
    ffmiMen: '18–20',
    bodyFatMen: '20–27%',
    ffmiWomen: '14–17',
    bodyFatWomen: '22–35%',
    description: 'Medel',
    colorClass: 'bg-yellow-50',
  },
  {
    ffmiMen: '19–21',
    bodyFatMen: '25–40%',
    ffmiWomen: '15–18',
    bodyFatWomen: '30–45%',
    description: 'Överviktig',
    colorClass: 'bg-orange-50',
  },
  {
    ffmiMen: '20–21',
    bodyFatMen: '10–18%',
    ffmiWomen: '16–17',
    bodyFatWomen: '18–25%',
    description: 'Atlet / Medel gymmare',
    colorClass: 'bg-green-50',
  },
  {
    ffmiMen: '22–23',
    bodyFatMen: '6–12%',
    ffmiWomen: '18–20',
    bodyFatWomen: '15–22%',
    description: 'Avancerad gymmare',
    colorClass: 'bg-green-100',
  },
  {
    ffmiMen: '24–25',
    bodyFatMen: '8–20%',
    ffmiWomen: '19–21',
    bodyFatWomen: '15–30%',
    description: 'Bodybuilder / Styrkelyftare / Tyngdlyftare',
    colorClass: 'bg-green-200',
  },
]

/**
 * FFMI Description Categories
 */
export const FFMI_DESCRIPTION_CATEGORIES: FFMIDescriptionCategory[] = [
  {
    description: 'Under medel',
    men: '< 18',
    women: '< 15',
    colorClass: 'bg-gray-50',
  },
  {
    description: 'Medel',
    men: '18–20',
    women: '15–17',
    colorClass: 'bg-yellow-50',
  },
  {
    description: 'Över medel',
    men: '20–22',
    women: '17–18',
    colorClass: 'bg-green-50',
  },
  {
    description: 'Utmärkt',
    men: '22–23',
    women: '18–19',
    colorClass: 'bg-green-100',
  },
  {
    description: 'Överlägsen',
    men: '23–26',
    women: '19–21.5',
    colorClass: 'bg-green-200',
  },
  {
    description: 'Misstanke om steroidanvändning',
    men: '26–28',
    women: '21.5–25',
    colorClass: 'bg-orange-100',
  },
  {
    description: 'Steroidanvändning trolig',
    men: '> 28',
    women: '> 25',
    colorClass: 'bg-red-100',
  },
]
