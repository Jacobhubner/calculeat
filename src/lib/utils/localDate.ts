/**
 * Datumsträngar (YYYY-MM-DD) i användarens lokala tidszon.
 *
 * `new Date().toISOString().split('T')[0]` ger UTC-datum, inte lokalt. I Sverige
 * (UTC+1/+2) betyder det att appen mellan midnatt och 01:00/02:00 fortfarande
 * tror att det är gårdagen: mat som loggas sent på kvällen hamnar på fel dag,
 * och dagavslutningen letar efter fel log_date.
 *
 * `sv-SE` som locale ger ISO-format (YYYY-MM-DD) direkt, till skillnad från
 * t.ex. en-US. Formatet är alltså inte språkberoende här — bara ett bekvämt
 * sätt att få rätt utdata.
 */
export function localDateString(date: Date = new Date(), timeZone?: string): string {
  if (timeZone) return dateStringInZone(date, timeZone)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Enhetens egen tidszon som IANA-identifierare, t.ex. 'Europe/Stockholm'.
 */
export function deviceTimeZone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  } catch {
    return undefined
  }
}

/**
 * Datumsträng i en angiven tidszon.
 *
 * Använder 'en-CA' som locale eftersom den ger ISO-format (YYYY-MM-DD) direkt.
 * Faller tillbaka på enhetens tid om zonen är ogiltig — en trasig eller föråldrad
 * zonsträng från databasen får inte krascha dagvyn.
 */
export function dateStringInZone(date: Date, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date)
  } catch {
    return localDateString(date)
  }
}

/**
 * Sant när två tidszoner ger olika datum eller skiljer sig i klockslag just nu.
 *
 * Jämför inte strängarna rakt av: 'Europe/Stockholm' och 'Europe/Oslo' är olika
 * namn men samma tid, och att fråga användaren om ett byte mellan dem vore bara
 * störande. Jämförelsen görs därför på faktisk lokal tid.
 */
export function zonesDiffer(a: string, b: string, at: Date = new Date()): boolean {
  if (a === b) return false
  try {
    const fmt = (tz: string) =>
      new Intl.DateTimeFormat('en-CA', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(at)
    return fmt(a) !== fmt(b)
  } catch {
    return false
  }
}

/**
 * Lokalt datum N dagar bakåt (negativt tal) eller framåt.
 *
 * Går via setDate, som hanterar månads- och årsskiften åt oss.
 */
export function localDateOffset(days: number, from: Date = new Date(), timeZone?: string): string {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return localDateString(d, timeZone)
}
