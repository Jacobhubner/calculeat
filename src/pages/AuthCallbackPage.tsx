/**
 * AuthCallbackPage - Hanterar email-bekräftelse efter signup
 * Denna sida tar emot användare som klickar på bekräftelselänken i sitt email
 */

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

type CallbackState = 'loading' | 'success' | 'error'

export default function AuthCallbackPage() {
  const { t, ready } = useTranslation('auth')
  const [state, setState] = useState<CallbackState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const navigate = useNavigate()

  useEffect(() => {
    let handled = false

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (handled) return
      // SIGNED_IN = email-bekräftelse; INITIAL_SESSION = befintlig session (t.ex. sidarefresh)
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        handled = true
        setState('success')
        setTimeout(() => navigate('/app'), 2000)
      } else if (event === 'INITIAL_SESSION' && !session) {
        handled = true
        setState('error')
        setErrorMessage(t('authCallback.errorFallback'))
      }
    })

    // Fallback om INITIAL_SESSION inte triggar inom 5s (t.ex. nätverksfel)
    const timeout = setTimeout(() => {
      if (!handled) {
        handled = true
        setState('error')
        setErrorMessage(t('authCallback.errorFallback'))
      }
    }, 5000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [navigate, t])

  if (!ready) return null

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
              {t('authCallback.loading')}
            </h2>
            <p className="text-neutral-600">{t('authCallback.pleaseWait')}</p>
          </div>
        )}

        {/* Success State */}
        {state === 'success' && (
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              {t('authCallback.successTitle')}
            </h2>
            <p className="text-neutral-600 mb-6">{t('authCallback.successDescription')}</p>
            <div className="flex items-center justify-center gap-2 text-sm text-neutral-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t('authCallback.redirecting')}</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              {t('authCallback.errorTitle')}
            </h2>
            <p className="text-neutral-600 mb-6">
              {errorMessage || t('authCallback.errorFallback')}
            </p>
            <div className="space-y-3">
              <Button onClick={() => navigate('/login')} className="w-full">
                {t('authCallback.goToLogin')}
              </Button>
              <Button onClick={() => navigate('/register')} variant="outline" className="w-full">
                {t('authCallback.createAccount')}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
