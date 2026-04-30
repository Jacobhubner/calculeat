/**
 * i18next TypeScript type augmentation.
 *
 * The Swedish locale files act as the master schema. TypeScript will
 * catch any missing or mistyped keys in t() calls across the codebase.
 *
 * Add each new namespace here as it is created in public/locales/sv/.
 */
import 'i18next'

import type svCommon from '../../public/locales/sv/common.json'
import type svAuth from '../../public/locales/sv/auth.json'
import type svDashboard from '../../public/locales/sv/dashboard.json'
import type svFood from '../../public/locales/sv/food.json'
import type svProfile from '../../public/locales/sv/profile.json'
import type svRecipes from '../../public/locales/sv/recipes.json'
import type svBody from '../../public/locales/sv/body.json'
import type svSharedLists from '../../public/locales/sv/shared-lists.json'
import type svSettings from '../../public/locales/sv/settings.json'
import type svContent from '../../public/locales/sv/content.json'
import type svHistory from '../../public/locales/sv/history.json'
import type svMarketing from '../../public/locales/sv/marketing.json'
import type svOnboarding from '../../public/locales/sv/onboarding.json'
import type svSocial from '../../public/locales/sv/social.json'
import type svToday from '../../public/locales/sv/today.json'
import type svTools from '../../public/locales/sv/tools.json'
import type svMet from '../../public/locales/sv/met.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof svCommon
      auth: typeof svAuth
      dashboard: typeof svDashboard
      food: typeof svFood
      profile: typeof svProfile
      recipes: typeof svRecipes
      body: typeof svBody
      'shared-lists': typeof svSharedLists
      settings: typeof svSettings
      content: typeof svContent
      history: typeof svHistory
      marketing: typeof svMarketing
      onboarding: typeof svOnboarding
      social: typeof svSocial
      today: typeof svToday
      tools: typeof svTools
      met: typeof svMet
    }
  }
}
