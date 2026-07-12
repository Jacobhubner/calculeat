import type { ArticleMeta } from './types'

/**
 * Registret över alla artiklar — enda stället en ny artikel registreras.
 * En post här + två innehållsfiler (public/locales/{sv,en}/articles/{key}.json)
 * ger automatiskt: route, canonical, hreflang, sitemap-post, Article- och
 * BreadcrumbList-schema samt synlig byline.
 *
 * datePublished/dateModified underhålls MANUELLT (redaktionell signal —
 * uppdatera dateModified när innehållet faktiskt ändras, inte vid refaktorer).
 * Initiala datum seedade från git-historiken 2026-07-12.
 */
export const ARTICLES: ArticleMeta[] = [
  {
    key: 'calorie-needs',
    paths: { sv: 'artiklar/kaloribehov', en: 'en/articles/calorie-needs' },
    datePublished: '2026-05-02',
    dateModified: '2026-06-21',
    priority: 0.8,
  },
  {
    key: 'what-is-tdee',
    paths: { sv: 'artiklar/vad-ar-tdee', en: 'en/articles/what-is-tdee' },
    datePublished: '2026-05-02',
    dateModified: '2026-06-28',
  },
  {
    key: 'calorie-deficit',
    paths: { sv: 'artiklar/kaloribrist', en: 'en/articles/calorie-deficit' },
    datePublished: '2026-05-02',
    dateModified: '2026-06-21',
  },
  {
    key: 'bulk-and-cut',
    paths: { sv: 'artiklar/bulk-och-cut', en: 'en/articles/bulk-and-cut' },
    datePublished: '2026-05-02',
    dateModified: '2026-06-21',
  },
  {
    key: 'reverse-diet',
    paths: { sv: 'artiklar/reverse-diet', en: 'en/articles/reverse-diet' },
    datePublished: '2026-05-02',
    dateModified: '2026-06-28',
  },
  {
    key: 'what-is-bmr',
    paths: { sv: 'artiklar/vad-ar-bmr', en: 'en/articles/what-is-bmr' },
    datePublished: '2026-05-03',
    dateModified: '2026-06-28',
  },
  {
    key: 'bmr-vs-rmr',
    paths: { sv: 'artiklar/bmr-vs-rmr', en: 'en/articles/bmr-vs-rmr' },
    datePublished: '2026-05-13',
    dateModified: '2026-06-21',
  },
  {
    key: 'bmr-vs-tdee',
    paths: { sv: 'artiklar/bmr-vs-tdee', en: 'en/articles/bmr-vs-tdee' },
    datePublished: '2026-05-03',
    dateModified: '2026-06-21',
  },
  {
    key: 'bmi-vs-bodyfat',
    paths: { sv: 'artiklar/bmi-vs-kroppsfett', en: 'en/articles/bmi-vs-body-fat' },
    datePublished: '2026-05-03',
    dateModified: '2026-06-21',
  },
  {
    key: 'what-is-ffmi',
    paths: { sv: 'artiklar/vad-ar-ffmi', en: 'en/articles/what-is-ffmi' },
    datePublished: '2026-05-03',
    dateModified: '2026-06-21',
  },
  {
    key: 'what-is-pal-and-met',
    paths: { sv: 'artiklar/vad-ar-pal-och-met', en: 'en/articles/what-is-pal-and-met' },
    datePublished: '2026-05-03',
    dateModified: '2026-06-21',
  },
  {
    key: 'lbm-vs-ffm',
    paths: { sv: 'artiklar/lbm-vs-ffm', en: 'en/articles/lbm-vs-ffm' },
    datePublished: '2026-05-14',
    dateModified: '2026-06-21',
  },
  {
    key: 'how-to-measure-bodyfat',
    paths: {
      sv: 'artiklar/hur-mater-man-kroppsfett',
      en: 'en/articles/how-to-measure-body-fat',
    },
    datePublished: '2026-05-14',
    dateModified: '2026-06-21',
  },
]

export function getArticleMeta(key: string): ArticleMeta | undefined {
  return ARTICLES.find(a => a.key === key)
}
