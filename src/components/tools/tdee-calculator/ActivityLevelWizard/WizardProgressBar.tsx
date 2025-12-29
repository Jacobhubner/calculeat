interface WizardProgressBarProps {
  currentStep: number
  totalSteps: number
}

export default function WizardProgressBar({ currentStep, totalSteps }: WizardProgressBarProps) {
  const progressPercentage = (currentStep / totalSteps) * 100

  return (
    <div className="mb-6">
      <div className="flex justify-between text-sm text-neutral-600 mb-2">
        <span>
          Steg {currentStep} av {totalSteps}
        </span>
        <span>{Math.round(progressPercentage)}%</span>
      </div>
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  )
}
