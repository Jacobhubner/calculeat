import { LucideIcon } from 'lucide-react'
import { Card } from './ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  unit?: string
  icon: LucideIcon
  trend?: {
    value: number
    label: string
  }
  variant?: 'default' | 'primary' | 'accent' | 'success'
  className?: string
}

export default function StatCard({
  title,
  value,
  unit,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-neutral-100 text-neutral-700',
    primary: 'bg-gradient-primary text-white',
    accent: 'bg-gradient-accent text-white',
    success: 'bg-gradient-to-br from-success-400 to-success-600 text-white',
  }

  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 mb-1">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-3xl font-bold text-neutral-900">{value}</h3>
            {unit && <span className="text-sm text-neutral-500">{unit}</span>}
          </div>
          {trend && (
            <p
              className={cn(
                'mt-2 text-xs font-medium',
                trend.value > 0 ? 'text-success-600' : 'text-error-600'
              )}
            >
              {trend.value > 0 ? '+' : ''}
              {trend.value}% {trend.label}
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-3', variantStyles[variant])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </Card>
  )
}
