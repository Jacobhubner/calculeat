/**
 * SettingsPage - Inställningar för konto och app
 * Grundläggande information, kontoinställningar, appinställningar och radera konto
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AlertTriangle,
  Loader2,
  Settings as SettingsIcon,
  Pencil,
  X,
  Check,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { translateAuthError } from '@/lib/auth-errors'
import { useActiveProfile } from '@/hooks/useActiveProfile'
import { useUpdateProfile } from '@/hooks/useUpdateProfile'
import { useUserProfile, useUpdateUsername } from '@/hooks/useUserProfile'
import type { Gender } from '@/lib/types'
import {
  useIsSuperAdmin,
  useListAdmins,
  useAddAdmin,
  useRemoveAdmin,
} from '@/hooks/useAdminManagement'

type CompletionMode = 'manual' | 'auto'
type OpenEditor = 'username' | 'email' | 'password' | null

// Password strength helper — labels injected at call site via t()
function getPasswordStrengthMeta(password: string): {
  level: string
  color: string
  width: string
} {
  if (password.length === 0) return { level: '', color: '', width: '0%' }
  if (password.length < 6) return { level: 'tooShort', color: 'bg-error-500', width: '25%' }
  if (password.length < 10) return { level: 'weak', color: 'bg-warning-500', width: '50%' }
  if (password.length < 14) return { level: 'good', color: 'bg-success-400', width: '75%' }
  return { level: 'strong', color: 'bg-success-600', width: '100%' }
}

export default function SettingsPage() {
  const { t } = useTranslation('profile')
  const navigate = useNavigate()
  const { user, deleteAccount, refreshProfile } = useAuth()
  const { profile, isReady } = useActiveProfile()
  const updateProfile = useUpdateProfile()
  const { data: userProfile } = useUserProfile()
  const updateUsername = useUpdateUsername()

  // Admin management
  const { data: isSuperAdmin = false } = useIsSuperAdmin()
  const { data: adminList = [] } = useListAdmins()
  const addAdmin = useAddAdmin()
  const removeAdmin = useRemoveAdmin()
  const [newAdminIdentifier, setNewAdminIdentifier] = useState('')

  // Delete account state
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // App settings
  const [completionMode, setCompletionMode] = useState<CompletionMode>(
    () => (localStorage.getItem('day-completion-mode') as CompletionMode) || 'manual'
  )

  // Basic info state (local, saved separately)
  const [birthDate, setBirthDate] = useState<string | undefined>(profile?.birth_date ?? undefined)
  const [gender, setGender] = useState<Gender | '' | undefined>(profile?.gender ?? '')
  const [height, setHeight] = useState<number | undefined>(profile?.height_cm ?? undefined)

  // Birth date dropdown state
  const parsedDate = birthDate ? new Date(birthDate) : null
  const [birthDay, setBirthDay] = useState(parsedDate?.getDate().toString() || '')
  const [birthMonth, setBirthMonth] = useState(
    parsedDate ? (parsedDate.getMonth() + 1).toString() : ''
  )
  const [birthYear, setBirthYear] = useState(parsedDate?.getFullYear().toString() || '')
  const [heightString, setHeightString] = useState(profile?.height_cm?.toString() || '')

  // Sync local state when profile loads (only if we haven't changed it yet)
  const [basicInfoInitialized, setBasicInfoInitialized] = useState(false)
  if (isReady && profile && !basicInfoInitialized) {
    const d = profile.birth_date ? new Date(profile.birth_date) : null
    setBirthDate(profile.birth_date ?? undefined)
    setBirthDay(d?.getDate().toString() || '')
    setBirthMonth(d ? (d.getMonth() + 1).toString() : '')
    setBirthYear(d?.getFullYear().toString() || '')
    setGender(profile.gender ?? '')
    setHeight(profile.height_cm ?? undefined)
    setHeightString(profile.height_cm?.toString() || '')
    setBasicInfoInitialized(true)
  }

  const updateBirthDate = (day: string, month: string, year: string) => {
    if (day && month && year) {
      const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      setBirthDate(dateString)
    }
  }

  // Inline editor state
  const [openEditor, setOpenEditor] = useState<OpenEditor>(null)

  // Username editor state
  const [usernameInput, setUsernameInput] = useState('')

  // Email editor state
  const [emailInput, setEmailInput] = useState('')
  const [emailPending, setEmailPending] = useState(false)
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)

  // Password editor state
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)

  const tAny = t as (key: string) => string
  const passwordStrengthMeta = getPasswordStrengthMeta(passwordInput)
  const passwordStrengthLabel: string = passwordStrengthMeta.level
    ? tAny(
        `settings.passwordStrength${passwordStrengthMeta.level.charAt(0).toUpperCase()}${passwordStrengthMeta.level.slice(1)}`
      )
    : ''

  // Open an inline editor (closes all others)
  const openEditorFor = (editor: OpenEditor) => {
    setOpenEditor(editor)
    if (editor === 'username') setUsernameInput(userProfile?.username ?? '')
    if (editor === 'email') {
      setEmailInput(user?.email ?? '')
      setEmailPending(false)
    }
    if (editor === 'password') {
      setPasswordInput('')
      setPasswordConfirm('')
    }
  }

  const closeEditor = () => setOpenEditor(null)

  // Save basic info
  const handleSaveBasicInfo = async () => {
    if (!profile) return
    try {
      await updateProfile.mutateAsync({
        profileId: profile.id,
        data: {
          birth_date: birthDate,
          gender: gender || undefined,
          height_cm: height,
        },
        silent: true,
      })
      toast.success(t('settings.basicInfoSaved'))
    } catch (error) {
      console.error('Error saving basic info:', error)
      toast.error(t('settings.basicInfoSaveError'))
    }
  }

  // Save username
  const handleSaveUsername = async () => {
    if (updateUsername.isPending) return
    const trimmed = usernameInput.trim()
    if (!trimmed) return
    if (trimmed === userProfile?.username) {
      closeEditor()
      return
    }
    try {
      const result = await updateUsername.mutateAsync(trimmed)
      if (!result.success) {
        if (result.error === 'username_taken') {
          toast.error(t('settings.usernameTaken'))
        } else if (result.error === 'invalid_format') {
          toast.error(t('settings.usernameInvalidFormat'))
        } else {
          toast.error(t('settings.usernameUpdateError'))
        }
        return
      }
      toast.success(t('settings.usernameUpdated'))
      closeEditor()
      await refreshProfile()
    } catch (error) {
      toast.error(translateAuthError(error))
    }
  }

  // Save email
  const handleSaveEmail = async () => {
    const trimmed = emailInput.trim().toLowerCase()
    if (!trimmed) return
    if (trimmed === user?.email?.toLowerCase()) {
      toast.error(t('settings.emailSameError'))
      return
    }
    setIsUpdatingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed })
      if (error) throw error
      setEmailPending(true)
      toast.success(t('settings.emailConfirmSent', { email: trimmed }), {
        description: t('settings.emailConfirmDesc'),
        duration: 6000,
      })
    } catch (error) {
      toast.error(translateAuthError(error))
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  // Save password
  const handleSavePassword = async () => {
    if (passwordInput.length < 6) {
      toast.error(t('settings.passwordTooShort'))
      return
    }
    if (passwordInput !== passwordConfirm) {
      toast.error(t('settings.passwordMismatch'))
      return
    }
    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordInput })
      if (error) throw error
      toast.success(t('settings.passwordUpdated'))
      closeEditor()
    } catch (error) {
      toast.error(translateAuthError(error))
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  // App settings
  const handleCompletionModeChange = (mode: CompletionMode) => {
    setCompletionMode(mode)
    localStorage.setItem('day-completion-mode', mode)
    toast.success(mode === 'auto' ? t('settings.toastAuto') : t('settings.toastManual'))
  }

  // Delete account
  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await deleteAccount()
      toast.success(t('settings.accountDeleted'))
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error(t('settings.deleteError'))
    } finally {
      setIsDeleting(false)
    }
  }

  const resetDeleteFlow = () => {
    setDeleteStep(0)
    setConfirmText('')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900 flex items-center gap-2 md:gap-3">
            <SettingsIcon className="h-6 w-6 md:h-8 md:w-8 text-primary-600" />
            {t('settings.title')}
          </h1>
          <p className="text-sm md:text-base text-neutral-600 mt-1 md:mt-2">
            {t('settings.description')}
          </p>
        </div>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('settings.appSettings')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-neutral-900 mb-3">
                {t('settings.dayCompletion')}
              </p>
              <div className="space-y-2">
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    completionMode === 'manual'
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="completion-mode"
                    value="manual"
                    checked={completionMode === 'manual'}
                    onChange={() => handleCompletionModeChange('manual')}
                    className="mt-0.5 accent-primary-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-neutral-900">
                      {t('settings.manual')}
                    </span>
                    <p className="text-xs text-neutral-500 mt-0.5">{t('settings.manualDesc')}</p>
                  </div>
                </label>
                <label
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    completionMode === 'auto'
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-neutral-200 hover:border-neutral-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="completion-mode"
                    value="auto"
                    checked={completionMode === 'auto'}
                    onChange={() => handleCompletionModeChange('auto')}
                    className="mt-0.5 accent-primary-600"
                  />
                  <div>
                    <span className="text-sm font-medium text-neutral-900">
                      {t('settings.auto')}
                    </span>
                    <p className="text-xs text-neutral-500 mt-0.5">{t('settings.autoDesc')}</p>
                  </div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Grundläggande information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('basicInfo.title')}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-neutral-100">
            {!isReady ? (
              <div className="py-4 text-sm text-neutral-500">{t('settings.loading')}</div>
            ) : (
              <>
                {/* Födelsedatum */}
                <div className="py-3">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                    {t('birthDate.label')}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={birthDay}
                      onChange={e => {
                        setBirthDay(e.target.value)
                        updateBirthDate(e.target.value, birthMonth, birthYear)
                      }}
                      className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">{t('birthDate.day')}</option>
                      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <select
                      value={birthMonth}
                      onChange={e => {
                        setBirthMonth(e.target.value)
                        updateBirthDate(birthDay, e.target.value, birthYear)
                      }}
                      className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">{t('birthDate.month')}</option>
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(i => (
                        <option key={i} value={i}>
                          {tAny(`months.${i}`)}
                        </option>
                      ))}
                    </select>
                    <select
                      value={birthYear}
                      onChange={e => {
                        setBirthYear(e.target.value)
                        updateBirthDate(birthDay, birthMonth, e.target.value)
                      }}
                      className="block w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <option value="">{t('birthDate.year')}</option>
                      {Array.from({ length: 105 }, (_, i) => new Date().getFullYear() - i).map(
                        year => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* Kön */}
                <div className="py-3">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                    {t('fields.gender')}
                  </p>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="settings-gender"
                        value="male"
                        checked={gender === 'male'}
                        onChange={() => setGender('male')}
                        className="h-4 w-4 accent-primary-600"
                      />
                      <span className="text-sm text-neutral-700">{t('gender.male')}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="settings-gender"
                        value="female"
                        checked={gender === 'female'}
                        onChange={() => setGender('female')}
                        className="h-4 w-4 accent-primary-600"
                      />
                      <span className="text-sm text-neutral-700">{t('gender.female')}</span>
                    </label>
                  </div>
                </div>

                {/* Längd */}
                <div className="py-3">
                  <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
                    {t('fields.height')}
                  </p>
                  <input
                    type="number"
                    value={heightString}
                    onChange={e => setHeightString(e.target.value)}
                    onBlur={() => {
                      const num = parseFloat(heightString)
                      setHeight(isNaN(num) ? undefined : num)
                    }}
                    placeholder="180"
                    min="100"
                    max="250"
                    className="w-full max-w-xs px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {/* Spara-knapp */}
                <div className="pt-3">
                  <button
                    onClick={handleSaveBasicInfo}
                    disabled={updateProfile.isPending}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    {updateProfile.isPending ? t('save.saving') : t('settings.save')}
                  </button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Konto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('settings.account')}</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-neutral-100">
            {/* Username row */}
            <div className="py-3">
              {openEditor === 'username' ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    {t('settings.username')}
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={e => setUsernameInput(e.target.value)}
                      placeholder={t('settings.usernamePlaceholder')}
                      disabled={updateUsername.isPending}
                      className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveUsername()
                        if (e.key === 'Escape') closeEditor()
                      }}
                      autoFocus
                    />
                    <button
                      onClick={handleSaveUsername}
                      disabled={updateUsername.isPending || !usernameInput.trim()}
                      className="p-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
                    >
                      {updateUsername.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={closeEditor}
                      className="p-2 text-neutral-500 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-neutral-400">{t('settings.usernameHint')}</p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">
                      {t('settings.username')}
                    </p>
                    <p className="text-sm font-medium text-neutral-900">
                      {userProfile?.username ? `@${userProfile.username}` : '—'}
                    </p>
                  </div>
                  <button
                    onClick={() => openEditorFor('username')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    {t('settings.edit')}
                  </button>
                </div>
              )}
            </div>

            {/* Email row */}
            <div className="py-3">
              {openEditor === 'email' ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    {t('settings.email')}
                  </label>
                  {emailPending ? (
                    <div className="text-sm text-success-700 bg-success-50 border border-success-200 rounded-lg px-3 py-2">
                      {t('settings.emailConfirmNotice')} <strong>{emailInput}</strong>.{' '}
                      {t('settings.emailConfirmAction')}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        placeholder="ny@email.se"
                        className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter') handleSaveEmail()
                          if (e.key === 'Escape') closeEditor()
                        }}
                        autoFocus
                      />
                      <button
                        onClick={handleSaveEmail}
                        disabled={isUpdatingEmail || !emailInput.trim()}
                        className="p-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50"
                      >
                        {isUpdatingEmail ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={closeEditor}
                        className="p-2 text-neutral-500 hover:text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  {!emailPending && (
                    <p className="text-xs text-neutral-400">{t('settings.emailHint')}</p>
                  )}
                  {emailPending && (
                    <button
                      onClick={closeEditor}
                      className="text-xs text-neutral-500 hover:text-neutral-700 underline"
                    >
                      {t('settings.close')}
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">
                      {t('settings.email')}
                    </p>
                    <p className="text-sm font-medium text-neutral-900">{user?.email ?? '—'}</p>
                  </div>
                  <button
                    onClick={() => openEditorFor('email')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    {t('settings.edit')}
                  </button>
                </div>
              )}
            </div>

            {/* Password row */}
            <div className="py-3">
              {openEditor === 'password' ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    {t('settings.newPassword')}
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder={t('settings.passwordPlaceholder')}
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  {passwordInput.length > 0 && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${passwordStrengthMeta.color}`}
                          style={{ width: passwordStrengthMeta.width }}
                        />
                      </div>
                      <p className="text-xs text-neutral-500">{passwordStrengthLabel}</p>
                    </div>
                  )}
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    placeholder={t('settings.confirmPassword')}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                      passwordConfirm.length > 0 && passwordInput !== passwordConfirm
                        ? 'border-error-300'
                        : 'border-neutral-300'
                    }`}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleSavePassword()
                      if (e.key === 'Escape') closeEditor()
                    }}
                  />
                  {passwordConfirm.length > 0 && passwordInput !== passwordConfirm && (
                    <p className="text-xs text-error-600">{t('settings.passwordMismatch')}</p>
                  )}
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={handleSavePassword}
                      disabled={
                        isUpdatingPassword ||
                        passwordInput.length < 6 ||
                        passwordInput !== passwordConfirm
                      }
                      className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUpdatingPassword && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isUpdatingPassword ? t('save.saving') : t('settings.savePassword')}
                    </button>
                    <button
                      onClick={closeEditor}
                      className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      {t('settings.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">
                      {t('settings.passwordLabel')}
                    </p>
                    <p className="text-sm font-medium text-neutral-900 tracking-widest">••••••••</p>
                  </div>
                  <button
                    onClick={() => openEditorFor('password')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    {t('settings.edit')}
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Admin management — only visible to super admin */}
        {isSuperAdmin && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary-600" />
                {t('settings.adminManagement')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current admins list */}
              <div className="space-y-2">
                {adminList.map(admin => (
                  <div
                    key={admin.user_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200"
                  >
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{admin.email}</p>
                      {admin.is_super_admin && (
                        <p className="text-xs text-primary-600 font-medium">Super admin</p>
                      )}
                    </div>
                    {!admin.is_super_admin && (
                      <button
                        onClick={async () => {
                          const result = await removeAdmin.mutateAsync(admin.user_id)
                          if (result?.success) {
                            toast.success(t('settings.adminRemoved'))
                          } else {
                            toast.error(t('settings.adminRemoveError'))
                          }
                        }}
                        disabled={removeAdmin.isPending}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-error-600 hover:bg-error-50 transition-colors"
                        title={t('settings.adminRemoveTitle')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add new admin */}
              <div className="flex gap-2">
                <input
                  type="email"
                  value={newAdminIdentifier}
                  onChange={e => setNewAdminIdentifier(e.target.value)}
                  placeholder={t('settings.adminPlaceholder')}
                  className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  onClick={async () => {
                    if (!newAdminIdentifier.trim()) return
                    const result = await addAdmin.mutateAsync(newAdminIdentifier.trim())
                    if (result?.success) {
                      toast.success(t('settings.adminAdded'))
                      setNewAdminIdentifier('')
                    } else if (result?.error === 'user_not_found') {
                      toast.error(t('settings.adminNotFound'))
                    } else if (result?.error === 'already_admin') {
                      toast.info(t('settings.adminAlreadyAdmin'))
                    } else if (result?.error === 'invitation_pending') {
                      toast.info(t('settings.adminInvitationPending'))
                    } else {
                      toast.error(t('settings.adminAddError'))
                    }
                  }}
                  disabled={addAdmin.isPending || !newAdminIdentifier.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 rounded-lg transition-colors"
                >
                  {addAdmin.isPending ? t('settings.addingAdmin') : t('settings.addAdmin')}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Delete Account Card — Farozon */}
        <Card className="border-2 border-error-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-error-700">
              <AlertTriangle className="h-5 w-5" />
              {t('settings.deleteAccountTitle')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border-2 border-error-200 bg-error-50/50 p-4 space-y-3">
              {deleteStep === 0 && (
                <>
                  <p className="text-sm text-neutral-700">{t('settings.deleteAccountWarning')}</p>
                  <button
                    onClick={() => setDeleteStep(1)}
                    className="px-4 py-2 text-sm font-medium text-error-700 bg-error-100 hover:bg-error-200 rounded-lg transition-colors"
                  >
                    {t('settings.deleteAccountButton')}
                  </button>
                </>
              )}
              {deleteStep === 1 && (
                <>
                  <p className="text-sm font-medium text-error-700">
                    {t('settings.deleteAccountConfirm')}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteStep(2)}
                      className="px-4 py-2 text-sm font-medium text-white bg-error-600 hover:bg-error-700 rounded-lg transition-colors"
                    >
                      {t('settings.deleteAccountSure')}
                    </button>
                    <button
                      onClick={resetDeleteFlow}
                      className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      {t('settings.cancel')}
                    </button>
                  </div>
                </>
              )}
              {deleteStep === 2 && (
                <>
                  <p className="text-sm font-medium text-error-700">
                    {t('settings.deleteAccountFinal')}
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder={t('settings.deleteAccountPlaceholder')}
                    className="w-full px-3 py-2 text-sm border border-error-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-error-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={confirmText !== 'RADERA' || isDeleting}
                      className="px-4 py-2 text-sm font-medium text-white bg-error-600 hover:bg-error-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isDeleting ? t('settings.deleting') : t('settings.deleteAccountPermanent')}
                    </button>
                    <button
                      onClick={resetDeleteFlow}
                      className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      {t('settings.cancel')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
