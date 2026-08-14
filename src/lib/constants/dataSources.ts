import type { FoodTab } from '@/hooks/useFoodItems'

export interface DataSourceConfig {
  id: string
  tabKey: FoodTab
  labelKey: string
  badgeClass: string
  /**
   * Locales där källan är förstahandsval, mest specifik först.
   * BCP 47-prefix: 'en-GB' matchar bara brittisk engelska, 'en' matchar all
   * engelska. Matchningen är prefixbaserad, så 'sv' fångar även 'sv-SE'.
   */
  primaryLocales: string[]
  /**
   * IANA-tidszoner där källan är förstahandsval när språket inte räcker.
   *
   * i18next normaliserar 'en-GB' → 'en', så språket ensamt kan aldrig skilja
   * en britt från en amerikan. Tidszonen kan. Prefixmatchning på segment:
   * 'America' fångar hela 'America/New_York'.
   *
   * Bara zoner som entydigt pekar ut källans marknad hör hemma här — en zon
   * som Europe/Stockholm ska INTE ge CoFID bara för att språket är engelska.
   */
  primaryTimeZones?: string[]
  /**
   * Viktar rankingen i search_food_items via food_items.data_quality_score.
   * Importskripten läser värdet härifrån, så registret är facit.
   */
  defaultQualityScore: number
  includeInAll: boolean
}

export const DATA_SOURCES: DataSourceConfig[] = [
  {
    id: 'livsmedelsverket',
    tabKey: 'slv',
    labelKey: 'tabs.slv',
    badgeClass:
      'bg-yellow-100 text-yellow-700 border-yellow-400 dark:bg-yellow-500/20 dark:text-yellow-200 dark:border-yellow-600',
    primaryLocales: ['sv'],
    primaryTimeZones: ['Europe/Stockholm'],
    defaultQualityScore: 100,
    includeInAll: true,
  },
  {
    id: 'usda',
    tabKey: 'usda',
    labelKey: 'tabs.usda',
    badgeClass:
      'bg-blue-100 text-blue-700 border-blue-400 dark:bg-blue-500/20 dark:text-blue-200 dark:border-blue-600',
    // 'en-US' först så CoFID kan ta 'en-GB' utan att krocka; 'en' kvar som
    // bred fallback för övrig engelska (en-AU, en-NZ …).
    primaryLocales: ['en-US', 'en'],
    // Hela America-trädet: USA, men även Kanada och Latinamerika, som saknar
    // egen källa här och står närmare USDA än CoFID.
    primaryTimeZones: ['America', 'Pacific/Honolulu'],
    defaultQualityScore: 90,
    includeInAll: true,
  },
  {
    id: 'cofid',
    tabKey: 'cofid',
    labelKey: 'tabs.cofid',
    badgeClass:
      'bg-rose-100 text-rose-700 border-rose-400 dark:bg-rose-500/20 dark:text-rose-200 dark:border-rose-600',
    // Mer specifikt än USDA:s 'en' — brittiska användare får CoFID, medan
    // en-US och en-AU fortsatt landar på USDA.
    primaryLocales: ['en-GB'],
    // Europe/Dublin: Irland har ingen egen källa och står kostmässigt närmare
    // CoFID än USDA. GB/GB-Eire är äldre alias som vissa system rapporterar.
    primaryTimeZones: ['Europe/London', 'Europe/Belfast', 'Europe/Dublin', 'GB'],
    defaultQualityScore: 95,
    includeInAll: true,
  },
]

/**
 * Källa vars primaryLocales bäst matchar angiven locale.
 *
 * Väljer mest specifik träff: för 'en-GB' vinner en källa med 'en-GB' över en
 * med bara 'en'. Utan träff returneras undefined — anroparen avgör fallback.
 *
 * Ersätter tidigare hårdkodad `locale.startsWith('sv') ? 'slv' : 'usda'`, som
 * inte kunde skilja en-GB från en-US och därför gav brittiska användare USDA.
 */
export function getDataSourceForLocale(locale: string): DataSourceConfig | undefined {
  const normalized = locale.toLowerCase()
  let best: { source: DataSourceConfig; specificity: number } | undefined

  for (const source of DATA_SOURCES) {
    for (const candidate of source.primaryLocales) {
      const lc = candidate.toLowerCase()
      // Exakt ('en-gb' mot 'en-gb') eller prefix på subtag-gräns ('en' mot 'en-gb').
      if (normalized !== lc && !normalized.startsWith(`${lc}-`)) continue
      // Längre mönster = mer specifikt, vinner över bredare träff.
      if (!best || lc.length > best.specificity) {
        best = { source, specificity: lc.length }
      }
    }
  }

  return best?.source
}

/**
 * Källa vars primaryTimeZones bäst matchar angiven IANA-tidszon.
 *
 * Används bara när språket inte kan avgöra: i18next normaliserar 'en-GB' → 'en',
 * så en britt och en amerikan ser identiska ut sett till locale. Tidszonen
 * skiljer dem åt.
 *
 * Matchar på hela segment, inte tecken: 'America' fångar 'America/New_York' men
 * 'Europe/Lon' fångar inte 'Europe/London'. Mest specifik träff vinner, så
 * 'Europe/London' slår ett bredare 'Europe' om båda skulle finnas.
 */
export function getDataSourceForTimeZone(timeZone: string): DataSourceConfig | undefined {
  const normalized = timeZone.toLowerCase()
  let best: { source: DataSourceConfig; specificity: number } | undefined

  for (const source of DATA_SOURCES) {
    for (const candidate of source.primaryTimeZones ?? []) {
      const tz = candidate.toLowerCase()
      if (normalized !== tz && !normalized.startsWith(`${tz}/`)) continue
      if (!best || tz.length > best.specificity) {
        best = { source, specificity: tz.length }
      }
    }
  }

  return best?.source
}

/**
 * Tar `string` snarare än `FoodTab`: anroparna har ofta bredare unioner som
 * även rymmer virtuella flikar ('alla', 'mina'). Funktionen returnerar ändå
 * undefined vid miss, så en snävare signatur hade bara tvingat fram cast.
 */
export function getDataSourceByTabKey(tabKey: string): DataSourceConfig | undefined {
  return DATA_SOURCES.find(ds => ds.tabKey === tabKey)
}

export function getDataSourceById(id: string): DataSourceConfig | undefined {
  return DATA_SOURCES.find(ds => ds.id === id)
}

export function getAllSourceIds(): string[] {
  return DATA_SOURCES.map(ds => ds.id)
}

export function getAllIncludedInAllSourceIds(): string[] {
  return DATA_SOURCES.filter(ds => ds.includeInAll).map(ds => ds.id)
}
