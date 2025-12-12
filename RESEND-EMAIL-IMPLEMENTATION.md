# Implementera "Resend Email" Funktionalitet

Denna guide beskriver hur du lägger till en "Skicka email igen" knapp för användare som inte fått sitt bekräftelse-email.

---

## Implementation

### Steg 1: Uppdatera AuthCallbackPage.tsx

Lägg till resend-funktionalitet på error state:

```typescript
// src/pages/AuthCallbackPage.tsx
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

type CallbackState = 'loading' | 'success' | 'error'

export default function AuthCallbackPage() {
  const [state, setState] = useState<CallbackState>('loading')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const [isResending, setIsResending] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
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
          setState('success')
          setTimeout(() => {
            navigate('/app')
          }, 2000)
        } else {
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

  // NY FUNKTION: Resend confirmation email
  const handleResendEmail = async () => {
    setIsResending(true)
    try {
      // Hämta email från URL eller localStorage om tillgängligt
      const params = new URLSearchParams(window.location.search)
      const email = params.get('email') || localStorage.getItem('signup_email')

      if (!email) {
        toast.error('Kunde inte hitta din e-postadress. Vänligen försök registrera igen.')
        setIsResending(false)
        return
      }

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
      })

      if (error) throw error

      toast.success('Bekräftelse-email skickat! Kontrollera din inbox.')
    } catch (error) {
      console.error('Resend error:', error)
      toast.error('Kunde inte skicka email igen. Vänligen försök senare.')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">
            CalculEat
          </h1>
        </div>

        {state === 'loading' && (
          <div className="text-center py-8">
            <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">
              Bekräftar din e-postadress...
            </h2>
            <p className="text-neutral-600">Vänligen vänta ett ögonblick</p>
          </div>
        )}

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

        {state === 'error' && (
          <div className="text-center py-8">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Något gick fel</h2>
            <p className="text-neutral-600 mb-6">
              {errorMessage || 'Kunde inte bekräfta din e-postadress.'}
            </p>
            <div className="space-y-3">
              <Button
                onClick={handleResendEmail}
                disabled={isResending}
                className="w-full"
                variant="default"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Skickar...
                  </>
                ) : (
                  'Skicka bekräftelse-email igen'
                )}
              </Button>
              <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
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
```

### Steg 2: Spara Email vid Registrering

Uppdatera SignUpForm.tsx för att spara email i localStorage:

```typescript
// src/components/SignUpForm.tsx
const onSubmit = async (data: { email: string; password: string; profile_name: string }) => {
  setIsLoading(true)
  setError(null)
  try {
    await signUp(data.email, data.password, data.profile_name)

    // NYTT: Spara email för resend-funktionalitet
    localStorage.setItem('signup_email', data.email)

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
```

### Steg 3: Rensa Email efter Bekräftelse

```typescript
// I AuthCallbackPage.tsx success state:
if (session) {
  setState('success')

  // NYTT: Rensa saved email efter lyckad bekräftelse
  localStorage.removeItem('signup_email')

  setTimeout(() => {
    navigate('/app')
  }, 2000)
}
```

---

## Testing

1. Registrera en ny användare
2. Vänta tills länken går ut (eller använd en ogiltig länk)
3. Besök `/auth/callback` med ogiltig token
4. Klicka på "Skicka bekräftelse-email igen"
5. Verifiera att ett nytt email skickas
6. Klicka på den nya länken och verifiera att bekräftelsen fungerar

---

## Säkerhetsöverväganden

- ✅ Rate limiting: Supabase begränsar resend till max 1 email per 60 sekunder
- ✅ Email sparas endast i localStorage på klienten
- ✅ Email raderas efter lyckad bekräftelse

---

**Implementerad:** Redo att implementera
**Prioritet:** Prio 2 (Viktigt)
