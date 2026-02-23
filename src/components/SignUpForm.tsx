import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { signUpSchema } from '@/lib/validation'
import { translateAuthError } from '@/lib/auth-errors'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Loader2, CheckCircle2, XCircle, Loader } from 'lucide-react'

type SignUpFormData = {
  email: string
  password: string
  confirmPassword: string
  profile_name: string
}

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken' | 'invalid'

export default function SignUpForm() {
  const { signUp } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [actualUsername, setActualUsername] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  })

  const usernameValue = watch('profile_name', '')

  // Real-time username availability check via RPC (bypasses RLS for unauthed users)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = usernameValue?.trim() ?? ''

    if (!trimmed || trimmed.length < 2) {
      setUsernameStatus('idle')
      return
    }
    if (!/^[a-zA-Z0-9_åäöÅÄÖ]+$/.test(trimmed) || trimmed.length > 50) {
      setUsernameStatus('invalid')
      return
    }

    setUsernameStatus('checking')

    debounceRef.current = setTimeout(async () => {
      try {
        const { data: isAvailable, error } = await supabase.rpc('check_username_available', {
          p_username: trimmed,
        })

        if (error) {
          setUsernameStatus('idle')
          return
        }

        setUsernameStatus(isAvailable ? 'available' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 500)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [usernameValue])

  const onSubmit = async (data: SignUpFormData) => {
    if (usernameStatus === 'taken') {
      setError('Användarnamnet är redan taget')
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      await signUp(data.email, data.password, data.profile_name)
      setSuccess(true)
      toast.success('Registrering lyckades! Kontrollera din e-post för att verifiera ditt konto.')

      // Hämta faktiskt username (kan skilja sig om race condition inträffade)
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('username')
            .eq('id', user.id)
            .single()
          setActualUsername(profile?.username ?? null)
        }
      } catch {
        // Icke-kritiskt — success-vyn fungerar utan @username
      }
    } catch (err: unknown) {
      const msg = (err as Error).message ?? ''
      // Hantera race condition: username togs av någon annan precis innan registrering
      if (msg.includes('username_taken') || msg.includes('P0001')) {
        setError('Användarnamnet togs precis av någon annan. Välj ett nytt namn.')
        setUsernameStatus('taken')
      } else {
        const errorMessage = translateAuthError(err)
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg space-y-1">
        <p className="font-semibold">Registrering lyckades!</p>
        {actualUsername && (
          <p className="text-sm">
            Ditt konto skapades som <strong>@{actualUsername}</strong>.
          </p>
        )}
        <p className="text-sm">Kontrollera din e-post för att verifiera ditt konto.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
      )}

      {/* Användarnamn */}
      <div>
        <Label htmlFor="profile_name">Användarnamn</Label>
        <div className="relative mt-2">
          <Input
            id="profile_name"
            {...register('profile_name')}
            className="pr-8"
            autoComplete="username"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            {usernameStatus === 'checking' && (
              <Loader className="h-4 w-4 text-neutral-400 animate-spin" />
            )}
            {usernameStatus === 'available' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {usernameStatus === 'taken' && <XCircle className="h-4 w-4 text-red-500" />}
          </div>
        </div>
        {errors.profile_name ? (
          <p className="text-red-500 text-sm mt-1">{errors.profile_name.message}</p>
        ) : usernameStatus === 'taken' ? (
          <p className="text-red-500 text-sm mt-1">Användarnamnet är redan taget</p>
        ) : usernameStatus === 'available' ? (
          <p className="text-green-600 text-sm mt-1">Användarnamnet är ledigt</p>
        ) : (
          <p className="text-neutral-500 text-xs mt-1">
            Välj ett unikt namn som dina vänner kan hitta dig på.
          </p>
        )}
      </div>

      {/* E-postadress */}
      <div>
        <Label htmlFor="email">E-postadress</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          className="mt-2"
          autoComplete="email"
        />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      {/* Lösenord */}
      <div>
        <Label htmlFor="password">Lösenord</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          className="mt-2"
          autoComplete="new-password"
        />
        {errors.password ? (
          <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
        ) : (
          <p className="text-neutral-500 text-xs mt-1">Lösenordet måste vara minst 6 tecken</p>
        )}
      </div>

      {/* Bekräfta lösenord */}
      <div>
        <Label htmlFor="confirmPassword">Bekräfta lösenord</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          className="mt-2"
          autoComplete="new-password"
        />
        {errors.confirmPassword && (
          <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || usernameStatus === 'taken' || usernameStatus === 'checking'}
        className="w-full"
      >
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
