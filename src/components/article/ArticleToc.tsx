import { useEffect, useState } from 'react'
import { List } from 'lucide-react'
import type { TocItem } from '@/lib/articles/derive'

interface ArticleTocProps {
  items: TocItem[]
  heading: string
  /** rail = sticky högermarginal (desktop ≥xl), inline = hopfällbar box ovanför brödtexten */
  variant: 'rail' | 'inline'
}

/**
 * Innehållsförteckning genererad från artikelns h2-block.
 * data-layout-text: TOC:n duplicerar rubriktexterna — den är navigation,
 * inte innehåll, och exkluderas ur golden-snapshot-diffen.
 */
export function ArticleToc({ items, heading, variant }: ArticleTocProps) {
  // Scroll-spy — ren förhöjning, påverkar bara klassnamn (prerender-säkert)
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    if (variant !== 'rail') return
    const headings = items
      .map(item => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null)
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        }
      },
      { rootMargin: '0% 0% -70% 0%' }
    )
    headings.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [items, variant])

  if (items.length < 3) return null

  if (variant === 'inline') {
    return (
      <details
        data-layout-text
        className="group mb-10 rounded-xl border border-neutral-200 bg-neutral-50 xl:hidden dark:border-neutral-700 dark:bg-neutral-900"
      >
        <summary className="flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-neutral-800 cursor-pointer list-none [&::-webkit-details-marker]:hidden dark:text-neutral-200">
          <List className="h-4 w-4 text-primary-600 dark:text-primary-300" />
          {heading}
        </summary>
        <nav className="px-4 pb-4">
          <ol className="space-y-1.5 border-l border-neutral-200 pl-4 dark:border-neutral-700">
            {items.map(item => (
              <li key={item.id}>
                <a
                  href={`#${item.id}`}
                  className="block text-sm text-neutral-600 hover:text-primary-700 transition-colors py-0.5 dark:text-neutral-400"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </details>
    )
  }

  return (
    <aside data-layout-text className="hidden xl:block">
      <nav className="sticky top-10 pl-10 pr-4 text-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-400 mb-3 dark:text-neutral-500">
          {heading}
        </p>
        <ol className="space-y-2 border-l border-neutral-200 dark:border-neutral-700">
          {items.map(item => (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={`block pl-4 -ml-px border-l-2 leading-snug transition-colors ${
                  activeId === item.id
                    ? 'border-primary-500 text-primary-700 font-medium dark:text-primary-300'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 dark:text-neutral-400'
                }`}
              >
                {item.label}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </aside>
  )
}
