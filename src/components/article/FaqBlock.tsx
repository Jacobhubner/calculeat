import { ChevronDown } from 'lucide-react'
import { JsonLd } from '@/components/seo/JsonLd'

export interface FaqItem {
  question: string
  answer: string
}

interface FaqBlockProps {
  items: FaqItem[]
  title?: string
}

// <details>/<summary> istället för useState-toggle: svaren måste alltid finnas
// i DOM så att sökmotorer indexerar texten (och så att FAQPage-JSON-LD nedan
// matchar synligt innehåll). Fungerar dessutom utan JS i prerendrad HTML.
export function FaqBlock({ items, title = 'Vanliga frågor' }: FaqBlockProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }

  return (
    <>
      <JsonLd schema={schema} />
      <section>
        <h2
          data-layout-text
          className="text-2xl font-semibold tracking-tight text-neutral-900 mb-5 dark:text-neutral-100"
        >
          {title}
        </h2>
        <div className="divide-y divide-neutral-100 rounded-2xl border border-neutral-200 bg-white shadow-card overflow-hidden dark:border-neutral-700 dark:bg-neutral-850">
          {items.map((item, i) => (
            <details key={i} className="group">
              <summary className="w-full flex items-center justify-between gap-4 px-4 sm:px-6 py-4 sm:py-5 text-left hover:bg-neutral-50 transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden dark:hover:bg-neutral-800">
                <span className="font-medium text-neutral-900 text-[15px] dark:text-neutral-100">
                  {item.question}
                </span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-all duration-200 group-open:rotate-180 group-open:bg-primary-100 group-open:text-primary-700 flex-shrink-0 dark:bg-neutral-800 dark:text-neutral-400">
                  <ChevronDown className="h-3.5 w-3.5" />
                </span>
              </summary>
              <div className="px-4 sm:px-6 pb-5 text-[15px] text-neutral-600 leading-relaxed dark:text-neutral-400">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
