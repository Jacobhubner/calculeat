import { ImagePlaceholder } from './ImagePlaceholder'

interface FeatureShowcaseProps {
  title: string
  description: string
  screenshotDescription: string
  screenshotFilename: string
  imagePosition?: 'left' | 'right'
  highlights?: string[]
}

export function FeatureShowcase({
  title,
  description,
  screenshotDescription,
  screenshotFilename,
  imagePosition = 'right',
  highlights = [],
}: FeatureShowcaseProps) {
  const isImageRight = imagePosition === 'right'

  return (
    <div className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div
          className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${
            isImageRight ? '' : 'lg:grid-flow-dense'
          }`}
        >
          {/* Content */}
          <div className={`space-y-6 ${isImageRight ? '' : 'lg:col-start-2'}`}>
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">{title}</h3>
              <p className="text-lg text-neutral-600 leading-relaxed">{description}</p>
            </div>

            {/* Highlights */}
            {highlights.length > 0 && (
              <ul className="space-y-3">
                {highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center mt-0.5">
                      <svg
                        className="w-4 h-4 text-primary-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-neutral-700">{highlight}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Screenshot/Image */}
          <div className={`${isImageRight ? '' : 'lg:col-start-1 lg:row-start-1'}`}>
            <div className="relative">
              {/* Decorative background */}
              <div
                className={`absolute inset-0 bg-gradient-to-br from-primary-100 to-accent-100 rounded-3xl transform ${
                  isImageRight ? 'translate-x-4 translate-y-4' : '-translate-x-4 translate-y-4'
                } -z-10`}
              />

              <ImagePlaceholder
                description={screenshotDescription}
                filename={screenshotFilename}
                width={400}
                height={800}
                aspectRatio="aspect-[1/2]"
                rounded="rounded-3xl"
                className="shadow-2xl w-full max-w-md mx-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
