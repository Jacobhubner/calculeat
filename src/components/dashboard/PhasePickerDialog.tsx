import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { PrepDurationHelper } from './PrepDurationHelper'
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
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { DietPhaseType, PhaseFocus } from '@/lib/types'
import { suggestPhaseTargets } from '@/lib/calculations/dietPhases'
import { useStartDietPhase } from '@/hooks/useDietPhases'
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
  const [focus, setFocus] = useState<PhaseFocus>(initialFocus ?? 'health')
  const [selected, setSelected] = useState<DietPhaseType>(initialPhase ?? 'cut')
  const [weeks, setWeeks] = useState('')
  const [step, setStep] = useState('')
  /**
   * Vilket steg som visas. Öppnas på 'focus' för den som inte valt spår
   * förut, annars direkt på 'type' — den som byter period har redan svarat
   * och ska inte behöva göra det igen.
   */
  const [view, setView] = useState<'focus' | 'type'>('focus')

  /** Styrkespåret valt men kroppsfett saknas — då ersätts steg 2 av uppmaningen */
  const needsBodyFatFirst = focus === 'strength' && !canUseStrength

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
  }, [open, initialPhase, initialFocus])

  const suggestion = suggestPhaseTargets(
    selected,
    tdee,
    weightKg,
    focus,
    currentCalories,
    bodyFatPercentage
  )

  // Bara de fält användaren faktiskt kan ändra behöver state. Kalorimål och
  // protein läses direkt ur suggestion vid start.
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWeeks(suggestion.plannedWeeks ? String(suggestion.plannedWeeks) : '')
    setStep(suggestion.weeklyCalorieStep ? String(suggestion.weeklyCalorieStep) : '')
    // suggestion är härledd från dessa — undviker en ny referens varje render
  }, [open, selected, focus, tdee, weightKg, currentCalories, bodyFatPercentage]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleStart = () => {
    startPhase.mutate(
      {
        phaseType: selected,
        focus,
        // Planeringsfälten sparas bara med premium — annars skulle en
        // gratisanvändare få en tidsplan som UI:t sedan inte visar.
        plannedWeeks: hasPlanning && weeks ? Number(weeks) : null,
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
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
                          {t(`phase.descriptions.${type}`)}
                        </span>
                      </button>
                    )
                  })}
                </div>

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
                      {/* Tävlingsräknaren visas bara för cut i styrkespåret —
                          det är där tävlingsförberedelse hör hemma. För den
                          som vill gå ner 8 kg vore den bara brus. */}
                      {selected === 'cut' && focus === 'strength' && (
                        <PrepDurationHelper
                          weightKg={weightKg}
                          bodyFatPercentage={bodyFatPercentage}
                          onUseWeeks={w => setWeeks(String(w))}
                        />
                      )}
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
  )
}
