import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

/**
 * Låter FoodHubPage skicka in sin flikrad till DashboardLayout.
 *
 * FoodItemsPage/RecipesPage/SavedMealsPage renderar var och en sin egen
 * <DashboardLayout>. För att lägga en gemensam flikrad överst i innehållsytan
 * utan att röra de sidorna — och utan att nästla två layouter — publicerar
 * FoodHubPage flikraden här, och DashboardLayout plockar upp den.
 */
export const FoodHubTabsContext = createContext<ReactNode>(null)

export function useFoodHubTabs(): ReactNode {
  return useContext(FoodHubTabsContext)
}
