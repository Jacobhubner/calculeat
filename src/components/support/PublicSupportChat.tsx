/**
 * Supportchatt för publika sidor.
 *
 * - Inloggad användare (eller gäst med pågående anonym session): ordinarie
 *   SupportChatButton/panel, oförändrat beteende.
 * - Besökare utan session: FAB + gästformulär (namn + e-post). Vid start
 *   skapas en anonym Supabase-session (signInAnonymously) med uppgifterna i
 *   user_metadata; create_support_thread kopierar dem till tråden. Därefter
 *   återanvänds hela den ordinarie chattstacken.
 *
 * Gäster är RLS-spärrade från allt utom supporttabellerna (migration
 * 20260716140000) och blockeras från /app av ProtectedRoute.
 */

import { useState } from 'react'
import { MessageCircle, X, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { SupportChatButton } from './SupportChatButton'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function GuestStartGate() {
  const { t } = useTranslation('support')
  const [isOpen, setIsOpen] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [, setSearchParams] = useSearchParams()

  const handleStart = async () => {
    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    if (!trimmedName) {
      setError(t('guestNameRequired'))
      return
    }
    if (!EMAIL_RE.test(trimmedEmail)) {
      setError(t('guestEmailInvalid'))
      return
    }

    setError(null)
    setIsStarting(true)
    const { error: authError } = await supabase.auth.signInAnonymously({
      options: {
        data: { guest_name: trimmedName, guest_email: trimmedEmail },
      },
    })
    setIsStarting(false)

    if (authError) {
      console.error('Guest sign-in failed:', authError)
      setError(t('guestStartError'))
      return
    }

    // Sessionen är skapad — AuthContext uppdateras och PublicSupportChat
    // byter till den ordinarie chatten. ?support=open får SupportChatButton
    // att öppna panelen direkt (befintlig mekanism).
    setSearchParams(
      prev => {
        prev.set('support', 'open')
        return prev
      },
      { replace: true }
    )
  }

  return (
    <>
      <div className="fixed bottom-6 right-4 md:right-6 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(prev => !prev)}
          aria-label={t('openChat')}
          className="h-12 w-12 rounded-full bg-primary-600 text-white shadow-lg hover:bg-primary-700 hover:shadow-xl transition-all flex items-center justify-center"
        >
          <MessageCircle className="h-5 w-5" strokeWidth={2} />
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-20 right-4 md:right-6 z-40 w-[340px] max-w-[calc(100vw-2rem)] flex flex-col rounded-2xl border border-neutral-200 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-neutral-100 bg-white">
            <div className="flex-1">
              <p className="text-sm font-semibold text-neutral-900">{t('panelTitle')}</p>
              <p className="text-xs text-neutral-500">{t('guestFormSubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
              aria-label={t('close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Gästformulär */}
          <div className="px-4 py-4 space-y-3">
            <p className="text-xs text-neutral-500">{t('guestFormIntro')}</p>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <div>
              <label
                htmlFor="guest-name"
                className="block text-xs font-medium text-neutral-700 mb-1"
              >
                {t('guestName')}
              </label>
              <input
                id="guest-name"
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value)
                  setError(null)
                }}
                maxLength={60}
                autoComplete="name"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-base md:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label
                htmlFor="guest-email"
                className="block text-xs font-medium text-neutral-700 mb-1"
              >
                {t('guestEmail')}
              </label>
              <input
                id="guest-email"
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value)
                  setError(null)
                }}
                maxLength={120}
                autoComplete="email"
                className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-base md:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <button
              type="button"
              onClick={handleStart}
              disabled={isStarting}
              className="w-full h-10 rounded-xl bg-primary-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-primary-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isStarting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('guestStart')}
            </button>
            <p className="text-[11px] text-neutral-400">{t('guestFormDisclaimer')}</p>
          </div>
        </div>
      )}
    </>
  )
}

export function PublicSupportChat() {
  const { user, loading } = useAuth()

  if (loading) return null

  // Session finns (riktig användare eller pågående gästsession) → ordinarie chatt
  if (user) return <SupportChatButton />

  return <GuestStartGate />
}
