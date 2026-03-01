import type { FoodSource } from '@/hooks/useFoodItems'

export const SOURCE_BADGES: Record<FoodSource, { label: string; className: string }> = {
  user: { label: 'Min', className: 'bg-neutral-100 text-neutral-600 border-neutral-300' },
  manual: {
    label: 'CalculEat',
    className: 'bg-primary-100 text-primary-700 border-primary-400 font-semibold',
  },
  livsmedelsverket: { label: 'SLV', className: 'bg-blue-700 text-white border-blue-800' },
  usda: { label: 'USDA', className: 'bg-neutral-100 text-neutral-600 border-neutral-300' },
  shared: { label: 'Delad', className: 'bg-violet-100 text-violet-700 border-violet-400' },
}

export function getSourceBadgeConfig(
  source: FoodSource,
  sharedBy?: string | null
): { label: string; className: string } {
  if (source === 'shared' && sharedBy) {
    return { label: `Delad av ${sharedBy}`, className: SOURCE_BADGES.shared.className }
  }
  return SOURCE_BADGES[source]
}

export const LIST_BADGE_CLASS = 'bg-orange-100 text-orange-700 border-orange-300 font-medium'

export function getListItemBadgeConfig(listName: string): { label: string; className: string } {
  const label = listName.length > 20 ? listName.slice(0, 18) + '\u2026' : listName
  return { label, className: LIST_BADGE_CLASS }
}
