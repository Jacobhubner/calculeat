import { Scan, ChefHat, Share2, TrendingUp } from 'lucide-react'
import { ProcessStep } from './ProcessStep'

export function HowItWorks() {
  const steps = [
    {
      step: 1,
      title: 'Scanna eller sök efter livsmedel',
      description:
        'Håll kameran mot streckkoden i affären eller sök i vår databas med tusentals livsmedel. Näringsvärdet hämtas direkt — du loggar det på ett klick.',
      iconName: 'Scan-ikon',
      iconFilename: 'step-1-scan.svg',
      Icon: Scan,
    },
    {
      step: 2,
      title: 'Bygg recept och logga måltider',
      description:
        'Skapa egna recept och följ kalorier, protein, fett och kolhydrater i realtid medan du lägger till ingredienser. Logga hela receptet som en portion.',
      iconName: 'Recept-ikon',
      iconFilename: 'step-2-recipe.svg',
      Icon: ChefHat,
    },
    {
      step: 3,
      title: 'Dela listor och recept med andra',
      description:
        'Bjud in familj, en partner eller en träningskompis till en gemensam lista. Alla kan lägga till och använda livsmedel och recept från listan.',
      iconName: 'Dela-ikon',
      iconFilename: 'step-3-share.svg',
      Icon: Share2,
    },
    {
      step: 4,
      title: 'Följ din progress och justera',
      description:
        'Grafer och statistik visar vad du faktiskt äter vecka för vecka. Jämför mot ditt kalorimål och din kroppssammansättning — och justera när det behövs.',
      iconName: 'Progress-ikon',
      iconFilename: 'step-4-progress.svg',
      Icon: TrendingUp,
    },
  ]

  return (
    <section className="py-20 md:py-28 bg-neutral-50">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-neutral-900 mb-4">
            Så fungerar det
          </h2>
          <p className="text-lg md:text-xl text-neutral-600">
            Från affärshyllan till tallriken — och allt däremellan.
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto space-y-12 md:space-y-16">
          {steps.map((stepData, index) => (
            <ProcessStep key={stepData.step} {...stepData} isLast={index === steps.length - 1} />
          ))}
        </div>
      </div>
    </section>
  )
}
