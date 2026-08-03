/**
 * Avatarcirklar med initialer.
 *
 * Delas av `AvatarFallback` (Radix, används i header och sidonavigering) och
 * de handbyggda cirklarna i Social och Delning, som har egna storlekar och
 * online-indikatorer och därför inte kan bytas mot Radix-komponenten rakt av.
 *
 * Gradienten är loggans: grönt → gult → orange. Vännernas cirklar var tidigare
 * platt `bg-primary-100`, vilket gjorde att din egen avatar såg ut som en
 * annan sorts objekt än dina vänners.
 *
 * Importera alltid härifrån — skriv aldrig gradienten inline (samma regel som
 * SOURCE_BADGES).
 */

/** Loggans gradient + vit text med skugga för läsbarhet mot det gula partiet. */
export const AVATAR_GRADIENT =
  'bg-[linear-gradient(135deg,#7bbe2a_0%,#edbe0c_53%,#fc8518_100%)] text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.28)]'
