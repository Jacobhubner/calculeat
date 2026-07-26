/**
 * Supportchatt för publika sidor.
 *
 * - Inloggad användare (eller gäst med pågående anonym session): ordinarie
 *   SupportChatButton/panel.
 * - Besökare utan session: ingen chatt. De hänvisas till support via mejl
 *   (info.calculeat@gmail.com) i kontakt-/villkors-/integritetstexterna.
 *
 * Gästchatten (anonymt startformulär) togs bort 2026-07-26. DB-tabeller,
 * RLS och functions för gästsessioner lämnades orörda; endast frontend-
 * ingången är borttagen.
 */

import { useAuth } from '@/contexts/AuthContext'
import { SupportChatButton } from './SupportChatButton'

export function PublicSupportChat() {
  const { user, loading } = useAuth()

  if (loading) return null

  // Session finns (riktig användare eller pågående gästsession) → ordinarie chatt.
  // Icke-inloggade besökare får ingen chatt — de hänvisas till support via mejl.
  if (user) return <SupportChatButton />

  return null
}
