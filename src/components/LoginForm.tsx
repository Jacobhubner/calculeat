import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInSchema } from '@/lib/validation'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Loader2 } from 'lucide-react'

export default function LoginForm() {
  const { signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true)
    setError(null)
    try {
      await signIn(data.email, data.password)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Inloggning misslyckades')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
      )}

      <div>
        <Label htmlFor="email">E-postadress</Label>
        <Input id="email" type="email" {...register('email')} className="mt-2" />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Lösenord</Label>
        <Input id="password" type="password" {...register('password')} className="mt-2" />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
      </div>

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loggar in...
          </>
        ) : (
          'Logga in'
        )}
      </Button>
    </form>
  )
}
