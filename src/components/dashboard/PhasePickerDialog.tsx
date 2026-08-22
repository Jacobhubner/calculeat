import { useState, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { PrepDurationHelper } from './PrepDurationHelper'
import { MeasureFirstInfo } from './MeasureFirstInfo'
import { DeficitLevelPicker } from './DeficitLevelPicker'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  TrendingDown,
  TrendingUp,
  Minus,
  ArrowUpRight,
  Dumbbell,
  HeartPulse,
  Lock,
  ChevronLeft,
  HelpCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DietPhaseType, PhaseFocus } from '@/lib/types'
import { suggestPhaseTargets } from '@/lib/calculations/dietPhases'
import { deficitLevelIdToLabel, type DeficitLevelId } from '@/lib/utils/deficitLevels'
import { useStartDietPhase } from '@/hooks/useDietPhases'
import { useActualCalorieIntake } from '@/hooks/useActualCalorieIntake'
import { useUpdateProfile, useActiveProfile } from '@/hooks'
import { useAuth } from '@/contexts/AuthContext'
import { macrosForMode } from '@/lib/utils/macroModes'
import { calculateLeanMass } from '@/lib/calculations/bodyComposition'
import { useEntitlements } from '@/hooks/useEntitlements'
import { useUpgradeModalStore } from '@/stores/upgradeModalStore'

/**
 * Visningsordning i väljaren. Underhåll först — det är utgångsläget och
 * kräver minst av användaren — sedan de två riktningarna, och upptrappning
 * sist eftersom den bara är relevant efter en avslutad nedgång.
 *
 * Endast presentation: `initialPhase` styr vad som är förvalt, och ordningen
 * påverkar varken lagring eller beräkning.
 */
const PHASE_TYPES: readonly DietPhaseType[] = ['maintenance', 'bulk', 'cut', 'reverse'] as const
// Hälsa först: det är det bredare spåret och kräver ingen kroppsfettmätning.
// Styrkespåret ligger tvåa och är låst tills kroppsfett är angivet.
const FOCUS_OPTIONS: readonly PhaseFocus[] = ['health', 'strength'] as const

/**
 * Mätperiodens längd i dagar. Fyra veckor, av samma skäl som
 * rekommendationen anger: mätosäkerheten är ±177 kcal/dag vid 14 dagar men
 * ±62 vid 28 (calibration-quality.ts).
 */
const MEASURE_WINDOW_DAYS = 28

const PHASE_ICON = {
  cut: TrendingDown,
  bulk: TrendingUp,
  maintenance: Minus,
  reverse: ArrowUpRight,
} as const

const FOCUS_ICON = {
  strength: Dumbbell,
  health: HeartPulse,
} as const

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  tdee: number
  weightKg: number
  /** Nuvarande kalorimål — reverse trappar upp härifrån, inte från en schablon */
  currentCalories?: number
  /** Sätt när kroppsfett är uppmätt; styr om Deff-läget kan appliceras */
  bodyFatPercentage?: number
  /** Förvald fas, t.ex. den som föreslås efter en avslutad cut */
  initialPhase?: DietPhaseType
  /** Förvalt fokusspår, normalt det den pågående fasen startades i */
  initialFocus?: PhaseFocus
}

export function PhasePickerDialog({
  open,
  onOpenChange,
  tdee,
  weightKg,
  currentCalories,
  bodyFatPercentage,
  initialPhase,
  initialFocus,
}: Props) {
  const { t, i18n } = useTranslation('dashboard')
  const navigate = useNavigate()

  /**
   * Gymtermen som visas som grå chip bredvid fasnamnet, eller '' när den
   * saknas medvetet.
   *
   * Hälsospåret har inga gymtermer för cut/bulk/maintenance — "Viktminskning"
   * ska inte ha "cut / deff" bredvid sig. En TOM STRÄNG i JSON fungerar inte:
   * appens i18n-konfiguration sätter returnEmptyString=false (avsiktligt, för
   * att fånga glömda översättningar), så en tom sträng renderas som det råa
   * nyckelnamnet. Nycklarna utelämnas därför helt, och exists() skiljer
   * "saknas medvetet" från "saknas av misstag".
   */
  const aliasFor = (f: PhaseFocus, type: DietPhaseType): string => {
    const key = `phase.aliases.${f}.${type}`
    if (!i18n.exists(`dashboard:${key}`)) return ''
    // Nyckeln finns (exists() ovan) — dynamiskt byggda nycklar går inte att
    // uttrycka i i18next-typerna, samma mönster som övriga t-anrop i filen
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(key as any) as string
  }
  const startPhase = useStartDietPhase()
  const updateProfile = useUpdateProfile()
  const { profile: activeProfile } = useActiveProfile()
  const { isPreviewMode } = useAuth()
  const profileId = activeProfile?.id

  // Styrkespåret bygger på Deff-/Bulk-lägen som räknar mot fettfri massa —
  // utan kroppsfettprocent går de inte att ge rätt siffror för.
  const canUseStrength = !!bodyFatPercentage
  const { limits } = useEntitlements()
  const openUpgradeModal = useUpgradeModalStore(state => state.open)
  /** Planering över tid (längd + upptrappning) är premium */
  const hasPlanning = limits.diet_phase_planning

  /**
   * Är TDEE en FORMELSKATTNING eller ett UPPMÄTT värde?
   *
   * En ny användare har ingen loggdata och kan inte kalibrera. Hennes TDEE
   * kommer då ur Mifflin plus en aktivitetsnivå hon själv gissat — och båda
   * felkällorna är stora. Ett steg fel på aktivitetsreglaget (lätt aktiv i
   * stället för stillasittande) är 13 % för en kvinna på 95 kg, vilket gör
   * att ett lovat tapp på 0,46 kg/vecka i praktiken blir 0,20.
   *
   * Perioden presenterade tidigare kalorimål och veckotakt som fakta oavsett
   * varifrån TDEE kom. Den som följde planen och inte såg resultatet drog
   * rimligen slutsatsen att appen har fel — eller att hon själv misslyckats.
   *
   * Bara metabolisk kalibrering mäter det faktiska värdet; övriga källor
   * ("manual" inräknad, eftersom ett handinmatat tal också är en gissning
   * tills det bekräftats mot utfall) är skattningar.
   */
  const tdeeIsEstimated = activeProfile?.tdee_source !== 'metabolic_calibration'

  /**
   * Loggade dagar de senaste fyra veckorna.
   *
   * Rekommendationen gäller en mätperiod på 28 dagar, så fönstret ska vara
   * detsamma — Översiktens beredskapskort använder 14 dagar för ett annat
   * syfte och går inte att låna rakt av.
   *
   * useMemo på datumen: utan det blir new Date() ett nytt objekt varje
   * render, queryKey ändras, och frågan körs om i all oändlighet.
   */
  const measureWindow = useMemo(() => {
    const end = new Date()
    const start = new Date(end.getTime() - MEASURE_WINDOW_DAYS * 24 * 60 * 60 * 1000)
    return { start, end }
  }, [])
  const { data: intakeWindow } = useActualCalorieIntake(
    measureWindow.start,
    measureWindow.end,
    open
  )
  const loggedDays = intakeWindow?.daysWithData ?? 0
  const [measureInfoOpen, setMeasureInfoOpen] = useState(false)

  const [focus, setFocus] = useState<PhaseFocus>(initialFocus ?? 'health')
  const [selected, setSelected] = useState<DietPhaseType>(initialPhase ?? 'cut')
  const [weeks, setWeeks] = useState('')
  const [step, setStep] = useState('')
  /**
   * Underskottsdjup för cut. 'normal' ger exakt de tal perioden gav innan
   * valet fanns (TDEE × 0,75–0,80), så förvalet ändrar ingenting för den
   * som inte rör reglaget.
   *
   * INTE premiumspärrat: det här är ett kalorimål, inte tidsplanering.
   * Gratisanvändare får redan välja kostläge fritt.
   */
  const [deficitLevel, setDeficitLevel] = useState<DeficitLevelId>('normal')
  /**
   * Vilket steg som visas. Öppnas på 'focus' för den som inte valt spår
   * förut, annars direkt på 'type' — den som byter period har redan svarat
   * och ska inte behöva göra det igen.
   */
  const [view, setView] = useState<'focus' | 'type'>('focus')

  /** Styrkespåret valt men kroppsfett saknas — då ersätts steg 2 av uppmaningen */
  const needsBodyFatFirst = focus === 'strength' && !canUseStrength

  /**
   * Rekommendera en mätperiod först.
   *
   * Villkoren: TDEE är skattat (annars finns inget att mäta), och
   * användaren är på väg att starta en NEDGÅNG eller UPPGÅNG — det är där
   * ett fel i utgångssiffran ger ett utfall som inte matchar löftet.
   * Väljer hon redan underhåll behövs ingen uppmaning; då gör hon det.
   *
   * TIDIGARE DOLDES DEN VID PERIODBYTE (initialFocus satt), med motiveringen
   * att den som redan kört en period inte är oerfaren. Fel signal: en period
   * kan ha gått utan att användaren loggat något, och då är TDEE fortfarande
   * en gissning. tdeeIsEstimated svarar redan på den frågan — det är HAR
   * MÄTNINGEN GJORTS som avgör, inte hur många perioder som passerat.
   */
  const suggestMeasureFirst = tdeeIsEstimated && (selected === 'cut' || selected === 'bulk')

  // Återställ valen varje gång dialogen öppnas, annars ligger föregående
  // val kvar nästa gång.
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected(initialPhase ?? 'cut')
    setFocus(initialFocus ?? 'health')
    // Har användaren redan ett spår (byter period) är frågan besvarad —
    // hoppa direkt till periodvalet. Annars en fråga i taget.
    setView(initialFocus ? 'type' : 'focus')
    setDeficitLevel('normal')
  }, [open, initialPhase, initialFocus])

  const suggestion = suggestPhaseTargets(
    selected,
    tdee,
    weightKg,
    focus,
    currentCalories,
    bodyFatPercentage,
    deficitLevel
  )

  // Bara de fält användaren faktiskt kan ändra behöver state. Kalorimål och
  // protein läses direkt ur suggestion vid start.
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWeeks(suggestion.plannedWeeks ? String(suggestion.plannedWeeks) : '')
    setStep(suggestion.weeklyCalorieStep ? String(suggestion.weeklyCalorieStep) : '')
    // suggestion är härledd från dessa — undviker en ny referens varje render
  }, [open, selected, focus, tdee, weightKg, currentCalories, bodyFatPercentage, deficitLevel]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = () => {
    startPhase.mutate(
      {
        phaseType: selected,
        focus,
        // Planeringsfälten sparas bara med premium — annars skulle en
        // gratisanvändare få en tidsplan som UI:t sedan inte visar.
        /**
         * Längden sparas ALLTID, med standardvärdet för gratis.
         *
         * Utan den kan en period aldrig ta slut på tid, och gratisanvändaren
         * får en period som ser trasig ut i stället för ett lås — samma
         * kategorifel som tidsberäknaren hade före 2026-08-19.
         *
         * Premium får ÄNDRA värdet; fältet ovan är gatat. Att välja hur
         * länge är planering, att veta att perioden tog slut är det inte.
         */
        plannedWeeks: weeks ? Number(weeks) : (suggestion.plannedWeeks ?? null),
        // Mittpunkten i kostlägets spann — samma tal som visas i rutan ovan
        targetCalories: suggestion.targetCalories,
        // Kolumnen är g/kg (CHECK 0,5–4,0). NNR-läget anger protein i
        // ENERGIPROCENT (10–20 E%), så proteinMaxGPerKg är 20 där — det
        // bröt mot villkoret och gav 400 för hälsospårets Underhåll och
        // Viktuppgång. Räkna om till g/kg ur kalorierna i stället:
        // E% av kcal / 4 kcal per gram / kroppsvikt.
        proteinGPerKg:
          suggestion.proteinBasis === 'energyPercent'
            ? Math.round((suggestion.proteinGramsMax / weightKg) * 100) / 100
            : suggestion.proteinMaxGPerKg,
        weeklyCalorieStep: hasPlanning && selected === 'reverse' && step ? Number(step) : null,
        // Bara för cut — RPC:n nollar den ändå för andra fastyper, men att
        // skicka null här gör avsikten tydlig på klientsidan.
        deficitLevel: selected === 'cut' ? deficitLevelIdToLabel(deficitLevel) : null,
      },
      {
        onSuccess: async () => {
          await applyToProfile()
          toast.success(t('phase.toast.started'))
          onOpenChange(false)
        },
      }
    )
  }

  /**
   * Skriver periodens mål till profilen: kaloriintervall och kostlägets
   * makrofördelning.
   *
   * Varför i klienten och inte i triggern: makroprocenten beror på kroppsvikt
   * och fettfri massa, som triggern inte har tillgång till. Den sätter därför
   * bara calorie_goal, deficit_level och show_energy_density.
   *
   * Varför perioden får sätta makron trots att specen sa "perioden sätter
   * aldrig makrofördelning": den regeln fanns för att skydda gränsen mot
   * `all_diet_modes`. Kostlägen är gratis sedan 2026-08-15, så skälet
   * försvann. Perioden pekar redan ut exakt ett kostläge — att applicera det
   * är inte en ny sanning, bara att göra det som ändå är avsett.
   *
   * Kalorierna är dessutom redan identiska med profilens egen härledning
   * (TDEE × 0,75–0,80 vid viktnedgång = deficit_level 20-25 %), så ingen
   * konkurrerande beräkning införs.
   *
   * Preview-läget: profilen är en sandlådekopia och triggern hoppar över
   * preview-rader, så skrivningen görs inte där heller — annars vore
   * halva kopplingen aktiv och halva inte.
   */
  const applyToProfile = async () => {
    if (!profileId || isPreviewMode) return

    const macros = macrosForMode(suggestion.macroMode, {
      weight: weightKg,
      fatFreeMass: bodyFatPercentage ? calculateLeanMass(weightKg, bodyFatPercentage) : undefined,
      caloriesMin: suggestion.targetCaloriesMin,
      caloriesMax: suggestion.targetCaloriesMax,
    })

    try {
      await updateProfile.mutateAsync({
        profileId,
        silent: true,
        data: {
          calories_min: suggestion.targetCaloriesMin,
          calories_max: suggestion.targetCaloriesMax,
          ...(macros
            ? {
                fat_min_percent: macros.fatMinPercent,
                fat_max_percent: macros.fatMaxPercent,
                carb_min_percent: macros.carbMinPercent,
                carb_max_percent: macros.carbMaxPercent,
                protein_min_percent: macros.proteinMinPercent,
                protein_max_percent: macros.proteinMaxPercent,
              }
            : {}),
        },
      })
    } catch {
      // Perioden är redan startad och triggern har satt calorie_goal —
      // en utebliven målskrivning får inte se ut som att starten misslyckades.
      // Nästa kalibrering eller TDEE-omräkning härleder värdena ur
      // calorie_goal ändå.
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        {/*
          MeasureFirstInfo renderas i en EGEN portal på document.body, alltså
          utanför Radix content-träd. Radix tolkar därför varje klick och
          scroll i den som "utanför dialogen" och stänger periodvalet — den
          som öppnade förklaringen tappade alltså sitt periodval bakom den,
          och kunde varken scrolla eller klicka utan att allt försvann.

          Guarderna avbryter bara medan den nästlade modalen är öppen. Är den
          stängd beter sig dialogen precis som förut: klick utanför stänger.
        */}
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
          onPointerDownOutside={e => {
            if (measureInfoOpen) e.preventDefault()
          }}
          onInteractOutside={e => {
            if (measureInfoOpen) e.preventDefault()
          }}
          onEscapeKeyDown={e => {
            // Esc ska stänga den översta modalen, inte den under.
            if (measureInfoOpen) e.preventDefault()
          }}
        >
          <DialogHeader>
            {/* Tillbakaknappen hör till huvudet, inte till innehållet: inklämd
              under beskrivningen såg den ut att tillhöra periodlistan, och
              på smal skärm hamnade den mitt i en textmassa. */}
            {view === 'type' && (
              <button
                type="button"
                onClick={() => setView('focus')}
                className="-ml-1 mb-1 flex items-center gap-1 self-start rounded px-1 py-0.5 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
              >
                <ChevronLeft className="h-3.5 w-3.5 shrink-0" />
                {t(`phase.focus.${focus}`)}
              </button>
            )}
            <DialogTitle>{t('phase.modal.title')}</DialogTitle>
            <DialogDescription>{t('phase.modal.subtitle')}</DialogDescription>
          </DialogHeader>

          {/*
          Preview är en sandlåda: profilen är en kopia och databastriggern
          hoppar över preview-rader. Perioden startas alltså, men kalorimål
          och makrofördelning når aldrig den riktiga profilen. Utan den här
          raden ser det ut som en bugg.
        */}
          {isPreviewMode && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:bg-amber-900/25 dark:text-amber-200">
              {t('phase.modal.previewNotice')}
            </p>
          )}

          {/*
          STEG 1 — egen vy, inte en ruta ovanför resten.
          Fokusvalet byter namn på alla fyra periodtyperna, byter kostläge och
          byter siffrorna. Att visa det jämbördigt med resten gjorde att det
          missades — och allt på en skärm blev ~12 element för någon som varit
          i appen i några minuter. En fråga i taget.

          Den som redan har ett fokus (byter period) hoppar direkt till steg 2
          och ser i praktiken en klick FÄRRE än förut; tillbakaknappen finns om
          hen vill byta spår.
        */}
          {view === 'focus' ? (
            <div className="space-y-4">
              <div
                role="radiogroup"
                aria-label={t('phase.focusLabel')}
                className="grid grid-cols-1 gap-3"
              >
                {FOCUS_OPTIONS.map(f => {
                  const Icon = FOCUS_ICON[f]
                  const active = focus === f
                  return (
                    <button
                      key={f}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setFocus(f)}
                      className={cn(
                        'flex items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors',
                        active
                          ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/25'
                          : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
                      )}
                    >
                      <Icon
                        className={cn(
                          'mt-0.5 h-5 w-5 shrink-0',
                          active
                            ? 'text-primary-600 dark:text-primary-300'
                            : 'text-neutral-500 dark:text-neutral-400'
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                          {t(`phase.focus.${f}`)}
                        </span>
                        <span className="mt-0.5 block text-xs text-neutral-600 dark:text-neutral-400">
                          {t(`phase.focus.${f}Desc`)}
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
                <Button
                  variant="outline"
                  className="h-12 flex-1 text-base sm:h-11 sm:text-sm"
                  onClick={() => onOpenChange(false)}
                >
                  {t('phase.modal.cancel')}
                </Button>
                <Button
                  className="h-12 flex-1 text-base sm:h-11 sm:text-sm"
                  onClick={() => setView('type')}
                >
                  {t('phase.modal.next')}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/*
            Styrkespåret valt utan kroppsfett: uppmaningen ERSÄTTER steg 2 och
            allt nedanför. Att visa fasval + kostläge + start-knapp här vore
            missvisande — Deff-/Bulk-lägena räknar mot fettfri massa och kan
            inte ge rätt siffror förrän kroppsfettet är uppmätt.
          */}
              {needsBodyFatFirst ? (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/25">
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                    {t('phase.bodyFatNeeded.title')}
                  </p>
                  <p className="mt-1 text-xs text-amber-800 dark:text-amber-200">
                    {t('phase.strengthNeedsBodyFat')}
                  </p>
                  <Button
                    size="sm"
                    className="mt-3 text-xs"
                    onClick={() => {
                      onOpenChange(false)
                      // ?returnTo=phase gör att beräknaren visar en väg
                      // tillbaka hit efter sparad mätning. Utan det var detta
                      // en återvändsgränd: dialogen stängdes och användaren
                      // fick själv lista ut var perioden låg.
                      navigate('/app/body-composition/calculate?returnTo=phase')
                    }}
                  >
                    {t('phase.bodyFatNeeded.cta')}
                  </Button>
                </div>
              ) : (
                <>
                  {/* Fastyp. Namnen och kostläget nedan följer av fokusvalet.
                  Stegnumret behövs inte längre — tillbakaknappen ovanför
                  visar vilket spår man kommer från. */}
                  <Label className="text-sm font-semibold">{t('phase.typeLabel')}</Label>

                  {/* Inget negativt marginaltillägg: -mt-2 kompenserade tidigare
                    space-y-5 när rubriken hade ett stegnummer bredvid sig, men
                    drog korten upp ÖVER rubriken på smala skärmar. */}
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {PHASE_TYPES.map(type => {
                      const Icon = PHASE_ICON[type]
                      const active = selected === type
                      const alias = aliasFor(focus, type)
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setSelected(type)}
                          className={cn(
                            'flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-colors',
                            active
                              ? 'border-primary-500 bg-primary-50 dark:border-primary-400 dark:bg-primary-900/25'
                              : 'border-neutral-200 hover:border-neutral-300 dark:border-neutral-700 dark:hover:border-neutral-600'
                          )}
                        >
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                            <Icon
                              className={cn(
                                'h-4 w-4 shrink-0',
                                active
                                  ? 'text-primary-600 dark:text-primary-300'
                                  : 'text-neutral-500 dark:text-neutral-400'
                              )}
                            />
                            <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                              {t(`phase.types.${focus}.${type}`)}
                            </span>
                            {alias && (
                              <span className="rounded bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
                                {alias}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-neutral-600 dark:text-neutral-400">
                            {t(`phase.descriptions.${focus}.${type}`)}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  {/*
            Underskottsdjup — bara för viktnedgång. Ligger FÖRE sammanfattningen
            nedan så att kalorisiffrorna syns ändra sig när nivån byts; låg den
            efter skulle valet se ut att sakna effekt.

            Ingen premiumspärr: detta är ett kalorimål, och kostlägen är gratis
            sedan 2026-08-15. Att låsa djupet men inte fördelningen vore
            godtyckligt.
          */}
                  {selected === 'cut' && (
                    <DeficitLevelPicker
                      value={deficitLevel}
                      onChange={setDeficitLevel}
                      tdee={tdee}
                      weightKg={weightKg}
                    />
                  )}

                  {/* Sägs FÖRE kalorimålet, inte efter. Läser man siffran
                    först och förbehållet sedan har man redan bildat sig en
                    uppfattning om vad som ska hända. */}
                  {tdeeIsEstimated && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/25">
                      <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">
                        {t('phase.estimatedTdeeTitle')}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-blue-900/90 dark:text-blue-300">
                        {t('phase.estimatedTdeeBody')}
                      </p>
                      <p className="mt-1.5 text-xs leading-relaxed text-blue-900/90 dark:text-blue-300">
                        {t('phase.estimatedTdeeAction')}
                      </p>
                    </div>
                  )}

                  {/* Rekommendationen att mäta först. Egen ruta under
                    förbehållet: den ena säger vad problemet är, den andra
                    vad man kan göra åt det. */}
                  {suggestMeasureFirst && (
                    <div className="rounded-lg border border-primary-200 bg-primary-50 p-3 dark:border-primary-800 dark:bg-primary-900/25">
                      <p className="text-xs font-semibold text-primary-900 dark:text-primary-200">
                        {t('phase.measureFirstTitle')}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-primary-900/90 dark:text-primary-300">
                        {t('phase.measureFirstBody')}
                      </p>
                      {/* Har hon redan börjat logga är "börja mäta" fel
                          uppmaning — visa i stället hur långt hon kommit.
                          Ett tal som rör sig motiverar bättre än en
                          uppmaning som ser likadan ut varje gång. */}
                      {loggedDays > 0 && (
                        <p className="mt-1.5 text-xs font-medium tabular-nums text-primary-900 dark:text-primary-200">
                          {t('phase.measureFirstProgress', {
                            current: loggedDays,
                            total: MEASURE_WINDOW_DAYS,
                          })}
                        </p>
                      )}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSelected('maintenance')}
                          className="h-7 text-xs"
                        >
                          {t('phase.measureFirstPick')}
                        </Button>
                        {/* Såg ut som löptext bredvid knappen — en frågeikon
                            och en ram gör att den läses som klickbar utan att
                            konkurrera med huvudvalet, som behåller sin
                            fyllda knapp. */}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setMeasureInfoOpen(true)}
                          className="h-7 gap-1.5 border border-primary-300 text-xs text-primary-800 hover:bg-primary-100 dark:border-primary-700 dark:text-primary-200 dark:hover:bg-primary-900/40"
                        >
                          <HelpCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          {t('phase.measureFirstCta')}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/*
            Kostläget fasen pekar mot — samma uppställning som kostlägeskortet
            i profilen (Energimål / Fett / Kolhydrater / Protein), så att
            användaren känner igen sig och ser att det är SAMMA siffror.
          */}
                  <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 dark:border-neutral-700 dark:bg-neutral-900">
                    <p className="text-xs font-medium text-neutral-700 dark:text-neutral-200">
                      {t('phase.macroMode.label')}:{' '}
                      <span className="font-semibold text-primary-700 dark:text-primary-300">
                        {t(`macroModes.${suggestion.macroMode}Name`, { ns: 'profile' })}
                      </span>
                    </p>
                    <dl className="mt-2 space-y-0.5 text-xs text-neutral-600 dark:text-neutral-400">
                      <div className="flex flex-wrap gap-x-1.5">
                        <dt>{t('phase.macroMode.energy')}:</dt>
                        <dd className="font-medium text-neutral-800 dark:text-neutral-200">
                          {suggestion.targetCaloriesMin}–{suggestion.targetCaloriesMax} kcal
                          {suggestion.calorieDeviationLabel && (
                            <span className="font-normal text-neutral-500 dark:text-neutral-400">
                              {' '}
                              ({suggestion.calorieDeviationLabel})
                            </span>
                          )}
                        </dd>
                      </div>
                      {/* flex-wrap: proteinraden är lång (g/kg + gram inom
                        parentes) och bröt inte på smal skärm. */}
                      <div className="flex flex-wrap gap-x-1.5">
                        <dt>{t('phase.macroMode.protein')}:</dt>
                        <dd className="font-medium text-neutral-800 dark:text-neutral-200">
                          {/* NNR anger protein i energiprocent (E%), övriga i g/kg */}
                          {suggestion.proteinBasis === 'energyPercent'
                            ? `${suggestion.proteinMinGPerKg}–${suggestion.proteinMaxGPerKg} E%`
                            : `${suggestion.proteinMinGPerKg}–${suggestion.proteinMaxGPerKg} g/kg${
                                suggestion.proteinBasis === 'ffm' ? ' FFM' : ''
                              }`}{' '}
                          ({suggestion.proteinGramsMin}–{suggestion.proteinGramsMax} g)
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-xs text-neutral-500 dark:text-neutral-400">
                      {t('phase.macroMode.hint')}
                    </p>
                    {/*
                      Träningen nämns DÄR BESLUTET FATTAS, inte bara i
                      tidsräknaren. Texten fanns redan som
                      phase.prep.gainStrengthTraining men renderades bara när
                      räknaren öppnades vid uppgång — den som valde
                      styrkespåret och startade en bulk direkt såg den aldrig.

                      Ingen spärr: träning går inte att verifiera, och en
                      fråga användaren kan svara fel på ger friktion utan
                      säkerhet.
                    */}
                    {focus === 'strength' && selected === 'bulk' && (
                      <p className="mt-2 text-xs text-neutral-600 dark:text-neutral-300">
                        {t('phase.strengthBulkTraining')}
                      </p>
                    )}
                  </div>

                  {/*
            Kalorimål och protein har INGA egna fält — de kommer från
            kostläget och visas i rutan ovan. Ett redigerbart fält här skulle
            låta användaren skriva ett värde som avviker från kostläget, och
            då är vi tillbaka i den divergens vi just byggt bort. Vill man
            ändra siffrorna byter man kostläge (eller fas).
          */}
                  {/*
            Planerad längd och upptrappning är PLANERING ÖVER TID och därmed
            premium (diet_phase_planning). Fasen går att starta utan dem —
            gratisanvändaren får kalori- och proteinmål och en veckoräknare,
            men ingen tidsplan och ingen automatisk upptrappning.
          */}
                  {/* Tidsräknaren ligger UTANFÖR premiumgränsen (flyttad
                    2026-08-19). Gränsen heter diet_phase_planning och gäller
                    planering över tid — att räkna ut hur lång tid något tar
                    är inte planering, och exakt samma svar finns redan
                    gratis i Målsättning. Att låsa det här hade varit en
                    gräns som bara den oinvigde stötte på.

                    Det som förblir premium är att ANVÄNDA resultatet som
                    faslängd — knappen inuti räknaren är därför villkorad,
                    och fältet Planerad längd ligger kvar i gaten nedan.

                    Visas i BÅDA fokusspåren (ändrat 2026-08-19). Den låg
                    tidigare bara i styrkespåret, trots att komponentens egen
                    beskrivning säger att den är för alla som vill gå ner —
                    frågan "hur lång tid tar det" är minst lika relevant för
                    den som vill gå ner åtta kilo som för den som tävlar.

                    Hälsospåret kräver inte kroppsfettprocent, och räknaren
                    behöver den. PrepDurationHelper returnerar null utan
                    mätvärde, så den försvinner då av sig själv i stället för
                    att visa en trasig ruta. */}
                  {/* Även för UPPGÅNG (tillagt 2026-08-22). Räknaren låg
                      bara på cut, så "hur lång tid tar det" fanns inte för
                      den som vill gå upp — varken i hälsospårets Gå upp i
                      vikt eller i styrkespårets Bygga muskler. Frågan är
                      densamma; takten är en annan (Iraki 2019), och
                      uppgången kräver inte kroppsfettmätning. */}
                  {(selected === 'cut' || selected === 'bulk') && (
                    <PrepDurationHelper
                      weightKg={weightKg}
                      tdee={tdee}
                      bodyFatPercentage={bodyFatPercentage}
                      gender={
                        activeProfile?.gender === 'male' || activeProfile?.gender === 'female'
                          ? activeProfile.gender
                          : undefined
                      }
                      level={deficitLevel}
                      focus={focus}
                      direction={selected === 'bulk' ? 'gain' : 'loss'}
                      /* Uppgångens takt härleds ur fasens EGET kalorimål,
                         inte ur en fast evidenssiffra. Annars visade
                         Perioder 0,20 kg/v där Målsättning visade
                         0,26–0,52 för samma mål — se weeklyRate.ts, som
                         finns just för att hålla dem samstämmiga. */
                      caloriesMin={suggestion.targetCaloriesMin}
                      caloriesMax={suggestion.targetCaloriesMax}
                      onUseWeeks={hasPlanning ? w => setWeeks(String(w)) : undefined}
                    />
                  )}

                  {hasPlanning ? (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="phase-weeks">{t('phase.modal.plannedWeeks')}</Label>
                        <Input
                          id="phase-weeks"
                          type="number"
                          inputMode="numeric"
                          value={weeks}
                          onChange={e => setWeeks(e.target.value)}
                        />
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {t('phase.weeksNotice')}
                        </p>
                      </div>

                      {selected === 'reverse' && (
                        <div className="space-y-1.5">
                          <Label htmlFor="phase-step">{t('phase.modal.weeklyStepLabel')}</Label>
                          <Input
                            id="phase-step"
                            type="number"
                            inputMode="numeric"
                            value={step}
                            onChange={e => setStep(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => openUpgradeModal('diet_phase_planning')}
                      className="flex w-full items-start gap-2 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2.5 text-left text-xs text-amber-800 transition-colors hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-900/25 dark:text-amber-200 dark:hover:bg-amber-900/40"
                    >
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>
                        {selected === 'reverse'
                          ? t('phase.planningLockedReverse')
                          : t('phase.planningLocked')}
                      </span>
                    </button>
                  )}
                </>
              )}

              {/* Perioden fungerar tekniskt utan loggning, men appen kan då
                varken visa om du följer den eller om den ger resultat.
                Formulerat som uppföljning, inte som en tröskel. */}
              {!needsBodyFatFirst && (
                <p className="pt-1 text-xs text-neutral-500 dark:text-neutral-400">
                  {t('phase.trackingNotice')}
                </p>
              )}

              <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row">
                <Button
                  variant="outline"
                  className="h-12 flex-1 text-base sm:h-11 sm:text-sm"
                  onClick={() => onOpenChange(false)}
                  disabled={startPhase.isPending}
                >
                  {needsBodyFatFirst ? t('phase.modal.close') : t('phase.modal.cancel')}
                </Button>
                {!needsBodyFatFirst && (
                  <Button
                    className="h-12 flex-1 text-base sm:h-11 sm:text-sm"
                    onClick={handleStart}
                    disabled={startPhase.isPending}
                  >
                    {t('phase.modal.start')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <MeasureFirstInfo open={measureInfoOpen} onClose={() => setMeasureInfoOpen(false)} />
    </>
  )
}
