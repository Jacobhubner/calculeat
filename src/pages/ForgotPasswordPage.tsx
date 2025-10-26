import { useState } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage(null)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) throw error

      setIsSuccess(true)
      setMessage('Kontrollera din e-post för instruktioner om att återställa lösenordet.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Något gick fel')
      setIsSuccess(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Dumbbell className="h-8 w-8 text-primary-600" />
              <h1 className="text-3xl font-bold text-neutral-900">CalculEat</h1>
            </div>
            <p className="text-neutral-600">Återställ ditt lösenord</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Glömt lösenord?</CardTitle>
              <CardDescription>
                Ange din e-postadress så skickar vi dig en länk för att återställa lösenordet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {message && (
                  <div
                    className={`p-3 rounded-lg ${
                      isSuccess
                        ? 'bg-green-50 border border-green-200 text-green-700'
                        : 'bg-red-50 border border-red-200 text-red-700'
                    }`}
                  >
                    {message}
                  </div>
                )}

                <div>
                  <Label htmlFor="email">E-postadress</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="mt-2"
                  />
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Skickar...
                    </>
                  ) : (
                    'Skicka återställningslänk'
                  )}
                </Button>

                <div className="text-center text-sm">
                  <Link to="/login" className="text-primary-600 hover:underline">
                    ← Tillbaka till inloggning
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
