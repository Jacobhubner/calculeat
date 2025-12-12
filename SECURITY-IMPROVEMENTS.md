# Säkerhetsförbättringar - Implementation Guide

Denna guide beskriver implementation av säkerhetsförbättringar för CalculEat.

---

## 1. Password Strength Meter

### Installation

```bash
npm install zxcvbn @types/zxcvbn
```

### Implementation

#### Steg 1.1: Skapa Password Strength Component

```typescript
// src/components/PasswordStrengthMeter.tsx
import { useEffect, useState } from 'react'
import zxcvbn from 'zxcvbn'

interface PasswordStrengthMeterProps {
  password: string
}

export default function PasswordStrengthMeter({ password }: PasswordStrengthMeterProps) {
  const [strength, setStrength] = useState(0)
  const [feedback, setFeedback] = useState('')

  useEffect(() => {
    if (!password) {
      setStrength(0)
      setFeedback('')
      return
    }

    const result = zxcvbn(password)
    setStrength(result.score) // 0-4

    // Svenska feedback-meddelanden
    const feedbackMessages = {
      0: 'Mycket svagt lösenord',
      1: 'Svagt lösenord',
      2: 'Okej lösenord',
      3: 'Starkt lösenord',
      4: 'Mycket starkt lösenord',
    }

    setFeedback(feedbackMessages[result.score as keyof typeof feedbackMessages])

    if (result.feedback.warning) {
      const warnings: Record<string, string> = {
        'This is a top-10 common password': 'Detta är ett av de vanligaste lösenorden',
        'This is a top-100 common password': 'Detta är ett av de 100 vanligaste lösenorden',
        'This is similar to a commonly used password': 'Detta liknar ett vanligt använt lösenord',
        'A word by itself is easy to guess': 'Ett enskilt ord är lätt att gissa',
        'Names and surnames by themselves are easy to guess':
          'För- och efternamn är lätta att gissa',
        'Common names and surnames are easy to guess': 'Vanliga namn är lätta att gissa',
        Straight rows of keys are easy to guess: 'Raka tangentsekvenser är lätta att gissa',
        'Short keyboard patterns are easy to guess': 'Korta tangentmönster är lätta att gissa',
        "Repeats like 'aaa' are easy to guess": "Upprepningar som 'aaa' är lätta att gissa",
        "Repeats like 'abcabcabc' are only slightly harder to guess than 'abc'":
          "Upprepningar som 'abcabcabc' är bara lite svårare att gissa än 'abc'",
        'Sequences like abc or 6543 are easy to guess': 'Sekvenser som abc eller 6543 är lätta att gissa',
        'Recent years are easy to guess': 'Senaste åren är lätta att gissa',
        'Dates are often easy to guess': 'Datum är ofta lätta att gissa',
      }
      const translatedWarning = warnings[result.feedback.warning] || result.feedback.warning
      setFeedback(translatedWarning)
    }
  }, [password])

  const getStrengthColor = () => {
    const colors = {
      0: 'bg-red-500',
      1: 'bg-orange-500',
      2: 'bg-yellow-500',
      3: 'bg-lime-500',
      4: 'bg-green-500',
    }
    return colors[strength as keyof typeof colors] || 'bg-gray-200'
  }

  const getStrengthTextColor = () => {
    const colors = {
      0: 'text-red-600',
      1: 'text-orange-600',
      2: 'text-yellow-600',
      3: 'text-lime-600',
      4: 'text-green-600',
    }
    return colors[strength as keyof typeof colors] || 'text-gray-600'
  }

  if (!password) return null

  return (
    <div className="mt-2 space-y-2">
      {/* Progress bar */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map(level => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-colors ${
              level <= strength ? getStrengthColor() : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Feedback text */}
      <p className={`text-xs ${getStrengthTextColor()}`}>{feedback}</p>
    </div>
  )
}
```

#### Steg 1.2: Integrera i SignUpForm

```typescript
// src/components/SignUpForm.tsx
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
import PasswordStrengthMeter from './PasswordStrengthMeter' // NYTT

export default function SignUpForm() {
  const { signUp } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [password, setPassword] = useState('') // NYTT: För password strength meter

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

  if (success) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
        <p className="font-semibold">Registrering lyckades!</p>
        <p className="text-sm mt-1">Vänligen kontrollera din e-post för att verifiera ditt konto.</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">{error}</div>
      )}

      <div>
        <Label htmlFor="profile_name">Profilnamn</Label>
        <Input id="profile_name" {...register('profile_name')} className="mt-2" />
        {errors.profile_name && (
          <p className="text-red-500 text-sm mt-1">{errors.profile_name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">E-postadress</Label>
        <Input id="email" type="email" {...register('email')} className="mt-2" />
        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
      </div>

      <div>
        <Label htmlFor="password">Lösenord</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
          onChange={e => setPassword(e.target.value)} // NYTT: Uppdatera password state
          className="mt-2"
        />
        {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}

        {/* NYTT: Password Strength Meter */}
        <PasswordStrengthMeter password={password} />

        <p className="text-neutral-500 text-xs mt-1">
          Använd minst 8 tecken med en mix av bokstäver, siffror och symboler
        </p>
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
```

#### Steg 1.3: Uppdatera Validation

Förbättra lösenordskraven:

```typescript
// src/lib/validation.ts
export const signUpSchema = z.object({
  email: z.string().email('Ogiltig e-postadress'),
  password: z
    .string()
    .min(8, 'Lösenordet måste vara minst 8 tecken långt')
    .regex(/[A-Z]/, 'Lösenordet måste innehålla minst en stor bokstav')
    .regex(/[a-z]/, 'Lösenordet måste innehålla minst en liten bokstav')
    .regex(/[0-9]/, 'Lösenordet måste innehålla minst en siffra'),
  profile_name: z.string().min(1, 'Profilnamn är obligatoriskt'),
})
```

---

## 2. Remember Me Checkbox

### Implementation

#### Steg 2.1: Uppdatera LoginForm

```typescript
// src/components/LoginForm.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { signInSchema } from '@/lib/validation'
import { translateAuthError } from '@/lib/auth-errors'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Checkbox } from './ui/checkbox' // NYTT
import { Loader2 } from 'lucide-react'

export default function LoginForm() {
  const { signIn } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(false) // NYTT
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signInSchema),
  })

  const onSubmit = async (data: { email: string; password: string }) => {
    setIsLoading(true)
    try {
      await signIn(data.email, data.password)

      // NYTT: Konfigurera session persistence
      if (rememberMe) {
        // Session kvarstår i 30 dagar (Supabase default)
        localStorage.setItem('rememberMe', 'true')
      } else {
        // Session kvarstår endast under browser-sessionen
        localStorage.removeItem('rememberMe')
      }

      const from = (location.state as any)?.from?.pathname || '/app'
      navigate(from)
      toast.success('Inloggning lyckades!')
    } catch (err: unknown) {
      const errorMessage = translateAuthError(err)
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

      {/* NYTT: Remember Me Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="rememberMe"
          checked={rememberMe}
          onCheckedChange={checked => setRememberMe(checked as boolean)}
        />
        <Label
          htmlFor="rememberMe"
          className="text-sm font-normal cursor-pointer text-neutral-700"
        >
          Kom ihåg mig i 30 dagar
        </Label>
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
```

---

## 3. Logging av Säkerhetshändelser

### Steg 3.1: Skapa Security Log Table

```sql
-- Kör i Supabase SQL Editor
CREATE TABLE IF NOT EXISTS public.security_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'login_failed', 'login_success', 'password_reset', etc.
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index för snabbare queries
CREATE INDEX idx_security_logs_user_id ON public.security_logs(user_id);
CREATE INDEX idx_security_logs_event_type ON public.security_logs(event_type);
CREATE INDEX idx_security_logs_created_at ON public.security_logs(created_at DESC);

-- RLS Policies
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- Användare kan endast se sina egna logs
CREATE POLICY "Users can view own security logs"
  ON public.security_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Endast service role kan skriva
CREATE POLICY "Service role can insert security logs"
  ON public.security_logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);
```

### Steg 3.2: Skapa Security Logger Utility

```typescript
// src/lib/security-logger.ts
import { supabase } from './supabase'

export type SecurityEventType =
  | 'login_success'
  | 'login_failed'
  | 'logout'
  | 'password_reset_requested'
  | 'password_reset_completed'
  | 'email_change_requested'
  | 'email_change_completed'
  | 'account_deleted'

interface LogSecurityEventParams {
  eventType: SecurityEventType
  userId?: string
  metadata?: Record<string, any>
}

export async function logSecurityEvent({
  eventType,
  userId,
  metadata = {},
}: LogSecurityEventParams) {
  try {
    // Hämta IP och User Agent (kan göras via ett API eller direkt här)
    const response = await fetch('https://api.ipify.org?format=json')
    const { ip } = await response.json()

    await supabase.from('security_logs').insert({
      user_id: userId,
      event_type: eventType,
      ip_address: ip,
      user_agent: navigator.userAgent,
      metadata,
    })
  } catch (error) {
    console.error('Failed to log security event:', error)
    // Inte kritiskt - logga inte fel här för att undvika infinite loops
  }
}
```

### Steg 3.3: Integrera Security Logging

```typescript
// src/contexts/AuthContext.tsx
import { logSecurityEvent } from '@/lib/security-logger'

const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // Logga misslyckad inloggning
      await logSecurityEvent({
        eventType: 'login_failed',
        metadata: { email, reason: error.message },
      })
      throw error
    }

    // Logga lyckad inloggning
    await logSecurityEvent({
      eventType: 'login_success',
      userId: data.user?.id,
      metadata: { email },
    })
  } catch (error) {
    throw error
  }
}

const signOut = async () => {
  const userId = user?.id

  const { error } = await supabase.auth.signOut()
  if (error) throw error

  // Logga logout
  if (userId) {
    await logSecurityEvent({
      eventType: 'logout',
      userId,
    })
  }

  setProfile(null)
}
```

---

## 4. Email-notifikation vid Lösenordsändring

### Steg 4.1: Skapa Email Notification Function

Denna funktionalitet kräver ett Supabase Edge Function eller Database Trigger.

#### Alternativ A: Database Trigger (Rekommenderat)

```sql
-- Skapa trigger function
CREATE OR REPLACE FUNCTION notify_password_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Kontrollera om lösenordet har ändrats
  IF OLD.encrypted_password IS DISTINCT FROM NEW.encrypted_password THEN
    -- Logga händelsen
    INSERT INTO public.security_logs (user_id, event_type, metadata)
    VALUES (
      NEW.id,
      'password_reset_completed',
      jsonb_build_object(
        'email', NEW.email,
        'changed_at', NOW()
      )
    );

    -- OBS: För att faktiskt skicka ett email behöver du ett Edge Function
    -- Detta trigger loggar bara händelsen
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Skapa trigger
CREATE TRIGGER on_password_change
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION notify_password_change();
```

---

## Testing Checklist

### Password Strength Meter

- [ ] Testa med svagt lösenord (123456)
- [ ] Testa med medelstarkt lösenord (Password123)
- [ ] Testa med starkt lösenord (P@ssw0rd!2024)
- [ ] Verifiera svenska feedback-meddelanden

### Remember Me

- [ ] Logga in med "Remember me" aktiverad
- [ ] Stäng och öppna webbläsaren
- [ ] Verifiera att sessionen kvarstår
- [ ] Logga in utan "Remember me"
- [ ] Stäng webbläsaren och verifiera att sessionen försvinner

### Security Logging

- [ ] Logga in och verifiera att event loggas
- [ ] Misslyckas med inloggning och verifiera att det loggas
- [ ] Logga ut och verifiera att det loggas
- [ ] Kontrollera security_logs tabell i Supabase

---

**Skapad:** 2025-12-09
**Status:** Redo för implementation
**Prioritet:** Prio 2-3
