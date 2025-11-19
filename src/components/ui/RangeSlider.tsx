/**
 * RangeSlider component - Dual handle range input
 * Allows setting min and max values on a single slider
 */

import * as React from 'react'
import { cn } from '@/lib/utils'

interface RangeSliderProps {
  value: [number, number] // [min, max]
  onValueChange?: (value: [number, number]) => void
  min?: number
  max?: number
  step?: number
  className?: string
  disabled?: boolean
}

export function RangeSlider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  className,
  disabled = false,
}: RangeSliderProps) {
  const [minVal, maxVal] = value
  const minValRef = React.useRef<HTMLInputElement>(null)
  const maxValRef = React.useRef<HTMLInputElement>(null)
  const range = React.useRef<HTMLDivElement>(null)

  // Convert value to percentage for styling
  const getPercent = React.useCallback(
    (value: number) => Math.round(((value - min) / (max - min)) * 100),
    [min, max]
  )

  // Set width of the range to decrease from the left side
  React.useEffect(() => {
    if (maxValRef.current && range.current) {
      const minPercent = getPercent(minVal)
      const maxPercent = getPercent(+maxValRef.current.value)

      range.current.style.left = `${minPercent}%`
      range.current.style.width = `${maxPercent - minPercent}%`
    }
  }, [minVal, getPercent])

  // Set width of the range to decrease from the right side
  React.useEffect(() => {
    if (minValRef.current && range.current) {
      const minPercent = getPercent(+minValRef.current.value)
      const maxPercent = getPercent(maxVal)

      range.current.style.width = `${maxPercent - minPercent}%`
    }
  }, [maxVal, getPercent])

  return (
    <div className={cn('relative w-full', className)}>
      {/* Min value input */}
      <input
        ref={minValRef}
        type="range"
        min={min}
        max={max}
        step={step}
        value={minVal}
        disabled={disabled}
        onChange={e => {
          const newMin = Math.min(+e.target.value, maxVal - step)
          onValueChange?.([newMin, maxVal])
        }}
        className={cn(
          'pointer-events-none absolute h-0 w-full outline-none',
          'z-[3]',
          '[&::-webkit-slider-thumb]:pointer-events-auto',
          '[&::-webkit-slider-thumb]:relative',
          '[&::-webkit-slider-thumb]:h-5',
          '[&::-webkit-slider-thumb]:w-5',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:border-2',
          '[&::-webkit-slider-thumb]:border-white',
          '[&::-webkit-slider-thumb]:bg-primary-600',
          '[&::-webkit-slider-thumb]:shadow-md',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:hover:bg-primary-700',
          '[&::-webkit-slider-thumb]:disabled:cursor-not-allowed',
          '[&::-webkit-slider-thumb]:disabled:bg-neutral-400',
          '[&::-moz-range-thumb]:pointer-events-auto',
          '[&::-moz-range-thumb]:h-5',
          '[&::-moz-range-thumb]:w-5',
          '[&::-moz-range-thumb]:appearance-none',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-2',
          '[&::-moz-range-thumb]:border-white',
          '[&::-moz-range-thumb]:bg-primary-600',
          '[&::-moz-range-thumb]:shadow-md',
          '[&::-moz-range-thumb]:cursor-pointer',
          '[&::-moz-range-thumb]:hover:bg-primary-700',
          '[&::-moz-range-thumb]:disabled:cursor-not-allowed',
          '[&::-moz-range-thumb]:disabled:bg-neutral-400'
        )}
      />

      {/* Max value input */}
      <input
        ref={maxValRef}
        type="range"
        min={min}
        max={max}
        step={step}
        value={maxVal}
        disabled={disabled}
        onChange={e => {
          const newMax = Math.max(+e.target.value, minVal + step)
          onValueChange?.([minVal, newMax])
        }}
        className={cn(
          'pointer-events-none absolute h-0 w-full outline-none',
          'z-[4]',
          '[&::-webkit-slider-thumb]:pointer-events-auto',
          '[&::-webkit-slider-thumb]:relative',
          '[&::-webkit-slider-thumb]:h-5',
          '[&::-webkit-slider-thumb]:w-5',
          '[&::-webkit-slider-thumb]:appearance-none',
          '[&::-webkit-slider-thumb]:rounded-full',
          '[&::-webkit-slider-thumb]:border-2',
          '[&::-webkit-slider-thumb]:border-white',
          '[&::-webkit-slider-thumb]:bg-primary-600',
          '[&::-webkit-slider-thumb]:shadow-md',
          '[&::-webkit-slider-thumb]:cursor-pointer',
          '[&::-webkit-slider-thumb]:hover:bg-primary-700',
          '[&::-webkit-slider-thumb]:disabled:cursor-not-allowed',
          '[&::-webkit-slider-thumb]:disabled:bg-neutral-400',
          '[&::-moz-range-thumb]:pointer-events-auto',
          '[&::-moz-range-thumb]:h-5',
          '[&::-moz-range-thumb]:w-5',
          '[&::-moz-range-thumb]:appearance-none',
          '[&::-moz-range-thumb]:rounded-full',
          '[&::-moz-range-thumb]:border-2',
          '[&::-moz-range-thumb]:border-white',
          '[&::-moz-range-thumb]:bg-primary-600',
          '[&::-moz-range-thumb]:shadow-md',
          '[&::-moz-range-thumb]:cursor-pointer',
          '[&::-moz-range-thumb]:hover:bg-primary-700',
          '[&::-moz-range-thumb]:disabled:cursor-not-allowed',
          '[&::-moz-range-thumb]:disabled:bg-neutral-400'
        )}
      />

      {/* Slider track */}
      <div className="relative w-full">
        {/* Background track */}
        <div className="absolute h-2 w-full rounded-lg bg-neutral-200" />
        {/* Active range */}
        <div ref={range} className="absolute h-2 rounded-lg bg-primary-500" />
      </div>
    </div>
  )
}
