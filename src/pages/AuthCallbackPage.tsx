/**
 * AuthCallbackPage - Hanterar email-bekräftelse efter signup
 * Denna sida tar emot användare som klickar på bekräftelselänken i sitt email
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CallbackState = 'loading' | 'success' | 'error'

export default function AuthCallbackPage() {
  const [state, setState] = useState<CallbackState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const navigate = useNavigate()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Supabase automatically handles the token from URL hash
        // Check if user is now authenticated
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error('Session error:', error)
          setState('error')
          setErrorMessage(error.message)
          return
        }

        if (session) {
          // User is authenticated, email confirmed successfully
          setState('success')

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            navigate('/app')
          }, 2000)
        } else {
          // No session found, might be an expired or invalid link
          setState('error')
          setErrorMessage('Bekräftelselänken är ogiltig eller har gått ut.')
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setState('error')
        setErrorMessage('Ett oväntat fel uppstod.')
      }
    }

    handleEmailConfirmation()
  }, [navigate])

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
            CalculEat
          </h1>
        </div>

        {/* Loading State */}
        {state === 'loading' && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Bekräftar din e-postadress...
            </h2>
            <p className="text-neutral-600">Vänligen vänta ett ögonblick</p>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              E-postadressen bekräftad!
            </h2>
            <p className="text-neutral-600 mb-6">
              Ditt konto är nu aktiverat. Du kommer snart omdirigeras till din dashboard.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Omdirigerar...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Något gick fel</h2>
            <p className="text-neutral-600 mb-6">
              {errorMessage || 'Kunde inte bekräfta din e-postadress.'}
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')} className="w-full">
                Gå till inloggning
              </Button>
              <Button onClick={() => navigate('/register')} variant="outline" className="w-full">
                Skapa nytt konto
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
