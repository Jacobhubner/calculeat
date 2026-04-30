import { useTranslation } from 'react-i18next'
import type { METActivity } from './metActivities'

export function useMETTranslation() {
  const { t } = useTranslation('met')

  const getActivityName = (activity: METActivity): string =>
    t(`activities.${activity.code}`, { defaultValue: activity.activity })

  const getCategoryName = (svCategory: string): string =>
    t(`categories.${svCategory}`, { defaultValue: svCategory })

  return { getActivityName, getCategoryName }
}
