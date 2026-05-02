import { useState } from 'react'
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

export function FaqBlock({ items, title = 'Vanliga frågor' }: FaqBlockProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

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
        <h2 className="text-xl font-semibold text-neutral-900 mb-4">{title}</h2>
        <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-xl overflow-hidden">
          {items.map((item, i) => (
            <div key={i}>
              <button
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-neutral-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                aria-expanded={openIndex === i}
              >
                <span className="font-medium text-neutral-900 text-sm">{item.question}</span>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-neutral-500 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4 text-sm text-neutral-600 leading-relaxed">
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
