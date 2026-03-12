import { forwardRef, InputHTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const inputVariants = cva(
  'flex h-11 w-full rounded-2xl bg-white dark:bg-neutral-800 dark:text-neutral-100 dark:placeholder:text-neutral-500 px-4 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border border-neutral-300 dark:border-neutral-600 focus:border-primary-500 dark:focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 focus:ring-offset-2 dark:focus:ring-offset-neutral-800',
        error:
          'border-2 border-error-500 focus:border-error-500 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface InputProps
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, onFocus, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant }), className)}
        ref={ref}
        onFocus={e => {
          if (type === 'number') e.target.select()
          onFocus?.(e)
        }}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
