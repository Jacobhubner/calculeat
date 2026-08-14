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
export function localDateString(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * Lokalt datum N dagar bakåt (negativt tal) eller framåt.
 *
 * Går via setDate, som hanterar månads- och årsskiften åt oss.
 */
export function localDateOffset(days: number, from: Date = new Date()): string {
  const d = new Date(from)
  d.setDate(d.getDate() + days)
  return localDateString(d)
}
