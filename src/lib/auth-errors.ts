/**
 * Translates Supabase auth errors to Swedish user-friendly messages
 */
export function translateAuthError(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'Ett oväntat fel uppstod'
  }

  const message = error.message.toLowerCase()

  // Invalid credentials
  if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
    return 'Fel e-postadress eller lösenord'
  }

  // Email not confirmed
  if (message.includes('email not confirmed')) {
    return 'Vänligen bekräfta din e-postadress via länken i mejlet vi skickade'
  }

  // User not found
  if (message.includes('user not found')) {
    return 'Ingen användare hittades med denna e-postadress'
  }

  // Email already registered
  if (message.includes('user already registered') || message.includes('already registered')) {
    return 'En användare med denna e-postadress finns redan'
  }

  // Password too short
  if (message.includes('password is too short')) {
    return 'Lösenordet måste vara minst 6 tecken långt'
  }

  // Invalid email format
  if (message.includes('invalid email')) {
    return 'Ogiltig e-postadress'
  }

  // Network errors
  if (message.includes('fetch') || message.includes('network')) {
    return 'Anslutningsproblem. Kontrollera din internetanslutning och försök igen'
  }

  // Rate limiting
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'För många försök. Vänligen vänta en stund och försök igen'
  }

  // Default fallback - show original error in development, generic in production
  if (import.meta.env.DEV) {
    return `Fel: ${error.message}`
  }

  return 'Något gick fel. Vänligen försök igen'
}
