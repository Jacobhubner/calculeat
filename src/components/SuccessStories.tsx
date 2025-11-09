import { Quote, Star } from 'lucide-react'
import { ImagePlaceholder } from './ImagePlaceholder'

interface Testimonial {
  name: string
  achievement: string
  quote: string
  rating: number
  avatarFilename: string
}

export function SuccessStories() {
  const testimonials: Testimonial[] = [
    {
      name: 'Anna Andersson',
      achievement: 'Gick ner 15 kg på 6 månader',
      quote:
        'CalculEat gjorde det enkelt att förstå mitt kaloriintag och hålla koll på mina makron. Jag har äntligen hittat ett hållbart sätt att nå mina viktmål!',
      rating: 5,
      avatarFilename: 'user-1-anna.jpg',
    },
    {
      name: 'Erik Nilsson',
      achievement: 'Ökade 8 kg muskelmassa',
      quote:
        'Som gymmare är det avgörande att få rätt mängd protein. Med CalculEat kunde jag optimera min kost och se fantastiska resultat på bara 4 månader.',
      rating: 5,
      avatarFilename: 'user-2-erik.jpg',
    },
    {
      name: 'Maria Johansson',
      achievement: 'Bibehållit vikten i 1 år',
      quote:
        'Efter att ha nått mitt målvikt använder jag fortfarande CalculEat dagligen. Det hjälper mig att hålla balansen och känna kontroll över min hälsa.',
      rating: 5,
      avatarFilename: 'user-3-maria.jpg',
    },
  ]

  return (
    <section className="py-20 md:py-28 bg-neutral-50">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-neutral-900 mb-4">
            Framgångshistorier
          </h2>
          <p className="text-lg md:text-xl text-neutral-600">
            Riktiga resultat från riktiga användare
          </p>
        </div>

        {/* Testimonials grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow duration-300 relative"
            >
              {/* Quote icon */}
              <div className="absolute top-6 right-6 text-primary-200">
                <Quote className="h-10 w-10" fill="currentColor" />
              </div>

              {/* Avatar */}
              <div className="mb-6">
                <ImagePlaceholder
                  description={`Profilbild för ${testimonial.name}`}
                  filename={testimonial.avatarFilename}
                  width={100}
                  height={100}
                  aspectRatio="aspect-square"
                  rounded="rounded-full"
                  className="w-20 h-20 mx-auto"
                />
              </div>

              {/* Content */}
              <div className="space-y-4 text-center">
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">{testimonial.name}</h3>
                  <p className="text-sm font-semibold text-primary-600">
                    {testimonial.achievement}
                  </p>
                </div>

                {/* Rating */}
                <div className="flex justify-center gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-accent-500 text-accent-500" />
                  ))}
                </div>

                {/* Quote */}
                <p className="text-neutral-600 italic leading-relaxed">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-neutral-700">
            Vill du också få resultat?{' '}
            <a
              href="/register"
              className="font-semibold text-primary-600 hover:text-primary-700 underline decoration-2 underline-offset-4"
            >
              Kom igång idag
            </a>
          </p>
        </div>
      </div>
    </section>
  )
}
