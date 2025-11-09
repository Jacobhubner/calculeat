import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function IconDemo() {
  // Logo concepts based on user's reference images
  const logoVariants = [
    {
      name: 'Citron med Linjer (Exakt som Bild 2) ⭐',
      description: 'Gul citron med vita horisontella linjer',
      logo: (
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 60 80" className="h-12 w-12" fill="none">
            {/* Lemon body */}
            <ellipse cx="30" cy="45" rx="22" ry="28" fill="#f9ca24" />
            {/* Stem */}
            <path d="M 30 17 Q 28 14, 30 12 Q 32 14, 30 17 Z" fill="#8B4513" />
            {/* White lines - progressive length */}
            <rect x="12" y="32" width="16" height="3" rx="1.5" fill="white" />
            <rect x="12" y="42" width="24" height="3" rx="1.5" fill="white" />
            <rect x="12" y="52" width="32" height="3" rx="1.5" fill="white" />
          </svg>
          <span className="text-2xl font-bold">
            <span style={{ color: '#52b788' }}>Calcul</span>
            <span style={{ color: '#e76f51' }}>Eat</span>
          </span>
        </div>
      ),
      isSelected: true,
    },
    {
      name: 'Grön Räknare med Ansikte (Som Bild 1)',
      description: 'Grön/orange räknare med ansikte',
      logo: (
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 60 80" className="h-12 w-12" fill="none">
            {/* Calculator body */}
            <rect x="10" y="10" width="40" height="60" rx="6" fill="#6FCF97" />
            {/* Screen */}
            <rect x="15" y="16" width="30" height="12" rx="2" fill="#e0e0e0" />
            {/* Eyes */}
            <circle cx="23" cy="38" r="3" fill="#2d3748" />
            <circle cx="37" cy="38" r="3" fill="#2d3748" />
            {/* Smile */}
            <path d="M 20 48 Q 30 54, 40 48" stroke="#2d3748" strokeWidth="2" fill="none" />
            {/* Buttons */}
            <rect x="16" y="56" width="6" height="6" rx="1" fill="#f39c12" />
            <rect x="27" y="56" width="6" height="6" rx="1" fill="#f39c12" />
            <rect x="38" y="56" width="6" height="6" rx="1" fill="#f39c12" />
          </svg>
          <span className="text-2xl font-bold">
            <span style={{ color: '#52b788' }}>Calcul</span>
            <span style={{ color: '#e76f51' }}>Eat</span>
          </span>
        </div>
      ),
      isSelected: false,
    },
    {
      name: 'Orange Äpple + Citron',
      description: 'Orange äpple bredvid citron (som i bild 1)',
      logo: (
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {/* Orange apple/orange */}
            <svg viewBox="0 0 40 40" className="h-10 w-10">
              <circle cx="20" cy="22" r="14" fill="#f39c12" />
              <rect x="19" y="8" width="2" height="6" rx="1" fill="#8B4513" />
            </svg>
            {/* Yellow lemon */}
            <svg viewBox="0 0 40 40" className="h-10 w-10">
              <ellipse cx="20" cy="22" rx="12" ry="15" fill="#f9ca24" />
            </svg>
          </div>
          <span className="text-2xl font-bold">
            <span style={{ color: '#52b788' }}>Calcul</span>
            <span style={{ color: '#e76f51' }}>Eat</span>
          </span>
        </div>
      ),
      isSelected: false,
    },
    {
      name: 'Citron Simple (Utan Linjer)',
      description: 'Enkel gul citron',
      logo: (
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 60 80" className="h-12 w-12">
            <ellipse cx="30" cy="45" rx="22" ry="28" fill="#f9ca24" />
            <path d="M 30 17 Q 28 14, 30 12 Q 32 14, 30 17 Z" fill="#8B4513" />
          </svg>
          <span className="text-2xl font-bold">
            <span style={{ color: '#52b788' }}>Calcul</span>
            <span style={{ color: '#e76f51' }}>Eat</span>
          </span>
        </div>
      ),
      isSelected: false,
    },
    {
      name: 'Grön Räknare (Utan Ansikte)',
      description: 'Grön räknare med knappar, utan ansikte',
      logo: (
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 60 80" className="h-12 w-12">
            <rect x="10" y="10" width="40" height="60" rx="6" fill="#6FCF97" />
            <rect x="15" y="16" width="30" height="14" rx="2" fill="#e0e0e0" />
            {/* Button grid */}
            <rect x="16" y="38" width="10" height="8" rx="1" fill="#f39c12" />
            <rect x="16" y="50" width="10" height="8" rx="1" fill="#f39c12" />
            <rect x="16" y="62" width="10" height="6" rx="1" fill="#f39c12" />
            <rect x="30" y="38" width="8" height="8" rx="1" fill="#f39c12" />
            <rect x="30" y="50" width="8" height="8" rx="1" fill="#f39c12" />
            <rect x="42" y="38" width="8" height="20" rx="1" fill="#e76f51" />
          </svg>
          <span className="text-2xl font-bold">
            <span style={{ color: '#52b788' }}>Calcul</span>
            <span style={{ color: '#e76f51' }}>Eat</span>
          </span>
        </div>
      ),
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
            Baserat på dina referensbilder - ingen grön box, bara ikon + text
          </p>
          <Button asChild variant="outline">
            <Link to="/">Tillbaka till startsidan</Link>
          </Button>
        </div>

        {/* Logo Grid */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          {logoVariants.map(({ name, description, logo, isSelected }) => (
            <Card
              key={name}
              className={`hover:shadow-xl transition-all hover:scale-[1.02] ${
                isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
              }`}
            >
              <CardHeader>
                <div className="flex justify-center mb-4">{logo}</div>
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
          <h2 className="text-2xl font-bold text-center mb-8">Så här ser de ut i headern</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {logoVariants.map(({ name, logo, isSelected }) => {
                  return (
                    <div
                      key={`preview-${name}`}
                      className={`flex items-center justify-between p-4 border rounded-xl hover:shadow-md transition-all ${
                        isSelected
                          ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-400'
                          : 'bg-white hover:border-primary-300'
                      }`}
                    >
                      {logo}
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
