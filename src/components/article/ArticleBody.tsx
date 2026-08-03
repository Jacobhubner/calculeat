import { Fragment } from 'react'
import { Link2 } from 'lucide-react'
import type { Block, ComponentName, RichText, Run } from '@/content/articles/types'
import { ArticleImage } from './ArticleImage'
import FFMIContent from '@/components/info/FFMIContent'
import NormalizedFFMIContent from '@/components/info/NormalizedFFMIContent'
import PALvsMETContent from '@/components/info/PALvsMETContent'
import BMRvsRMRContent from '@/components/info/BMRvsRMRContent'

const COMPONENTS: Record<ComponentName, React.ComponentType> = {
  FFMIContent,
  NormalizedFFMIContent,
  PALvsMETContent,
  BMRvsRMRContent,
}

// Cards-färgerna i innehålls-JSON (får ej ändras där) normaliseras till
// palettens nyanser här i renderern
// NYCKLARNA måste matcha strängarna i innehålls-JSON ordagrant — de får
// alltså aldrig dark:-klasser. Det är VÄRDENA som renderas och som bär
// temat.
const CARD_COLORS: Record<string, string> = {
  'bg-green-50 border-green-200':
    'bg-primary-50/60 border-primary-200/70 dark:bg-primary-900/25 dark:border-primary-800',
  'bg-blue-50 border-blue-200':
    'bg-neutral-50 border-neutral-200 dark:bg-neutral-900 dark:border-neutral-700',
  'bg-yellow-50 border-yellow-200':
    'bg-accent-50/60 border-accent-200/70 dark:bg-accent-900/25 dark:border-accent-800',
  'bg-red-50 border-red-200':
    'bg-error-50 border-error-200 dark:bg-error-900/25 dark:border-error-800',
  'bg-primary-50 border-primary-200':
    'bg-primary-50/60 border-primary-200/70 dark:bg-primary-900/25 dark:border-primary-800',
}

function Rich({ text }: { text: RichText }) {
  if (typeof text === 'string') return <>{text}</>
  return (
    <>
      {text.map((run: Run, i: number) => {
        if ('br' in run) return <br key={i} />
        if (run.strong) return <strong key={i}>{run.text}</strong>
        if (run.em) return <em key={i}>{run.text}</em>
        return <Fragment key={i}>{run.text}</Fragment>
      })}
    </>
  )
}

const LIST_GAP: Record<number, string> = {
  1: 'space-y-1.5',
  2: 'space-y-2.5',
  4: 'space-y-4',
}

// OBS: ingen `uppercase` här — tabellrubriker är artikelinnehåll och
// text-transform ändrar renderad text (bryter golden-garantin)
const TH_CLASS = 'px-4 py-3 text-left text-xs font-semibold text-neutral-500 dark:text-neutral-400'

interface ArticleBodyProps {
  blocks: Block[]
  /** blockindex → ankar-id för h2 (från deriveToc) */
  headingIds?: Record<number, string>
  /** aria-label för kopiera-länk-knappen på h2 (layouttext) */
  anchorCopyLabel?: string
}

function copyAnchor(id: string) {
  const url = `${window.location.origin}${window.location.pathname}#${id}`
  void navigator.clipboard?.writeText(url)
}

/** Renderar en artikels body-blocklista — typografi och komponentspråk ägs här */
export function ArticleBody({ blocks, headingIds, anchorCopyLabel }: ArticleBodyProps) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h2': {
            const id = headingIds?.[i]
            return (
              <h2
                key={i}
                id={id}
                className={`group relative text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 ${block.tight ? 'mt-8' : 'mt-12'} mb-4 scroll-mt-8`}
              >
                {id && (
                  <button
                    type="button"
                    aria-label={anchorCopyLabel}
                    onClick={() => copyAnchor(id)}
                    className="absolute -left-7 top-1/2 -translate-y-1/2 hidden md:flex h-5 w-5 items-center justify-center text-neutral-300 opacity-0 group-hover:opacity-100 hover:text-primary-600 transition-all"
                  >
                    <Link2 className="h-4 w-4" />
                  </button>
                )}
                <Rich text={block.text} />
              </h2>
            )
          }
          case 'h3':
            return (
              <h3
                key={i}
                className="text-lg font-semibold text-neutral-900 mt-8 mb-3 dark:text-neutral-100"
              >
                <Rich text={block.text} />
              </h3>
            )
          case 'p':
            return (
              <p key={i} className={block.flush ? 'text-pretty' : 'mt-5 text-pretty'}>
                <Rich text={block.text} />
              </p>
            )
          case 'note':
            return (
              <p
                key={i}
                className={
                  block.subtle
                    ? 'text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400'
                    : 'mt-3 text-[15px] leading-relaxed text-neutral-500 dark:text-neutral-400'
                }
              >
                <Rich text={block.text} />
              </p>
            )
          case 'formula':
            return (
              <div
                key={i}
                className="my-6 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4 dark:border-neutral-700 dark:bg-neutral-900"
              >
                <p className="font-mono text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                  <Rich text={block.text} />
                </p>
              </div>
            )
          case 'callout':
            return (
              <div
                key={i}
                className="mt-6 rounded-xl border border-primary-200/70 bg-primary-50/60 px-5 py-4 text-center font-medium text-primary-950 dark:border-primary-800 dark:bg-primary-900/25 dark:text-primary-100"
              >
                <Rich text={block.text} />
              </div>
            )
          case 'infoBox':
            return (
              <div
                key={i}
                className="my-6 rounded-xl border border-neutral-200 bg-neutral-50 px-5 py-4 space-y-1.5 text-[15px] leading-relaxed text-neutral-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200"
              >
                {block.items.map((item, j) => (
                  <p key={j}>
                    <Rich text={item} />
                  </p>
                ))}
              </div>
            )
          case 'img':
            return (
              <ArticleImage
                key={i}
                src={block.src}
                alt={block.alt}
                width={block.width}
                height={block.height}
                webpSrc={block.webpSrc}
              />
            )
          case 'ul':
          case 'ol': {
            const Tag = block.type
            const gap = LIST_GAP[block.gap ?? 2]
            const marker =
              block.type === 'ul'
                ? 'list-disc marker:text-primary-600'
                : 'list-decimal marker:text-neutral-400 marker:font-medium'
            return (
              <Tag key={i} className={`${gap} pl-5 ${marker} mt-4`}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Rich text={item} />
                  </li>
                ))}
              </Tag>
            )
          }
          case 'table':
            return (
              <div
                key={i}
                className="mt-6 overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-xs dark:border-neutral-700 dark:bg-neutral-850"
              >
                <table className={`${block.variant === 'plain' ? 'min-w-full' : 'w-full'} text-sm`}>
                  <thead className="bg-neutral-50 border-b border-neutral-200 dark:border-neutral-700 dark:bg-neutral-900">
                    <tr>
                      {block.headers.map(h => (
                        <th key={h} className={TH_CLASS}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 dark:divide-neutral-700">
                    {block.rows.map((row, r) => (
                      <tr
                        key={r}
                        className={
                          block.variant === 'bordered'
                            ? 'even:bg-neutral-50/60 dark:even:bg-neutral-900/50'
                            : undefined
                        }
                      >
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className={
                              c === 0
                                ? `px-4 py-3 font-medium text-neutral-800 dark:text-neutral-100 ${block.variant === 'plain' ? 'whitespace-nowrap' : ''}`
                                : 'px-4 py-3 text-neutral-600 tabular-nums dark:text-neutral-400'
                            }
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          case 'tableGrid':
            return (
              <div key={i} className="mt-6 grid sm:grid-cols-2 gap-4">
                {block.tables.map((t, j) => (
                  <div
                    key={j}
                    className="rounded-xl border border-neutral-200 bg-white shadow-xs overflow-hidden dark:border-neutral-700 dark:bg-neutral-850"
                  >
                    <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-2.5 text-[13px] font-semibold text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                      {t.header}
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {t.rows.map(([label, value], r) => (
                          <tr
                            key={r}
                            className="border-t border-neutral-100 first:border-t-0 dark:border-neutral-700"
                          >
                            <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400">
                              {label}
                            </td>
                            <td className="px-4 py-2.5 text-right font-medium text-neutral-800 tabular-nums dark:text-neutral-200">
                              {value}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )
          case 'cards':
            return (
              <div key={i} className="mt-6 space-y-4">
                {block.items.map((card, j) => (
                  <div
                    key={j}
                    className={`rounded-xl border p-5 ${CARD_COLORS[card.color] ?? card.color}`}
                  >
                    <div className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {card.title}
                    </div>
                    {card.label && (
                      <div className="text-xs font-medium text-neutral-500 mt-0.5 mb-2 dark:text-neutral-400">
                        {card.label}
                      </div>
                    )}
                    <div className="text-[15px] leading-relaxed text-neutral-700 mt-1 dark:text-neutral-200">
                      {card.text}
                    </div>
                  </div>
                ))}
              </div>
            )
          case 'component': {
            const Component = COMPONENTS[block.name]
            if (!Component) return null
            return block.className ? (
              <div key={i} className={block.className}>
                <Component />
              </div>
            ) : (
              <Component key={i} />
            )
          }
        }
      })}
    </>
  )
}
