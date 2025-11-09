import { Link } from 'react-router-dom'
import { Calculator, Apple, Scale, Plus, Hash } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function IconDemo() {
  // Logo concepts - keeping CalculEat text, just changing the icon
  const logoVariants = [
    {
      name: 'Citron Simple ⭐',
      description: 'Enkel citron-form (som i bild 2)',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <ellipse cx="12" cy="13" rx="7" ry="9" />
          <path d="M 12 4 Q 10 2, 12 1 Q 14 2, 12 4 Z" />
        </svg>
      ),
      isSelected: true,
    },
    {
      name: 'Citron med Linjer',
      description: 'Citron med horisontella linjer (som i bild 2)',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
          <ellipse cx="12" cy="13" rx="7" ry="9" fill="currentColor" />
          <line x1="7" y1="10" x2="12" y2="10" stroke="white" strokeWidth="1.5" />
          <line x1="7" y1="13" x2="14" y2="13" stroke="white" strokeWidth="1.5" />
          <line x1="7" y1="16" x2="16" y2="16" stroke="white" strokeWidth="1.5" />
        </svg>
      ),
      isSelected: false,
    },
    {
      name: 'Räknare/Kalkylator',
      description: 'Kalkylator med knappar (som i bild 1)',
      icon: <Calculator className="h-5 w-5" />,
      isSelected: false,
    },
    {
      name: 'Tallrik med Siffror',
      description: 'Tallrik med kalorisiffror',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="9" strokeWidth="2" />
          <text
            x="12"
            y="15"
            fontSize="8"
            fill="currentColor"
            textAnchor="middle"
            fontWeight="bold"
          >
            123
          </text>
        </svg>
      ),
      isSelected: false,
    },
    {
      name: 'Äpple Simple',
      description: 'Ett enkelt äpple',
      icon: <Apple className="h-5 w-5" />,
      isSelected: false,
    },
    {
      name: 'Äpple med Blad',
      description: 'Äpple med blad (som i bild 1)',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <circle cx="12" cy="14" r="8" />
          <ellipse cx="15" cy="7" rx="3" ry="2" transform="rotate(-25 15 7)" />
          <rect x="11.5" y="6" width="1" height="3" rx="0.5" />
        </svg>
      ),
      isSelected: false,
    },
    {
      name: 'Våg/Scale',
      description: 'En matskala för viktkontroll',
      icon: <Scale className="h-5 w-5" />,
      isSelected: false,
    },
    {
      name: 'Gaffel + Siffror',
      description: 'Gaffel med kalkylsiffror',
      icon: (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor">
          <line x1="9" y1="4" x2="9" y2="12" strokeWidth="2" />
          <line x1="12" y1="4" x2="12" y2="12" strokeWidth="2" />
          <line x1="15" y1="4" x2="15" y2="12" strokeWidth="2" />
          <path d="M 7 12 L 12 12 L 17 12 L 12 20 Z" strokeWidth="2" fill="currentColor" />
          <text x="19" y="14" fontSize="6" fill="currentColor" fontWeight="bold">
            123
          </text>
        </svg>
      ),
      isSelected: false,
    },
    {
      name: 'Plus-tecken',
      description: 'Plus för addition/kalkylering',
      icon: <Plus className="h-5 w-5" />,
      isSelected: false,
    },
    {
      name: 'Hash/Siffertecken',
      description: 'Hash-tecken för kalorier/nummer',
      icon: <Hash className="h-5 w-5" />,
      isSelected: false,
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-neutral-900">Välj Ikon för CalculEat</h1>
          <p className="text-lg text-neutral-600 mb-2">
            Olika ikonförslag baserade på dina referensbilder
          </p>
          <p className="text-sm text-neutral-500 mb-6">
            Texten &quot;CalculEat&quot; med gradient-färger bevaras - endast ikonen i den gröna
            boxen ändras
          </p>
          <Button asChild variant="outline">
            <Link to="/">Tillbaka till startsidan</Link>
          </Button>
        </div>

        {/* Logo Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {logoVariants.map(({ name, description, icon, isSelected }) => (
            <Card
              key={name}
              className={`hover:shadow-xl transition-all hover:scale-[1.02] ${
                isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
              }`}
            >
              <CardHeader>
                <div className="flex justify-center mb-4">
                  {/* Show logo in current structure: green gradient box + CalculEat text */}
                  <div className="flex items-center gap-2">
                    <div className="rounded-xl bg-gradient-primary p-2 transition-transform hover:scale-105">
                      <div className="text-white">{icon}</div>
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                      CalculEat
                    </span>
                  </div>
                </div>
                <CardTitle className="text-center text-lg">
                  {name}
                  {isSelected && <span className="ml-2 text-primary-600">✓</span>}
                </CardTitle>
                <CardDescription className="text-center text-sm">{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Preview Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Så här ser de ut i den faktiska headern
          </h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {logoVariants.map(({ name, icon, isSelected }) => {
                  return (
                    <div
                      key={`preview-${name}`}
                      className={`flex items-center gap-3 p-4 border rounded-xl hover:shadow-md transition-all ${
                        isSelected
                          ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-400'
                          : 'bg-white hover:border-primary-300'
                      }`}
                    >
                      {/* Exactly as it appears in header */}
                      <div className="rounded-xl bg-gradient-primary p-2">
                        <div className="text-white">{icon}</div>
                      </div>
                      <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                        CalculEat
                      </span>
                      <span className="ml-auto text-xs text-neutral-400">
                        {name}
                        {isSelected && ' ✓'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-2xl p-8 mb-6">
            <p className="text-neutral-700 mb-2 font-medium">
              💡 Välj den logotyp som bäst representerar CalculEat
            </p>
            <p className="text-sm text-neutral-600">
              Dessa är enkla koncept. Om du gillar en design kan den utvecklas och förfinas
              ytterligare!
            </p>
          </div>
          <Button asChild size="lg">
            <Link to="/">Tillbaka till startsidan</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
