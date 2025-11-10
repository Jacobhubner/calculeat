import { Link } from 'react-router'
import { ArrowRight, Calculator } from 'lucide-react'
import { Button } from './ui/button'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 pt-20 pb-24 md:pt-28 md:pb-32">
      {/* Background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]" />

      <div className="container relative mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left column - Text content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Ta kontroll över din kost.{' '}
                <span className="text-accent-400">Enkelt med CalculEat.</span>
              </h1>
              <p className="text-lg md:text-xl text-primary-50 max-w-2xl mx-auto lg:mx-0">
                Räkna kalorier, spåra makron och nå dina hälsomål med precision. Vetenskapligt
                baserade kalkyler som hjälper dig förstå din kropp bättre.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button
                asChild
                size="lg"
                variant="accent"
                className="text-base font-semibold shadow-xl hover:shadow-2xl transition-all"
              >
                <Link to="/register">
                  Skapa konto gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-base font-semibold bg-white/10 hover:bg-white/20 text-white border-white/30 backdrop-blur-sm"
              >
                <a href="#calculator">
                  <Calculator className="mr-2 h-5 w-5" />
                  Prova kalkylatorn
                </a>
              </Button>
            </div>

            {/* Social proof */}
            <div className="flex flex-wrap gap-6 justify-center lg:justify-start text-primary-50">
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-white">10,000+</div>
                <div className="text-sm">Aktiva användare</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-white">500K+</div>
                <div className="text-sm">Loggade måltider</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-2xl font-bold text-white">4.9/5</div>
                <div className="text-sm">Användarbetyg</div>
              </div>
            </div>
          </div>

          {/* Right column - Hero image/mockup */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-lg">
              <img
                src="/hero-dashboard-mockup.png"
                alt="Dashboard mockup - Visa översikt av dagens kaloriintag, makrofördelning och progress rings"
                className="shadow-2xl w-full aspect-[3/4] rounded-3xl object-cover"
                width={600}
                height={800}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
            fill="rgb(250, 250, 249)"
          />
        </svg>
      </div>
    </section>
  )
}
