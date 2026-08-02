import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Apple, ChefHat, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { FoodHubTabsContext } from '@/components/layout/foodHubTabs'
import type { LucideProps } from 'lucide-react'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'

const FoodItemsPage = lazy(() => import('./FoodItemsPage'))
const RecipesPage = lazy(() => import('./RecipesPage'))
const SavedMealsPage = lazy(() => import('./SavedMealsPage'))

export type FoodHubTab = 'food' | 'recipes' | 'saved'

interface TabDef {
  key: FoodHubTab
  to: string
  labelKey: 'nav.food' | 'nav.recipes' | 'nav.savedMeals'
  icon: ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>
}

const TABS: TabDef[] = [
  { key: 'food', to: '/app/food-items', labelKey: 'nav.food', icon: Apple },
  { key: 'recipes', to: '/app/recipes', labelKey: 'nav.recipes', icon: ChefHat },
  { key: 'saved', to: '/app/saved-meals', labelKey: 'nav.savedMeals', icon: Bookmark },
]

/**
 * Flikraden för Mat-ytan. Renderas av DashboardLayout högst upp i
 * innehållsytan när en FoodHub-flik är aktiv (se foodHubTabs.tsx).
 */
function FoodHubTabs({ active }: { active: FoodHubTab }) {
  const { t } = useTranslation('common')

  return (
    <nav
      aria-label={t('nav.sectionPlanning')}
      className="mb-5 md:mb-6 border-b border-neutral-200 dark:border-neutral-700"
    >
      <div className="flex gap-1 overflow-x-auto md:overflow-x-visible scrollbar-none">
        {TABS.map(tab => {
          const Icon = tab.icon
          const isActive = tab.key === active

          return (
            <Link
              key={tab.key}
              to={tab.to}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors md:px-4',
                isActive
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-neutral-500 hover:border-neutral-300 hover:text-neutral-800 dark:text-neutral-400'
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary-600')} />
              {t(tab.labelKey)}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

function TabContentLoader() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  )
}

/**
 * Samlad "Mat"-yta: Livsmedel / Recept / Sparade måltider under tre flikar.
 *
 * Varje underliggande sida renderar sin egen <DashboardLayout>, därför injiceras
 * flikraden via context istället för att wrappas runt sidan — annars skulle
 * header/sidomeny/bottennav dubbleras. Flikarna är riktiga <Link>-element mot
 * de befintliga URL:erna, så djuplänkning och bakåtknappen fungerar som förut.
 */
export default function FoodHubPage({ tab }: { tab: FoodHubTab }) {
  const content =
    tab === 'food' ? <FoodItemsPage /> : tab === 'recipes' ? <RecipesPage /> : <SavedMealsPage />

  return (
    <FoodHubTabsContext.Provider value={<FoodHubTabs active={tab} />}>
      <Suspense fallback={<TabContentLoader />}>{content}</Suspense>
    </FoodHubTabsContext.Provider>
  )
}
