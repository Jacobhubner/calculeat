import { Calculator, Utensils, Target, TrendingUp } from 'lucide-react'
import { ProcessStep } from './ProcessStep'

export function HowItWorks() {
  const steps = [
    {
      step: 1,
      title: 'Beräkna ditt behov',
      description:
        'Använd vår smarta kalkylator för att få reda på ditt BMR (basalmetabolism) och TDEE (totalt dagligt energibehov). Baserat på vetenskapliga formler som Mifflin-St Jeor.',
      iconName: 'Kalkylator-ikon',
      iconFilename: 'step-1-calculator.svg',
      Icon: Calculator,
    },
    {
      step: 2,
      title: 'Logga dina måltider',
      description:
        'Registrera enkelt vad du äter med vår omfattande matdatabas. Få direkt feedback på kalorier, protein, kolhydrater och fett. Spara dina favoritmåltider för snabb loggning.',
      iconName: 'Mat-ikon',
      iconFilename: 'step-2-food.svg',
      Icon: Utensils,
    },
    {
      step: 3,
      title: 'Sätt upp dina mål',
      description:
        'Definiera ditt viktmål och få personaliserade kalori- och makrorekommendationer. Välj mellan viktminskning, viktökning eller underhåll med flexibla makrofördelningar.',
      iconName: 'Mål-ikon',
      iconFilename: 'step-3-target.svg',
      Icon: Target,
    },
    {
      step: 4,
      title: 'Följ din progress',
      description:
        'Se din utveckling över tid med detaljerade grafer och statistik. Få insikter om dina matvanor och justera din strategi baserat på resultat.',
      iconName: 'Progress-ikon',
      iconFilename: 'step-4-progress.svg',
      Icon: TrendingUp,
    },
  ]

  return (
    <section className="py-20 md:py-28 bg-white">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
            Så fungerar det
          </h2>
          <p className="text-lg md:text-xl text-neutral-600">
            Fyra enkla steg till bättre hälsa och kontroll över din kost
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto space-y-12 md:space-y-16">
          {steps.map((stepData, index) => (
            <ProcessStep key={stepData.step} {...stepData} isLast={index === steps.length - 1} />
          ))}
        </div>

        {/* Optional CTA */}
        <div className="text-center mt-16">
          <p className="text-neutral-600 mb-6">
            Börja din resa mot bättre hälsa idag – helt gratis!
          </p>
        </div>
      </div>
    </section>
  )
}
