import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-2xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        primary: 'bg-primary-600 text-white hover:bg-primary-700 active:scale-[0.98] shadow-sm',
        secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 active:scale-[0.98]',
        ghost: 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 active:scale-[0.98]',
        outline:
          'border-2 border-neutral-300 text-neutral-700 hover:bg-neutral-50 active:scale-[0.98]',
        destructive: 'bg-error-600 text-white hover:bg-error-700 active:scale-[0.98] shadow-sm',
        accent: 'bg-accent-600 text-white hover:bg-accent-700 active:scale-[0.98] shadow-sm',
        success: 'bg-success-600 text-white hover:bg-success-700 active:scale-[0.98] shadow-sm',
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

export { Button }
