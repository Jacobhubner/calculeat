/**
 * Design Tokens för CalculEat
 * Centraliserad design system konfiguration
 */

export const colors = {
  primary: {
    50: 'hsl(166, 72%, 95%)',
    100: 'hsl(166, 72%, 90%)',
    200: 'hsl(166, 72%, 80%)',
    300: 'hsl(166, 72%, 70%)',
    400: 'hsl(166, 72%, 50%)',
    500: 'hsl(166, 72%, 40%)', // Base
    600: 'hsl(166, 72%, 35%)',
    700: 'hsl(166, 72%, 30%)',
    800: 'hsl(166, 72%, 25%)',
    900: 'hsl(166, 72%, 20%)',
    950: 'hsl(166, 72%, 10%)',
  },
  accent: {
    50: 'hsl(21, 90%, 95%)',
    100: 'hsl(21, 90%, 90%)',
    200: 'hsl(21, 90%, 80%)',
    300: 'hsl(21, 90%, 70%)',
    400: 'hsl(21, 90%, 64%)',
    500: 'hsl(21, 90%, 54%)', // Base
    600: 'hsl(21, 90%, 48%)',
    700: 'hsl(21, 90%, 42%)',
    800: 'hsl(21, 90%, 36%)',
    900: 'hsl(21, 90%, 30%)',
    950: 'hsl(21, 90%, 20%)',
  },
  success: {
    50: 'hsl(142, 71%, 95%)',
    100: 'hsl(142, 71%, 90%)',
    200: 'hsl(142, 71%, 80%)',
    300: 'hsl(142, 71%, 70%)',
    400: 'hsl(142, 71%, 55%)',
    500: 'hsl(142, 71%, 45%)', // Base
    600: 'hsl(142, 71%, 40%)',
    700: 'hsl(142, 71%, 35%)',
    800: 'hsl(142, 71%, 30%)',
    900: 'hsl(142, 71%, 25%)',
    950: 'hsl(142, 71%, 15%)',
  },
  warning: {
    50: 'hsl(45, 93%, 95%)',
    100: 'hsl(45, 93%, 90%)',
    200: 'hsl(45, 93%, 80%)',
    300: 'hsl(45, 93%, 70%)',
    400: 'hsl(45, 93%, 60%)',
    500: 'hsl(45, 93%, 50%)',
    600: 'hsl(45, 93%, 45%)',
    700: 'hsl(45, 93%, 40%)',
    800: 'hsl(45, 93%, 35%)',
    900: 'hsl(45, 93%, 30%)',
  },
  error: {
    50: 'hsl(0, 84%, 95%)',
    100: 'hsl(0, 84%, 90%)',
    200: 'hsl(0, 84%, 80%)',
    300: 'hsl(0, 84%, 70%)',
    400: 'hsl(0, 84%, 64%)',
    500: 'hsl(0, 84%, 60%)',
    600: 'hsl(0, 84%, 55%)',
    700: 'hsl(0, 84%, 50%)',
    800: 'hsl(0, 84%, 45%)',
    900: 'hsl(0, 84%, 40%)',
  },
} as const

export const spacing = {
  xs: '0.5rem', // 8px
  sm: '0.75rem', // 12px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
  '4xl': '6rem', // 96px
} as const

export const typography = {
  fontFamily: {
    sans: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
    mono: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
    '5xl': ['3rem', { lineHeight: '1' }],
    '6xl': ['3.75rem', { lineHeight: '1' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const

export const borderRadius = {
  none: '0',
  sm: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '1rem', // 16px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  full: '9999px',
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
} as const

export const animations = {
  duration: {
    fast: '150ms',
    base: '200ms',
    slow: '300ms',
  },
  easing: {
    ease: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  modal: 30,
  popover: 40,
  toast: 50,
} as const
