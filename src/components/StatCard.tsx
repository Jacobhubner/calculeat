import { LucideIcon } from 'lucide-react'
import { Card } from './ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  unit?: string
  subtitle?: string
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
  subtitle,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const variantStyles = {
    default: 'bg-neutral-200/50 text-neutral-700',
    primary: 'bg-primary-200/40 text-primary-700',
    accent: 'bg-accent-200/40 text-accent-700',
    success: 'bg-success-200/40 text-success-700',
  }

  return (
    <Card variant="gradient" className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-neutral-600 mb-2 dark:text-neutral-400">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-4xl font-bold text-neutral-950">{value}</h3>
            {unit && <span className="text-sm text-neutral-500 dark:text-neutral-400">{unit}</span>}
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{subtitle}</p>
          )}
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
