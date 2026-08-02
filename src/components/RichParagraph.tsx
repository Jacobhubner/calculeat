import { Fragment } from 'react'

/**
 * Renderar **fetstil** i i18n-strängar.
 *
 * Innehållet i pages-tools.json skrevs med markdown-markörer, men styckena
 * renderades rakt av — så `**TDEE är siffran**` visades bokstavligen med
 * asterisker på tio kalkylatorsidor.
 *
 * Avsiktligt minimal: bara `**fet**`, inget annat markdown. Att dra in en
 * full parser för det här skulle betyda att godtycklig HTML kan hamna i
 * översättningsfiler, och innehållet behöver bara det här.
 */
export function RichParagraph({ text }: { text: string }) {
  if (!text.includes('**')) return <>{text}</>

  // Udda index = innehåll mellan ett par asterisker
  const parts = text.split('**')
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : <Fragment key={i}>{part}</Fragment>
      )}
    </>
  )
}
