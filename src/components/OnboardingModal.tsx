/**
 * Onboarding Modal Component
 * Guides new users through the initial setup process
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CheckCircle2, ArrowRight, Scale, Target, Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const steps = [
  {
    id: 1,
    title: 'Välkommen till CalculEat! 🎉',
    description: 'Din personliga nutrition- och kaloriräknare',
    icon: Sparkles,
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">
          CalculEat hjälper dig att enkelt hålla koll på dina kalorier, makronutrienter och nå dina
          hälsomål.
        </p>
        <div className="grid gap-3 mt-4">
          <div className="flex items-start gap-3 p-3 bg-primary-50 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary-900">Personliga beräkningar</p>
              <p className="text-sm text-primary-700">
                BMR, TDEE och kalorimål baserat på din profil
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-accent-50 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-accent-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-accent-900">Enkel matloggning</p>
              <p className="text-sm text-accent-700">
                Snabba genvägar och senaste matvaror för smidig loggning
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-success-50 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-success-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-success-900">Detaljerad uppföljning</p>
              <p className="text-sm text-success-700">Statistik och framstegshistorik</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 2,
    title: 'Fyll i din profil',
    description: 'För att beräkna ditt kaloribehov behöver vi lite information',
    icon: Scale,
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">
          Vi behöver följande information för att ge dig korrekta beräkningar:
        </p>
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="font-bold text-primary-600">1</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900">Personuppgifter</p>
              <p className="text-sm text-neutral-600">Ålder, kön, längd och vikt</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="font-bold text-primary-600">2</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900">Aktivitetsnivå</p>
              <p className="text-sm text-neutral-600">Hur aktiv är du i vardagen?</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="font-bold text-primary-600">3</span>
            </div>
            <div className="flex-1">
              <p className="font-medium text-neutral-900">Hälsomål</p>
              <p className="text-sm text-neutral-600">Viktminskning, bibehållande eller ökning</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 3,
    title: 'Börja logga mat',
    description: 'Logga dina måltider för att nå dina mål',
    icon: Target,
    content: (
      <div className="space-y-4">
        <p className="text-neutral-700">Efter att du fyllt i din profil kan du börja logga mat:</p>
        <div className="space-y-3 mt-4">
          <div className="p-4 bg-gradient-to-br from-primary-50 to-accent-50 rounded-lg border border-primary-200">
            <p className="font-medium text-neutral-900 mb-2">📱 Dagens logg</p>
            <p className="text-sm text-neutral-700">
              Gå till &quot;Idag&quot; för att logga dina måltider och se daglig progress
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-accent-50 to-success-50 rounded-lg border border-accent-200">
            <p className="font-medium text-neutral-900 mb-2">⚡ Snabbtillägg</p>
            <p className="text-sm text-neutral-700">
              Använd &quot;Senaste matvaror&quot; för att snabbt lägga till vanliga livsmedel
            </p>
          </div>
          <div className="p-4 bg-gradient-to-br from-success-50 to-primary-50 rounded-lg border border-success-200">
            <p className="font-medium text-neutral-900 mb-2">📊 Följ framsteg</p>
            <p className="text-sm text-neutral-700">
              Se din historik och statistik under &quot;Historik&quot;
            </p>
          </div>
        </div>
      </div>
    ),
  },
]

export default function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const navigate = useNavigate()

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Last step - go to profile
      onOpenChange(false)
      navigate('/app/profile')
    }
  }

  const handleSkip = () => {
    onOpenChange(false)
  }

  const step = steps[currentStep]
  const Icon = step.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center">
              <Icon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl md:text-2xl">{step.title}</DialogTitle>
              <DialogDescription className="text-sm md:text-base">
                {step.description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-4">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`h-2 rounded-full transition-all ${
                index === currentStep
                  ? 'w-8 bg-primary-600'
                  : index < currentStep
                    ? 'w-2 bg-primary-400'
                    : 'w-2 bg-neutral-300'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="py-4">{step.content}</div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 pt-4 border-t">
          <Button variant="ghost" onClick={handleSkip} className="text-neutral-600">
            Hoppa över
          </Button>
          <Button onClick={handleNext} className="gap-2">
            {currentStep < steps.length - 1 ? (
              <>
                Nästa
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                Gå till profil
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
