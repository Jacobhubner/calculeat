import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-900 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        // Loggans gröna med mörk text i stället för mörkare grönt med vit.
        // Vit text på grönt når aldrig 4.5:1 i den här nyansen; mörk text ger
        // 5.16:1 och låter knappen bära märkets faktiska färg.
        primary:
          'bg-primary-500 text-on-primary hover:bg-primary-400 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] shadow-md dark:shadow-black/30',
        secondary:
          'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700 hover:shadow-md dark:hover:shadow-black/30 hover:-translate-y-0.5 active:scale-[0.98]',
        ghost:
          'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800 dark:hover:text-neutral-100 hover:-translate-y-0.5 active:scale-[0.98]',
        outline:
          'border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 dark:border-neutral-600 dark:text-neutral-200 dark:hover:bg-neutral-800 hover:shadow-md dark:hover:shadow-black/30 hover:-translate-y-0.5 active:scale-[0.98]',
        destructive:
          'bg-error-600 text-white hover:bg-error-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] shadow-md dark:shadow-black/30',
        accent:
          'bg-accent-600 text-white hover:bg-accent-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] shadow-md dark:shadow-black/30',
        success:
          'bg-success-600 text-white hover:bg-success-700 hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] shadow-md dark:shadow-black/30',
      },
      size: {
        sm: 'h-9 px-4 text-sm',
        md: 'h-11 px-6',
        lg: 'h-12 px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
