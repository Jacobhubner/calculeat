import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { calculatePALFromWizard } from '@/lib/calculations/activityLevelWizard'
import WizardProgressBar from './WizardProgressBar'
import WizardNavigation from './WizardNavigation'
import WizardStep1Training from './WizardStep1Training'
import WizardStep2WalkingStanding from './WizardStep2WalkingStanding'
import WizardStep3Household from './WizardStep3Household'
import WizardStep4SPA from './WizardStep4SPA'
import type { ActivityLevelWizardData, WizardResult } from './types'

interface ActivityLevelWizardModalProps {
  bmr: number
  weightKg: number
  onComplete: (result: WizardResult) => void
  onClose: () => void
}

export default function ActivityLevelWizardModal({
  bmr,
  weightKg,
  onComplete,
  onClose,
}: ActivityLevelWizardModalProps) {
  const [currentStep, setCurrentStep] = useState(1)
  const totalSteps = 4

  // Initial wizard-data
  const [wizardData, setWizardData] = useState<ActivityLevelWizardData>({
    training: {
      daysPerWeek: 0,
      minutesPerSession: 0,
      selectedActivity: null,
    },
    walking: {
      stepsPerDay: 7000, // Genomsnitt
      hoursStandingPerDay: 0,
      selectedWalkActivity: null,
    },
    household: {
      hoursPerDay: 0,
      selectedHouseholdActivity: null,
    },
    spaFactor: 1.1, // Normal (baserat på NEAT-litteratur)
  })

  const handleUpdate = (data: Partial<ActivityLevelWizardData>) => {
    setWizardData(prev => ({
      ...prev,
      ...data,
    }))
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
    }
  }

  const handleCalculate = () => {
    const result = calculatePALFromWizard(wizardData, bmr, weightKg)
    onComplete(result)
  }

  // Validera om man kan gå vidare från nuvarande steg
  const canProceed = () => {
    switch (currentStep) {
      case 1:
        // Om man tränar, måste man ange minuter
        if (wizardData.training.daysPerWeek > 0 && wizardData.training.minutesPerSession === 0) {
          return false
        }
        return true
      case 2:
      case 3:
      case 4:
        return true
      default:
        return true
    }
  }

  // Rendera rätt steg
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WizardStep1Training data={wizardData} onUpdate={handleUpdate} />
      case 2:
        return <WizardStep2WalkingStanding data={wizardData} onUpdate={handleUpdate} />
      case 3:
        return <WizardStep3Household data={wizardData} onUpdate={handleUpdate} />
      case 4:
        return <WizardStep4SPA data={wizardData} onUpdate={handleUpdate} />
      default:
        return null
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-bold text-neutral-900">Beräkna din aktivitetsnivå</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress Bar */}
          <WizardProgressBar currentStep={currentStep} totalSteps={totalSteps} />

          {/* Step Content */}
          <div className="min-h-[20rem]">{renderStep()}</div>

          {/* Navigation */}
          <WizardNavigation
            currentStep={currentStep}
            totalSteps={totalSteps}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onCalculate={handleCalculate}
            canProceed={canProceed()}
          />
        </div>
      </div>
    </div>
  )
}
