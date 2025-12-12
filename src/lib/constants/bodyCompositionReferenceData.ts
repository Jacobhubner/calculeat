/**
 * Reference data for body composition visualizations
 * Based on American Council on Exercise (ACE) guidelines and FFMI research
 */

export interface BodyFatCategory {
  category: string;
  men: string;
  women: string;
}

export interface FFMIWithBodyFatRange {
  ffmiMen: string;
  bodyFatMen: string;
  ffmiWomen: string;
  bodyFatWomen: string;
  description: string;
  colorClass?: string; // For highlighting
}

export interface FFMIDescriptionCategory {
  description: string;
  men: string;
  women: string;
  colorClass?: string; // For highlighting
}

/**
 * Body Fat % Categories (American Council on Exercise)
 */
export const BODY_FAT_CATEGORIES_ACE: BodyFatCategory[] = [
  {
    category: 'Essential Fat',
    men: '2–5%',
    women: '10–13%',
  },
  {
    category: 'Athletes',
    men: '6–13%',
    women: '14–20%',
  },
  {
    category: 'Fitness (in shape)',
    men: '14–17%',
    women: '21–24%',
  },
  {
    category: 'Healthy average',
    men: '18–24%',
    women: '25–31%',
  },
  {
    category: 'Obese',
    men: '≥ 25%',
    women: '≥ 32%',
  },
];

/**
 * Fat Free Mass Index (FFMI) with Body Fat Ranges
 */
export const FFMI_WITH_BODY_FAT_RANGES: FFMIWithBodyFatRange[] = [
  {
    ffmiMen: '17–18',
    bodyFatMen: '10–18%',
    ffmiWomen: '14–15',
    bodyFatWomen: '20–25%',
    description: 'Skinny',
    colorClass: 'bg-blue-50',
  },
  {
    ffmiMen: '18–20',
    bodyFatMen: '20–27%',
    ffmiWomen: '14–17',
    bodyFatWomen: '22–35%',
    description: 'Average',
    colorClass: 'bg-yellow-50',
  },
  {
    ffmiMen: '19–21',
    bodyFatMen: '25–40%',
    ffmiWomen: '15–18',
    bodyFatWomen: '30–45%',
    description: 'Obese',
    colorClass: 'bg-orange-50',
  },
  {
    ffmiMen: '20–21',
    bodyFatMen: '10–18%',
    ffmiWomen: '16–17',
    bodyFatWomen: '18–25%',
    description: 'Athlete / Intermediate gym user',
    colorClass: 'bg-green-50',
  },
  {
    ffmiMen: '22–23',
    bodyFatMen: '6–12%',
    ffmiWomen: '18–20',
    bodyFatWomen: '15–22%',
    description: 'Advanced gym user',
    colorClass: 'bg-green-100',
  },
  {
    ffmiMen: '24–25',
    bodyFatMen: '8–20%',
    ffmiWomen: '19–21',
    bodyFatWomen: '15–30%',
    description: 'Bodybuilder / Powerlifter / Weightlifter',
    colorClass: 'bg-green-200',
  },
];

/**
 * FFMI Description Categories
 */
export const FFMI_DESCRIPTION_CATEGORIES: FFMIDescriptionCategory[] = [
  {
    description: 'Below average',
    men: '< 18',
    women: '< 15',
    colorClass: 'bg-gray-50',
  },
  {
    description: 'Average',
    men: '18–20',
    women: '15–17',
    colorClass: 'bg-yellow-50',
  },
  {
    description: 'Above average',
    men: '20–22',
    women: '17–18',
    colorClass: 'bg-green-50',
  },
  {
    description: 'Excellent',
    men: '22–23',
    women: '18–19',
    colorClass: 'bg-green-100',
  },
  {
    description: 'Superior',
    men: '23–26',
    women: '19–21.5',
    colorClass: 'bg-green-200',
  },
  {
    description: 'Suspicion of steroid use',
    men: '26–28',
    women: '21.5–25',
    colorClass: 'bg-orange-100',
  },
  {
    description: 'Steroid usage likely',
    men: '> 28',
    women: '> 25',
    colorClass: 'bg-red-100',
  },
];
