import { useState, useEffect, useRef, useCallback } from 'react'
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

const TOTAL_STEPS = 4

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

  const heightRef = useRef<HTMLInputElement>(null)
  const weightRef = useRef<HTMLInputElement>(null)
  // Used to move focus to the live region on step change for screen readers
  const liveRef = useRef<HTMLDivElement>(null)

  const advanceStep = useCallback(
    (next: number) => {
      setDirection(1)
      setCurrentStep(next)
      onStepChange?.(next)
      // Defer focus to live region so screen reader announces the new step
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
        onOpenChange(false)
        navigate('/app')
      } catch {
        setSaveError(true)
      } finally {
        setIsSaving(false)
      }
      return
    }
    advanceStep(currentStep + 1)
  }

  const handleSkip = () => {
    onOpenChange(false)
  }

  const step2Ready = selectedGoal !== null
  const canAdvance =
    currentStep === 0
      ? true
      : currentStep === 1
        ? step2Ready
        : currentStep === 2
          ? step3Valid
          : true

  const progressValue = ((currentStep + 1) / TOTAL_STEPS) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[520px] max-h-[92vh] overflow-y-auto p-0 gap-0 rounded-3xl"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{(t as T)('step1.title')}</DialogTitle>
        {/* Screen reader live region — announces step changes */}
        <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only" tabIndex={-1}>
          {(t as T)('accessibility.step', { current: currentStep + 1, total: TOTAL_STEPS })}
        </div>
        {/* Progress bar */}
        <div className="px-6 pt-5">
          <Progress value={progressValue} className="h-1" />
        </div>

        {/* Step content with animated transitions */}
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
              {currentStep === 1 && (
                <Step2 t={t as T} selectedGoal={selectedGoal} onSelect={setSelectedGoal} />
              )}
              {currentStep === 2 && (
                <Step3
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
              {currentStep === 3 && (
                <Step4 t={t as T} profileName={profileName} estimatedTDEE={estimatedTDEE} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Actions — sticky on mobile so keyboard never hides the CTA */}
        <div className="sticky bottom-0 bg-white px-6 pb-6 pt-2 flex flex-col items-center gap-3 md:static md:pt-0">
          {saveError && (
            <div className="w-full flex items-center gap-2 text-sm text-error-600 bg-error-50 rounded-xl px-3 py-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{(t as T)('actions.saveError')}</span>
            </div>
          )}
          <Button
            onClick={handleNext}
            disabled={!canAdvance || isSaving}
            className="w-full h-12 text-base rounded-2xl"
          >
            {currentStep === TOTAL_STEPS - 1
              ? isSaving
                ? (t as T)('actions.saving')
                : (t as T)('actions.goToDashboard')
              : (t as T)('actions.next')}
          </Button>
          {currentStep === 0 && (
            <button
              onClick={handleSkip}
              className="text-sm text-neutral-400 underline underline-offset-2 hover:text-neutral-500 transition-colors"
            >
              {(t as T)('actions.skip')}
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
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

// ─── Step 2: Goal ─────────────────────────────────────────────────────────────

const GOAL_OPTIONS: { key: GoalKey; icon: React.ReactNode }[] = [
  { key: 'lose', icon: <TrendingDown className="h-5 w-5" /> },
  { key: 'maintain', icon: <Minus className="h-5 w-5" /> },
  { key: 'gain', icon: <TrendingUp className="h-5 w-5" /> },
]

function Step2({
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

function Step3({
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

      {/* Gender */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-neutral-700">{t('step3.gender')}</label>
        <div className="grid grid-cols-2 gap-3">
          {(['male', 'female'] as Gender[]).map(g => {
            const active = selectedGender === g
            return (
              <button
                key={g}
                onClick={() => {
                  onGenderSelect(g)
                  // Focus year select after gender picked
                }}
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

      {/* Birth year */}
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

      {/* Height */}
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

      {/* Weight */}
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

// ─── Step 4: Done ─────────────────────────────────────────────────────────────

function Step4({
  t,
  profileName,
  estimatedTDEE,
}: {
  t: T
  profileName: string | null
  estimatedTDEE: number | null
}) {
  return (
    <div className="flex flex-col items-center text-center gap-6 py-4">
      {/* Animated checkmark */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.05 }}
        className="h-24 w-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center"
        style={{ boxShadow: '0 0 48px hsla(108,100%,37%,0.28)' }}
      >
        <Check className="h-12 w-12 text-white" strokeWidth={2.5} />
      </motion.div>

      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <h2 className="text-2xl md:text-3xl font-bold text-neutral-900">
          {profileName ? t('step4.titleNamed').replace('{{name}}', profileName) : t('step4.title')}
        </h2>
      </motion.div>

      {/* TDEE estimate */}
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

      {/* Closing line */}
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
