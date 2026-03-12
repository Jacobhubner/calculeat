import { forwardRef, SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>

const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, ...props }, ref) => {
  return (
    <select
      className={cn(
        'flex h-11 w-full rounded-2xl border border-neutral-300 bg-white px-4 py-2 text-sm',
        'dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100 dark:[color-scheme:dark]',
        'focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        'dark:focus:border-primary-400 dark:focus:ring-primary-400 dark:focus:ring-offset-neutral-800',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Select.displayName = 'Select'

export { Select }
