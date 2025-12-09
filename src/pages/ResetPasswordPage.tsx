import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, 'Lösenordet måste vara minst 6 tecken långt'),
    confirmPassword: z.string().min(6, 'Lösenordet måste vara minst 6 tecken långt'),
  })
  .refine(data => data.password === data.confirmPassword, {
    message: 'Lösenorden matchar inte',
    path: ['confirmPassword'],
  })

type ResetPasswordForm = z.infer<typeof resetPasswordSchema>

export default function ResetPasswordPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null)
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
  })

  // Check if we have a valid recovery token
  useEffect(() => {
    const checkToken = async () => {
      const { data, error } = await supabase.auth.getSession()

      if (error || !data.session) {
        setIsValidToken(false)
        toast.error('Återställningslänken är ogiltig eller har gått ut')
        return
      }

      setIsValidToken(true)
    }

    checkToken()
  }, [])

  const onSubmit = async (data: ResetPasswordForm) => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) throw error

      setIsSuccess(true)
      toast.success('Lösenordet har återställts!')

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Något gick fel'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state while checking token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-md p-8">
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Verifierar återställningslänk...
              </h2>
              <p className="text-neutral-600">Vänligen vänta ett ögonblick</p>
            </div>
          </Card>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // Show error if token is invalid
  if (isValidToken === false) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-md p-8">
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Återställningslänken är ogiltig
              </h2>
              <p className="text-neutral-600 mb-6">
                Länken kan ha gått ut eller redan använts. Vänligen begär en ny återställningslänk.
              </p>
              <Button onClick={() => navigate('/forgot-password')} className="w-full">
                Begär ny återställningslänk
              </Button>
            </div>
          </Card>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // Show success state
  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 flex items-center justify-center py-12">
          <Card className="w-full max-w-md p-8">
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-neutral-900 mb-2">
                Lösenordet har återställts!
              </h2>
              <p className="text-neutral-600 mb-6">
                Du kan nu logga in med ditt nya lösenord. Du kommer snart omdirigeras till
                inloggningssidan.
              </p>
              <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Omdirigerar...</span>
              </div>
            </div>
          </Card>
        </main>
        <SiteFooter />
      </div>
    )
  }

  // Show reset password form
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <img src="/CalculEat-logo.svg" alt="CalculEat Logo" className="h-16 object-contain" />
            </div>
            <p className="text-neutral-600">Återställ ditt lösenord</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Ange nytt lösenord</CardTitle>
              <CardDescription>
                Välj ett starkt lösenord som är minst 6 tecken långt
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <Label htmlFor="password">Nytt lösenord</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    className="mt-2"
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-600 mt-1">{errors.password.message}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="confirmPassword">Bekräfta nytt lösenord</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword')}
                    className="mt-2"
                    disabled={isLoading}
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-600 mt-1">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Återställer...
                    </>
                  ) : (
                    'Återställ lösenord'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  )
}
