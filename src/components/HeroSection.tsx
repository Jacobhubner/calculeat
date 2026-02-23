import { Link } from 'react-router'
import { ArrowRight, Calculator } from 'lucide-react'
import { Button } from './ui/button'

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-white pt-20 pb-24 md:pt-28 md:pb-32">
      {/* Background pattern with subtle green radial gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(37,189,0,0.08),transparent_50%)]" />

      <div className="container relative mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left column - Text content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-neutral-900 leading-tight">
                Ta kontroll över din kost.{' '}
                <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                  Enkelt med CalculEat.
                </span>
              </h1>
              <p className="text-lg md:text-xl text-neutral-700 max-w-2xl mx-auto lg:mx-0">
                Tio beprövade BMR-formler. En kaloristrategi som faktiskt passar din kropp.
              </p>
              <p className="text-sm text-neutral-500 max-w-2xl mx-auto lg:mx-0">
                Tar mindre än en minut att komma igång.
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
                className="text-base font-semibold bg-white border-neutral-300 hover:bg-neutral-50 text-neutral-900"
              >
                <a href="#calculator">
                  <Calculator className="mr-2 h-5 w-5" />
                  Prova kalkylatorn
                </a>
              </Button>
            </div>
          </div>

          {/* Right column - Calculator result preview */}
          <div className="hidden lg:flex justify-center lg:justify-end">
            <div className="w-full max-w-md">
              <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-xl rotate-1 hover:rotate-0 transition-transform duration-300">
                {/* Card header */}
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-neutral-100">
                  <Calculator className="h-4 w-4 text-primary-600" />
                  <span className="text-sm font-semibold text-neutral-700">
                    Beräkna ditt kaloribehov
                  </span>
                </div>

                {/* Input summary */}
                <div className="text-xs text-neutral-500 mb-5 bg-neutral-50 rounded-lg px-3 py-2 tracking-wide">
                  Man &middot; 28 år &middot; 180 cm &middot; 78 kg &middot; Måttligt aktiv
                </div>

                {/* Result cards */}
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="rounded-xl bg-primary-50 border border-primary-200 p-4">
                    <p className="text-xs font-medium text-neutral-500 mb-2">BMR</p>
                    <p className="text-2xl font-bold text-primary-600 tabular-nums">1 847</p>
                    <p className="text-xs text-neutral-400 mt-1">kcal/dag i vila</p>
                  </div>
                  <div className="rounded-xl bg-accent-50 border border-accent-200 p-4">
                    <p className="text-xs font-medium text-neutral-500 mb-2">TDEE</p>
                    <p className="text-2xl font-bold text-accent-600 tabular-nums">2 684</p>
                    <p className="text-xs text-neutral-400 mt-1">kcal/dag totalt</p>
                  </div>
                </div>

                {/* Formula badge */}
                <div className="flex items-center gap-2 text-xs text-neutral-400">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                  Mifflin-St Jeor equation
                </div>
              </div>
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
