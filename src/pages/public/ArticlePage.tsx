import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Seo } from '@/components/seo/Seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { ArticleLayout } from '@/components/article/ArticleLayout'
import { ArticleBody } from '@/components/article/ArticleBody'
import { getPageConfigByKey, getHreflangAlternates } from '@/lib/config/pages'
import { getArticleMeta } from '@/content/articles/registry'
import { buildArticleSchemas } from '@/lib/seo/schema'
import { AUTHOR } from '@/lib/seo/constants'
import { deriveToc, deriveReadingMinutes } from '@/lib/articles/derive'
import type { ArticleContent } from '@/content/articles/types'
import type { SupportedLocale } from '@/lib/config/pages'

interface ArticlePageProps {
  articleKey: string
}

/**
 * Generisk artikelsida — ersätter en-TSX-fil-per-artikel.
 * Innehållet laddas som eget i18n-namespace (articles/{key}) från
 * public/locales/{lng}/articles/{key}.json och renderas blockvis.
 */
export default function ArticlePage({ articleKey }: ArticlePageProps) {
  const { pathname } = useLocation()
  const lng: SupportedLocale = pathname.startsWith('/en/') ? 'en' : 'sv'
  const ns = `articles/${articleKey}`

  // Cast: dynamiska artikel-namespaces finns inte i den statiska typaugmenteringen.
  // useTranslation sköter laddning + Suspense; innehållet läses som helt bundle.
  const { i18n } = useTranslation(ns as never, { lng })
  const { t: tLayout } = useTranslation('article-layout', { lng })
  const tAnchorCopy = tLayout('anchor.copyLabel')
  const content = (i18n.getResourceBundle(lng, ns) ??
    i18n.getResourceBundle('sv', ns)) as ArticleContent

  const meta = getArticleMeta(articleKey)!
  const pageConfig = getPageConfigByKey(articleKey)!
  const { items: tocItems, idByBlockIndex } = deriveToc(content.body)
  const readingMinutes = deriveReadingMinutes(content.body)
  const localeEntry = pageConfig.locales[lng] ?? pageConfig.locales.sv!
  const hreflangAlternates = getHreflangAlternates(pageConfig)

  const breadcrumb = [
    { label: content.layout.breadcrumb.hubLabel, href: content.layout.breadcrumb.hubPath },
    { label: content.layout.breadcrumb.pageLabel, href: localeEntry.canonical },
  ]

  const schemas = buildArticleSchemas({
    headline: content.schema.headline,
    description: content.schema.description,
    canonical: localeEntry.canonical,
    lng,
    datePublished: meta.datePublished,
    dateModified: meta.dateModified,
    breadcrumb,
  })

  return (
    <>
      <Seo
        title={content.seo.title}
        description={content.seo.description}
        canonical={localeEntry.canonical}
        hreflangAlternates={hreflangAlternates}
        locale={lng === 'en' ? 'en_US' : 'sv_SE'}
        type="article"
      />
      <JsonLd schema={schemas} />

      <ArticleLayout
        title={content.layout.title}
        intro={content.layout.intro}
        moneyPageHref={content.layout.moneyPageHref}
        moneyPageLabel={content.layout.moneyPageLabel}
        faqItems={content.faq}
        sources={content.sources}
        relatedCalculators={content.related?.calculators}
        relatedArticles={content.related?.articles}
        breadcrumb={breadcrumb}
        authorName={AUTHOR.name}
        dateModified={meta.dateModified}
        readingMinutes={readingMinutes}
        tocItems={tocItems}
      >
        <ArticleBody
          blocks={content.body}
          headingIds={idByBlockIndex}
          anchorCopyLabel={tAnchorCopy}
        />
      </ArticleLayout>
    </>
  )
}
