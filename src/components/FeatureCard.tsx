import { LucideIcon } from 'lucide-react'
import { ImagePlaceholder } from './ImagePlaceholder'

interface FeatureCardProps {
  icon?: LucideIcon
  iconPlaceholder?: {
    description: string
    filename: string
  }
  title: string
  description: string
  accentColor?: 'primary' | 'accent'
}

export default function FeatureCard({
  icon: Icon,
  iconPlaceholder,
  title,
  description,
  accentColor = 'primary',
}: FeatureCardProps) {
  // Ikonbrickan: ljus pastell mot vitt, mättad ton på låg opacitet mot mörkt.
  // -100 rakt av blir en blek fläck som varken syns eller bär färgen.
  const colorClasses = {
    primary: {
      bg: 'bg-primary-100 dark:bg-primary-500/20',
      text: 'text-primary-600 dark:text-primary-300',
      hover: 'group-hover:bg-primary-200 dark:group-hover:bg-primary-500/30',
    },
    accent: {
      bg: 'bg-accent-100 dark:bg-accent-500/20',
      text: 'text-accent-600 dark:text-accent-300',
      hover: 'group-hover:bg-accent-200 dark:group-hover:bg-accent-500/30',
    },
  }

  const colors = colorClasses[accentColor]

  return (
    <div className="group rounded-2xl border border-neutral-200 bg-white p-6 dark:border-neutral-700 dark:bg-neutral-850 shadow-lg dark:shadow-black/30 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] hover:border-primary-300 dark:hover:border-primary-700">
      {/* Icon or Placeholder */}
      <div className="mb-4">
        {Icon ? (
          <div
            className={`inline-flex rounded-xl ${colors.bg} ${colors.hover} p-3 ${colors.text} transition-colors duration-300`}
          >
            <Icon className="h-8 w-8" strokeWidth={2} />
          </div>
        ) : iconPlaceholder ? (
          <ImagePlaceholder
            description={iconPlaceholder.description}
            filename={iconPlaceholder.filename}
            width={100}
            height={100}
            aspectRatio="aspect-square"
            rounded="rounded-xl"
            className="w-16 h-16"
          />
        ) : null}
      </div>

      {/* Content */}
      <h3 className="mb-2 text-xl font-bold text-neutral-900 group-hover:text-primary-700 dark:text-neutral-100 dark:group-hover:text-primary-300 transition-colors">
        {title}
      </h3>
      <p className="text-neutral-600 leading-relaxed dark:text-neutral-400">{description}</p>
    </div>
  )
}
