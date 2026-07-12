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
      <section className="mt-10">
        <h2 data-layout-text className="text-xl font-semibold text-neutral-900 mb-4">
          {title}
        </h2>
        <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
          {items.map((item, i) => (
            <details key={i} className="group">
              <summary className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-neutral-50 transition-colors cursor-pointer list-none [&::-webkit-details-marker]:hidden">
                <span className="font-medium text-neutral-900 text-sm">{item.question}</span>
                <ChevronDown className="h-4 w-4 flex-shrink-0 text-neutral-500 transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
                {item.answer}
              </div>
            </details>
          ))}
        </div>
      </section>
    </>
  )
}
