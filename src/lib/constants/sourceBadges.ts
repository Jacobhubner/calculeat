import type { FoodSource } from '@/hooks/useFoodItems'

// Badgarna är små och tätt satta, så de behöver hålla ihop som färgfält även
// i mörkt läge: mättad ton på låg opacitet i botten, ljus text ovanpå. En
// rak -100/-700-inversion hade gett bländande fläckar i livsmedelslistorna.
export const SOURCE_BADGES: Record<FoodSource, { label: string; className: string }> = {
  user: {
    label: 'Min',
    className:
      'bg-neutral-100 text-neutral-600 border-neutral-300 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-600',
  },
  manual: {
    label: 'Calculeat',
    className:
      'bg-primary-100 text-primary-700 border-primary-400 font-semibold dark:bg-primary-500/20 dark:text-primary-200 dark:border-primary-600',
  },
  livsmedelsverket: {
    label: 'SLV',
    className:
      'bg-yellow-100 text-yellow-700 border-yellow-400 dark:bg-yellow-500/20 dark:text-yellow-200 dark:border-yellow-600',
  },
  usda: {
    label: 'USDA',
    className:
      'bg-blue-100 text-blue-700 border-blue-400 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-600',
  },
  cofid: {
    label: 'CoFID',
    className:
      'bg-rose-100 text-rose-700 border-rose-400 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-600',
  },
  shared: {
    label: 'Delad',
    className:
      'bg-violet-100 text-violet-700 border-violet-400 dark:bg-violet-500/20 dark:text-violet-200 dark:border-violet-600',
  },
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

export const LIST_BADGE_CLASS =
  'bg-orange-100 text-orange-700 border-orange-300 font-medium dark:bg-orange-500/20 dark:text-orange-200 dark:border-orange-600'

export function getListItemBadgeConfig(listName: string): { label: string; className: string } {
  const label = listName.length > 20 ? listName.slice(0, 18) + '\u2026' : listName
  return { label, className: LIST_BADGE_CLASS }
}
