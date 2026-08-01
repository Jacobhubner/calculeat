/**
 * Kopplingen mellan desktop-sidebarens grupper och onboarding-tourens spotlight.
 *
 * Tidigare härleddes selektorn från nycklarna i DashboardNavs `navGroups`
 * (`data-tour={`nav-${key.toLowerCase()}`}`) medan touren hårdkodade samma
 * strängar. Ett namnbyte på en gruppnyckel bröt kopplingen tyst — spotlighten
 * hittade inget element, `measureTarget` returnerade tidigt och overlayen
 * ritades helt enkelt aldrig ut.
 *
 * Nu är listan här den enda källan. Båda sidor är typade mot `TourGroupKey`,
 * så ett namnbyte blir ett kompileringsfel i stället för en tyst regression.
 */
export const TOUR_GROUP_KEYS = ['oversikt', 'planering', 'minplan', 'social'] as const

export type TourGroupKey = (typeof TOUR_GROUP_KEYS)[number]

/** Värdet som sätts som `data-tour` på gruppens wrapper i sidebaren. */
export const tourAttr = (key: TourGroupKey) => `nav-${key}`

/** Selektorn touren använder för att hitta samma element. */
export const tourSelector = (key: TourGroupKey) => `[data-tour="nav-${key}"]`
