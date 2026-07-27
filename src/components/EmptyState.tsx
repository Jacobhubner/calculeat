import { LucideIcon } from 'lucide-react'
import { Button } from './ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}
    >
      <div className="rounded-2xl bg-gradient-to-br from-primary-100/40 to-accent-100/40 p-6 mb-6">
        <Icon className="h-14 w-14 text-primary-600" />
      </div>
      <h3 className="text-xl font-bold text-neutral-950 mb-3">{title}</h3>
      <p className="text-sm text-neutral-600 max-w-sm mb-8">{description}</p>
      {action && (
        <Button onClick={action.onClick} size="lg">
          {action.label}
        </Button>
      )}
    </div>
  )
}
