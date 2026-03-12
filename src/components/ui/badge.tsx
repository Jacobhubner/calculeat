import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'bg-primary-100 text-primary-800 border border-primary-200 dark:bg-primary-950 dark:text-primary-200 dark:border-primary-800',
        secondary:
          'bg-neutral-100 text-neutral-800 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-700',
        success:
          'bg-success-100 text-success-800 border border-success-200 dark:bg-success-950 dark:text-success-200 dark:border-success-800',
        warning:
          'bg-warning-100 text-warning-800 border border-warning-200 dark:bg-warning-900/30 dark:text-warning-200 dark:border-warning-700',
        error:
          'bg-error-100 text-error-800 border border-error-200 dark:bg-error-950/50 dark:text-error-200 dark:border-error-800',
        accent:
          'bg-accent-100 text-accent-800 border border-accent-200 dark:bg-accent-950 dark:text-accent-200 dark:border-accent-800',
        outline:
          'border border-neutral-300 text-neutral-700 dark:border-neutral-600 dark:text-neutral-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
