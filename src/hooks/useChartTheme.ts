import { useEffect, useState } from 'react'

/**
 * Diagramfärger per tema.
 *
 * Recharts tar färger som JS-props (contentStyle, stroke, fill) och inte som
 * klasser, så `dark:` når dem aldrig. Utan den här hooken blir tooltips vita
 * rutor med nästan osynlig text i mörkt läge.
 *
 * Värdena speglar de tokens som används i CSS: neutral-850 för upphöjda ytor,
 * neutral-700 för kanter, neutral-400 för dämpad text.
 */
export interface ChartTheme {
  isDark: boolean
  /** Bakgrund + kant för tooltip-rutan */
  tooltip: { backgroundColor: string; border: string; borderRadius: string; color: string }
  /** Rutnätslinjer */
  grid: string
  /** Axeltext */
  axisTick: string
  /** Brush (tidsintervallväljaren under diagrammet) */
  brush: { stroke: string; fill: string }
}

const LIGHT: Omit<ChartTheme, 'isDark'> = {
  tooltip: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    color: '#1c2b14',
  },
  grid: '#e5e7eb',
  axisTick: '#6b7280',
  brush: { stroke: '#d1d5db', fill: '#f9fafb' },
}

const DARK: Omit<ChartTheme, 'isDark'> = {
  tooltip: {
    backgroundColor: 'hsl(104 18% 13%)', // neutral-850
    border: '1px solid hsl(102 14% 22%)', // edge
    borderRadius: '0.5rem',
    color: 'hsl(90 16% 94%)', // neutral-100
  },
  grid: 'hsl(102 16% 17%)', // neutral-800
  axisTick: 'hsl(94 10% 60%)', // neutral-400
  brush: { stroke: 'hsl(100 14% 26%)', fill: 'hsl(104 20% 10%)' },
}

/**
 * Läser .dark-klassen på <html> i stället för temastoren. Klassen är den
 * faktiska sanningen — den sätts av inline-skriptet i index.html innan React
 * monterar, av storen vid val, och av systemlyssnaren i main.tsx. Att läsa
 * DOM:en fångar alla tre utan att duplicera logiken.
 */
export function useIsDarkMode(): boolean {
  const [isDark, setIsDark] = useState(
    () => typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    const root = document.documentElement
    const observer = new MutationObserver(() => setIsDark(root.classList.contains('dark')))
    observer.observe(root, { attributes: true, attributeFilter: ['class'] })
    setIsDark(root.classList.contains('dark'))
    return () => observer.disconnect()
  }, [])

  return isDark
}

export function useChartTheme(): ChartTheme {
  const isDark = useIsDarkMode()
  return { isDark, ...(isDark ? DARK : LIGHT) }
}
