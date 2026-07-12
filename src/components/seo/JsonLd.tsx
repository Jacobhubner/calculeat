import { Helmet } from 'react-helmet-async'

interface JsonLdProps {
  schema: Record<string, unknown> | Record<string, unknown>[]
}

export function JsonLd({ schema }: JsonLdProps) {
  return (
    // defer={false}: se kommentar i Seo.tsx — krävs för prerendering
    <Helmet defer={false}>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  )
}
