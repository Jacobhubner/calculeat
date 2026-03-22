import { Scan, ChefHat, Share2, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ProcessStep } from './ProcessStep'

export function HowItWorks() {
  const { t } = useTranslation('marketing')

  const steps = [
    {
      step: 1,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.description'),
      iconName: 'Scan-ikon',
      iconFilename: 'step-1-scan.svg',
      Icon: Scan,
    },
    {
      step: 2,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.description'),
      iconName: 'Recept-ikon',
      iconFilename: 'step-2-recipe.svg',
      Icon: ChefHat,
    },
    {
      step: 3,
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.description'),
      iconName: 'Dela-ikon',
      iconFilename: 'step-3-share.svg',
      Icon: Share2,
    },
    {
      step: 4,
      title: t('howItWorks.step4.title'),
      description: t('howItWorks.step4.description'),
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
            {t('howItWorks.title')}
          </h2>
          <p className="text-lg md:text-xl text-neutral-600">
            {t('howItWorks.subtitle')}
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
