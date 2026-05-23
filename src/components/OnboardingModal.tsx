import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { motion, AnimatePresence } from 'framer-motion'
import {
  TrendingDown,
  Minus,
  TrendingUp,
  Check,
  Zap,
  BarChart2,
  Apple,
  AlertCircle,
  CalendarDays,
  UtensilsCrossed,
  Target,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useActiveProfile } from '@/hooks/useActiveProfile'
import { useUpdateProfile } from '@/hooks/useUpdateProfile'
import { useAuth } from '@/contexts/AuthContext'
import type { Gender, CalorieGoal } from '@/lib/types'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type T = (key: string, opts?: any) => string

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStep?: number
  onStepChange?: (step: number) => void
}

type GoalKey = 'lose' | 'maintain' | 'gain'

const GOAL_MAP: Record<GoalKey, CalorieGoal> = {
  lose: 'Weight loss',
  maintain: 'Maintain weight',
  gain: 'Weight gain',
}

// Steps: 0=Welcome, 1=Tour, 2=Goal, 3=BodyData, 4=Done
const TOTAL_STEPS = 5

function estimateTDEE(gender: Gender, weightKg: number, heightCm: number, birthYear: number) {
  const age = new Date().getFullYear() - birthYear
  const bmr =
    gender === 'male'
      ? 88.4 + 13.4 * weightKg + 4.8 * heightCm - 5.7 * age
      : 447.6 + 9.2 * weightKg + 3.1 * heightCm - 4.3 * age
  const tdee = Math.round((bmr * 1.4) / 50) * 50
  return tdee
}

export default function OnboardingModal({
  open,
  onOpenChange,
  initialStep = 0,
  onStepChange,
}: OnboardingModalProps) {
  const { t, i18n } = useTranslation('onboarding')
  const [nsReady, setNsReady] = useState(() => i18n.exists('step1.title', { ns: 'onboarding' }))
  useEffect(() => {
    if (nsReady) return
    const check = () => {
      if (i18n.exists('step1.title', { ns: 'onboarding' })) setNsReady(true)
    }
    i18n.on('loaded', check)
    return () => {
      i18n.off('loaded', check)
    }
  }, [i18n, nsReady])

  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile: activeProfile } = useActiveProfile()
  const updateProfile = useUpdateProfile()

  const [currentStep, setCurrentStep] = useState(initialStep)
  const [selectedGoal, setSelectedGoal] = useState<GoalKey | null>(null)
  const [selectedGender, setSelectedGender] = useState<Gender | null>(null)
  const [selectedYear, setSelectedYear] = useState('')
  const [heightString, setHeightString] = useState('')
  const [weightString, setWeightString] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [direction, setDirection] = useState(1)
  // Tour is running when currentStep === 1
  const [tourActive, setTourActive] = useState(false)

  const heightRef = useRef<HTMLInputElement>(null)
  const weightRef = useRef<HTMLInputElement>(null)
  const liveRef = useRef<HTMLDivElement>(null)

  const advanceStep = useCallback(
    (next: number) => {
      setDirection(1)
      setCurrentStep(next)
      onStepChange?.(next)
      setTimeout(() => liveRef.current?.focus(), 50)
    },
    [onStepChange]
  )

  if (!nsReady) return null

  const height = parseFloat(heightString)
  const weight = parseFloat(weightString)
  const year = parseInt(selectedYear)

  const step3Valid =
    !!selectedGender &&
    !!selectedYear &&
    !isNaN(height) &&
    height >= 100 &&
    height <= 250 &&
    !isNaN(weight) &&
    weight >= 20 &&
    weight <= 400

  const estimatedTDEE =
    step3Valid && selectedGender ? estimateTDEE(selectedGender, weight, height, year) : null

  const profileName = user?.user_metadata?.full_name?.split(' ')[0] ?? null

  const handleNext = async () => {
    // Step 4 (index 4) = final step: save profile
    if (currentStep === TOTAL_STEPS - 1) {
      if (!activeProfile?.id) return
      setIsSaving(true)
      setSaveError(false)
      try {
        await updateProfile.mutateAsync({
          profileId: activeProfile.id,
          data: {
            birth_date: `${selectedYear}-01-01`,
            gender: selectedGender!,
            height_cm: height,
            weight_kg: weight,
            initial_weight_kg: weight,
            calorie_goal: GOAL_MAP[selectedGoal!],
          },
          silent: true,
        })
        // Navigate to profile to complete setup
        onOpenChange(false)
        navigate('/app/profile')
      } catch {
        setSaveError(true)
      } finally {
        setIsSaving(false)
      }
      return
    }

    // Step 1 (index 1) = tour: activate spotlight
    if (currentStep === 1) {
      setTourActive(true)
      return
    }

    advanceStep(currentStep + 1)
  }

  const handleTourDone = () => {
    setTourActive(false)
    advanceStep(2)
  }

  const handleSkip = () => {
    onOpenChange(false)
  }

  const handleExploreDashboard = () => {
    onOpenChange(false)
    navigate('/app')
  }

  const step2Ready = selectedGoal !== null
  const canAdvance =
    currentStep === 0
      ? true
      : currentStep === 1
        ? true
        : currentStep === 2
          ? step2Ready
          : currentStep === 3
            ? step3Valid
            : true

  const progressValue = ((currentStep + 1) / TOTAL_STEPS) * 100

  return (
    <>
      {/* Spotlight tour renders via portal, outside modal stacking context */}
      {tourActive && <SpotlightTour t={t as T} onDone={handleTourDone} onSkip={handleTourDone} />}

      <Dialog
        open={open && !tourActive}
        onOpenChange={open => {
          if (!tourActive) onOpenChange(open)
        }}
      >
        <DialogContent
          className="sm:max-w-[520px] max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-3xl"
          aria-describedby={undefined}
        >
          <DialogTitle className="sr-only">{(t as T)('step1.title')}</DialogTitle>
          <div
            ref={liveRef}
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            tabIndex={-1}
          >
            {(t as T)('accessibility.step', { current: currentStep + 1, total: TOTAL_STEPS })}
          </div>
          <div className="px-6 pt-5">
            <Progress value={progressValue} className="h-1" />
          </div>

          <div className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: direction * 32 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -32 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="px-6 py-8"
              >
                {currentStep === 0 && <Step1 t={t as T} />}
                {currentStep === 1 && <TourIntro t={t as T} />}
                {currentStep === 2 && (
                  <StepGoal t={t as T} selectedGoal={selectedGoal} onSelect={setSelectedGoal} />
                )}
                {currentStep === 3 && (
                  <StepBody
                    t={t as T}
                    selectedGender={selectedGender}
                    onGenderSelect={setSelectedGender}
                    selectedYear={selectedYear}
                    onYearChange={setSelectedYear}
                    heightString={heightString}
                    onHeightChange={setHeightString}
                    weightString={weightString}
                    onWeightChange={setWeightString}
                    height={height}
                    weight={weight}
                    heightRef={heightRef}
                    weightRef={weightRef}
                    onNext={canAdvance ? handleNext : undefined}
                  />
                )}
                {currentStep === 4 && (
                  <StepDone
                    t={t as T}
                    profileName={profileName}
                    estimatedTDEE={estimatedTDEE}
                    onExplore={handleExploreDashboard}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="sticky bottom-0 bg-white px-6 pb-6 pt-2 flex flex-col items-center gap-3 md:static md:pt-0">
            {saveError && (
              <div className="w-full flex items-center gap-2 text-sm text-error-600 bg-error-50 rounded-xl px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{(t as T)('actions.saveError')}</span>
              </div>
            )}
            {/* Final step has its own CTA buttons inside StepDone */}
            {currentStep < TOTAL_STEPS - 1 && (
              <Button
                onClick={handleNext}
                disabled={!canAdvance || isSaving}
                className="w-full h-12 text-base rounded-2xl"
              >
                {currentStep === 1 ? (t as T)('tour.next') : (t as T)('actions.next')}
              </Button>
            )}
            {currentStep === 0 && (
              <button
                onClick={handleSkip}
                className="text-sm text-neutral-400 underline underline-offset-2 hover:text-neutral-500 transition-colors"
              >
                {(t as T)('actions.skip')}
              </button>
            )}
            {currentStep === TOTAL_STEPS - 1 && (
              <>
                <Button
                  onClick={handleNext}
                  disabled={!canAdvance || isSaving}
                  className="w-full h-12 text-base rounded-2xl"
                >
                  {isSaving ? (t as T)('actions.saving') : (t as T)('step4.primaryCta')}
                </Button>
                <button
                  onClick={handleExploreDashboard}
                  className="text-sm text-neutral-400 underline underline-offset-2 hover:text-neutral-500 transition-colors"
                >
                  {(t as T)('step4.secondaryCta')}
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function Step1({ t }: { t: T }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div
        className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg"
        style={{ boxShadow: '0 8px 32px hsla(108,100%,37%,0.3)' }}
      >
        <Apple className="h-9 w-9 text-white" />
      </div>
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">{t('step1.title')}</h2>
        <p className="text-neutral-500 text-base">{t('step1.subtitle')}</p>
      </div>
      <div className="w-full flex flex-col gap-3 text-left mt-2">
        <ValueRow icon={<Zap className="h-5 w-5 text-primary-600" />} text={t('step1.value1')} />
        <ValueRow
          icon={<BarChart2 className="h-5 w-5 text-primary-600" />}
          text={t('step1.value2')}
        />
        <ValueRow icon={<Check className="h-5 w-5 text-primary-600" />} text={t('step1.value3')} />
      </div>
    </div>
  )
}

function ValueRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
        {icon}
      </div>
      <span className="text-neutral-700 text-sm font-medium">{text}</span>
    </div>
  )
}

// ─── Step 2 intro: before tour launches ───────────────────────────────────────

function TourIntro({ t }: { t: T }) {
  return (
    <div className="flex flex-col items-center text-center gap-6">
      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-accent-400 to-primary-600 flex items-center justify-center shadow-lg">
        <Target className="h-9 w-9 text-white" />
      </div>
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-2">{t('tour.title')}</h2>
        <p className="text-neutral-500 text-base">{t('tour.subtitle')}</p>
      </div>
      <div className="w-full flex flex-col gap-3 text-left mt-2">
        {TOUR_SECTIONS.map(s => (
          <div key={s.key} className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
              <s.Icon className="h-5 w-5 text-primary-600" />
            </div>
            <span className="text-neutral-700 text-sm font-medium">{t(`tour.${s.key}.title`)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Step 2: Goal ─────────────────────────────────────────────────────────────

const GOAL_OPTIONS: { key: GoalKey; icon: React.ReactNode }[] = [
  { key: 'lose', icon: <TrendingDown className="h-5 w-5" /> },
  { key: 'maintain', icon: <Minus className="h-5 w-5" /> },
  { key: 'gain', icon: <TrendingUp className="h-5 w-5" /> },
]

function StepGoal({
  t,
  selectedGoal,
  onSelect,
}: {
  t: T
  selectedGoal: GoalKey | null
  onSelect: (g: GoalKey) => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-1">{t('step2.title')}</h2>
        <p className="text-neutral-500 text-sm">{t('step2.subtitle')}</p>
      </div>
      <div className="flex flex-col gap-3">
        {GOAL_OPTIONS.map(({ key, icon }) => {
          const active = selectedGoal === key
          return (
            <button
              key={key}
              onClick={() => onSelect(key)}
              className={[
                'flex items-center gap-4 rounded-2xl px-4 py-4 border-2 text-left transition-all duration-150',
                active
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 bg-white hover:border-neutral-300',
              ].join(' ')}
            >
              <div
                className={[
                  'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors',
                  active ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-500',
                ].join(' ')}
              >
                {icon}
              </div>
              <div>
                <p
                  className={[
                    'font-semibold text-sm',
                    active ? 'text-primary-900' : 'text-neutral-800',
                  ].join(' ')}
                >
                  {t(`step2.goal.${key}.title`)}
                </p>
                <p
                  className={[
                    'text-xs mt-0.5',
                    active ? 'text-primary-700' : 'text-neutral-500',
                  ].join(' ')}
                >
                  {t(`step2.goal.${key}.subtitle`)}
                </p>
              </div>
              {active && (
                <div className="ml-auto h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ─── Step 3: Body data ────────────────────────────────────────────────────────

function StepBody({
  t,
  selectedGender,
  onGenderSelect,
  selectedYear,
  onYearChange,
  heightString,
  onHeightChange,
  weightString,
  onWeightChange,
  height,
  weight,
  heightRef,
  weightRef,
  onNext,
}: {
  t: T
  selectedGender: Gender | null
  onGenderSelect: (g: Gender) => void
  selectedYear: string
  onYearChange: (y: string) => void
  heightString: string
  onHeightChange: (v: string) => void
  weightString: string
  onWeightChange: (v: string) => void
  height: number
  weight: number
  heightRef: React.RefObject<HTMLInputElement | null>
  weightRef: React.RefObject<HTMLInputElement | null>
  onNext?: () => void
}) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 81 }, (_, i) => currentYear - 15 - i)
  const heightInvalid = heightString !== '' && (isNaN(height) || height < 100 || height > 250)
  const weightInvalid = weightString !== '' && (isNaN(weight) || weight < 20 || weight > 400)

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 mb-1">{t('step3.title')}</h2>
        <p className="text-neutral-500 text-sm">{t('step3.subtitle')}</p>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">{t('step3.gender')}</label>
        <div className="grid grid-cols-2 gap-3">
          {(['male', 'female'] as Gender[]).map(g => {
            const active = selectedGender === g
            return (
              <button
                key={g}
                onClick={() => onGenderSelect(g)}
                className={[
                  'rounded-2xl px-4 py-3 border-2 text-sm font-semibold transition-all duration-150',
                  active
                    ? 'border-primary-500 bg-primary-50 text-primary-900'
                    : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300',
                ].join(' ')}
              >
                {t(`step3.genderOption.${g}`)}
              </button>
            )
          })}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">{t('step3.birthYear')}</label>
        <select
          value={selectedYear}
          onChange={e => onYearChange(e.target.value)}
          className="block w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          <option value="">{t('step3.birthYearPlaceholder')}</option>
          {years.map(y => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">{t('step3.height')}</label>
        <input
          ref={heightRef}
          type="number"
          inputMode="numeric"
          value={heightString}
          onChange={e => onHeightChange(e.target.value)}
          placeholder="175"
          min="100"
          max="250"
          onKeyDown={e => {
            if (e.key === 'Enter') weightRef.current?.focus()
          }}
          className="block w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {heightInvalid && <p className="text-xs text-neutral-500">{t('step3.heightHint')}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">{t('step3.weight')}</label>
        <input
          ref={weightRef}
          type="number"
          inputMode="decimal"
          value={weightString}
          onChange={e => onWeightChange(e.target.value)}
          placeholder="75"
          min="20"
          max="400"
          step="0.1"
          onKeyDown={e => {
            if (e.key === 'Enter' && onNext) onNext()
          }}
          className="block w-full rounded-2xl border border-neutral-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
        {weightInvalid && <p className="text-xs text-neutral-500">{t('step3.weightHint')}</p>}
      </div>
    </div>
  )
}

// ─── Step 4 (final): Done + dual CTA ─────────────────────────────────────────

function StepDone({
  t,
  profileName,
  estimatedTDEE,
  onExplore,
}: {
  t: T
  profileName: string | null
  estimatedTDEE: number | null
  onExplore: () => void
}) {
  // Suppress unused — onExplore is used in parent's action bar
  void onExplore
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
        className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center"
        style={{ boxShadow: '0 0 48px hsla(108,100%,37%,0.28)' }}
      >
        <Check className="h-12 w-12 text-white" strokeWidth={2.5} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
          {profileName
            ? (t as T)('step4.titleNamed').replace('{{name}}', profileName)
            : (t as T)('step4.title')}
        </h2>
      </motion.div>
      {estimatedTDEE && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
          className="w-full bg-primary-50 rounded-2xl px-5 py-4"
        >
          <p className="text-sm text-primary-700 font-medium mb-0.5">{t('step4.tdeeLabel')}</p>
          <p className="text-3xl font-bold text-primary-900">
            ~{estimatedTDEE.toLocaleString()}{' '}
            <span className="text-lg font-semibold">{t('step4.kcalUnit')}</span>
          </p>
          <p className="text-xs text-primary-600 mt-1">{t('step4.tdeeSubtext')}</p>
        </motion.div>
      )}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.42 }}
        className="text-neutral-500 text-sm"
      >
        {t('step4.closing')}
      </motion.p>
    </div>
  )
}

// ─── Spotlight Tour ───────────────────────────────────────────────────────────

interface TourSection {
  key: 'oversikt' | 'planering' | 'minplan' | 'social'
  selector: string
  Icon: React.FC<{ className?: string }>
}

const TOUR_SECTIONS: TourSection[] = [
  { key: 'oversikt', selector: '[data-tour="nav-oversikt"]', Icon: CalendarDays },
  { key: 'planering', selector: '[data-tour="nav-planering"]', Icon: UtensilsCrossed },
  { key: 'minplan', selector: '[data-tour="nav-minplan"]', Icon: Target },
  { key: 'social', selector: '[data-tour="nav-social"]', Icon: Users },
]

interface SpotRect {
  top: number
  left: number
  width: number
  height: number
}

function SpotlightTour({ t, onDone, onSkip }: { t: T; onDone: () => void; onSkip: () => void }) {
  const [sectionIndex, setSectionIndex] = useState(0)
  const [rect, setRect] = useState<SpotRect | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const observerRef = useRef<ResizeObserver | null>(null)

  const prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const PAD = 8 // px padding around spotlight

  const measureTarget = useCallback(() => {
    const section = TOUR_SECTIONS[sectionIndex]
    const el = document.querySelector(section.selector)
    if (!el) return
    const r = el.getBoundingClientRect()
    setRect({
      top: r.top - PAD,
      left: r.left - PAD,
      width: r.width + PAD * 2,
      height: r.height + PAD * 2,
    })
  }, [sectionIndex])

  // Check mobile, lock scroll, attach ResizeObserver
  useEffect(() => {
    const mobile = window.innerWidth < 768
    setIsMobile(mobile)

    if (!mobile) {
      document.body.style.overflow = 'hidden'

      // Auto-scroll target into view, then measure
      const section = TOUR_SECTIONS[sectionIndex]
      const el = document.querySelector(section.selector)
      if (el) {
        el.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' })
        // Small delay to let scroll settle before measuring
        const timer = setTimeout(
          () => {
            measureTarget()
            // Watch for layout changes (sidebar collapse/expand)
            observerRef.current?.disconnect()
            const ro = new ResizeObserver(measureTarget)
            ro.observe(el)
            observerRef.current = ro
          },
          prefersReducedMotion ? 0 : 300
        )
        return () => {
          clearTimeout(timer)
          observerRef.current?.disconnect()
          document.body.style.overflow = ''
        }
      }
    }

    return () => {
      observerRef.current?.disconnect()
      document.body.style.overflow = ''
    }
  }, [sectionIndex, measureTarget, prefersReducedMotion])

  // Also re-measure on window resize (handles desktop↔mobile transitions)
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) measureTarget()
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [measureTarget])

  // ESC closes tour
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSkip()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onSkip])

  const handleNext = () => {
    if (sectionIndex < TOUR_SECTIONS.length - 1) {
      setSectionIndex(i => i + 1)
    } else {
      onDone()
    }
  }

  const isLast = sectionIndex === TOUR_SECTIONS.length - 1
  const section = TOUR_SECTIONS[sectionIndex]

  // ── Mobile fallback: inline list inside modal-like card ──────────────────
  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-6">
        <div className="bg-white rounded-3xl p-6 w-full max-w-sm flex flex-col gap-5 shadow-2xl">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 mb-1">{t('tour.title')}</h2>
            <p className="text-sm text-neutral-500">{t('tour.subtitle')}</p>
          </div>
          <div className="flex flex-col gap-4">
            {TOUR_SECTIONS.map(s => (
              <div key={s.key} className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 mt-0.5">
                  <s.Icon className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-neutral-800">
                    {t(`tour.${s.key}.title`)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-0.5">{t(`tour.${s.key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={onDone}
            className="w-full h-11 rounded-2xl bg-primary-600 text-white text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            {t('tour.done')}
          </button>
        </div>
      </div>,
      document.body
    )
  }

  // ── Desktop: spotlight overlay + tooltip card ─────────────────────────────
  // Compute tooltip position: prefer right of nav, fall back to center-bottom
  const tooltipStyle: React.CSSProperties = (() => {
    if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }
    const cardW = 280
    const cardH = 180
    const margin = 16

    // Try placing to the right of the spotlight
    const rightX = rect.left + rect.width + margin
    const rightFits = rightX + cardW < window.innerWidth - margin

    if (rightFits) {
      // Vertically centre alongside the target, clamp to viewport
      const idealTop = rect.top + rect.height / 2 - cardH / 2
      const clampedTop = Math.max(margin, Math.min(idealTop, window.innerHeight - cardH - margin))
      return { top: clampedTop, left: rightX, width: cardW }
    }

    // Fall back: place below the spotlight, horizontally centred
    const belowY = rect.top + rect.height + margin
    const centreX = Math.max(
      margin,
      Math.min(rect.left + rect.width / 2 - cardW / 2, window.innerWidth - cardW - margin)
    )
    return { top: belowY, left: centreX, width: cardW }
  })()

  return createPortal(
    <>
      {/* Overlay with spotlight hole via box-shadow */}
      {rect && (
        <div
          style={{
            position: 'fixed',
            top: rect.top,
            left: rect.left,
            width: rect.width,
            height: rect.height,
            borderRadius: 8,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.65)',
            zIndex: 100,
            pointerEvents: 'none',
            transition: prefersReducedMotion
              ? 'none'
              : 'top 0.3s ease, left 0.3s ease, width 0.3s ease, height 0.3s ease',
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        style={{ position: 'fixed', zIndex: 101, ...tooltipStyle }}
        className="bg-white rounded-2xl shadow-2xl p-5 flex flex-col gap-4"
      >
        {/* Icon + title */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary-50 flex items-center justify-center shrink-0">
            <section.Icon className="h-5 w-5 text-primary-600" />
          </div>
          <p className="font-bold text-neutral-900 text-sm">{t(`tour.${section.key}.title`)}</p>
        </div>

        {/* Description */}
        <p className="text-xs text-neutral-600 leading-relaxed">{t(`tour.${section.key}.desc`)}</p>

        {/* Dots + Next button */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            {TOUR_SECTIONS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${prefersReducedMotion ? '' : 'duration-200'} ${
                  i === sectionIndex ? 'w-4 bg-primary-600' : 'w-1.5 bg-neutral-300'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onSkip}
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              {t('tour.skip')}
            </button>
            <button
              onClick={handleNext}
              className="text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 transition-colors rounded-lg px-3 py-1.5"
            >
              {isLast ? t('tour.done') : t('tour.next')}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
