import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import LemonCalculatorLogo from '@/components/icons/LemonCalculatorLogo'

export default function IconDemo() {
  // Custom SVG logo concepts
  const logoVariants = [
    {
      name: 'Citron Classic',
      description: 'Klassisk gul citron med vita progressiva linjer - ren och tydlig',
      component: <LemonCalculatorLogo size={48} variant="classic" />,
      isSelected: true,
    },
    {
      name: 'Citron Minimal',
      description: 'Minimalistisk citron med subtila orange linjer - elegant och modern',
      component: <LemonCalculatorLogo size={48} variant="minimal" />,
      isSelected: false,
    },
    {
      name: 'Citron Outline',
      description: 'Kontur-stil med lineart - unik och artistisk',
      component: <LemonCalculatorLogo size={48} variant="outline" />,
      isSelected: false,
    },
    {
      name: 'Citron Gradient',
      description: 'Modern gradient från gul till orange - djup och färgrik',
      component: <LemonCalculatorLogo size={48} variant="gradient" />,
      isSelected: false,
    },
    {
      name: 'Citron Modern',
      description: 'Flat design med skugga och highlights - professionell känsla',
      component: <LemonCalculatorLogo size={48} variant="modern" />,
      isSelected: false,
    },
    {
      name: 'CE Monogram',
      description: 'Bokstäverna C och E i en modern, minimalistisk design',
      svg: (
        <svg viewBox="0 0 100 100" className="w-12 h-12">
          <text
            x="50"
            y="65"
            fontSize="48"
            fontWeight="700"
            fontFamily="system-ui"
            fill="currentColor"
            textAnchor="middle"
          >
            CE
          </text>
        </svg>
      ),
      style: 'text-primary-600',
    },
    {
      name: 'Äpple + Plus',
      description: 'Ett stiliserat äpple med ett plustecken (addition/kalkylering)',
      svg: (
        <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" stroke="currentColor">
          <circle cx="50" cy="55" r="25" strokeWidth="3" />
          <path d="M 50 35 Q 45 25, 50 20" strokeWidth="2" />
          <line x1="50" y1="45" x2="50" y2="65" strokeWidth="3" />
          <line x1="40" y1="55" x2="60" y2="55" strokeWidth="3" />
        </svg>
      ),
      style: 'text-success-600',
    },
    {
      name: 'Tallrik & Siffror',
      description: 'En tallrik med kalkylsiffror som mönster',
      svg: (
        <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" stroke="currentColor">
          <circle cx="50" cy="50" r="30" strokeWidth="2.5" />
          <text x="50" y="58" fontSize="24" fill="currentColor" textAnchor="middle">
            123
          </text>
        </svg>
      ),
      style: 'text-primary-600',
    },
    {
      name: 'Våg Balance',
      description: 'Stiliserad våg med perfekt balans - symboliserar korrekt näring',
      svg: (
        <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" stroke="currentColor">
          <line x1="30" y1="60" x2="70" y2="60" strokeWidth="3" strokeLinecap="round" />
          <line x1="50" y1="60" x2="50" y2="40" strokeWidth="2.5" />
          <circle cx="50" cy="35" r="5" fill="currentColor" />
          <path d="M 25 65 L 30 60 L 30 55" strokeWidth="2" strokeLinecap="round" />
          <path d="M 75 65 L 70 60 L 70 55" strokeWidth="2" strokeLinecap="round" />
        </svg>
      ),
      style: 'text-accent-600',
    },
    {
      name: 'Pil Uppåt i Cirkel',
      description: 'Uppåtgående pil (framsteg) i cirkel - enkel och kraftfull',
      svg: (
        <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" stroke="currentColor">
          <circle cx="50" cy="50" r="30" strokeWidth="3" />
          <path
            d="M 50 30 L 50 65 M 50 30 L 40 40 M 50 30 L 60 40"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      style: 'text-success-600',
    },
    {
      name: 'Makro Trekant',
      description: 'Tre cirklar (protein, kolhydrater, fett) i triangelformation',
      svg: (
        <svg viewBox="0 0 100 100" className="w-12 h-12" fill="currentColor">
          <circle cx="50" cy="30" r="8" />
          <circle cx="35" cy="55" r="8" />
          <circle cx="65" cy="55" r="8" />
          <path
            d="M 50 38 L 35 47 M 35 47 L 65 47 M 65 47 L 50 38"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
      ),
      style: 'text-primary-600',
    },
    {
      name: 'Leaf Analytics',
      description: 'Ett löv med data-linjer - naturlig hälsa möter teknik',
      svg: (
        <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" stroke="currentColor">
          <path
            d="M 50 20 Q 75 30, 75 55 Q 75 75, 50 80 Q 45 78, 45 70 L 45 25 Q 45 20, 50 20 Z"
            strokeWidth="2"
            fill="currentColor"
            opacity="0.2"
          />
          <path d="M 50 20 Q 75 30, 75 55 Q 75 75, 50 80" strokeWidth="2.5" />
          <path d="M 50 30 Q 65 35, 65 50" strokeWidth="1.5" opacity="0.6" />
          <path d="M 50 45 Q 62 48, 62 60" strokeWidth="1.5" opacity="0.6" />
        </svg>
      ),
      style: 'text-success-600',
    },
    {
      name: 'Target Ring',
      description: 'Koncentriska ringar med centrum-punkt - fokus på målet',
      svg: (
        <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" stroke="currentColor">
          <circle cx="50" cy="50" r="30" strokeWidth="2" />
          <circle cx="50" cy="50" r="20" strokeWidth="2" />
          <circle cx="50" cy="50" r="10" strokeWidth="2" />
          <circle cx="50" cy="50" r="3" fill="currentColor" />
        </svg>
      ),
      style: 'text-accent-600',
    },
    {
      name: 'Fork & Chart',
      description: 'Gaffel med diagram-element - mat möter data',
      svg: (
        <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" stroke="currentColor">
          <line x1="40" y1="25" x2="40" y2="50" strokeWidth="2.5" />
          <line x1="50" y1="25" x2="50" y2="50" strokeWidth="2.5" />
          <line x1="60" y1="25" x2="60" y2="50" strokeWidth="2.5" />
          <path
            d="M 35 50 L 50 50 L 65 50 L 50 75 Z"
            strokeWidth="2.5"
            fill="currentColor"
            opacity="0.2"
          />
          <rect x="68" y="55" width="4" height="10" fill="currentColor" />
          <rect x="74" y="50" width="4" height="15" fill="currentColor" />
          <rect x="80" y="45" width="4" height="20" fill="currentColor" />
        </svg>
      ),
      style: 'text-primary-600',
    },
    {
      name: 'Infinity Symbol',
      description: 'Oändlighetstecken - kontinuerlig förbättring och livsstil',
      svg: (
        <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" stroke="currentColor">
          <path
            d="M 25 50 Q 35 35, 45 50 Q 55 65, 65 50 Q 75 35, 85 50 Q 75 65, 65 50 Q 55 35, 45 50 Q 35 65, 25 50 Z"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </svg>
      ),
      style: 'text-accent-600',
    },
    {
      name: 'Spark Icon',
      description: 'En gnista/blixt - energi, vitalitet och transformation',
      svg: (
        <svg viewBox="0 0 100 100" className="w-12 h-12" fill="currentColor">
          <path d="M 55 20 L 40 55 L 50 55 L 45 80 L 70 45 L 60 45 L 65 20 Z" />
        </svg>
      ),
      style: 'text-warning-500',
    },
    {
      name: 'Pentagon Shield',
      description: 'Ett pentagram (5 sidor = makronutrienter) som sköld - skydd för hälsa',
      svg: (
        <svg viewBox="0 0 100 100" className="w-12 h-12" fill="none" stroke="currentColor">
          <path
            d="M 50 25 L 75 40 L 67 70 L 33 70 L 25 40 Z"
            strokeWidth="3"
            fill="currentColor"
            opacity="0.15"
          />
          <path
            d="M 50 25 L 75 40 L 67 70 L 33 70 L 25 40 Z"
            strokeWidth="3"
            strokeLinejoin="round"
          />
        </svg>
      ),
      style: 'text-primary-600',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-neutral-900">Välj Logotyp för CalculEat</h1>
          <p className="text-lg text-neutral-600 mb-2">
            Unika, originella logotyp-koncept som sticker ut
          </p>
          <p className="text-sm text-neutral-500 mb-6">
            Dessa är enkla symboler som kan fungera som CalculEats varumärkesikon
          </p>
          <Button asChild variant="outline">
            <Link to="/">Tillbaka till startsidan</Link>
          </Button>
        </div>

        {/* Logo Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {logoVariants.map(({ name, description, svg, style, component, isSelected }) => (
            <Card
              key={name}
              className={`hover:shadow-xl transition-all hover:scale-[1.02] ${
                isSelected ? 'ring-2 ring-primary-500 bg-primary-50' : ''
              }`}
            >
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className={`${style || ''} transition-transform hover:scale-110`}>
                    {component || svg}
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
          <h2 className="text-2xl font-bold text-center mb-8">Så här ser de ut i headern</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {logoVariants.map(({ name, svg, style, component, isSelected }) => {
                  // Extract variant from component if it exists
                  let logoComponent = component
                  if (component && component.type === LemonCalculatorLogo) {
                    const variant = component.props.variant
                    logoComponent = <LemonCalculatorLogo size={40} variant={variant} />
                  }

                  return (
                    <div
                      key={`preview-${name}`}
                      className={`flex items-center gap-3 p-4 border rounded-xl hover:shadow-md transition-all ${
                        isSelected
                          ? 'bg-primary-50 border-primary-300 ring-2 ring-primary-400'
                          : 'bg-white hover:border-primary-300'
                      }`}
                    >
                      <div className={style || ''}>{logoComponent || svg}</div>
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

        {/* Color Variations Preview */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Färgvarianter (exempel)</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Show a few favorites in different colors */}
            {[logoVariants[1], logoVariants[6], logoVariants[10]].map((logo, idx) => (
              <Card key={`color-${idx}`}>
                <CardHeader>
                  <CardTitle className="text-sm text-center mb-4">{logo.name}</CardTitle>
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-primary-600">{logo.svg}</div>
                      <div className="text-success-600">{logo.svg}</div>
                      <div className="text-accent-600">{logo.svg}</div>
                    </div>
                    <div className="text-center text-xs text-neutral-500">
                      Primary / Success / Accent
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
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
