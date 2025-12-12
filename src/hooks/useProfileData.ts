import { useEffect, useMemo } from 'react';
import { useProfileStore } from '@/stores/profileStore';
import type { Profile } from '@/lib/types';

/**
 * Hook för att hämta specifika fält från aktiv profil
 * Återberäknas automatiskt när profil ändras
 *
 * @param fields - Array av fältnamn från Profile interface
 * @returns Objekt med valda fält, eller null om ingen aktiv profil
 *
 * @example
 * const profileData = useProfileData(['weight_kg', 'height_cm', 'gender'])
 * if (profileData) {
 *   // profileData har typen { weight_kg?: number, height_cm?: number, gender?: Gender }
 * }
 */
export function useProfileData<T extends keyof Profile>(
  fields: T[]
): Pick<Profile, T> | null {
  const activeProfile = useProfileStore(state => state.activeProfile);

  // Memoize resultatet baserat på profil-ID och valda fält
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const profileData = useMemo(() => {
    if (!activeProfile) return null;

    // Skapa objekt med endast valda fält
    const result = {} as Pick<Profile, T>;
    fields.forEach(field => {
      result[field] = activeProfile[field];
    });

    return result;
    // Vi vill att denna uppdateras när något av de valda fälten ändras
  }, [activeProfile?.id, activeProfile, ...fields]);

  return profileData;
}

/**
 * Hook för att kolla om specifika profilfält saknas
 *
 * @param requiredFields - Array av fältnamn som krävs
 * @returns Objekt med saknade fält och deras labels
 *
 * @example
 * const missingFields = useMissingProfileData(['weight_kg', 'height_cm'])
 * if (missingFields.length > 0) {
 *   // Visa varning eller inline input
 * }
 */
export function useMissingProfileData(
  requiredFields: Array<keyof Profile>
): Array<{ key: keyof Profile; label: string }> {
  const activeProfile = useProfileStore(state => state.activeProfile);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => {
    if (!activeProfile) return [];

    const missing: Array<{ key: keyof Profile; label: string }> = [];

    requiredFields.forEach(field => {
      const value = activeProfile[field];

      // Kolla om fältet saknas eller är tomt
      if (value === undefined || value === null || value === '') {
        missing.push({
          key: field,
          label: getFieldLabel(field),
        });
      }
    });

    return missing;
    // Vi vill att denna uppdateras när activeProfile eller requiredFields ändras
  }, [activeProfile, requiredFields]);
}

/**
 * Hjälpfunktion för att få svenska labels för profilfält
 */
function getFieldLabel(field: keyof Profile): string {
  const labels: Partial<Record<keyof Profile, string>> = {
    weight_kg: 'Vikt (kg)',
    height_cm: 'Längd (cm)',
    gender: 'Kön',
    birth_date: 'Födelsedatum',
    body_fat_percentage: 'Kroppsfett (%)',
    bmr: 'BMR',
    tdee: 'TDEE',
    activity_level: 'Aktivitetsnivå',
    pal_system: 'PAL System',
    target_body_fat_percentage: 'Mål kroppsfett (%)',
    target_weight_kg: 'Målvikt (kg)',
    calories_min: 'Minimum kalorier',
    calories_max: 'Maximum kalorier',
  };

  return labels[field] || field.toString();
}
