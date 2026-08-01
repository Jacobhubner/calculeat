import { HTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const cardVariants = cva('rounded-2xl bg-white dark:bg-neutral-850 w-full min-w-0 max-w-full', {
  variants: {
    variant: {
      default:
        'border border-neutral-200 dark:border-neutral-700 shadow-md hover:shadow-lg dark:shadow-black/30 transition-shadow duration-300',
      elevated: 'shadow-lg dark:shadow-black/30 border border-neutral-200 dark:border-neutral-700',
      outlined: 'border-2 border-neutral-300 dark:border-neutral-600',
      ghost: 'border-0 shadow-none',
      // Tonad i loggans bladgrön i stället för den helmättade primary-50,
      // som skar sig mot märket när den låg bakom ringen.
      // I mörkt läge måste via-white bytas mot en mörk ton, annars blir kortet vitt.
      gradient:
        'border border-neutral-200 dark:border-neutral-700 bg-gradient-to-br from-[#7bbe2a]/[0.07] via-white to-neutral-50/50 dark:from-[#7bbe2a]/[0.12] dark:via-neutral-850 dark:to-neutral-900/50 shadow-md hover:shadow-lg dark:shadow-black/30 transition-shadow duration-300',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {}

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(cardVariants({ variant }), 'p-6', className)} {...props} />
))
Card.displayName = 'Card'

const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6 min-w-0 overflow-hidden', className)}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-2xl font-bold leading-none tracking-tight text-neutral-950 dark:text-neutral-100',
        className
      )}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-neutral-500 dark:text-neutral-400', className)}
      {...props}
    />
  )
)
CardDescription.displayName = 'CardDescription'

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0 w-full min-w-0', className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardTitle, CardDescription, CardContent }
