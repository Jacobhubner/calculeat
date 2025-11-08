import { Link } from 'react-router-dom'
import {
  Calculator,
  Scale,
  Apple,
  ChefHat,
  Sparkles,
  Target,
  TrendingUp,
  PieChart,
  Activity,
  Heart,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function IconDemo() {
  const icons = [
    {
      Icon: Calculator,
      name: 'Calculator',
      description: 'Kalkylator - symboliserar beräkning och är kärnan i "CalculEat"',
      pros: 'Tydlig, professionell, matchar namnet perfekt',
    },
    {
      Icon: Scale,
      name: 'Scale',
      description: 'Våg - balans, mätning, både mat och vikt',
      pros: 'Unik, representerar både viktmätning och balans i kosten',
    },
    {
      Icon: Apple,
      name: 'Apple',
      description: 'Äpple - hälsa och nyttig mat',
      pros: 'Universell symbol för hälsa och näring',
    },
    {
      Icon: ChefHat,
      name: 'ChefHat',
      description: 'Kockmössa - mat och matlagning',
      pros: 'Kreativ, matrelaterad, lite annorlunda',
    },
    {
      Icon: Sparkles,
      name: 'Sparkles',
      description: 'Gnistrar - transformation och förbättring',
      pros: 'Energi, transformation, positiv känsla',
    },
    {
      Icon: Target,
      name: 'Target',
      description: 'Målskytt - att nå sina mål',
      pros: 'Fokus på målsättning och precision',
    },
    {
      Icon: TrendingUp,
      name: 'TrendingUp',
      description: 'Uppåtgående trend - framsteg och utveckling',
      pros: 'Visar progression och framgång',
    },
    {
      Icon: PieChart,
      name: 'PieChart',
      description: 'Pajdiagram - makrofördelning och statistik',
      pros: 'Data-driven, visar fördelning av makron',
    },
    {
      Icon: Activity,
      name: 'Activity',
      description: 'Aktivitet - data, mätning och statistik',
      pros: 'Modern, tech-känsla, datainriktad',
    },
    {
      Icon: Heart,
      name: 'Heart',
      description: 'Hjärta - hälsa och välmående',
      pros: 'Varm, positiv, hälsorelaterad',
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 py-12">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-neutral-900">Välj ikon för CalculEat</h1>
          <p className="text-lg text-neutral-600 mb-6">
            Här kan du se alla ikonalternativ med samma stil. Välj den du tycker passar bäst!
          </p>
          <Button asChild variant="outline">
            <Link to="/">Tillbaka till startsidan</Link>
          </Button>
        </div>

        {/* Icon Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {icons.map(({ Icon, name, description, pros }) => (
            <Card key={name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-center mb-4">
                  <div className="rounded-xl bg-gradient-primary p-4 hover:scale-105 transition-transform">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>
                <CardTitle className="text-center text-lg">{name}</CardTitle>
                <CardDescription className="text-center">{description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-primary-50 rounded-lg p-3">
                  <p className="text-sm text-neutral-700">
                    <span className="font-semibold text-primary-700">Fördelar:</span> {pros}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Preview Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Så här ser ikonen ut i headern</CardTitle>
              <CardDescription>
                Testa hur varje ikon skulle se ut i den faktiska headern med logotypen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {icons.map(({ Icon, name }) => (
                  <div
                    key={`preview-${name}`}
                    className="flex items-center gap-2 p-4 bg-white border rounded-xl hover:shadow-md transition-shadow"
                  >
                    <div className="rounded-xl bg-gradient-primary p-2">
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                      CalculEat
                    </span>
                    <span className="ml-auto text-sm text-neutral-500">{name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-neutral-600 mb-4">
            När du har valt din favorit, säg till så uppdaterar jag headern!
          </p>
          <Button asChild>
            <Link to="/">Tillbaka till startsidan</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
