import type { METActivity } from '@/lib/constants/metActivities'

export interface ActivityLevelWizardData {
  training: {
    daysPerWeek: number
    minutesPerSession: number
    selectedActivity: METActivity | null
  }
  walking: {
    stepsPerDay: number
    hoursStandingPerDay: number
    selectedWalkActivity: METActivity | null
  }
  household: {
    hoursPerDay: number
    selectedHouseholdActivity: METActivity | null
  }
  spaFactor: number
}

export interface WizardResult {
  pal: number
  tdee: number
  bmr: number
}

export interface WizardStepProps {
  data: ActivityLevelWizardData
  onUpdate: (data: Partial<ActivityLevelWizardData>) => void
}
