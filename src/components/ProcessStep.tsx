import { LucideIcon } from 'lucide-react'
import { ImagePlaceholder } from './ImagePlaceholder'

interface ProcessStepProps {
  step: number
  title: string
  description: string
  iconName: string
  iconFilename: string
  Icon?: LucideIcon
  isLast?: boolean
}

export function ProcessStep({
  step,
  title,
  description,
  iconName,
  iconFilename,
  Icon,
  isLast = false,
}: ProcessStepProps) {
  return (
    <div className="relative">
      {/* Connector line (not shown on last item) */}
      {!isLast && (
        <div className="absolute left-10 top-20 h-full w-0.5 bg-gradient-to-b from-primary-300 to-transparent hidden md:block" />
      )}

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Icon/Number Circle */}
        <div className="flex-shrink-0 relative">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg">
            {Icon ? (
              <Icon className="h-10 w-10 text-white" strokeWidth={2} />
            ) : (
              <ImagePlaceholder
                description={iconName}
                filename={iconFilename}
                width={80}
                height={80}
                aspectRatio="aspect-square"
                rounded="rounded-2xl"
                className="w-20 h-20 p-2"
              />
            )}
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent-500 text-white flex items-center justify-center font-bold text-sm shadow-md">
            {step}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 pt-2">
          <h3 className="text-xl md:text-2xl font-bold text-neutral-800">{title}</h3>
          <p className="text-neutral-600 leading-relaxed">{description}</p>
        </div>
      </div>
    </div>
  )
}
