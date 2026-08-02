import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { TDEEStatusInfo } from '@/hooks/useTDEEStatus'

interface TDEESourceBadgeProps {
  statusInfo: TDEEStatusInfo
}

const colorClasses = {
  green:
    'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
  yellow:
    'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
  orange:
    'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
  blue: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
  gray: 'bg-gray-100 text-gray-800 border-gray-300',
}

const iconEmojis = {
  current: '🟢',
  outdated: '🟠',
  stale: '🟡',
  manual: '🔵',
  missing: '⚪',
}

export function TDEESourceBadge({ statusInfo }: TDEESourceBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="outline"
            className={`${colorClasses[statusInfo.color]} border font-medium cursor-help`}
          >
            <span className="mr-1">{iconEmojis[statusInfo.status]}</span>
            {statusInfo.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">{statusInfo.message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
