import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { TDEEStatusInfo } from '@/hooks/useTDEEStatus'

interface TDEESourceBadgeProps {
  statusInfo: TDEEStatusInfo
}

const colorClasses = {
  green: 'bg-green-100 text-green-800 border-green-300',
  yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  orange: 'bg-orange-100 text-orange-800 border-orange-300',
  blue: 'bg-blue-100 text-blue-800 border-blue-300',
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
