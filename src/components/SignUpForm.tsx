import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { signUpSchema } from '@/lib/validation'
import { translateAuthError } from '@/lib/auth-errors'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Loader2 } from 'lucide-react'

export default function SignUpForm() {
  const { signUp } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signUpSchema),
  })

  const onSubmit = async (data: { email: string; password: string; profile_name: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      await signUp(data.email, data.password, data.profile_name)
      setSuccess(true)
      toast.success('Registrering lyckades! Kontrollera din e-post för att verifiera ditt konto.')
    } catch (err: unknown) {
      const errorMessage = translateAuthError(err)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
        <p className="font-semibold">Registrering lyckades!</p>
        <p className="text-sm mt-1">
          Vänligen kontrollera din e-post för att verifiera ditt konto.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
      )}

      <div>
        <Label htmlFor="profile_name">Användarnamn</Label>
        <Input id="profile_name" {...register('profile_name')} className="mt-2" />
        {errors.profile_name ? (
          <p className="text-red-500 text-sm mt-1">{errors.profile_name.message}</p>
        ) : (
          <p className="text-neutral-500 text-xs mt-1">
            Välj ett unikt namn som dina vänner kan hitta dig på.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="email">E-postadress</Label>
        <Input id="email" type="email" {...register('email')} className="mt-2" />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Lösenord</Label>
        <Input id="password" type="password" {...register('password')} className="mt-2" />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
        <p className="text-neutral-500 text-xs mt-1">Lösenordet måste vara minst 6 tecken</p>
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registrerar...
          </>
        ) : (
          'Skapa konto'
        )}
      </Button>
    </form>
  )
}
