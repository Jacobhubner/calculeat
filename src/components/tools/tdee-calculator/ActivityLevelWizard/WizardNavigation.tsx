import { Button } from '@/components/ui/button'

interface WizardNavigationProps {
  currentStep: number
  totalSteps: number
  onPrevious: () => void
  onNext: () => void
  onCalculate: () => void
  canProceed: boolean
}

export default function WizardNavigation({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onCalculate,
  canProceed,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === totalSteps

  return (
    <div className="flex justify-between pt-6 border-t border-neutral-200">
      <Button variant="outline" onClick={onPrevious} disabled={isFirstStep}>
        Föregående
      </Button>

      {isLastStep ? (
        <Button onClick={onCalculate} disabled={!canProceed}>
          Beräkna PAL
        </Button>
      ) : (
        <Button onClick={onNext} disabled={!canProceed}>
          Nästa
        </Button>
      )}
    </div>
  )
}
