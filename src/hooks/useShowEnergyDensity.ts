import { useActiveProfile } from './useActiveProfile'

/**
 * Om kaloritäthetsindikatorn (färgtyperna grön/gul/orange) ska visas.
 * Styrs av profilinställningen "Visa kaloritäthetsindikatorn"
 * (show_energy_density). Gäller ALLA färgvisningar: livsmedel, recept,
 * dagens logg, förklaringsmodeller m.m. Beräkningen av färg sker alltid
 * (lagras på livsmedlet) — endast visningen döljs.
 */
export function useShowEnergyDensity(): boolean {
  const { profile } = useActiveProfile()
  return profile?.show_energy_density ?? false
}
