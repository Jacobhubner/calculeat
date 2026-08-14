/**
 * Färger för de tre makronutrienterna.
 *
 * Importera alltid härifrån — färgerna låg tidigare hårdkodade på 63 ställen i
 * 14 filer, vilket gjorde varje justering till en sök-och-ersätt-övning med
 * risk att missa något.
 *
 * ── Varför just dessa värden ────────────────────────────────────────────────
 *
 * Gult för fett är den enda semantiskt motiverade makrofärgen (smör, olja,
 * ost) och delas med MacroFactor. Den behålls.
 *
 * Kolhydrat var tidigare orange (#fb923c) och hamnade då på 1,07 mot fettets
 * gula vid deuteranopi — i praktiken samma färg för ~5 % av män. Blått löser
 * det (3,65) och sammanfaller dessutom med MyFitnessPals och Cronometers
 * konvention för kolhydrater.
 *
 * Protein var #f43f5e. Den ljusare rosan låg för nära gult vid färgblindhet;
 * #e6294c är den ljusaste rosa nyansen som förbättrar samtliga mätvärden mot
 * det gamla läget i stället för att byta en försämring mot en förbättring.
 *
 * Uppmätt (sämsta färgpar respektive sämsta färg mot bakgrund):
 *
 *              deuteranopi  protanopi  vit bg  mörk bg
 *   tidigare       1,07       1,47      1,63    4,46
 *   nuvarande      1,27       1,50      1,92    3,73
 *
 * MyFitnessPals egen palett (protein grön, fett röd) ligger på 1,22 och 1,15
 * och är alltså sämre än båda — därför följs den inte för protein och fett.
 *
 * ── Viktigt ─────────────────────────────────────────────────────────────────
 *
 * Inget par når 1,8, vilket är gränsen för att två fält säkert ska gå att
 * skilja åt. Färgen får därför aldrig vara ensam bärare av informationen —
 * behåll alltid siffra, etikett eller ikon bredvid.
 */
export const MACRO_COLORS = {
  fat: '#eab308',
  carbs: '#3b82f6',
  protein: '#e6294c',
} as const

export type MacroKey = keyof typeof MACRO_COLORS
