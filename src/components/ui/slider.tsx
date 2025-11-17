/**
 * Slider component for range inputs
 * Based on shadcn/ui slider component
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: number[]
  onValueChange?: (value: number[]) => void
}

const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  ({ className, value, onValueChange, min = 0, max = 100, step = 1, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value)
      onValueChange?.([newValue])
    }

    return (
      <input
        ref={ref}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value[0] ?? 0}
        onChange={handleChange}
        className={cn(
          'w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:w-5',
          '[&::-webkit-slider-thumb]:h-5',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:bg-primary-600',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:shadow-md',
          '[&::-webkit-slider-thumb]:hover:bg-primary-700',
          '[&::-webkit-slider-thumb]:transition-colors',
          '[&::-moz-range-thumb]:w-5',
          '[&::-moz-range-thumb]:h-5',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:bg-primary-600',
          '[&::-moz-range-thumb]:cursor-pointer',
          '[&::-moz-range-thumb]:border-0',
          '[&::-moz-range-thumb]:shadow-md',
          '[&::-moz-range-thumb]:hover:bg-primary-700',
          '[&::-moz-range-thumb]:transition-colors',
          className
        )}
        {...props}
      />
    )
  }
)

Slider.displayName = 'Slider'

export { Slider }
