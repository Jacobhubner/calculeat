/**
 * Global store för UpgradeModal så att kvotfel från servern
 * (PREMIUM_LIMIT_REACHED, se docs/PREMIUM_SPEC.md) kan öppna modalen
 * från vilken mutation/dialog som helst utan prop-drilling.
 */

import { create } from 'zustand'
import { parsePremiumLimitError, type PremiumLimitKey } from '@/lib/constants/entitlements'

interface UpgradeModalState {
  isOpen: boolean
  limitKey: PremiumLimitKey | null
  open: (limitKey?: PremiumLimitKey) => void
  close: () => void
}

export const useUpgradeModalStore = create<UpgradeModalState>()(set => ({
  isOpen: false,
  limitKey: null,
  open: limitKey => set({ isOpen: true, limitKey: limitKey ?? null }),
  close: () => set({ isOpen: false }),
}))

/**
 * Anropas först i catch-block för create-mutationer. Om felet är en
 * premiumkvot öppnas UpgradeModal och true returneras — då ska anroparen
 * INTE visa sin generiska feltoast.
 */
export function handlePremiumLimitError(error: unknown): boolean {
  const limitKey = parsePremiumLimitError(error)
  if (!limitKey) return false
  useUpgradeModalStore.getState().open(limitKey)
  return true
}
