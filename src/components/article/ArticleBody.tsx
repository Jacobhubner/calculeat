import { Fragment } from 'react'
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

const LIST_GAP: Record<number, string> = { 1: 'space-y-1', 2: 'space-y-2', 4: 'space-y-4' }

/** Renderar en artikels body-blocklista med samma klasser som de gamla TSX-sidorna */
export function ArticleBody({ blocks }: { blocks: Block[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2
                key={i}
                className={`text-xl font-semibold text-neutral-900 ${block.tight ? 'mt-6' : 'mt-8'} mb-3`}
              >
                <Rich text={block.text} />
              </h2>
            )
          case 'h3':
            return (
              <h3 key={i} className="text-base font-semibold text-neutral-900 mt-6 mb-2">
                <Rich text={block.text} />
              </h3>
            )
          case 'p':
            return (
              <p key={i} className={block.flush ? undefined : 'mt-3'}>
                <Rich text={block.text} />
              </p>
            )
          case 'note':
            return (
              <p
                key={i}
                className={
                  block.subtle ? 'text-sm text-neutral-500' : 'mt-3 text-sm text-neutral-600'
                }
              >
                <Rich text={block.text} />
              </p>
            )
          case 'formula':
            return (
              <div
                key={i}
                className="bg-neutral-100 border border-neutral-200 rounded-lg px-4 py-3 my-4"
              >
                <p className="text-sm font-mono text-neutral-800">
                  <Rich text={block.text} />
                </p>
              </div>
            )
          case 'callout':
            return (
              <div
                key={i}
                className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 text-center font-medium text-neutral-900"
              >
                <Rich text={block.text} />
              </div>
            )
          case 'infoBox':
            return (
              <div
                key={i}
                className="bg-neutral-100 border border-neutral-200 rounded-lg px-4 py-3 my-4 space-y-1 text-sm"
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
            const marker = block.type === 'ul' ? 'list-disc' : 'list-decimal'
            return (
              <Tag key={i} className={`${gap} pl-4 ${marker} mt-2`}>
                {block.items.map((item, j) => (
                  <li key={j}>
                    <Rich text={item} />
                  </li>
                ))}
              </Tag>
            )
          }
          case 'table':
            return block.variant === 'bordered' ? (
              <div key={i} className="overflow-x-auto mt-3">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="bg-neutral-100">
                      {block.headers.map(h => (
                        <th
                          key={h}
                          className="text-left p-3 border border-neutral-200 font-semibold"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, r) => (
                      <tr key={r} className="even:bg-neutral-50">
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className={`p-3 border border-neutral-200 ${c === 0 ? 'font-medium text-neutral-700' : 'text-neutral-600'}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div key={i} className="overflow-x-auto rounded-lg border border-neutral-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-neutral-50 border-b border-neutral-200">
                    <tr>
                      {block.headers.map(h => (
                        <th key={h} className="px-4 py-3 text-left font-medium text-neutral-700">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {block.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td
                            key={c}
                            className={
                              c === 0
                                ? 'px-4 py-3 font-medium text-neutral-800 whitespace-nowrap'
                                : 'px-4 py-3 text-neutral-600'
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
              <div key={i} className="mt-4 grid sm:grid-cols-2 gap-4">
                {block.tables.map((t, j) => (
                  <div key={j} className="rounded-lg border border-neutral-200 overflow-hidden">
                    <div className="bg-neutral-100 px-4 py-2 text-sm font-semibold text-neutral-700">
                      {t.header}
                    </div>
                    <table className="w-full text-sm">
                      <tbody>
                        {t.rows.map(([label, value], r) => (
                          <tr key={r} className="border-t border-neutral-100">
                            <td className="px-4 py-2 text-neutral-700">{label}</td>
                            <td className="px-4 py-2 text-neutral-500 text-right">{value}</td>
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
              <div key={i} className="space-y-4">
                {block.items.map((card, j) => (
                  <div key={j} className={`rounded-xl border p-4 ${card.color}`}>
                    <div className="font-semibold text-neutral-800 mb-1">{card.title}</div>
                    {card.label && (
                      <div className="text-xs text-neutral-500 mb-2">{card.label}</div>
                    )}
                    <div className="text-sm text-neutral-700">{card.text}</div>
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
