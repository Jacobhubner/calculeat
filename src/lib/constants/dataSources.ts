import type { FoodTab } from '@/hooks/useFoodItems'

export interface DataSourceConfig {
  id: string
  tabKey: FoodTab
  labelKey: string
  badgeClass: string
  primaryLocales: string[]
  defaultQualityScore: number
  isVerified: boolean
  sourcePriority: number
  includeInAll: boolean
}

export const DATA_SOURCES: DataSourceConfig[] = [
  {
    id: 'livsmedelsverket',
    tabKey: 'slv',
    labelKey: 'tabs.slv',
    badgeClass:
      'bg-yellow-100 text-yellow-700 border-yellow-400 dark:bg-yellow-500/20 dark:text-yellow-200 dark:border-yellow-600',
    primaryLocales: ['sv'],
    defaultQualityScore: 100,
    isVerified: true,
    sourcePriority: 100,
    includeInAll: true,
  },
  {
    id: 'usda',
    tabKey: 'usda',
    labelKey: 'tabs.usda',
    badgeClass:
      'bg-blue-100 text-blue-700 border-blue-400 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-600',
    primaryLocales: ['en'],
    defaultQualityScore: 90,
    isVerified: true,
    sourcePriority: 90,
    includeInAll: true,
  },
]

export function getDataSourceByTabKey(tabKey: FoodTab): DataSourceConfig | undefined {
  return DATA_SOURCES.find(ds => ds.tabKey === tabKey)
}

export function getDataSourceById(id: string): DataSourceConfig | undefined {
  return DATA_SOURCES.find(ds => ds.id === id)
}

export function getAllSourceIds(): string[] {
  return DATA_SOURCES.map(ds => ds.id)
}

export function getAllIncludedInAllSourceIds(): string[] {
  return DATA_SOURCES.filter(ds => ds.includeInAll).map(ds => ds.id)
}
