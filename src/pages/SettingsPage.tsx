/**
 * SettingsPage - Inställningar för konto och app
 * Grundläggande information, kontoinställningar, appinställningar och radera konto
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Loader2, Settings as SettingsIcon, Pencil, X, Check } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { translateAuthError } from '@/lib/auth-errors'
import BasicInfoFields from '@/components/profile/BasicInfoFields'
import { useActiveProfile } from '@/hooks/useActiveProfile'
import { useUpdateProfile } from '@/hooks/useUpdateProfile'
import { useUserProfile, useUpdateUsername } from '@/hooks/useUserProfile'
import type { Gender } from '@/lib/types'

type CompletionMode = 'manual' | 'auto'
type OpenEditor = 'username' | 'email' | 'password' | null

// Password strength helper
function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  if (password.length === 0) return { label: '', color: '', width: '0%' }
  if (password.length < 6) return { label: 'För kort', color: 'bg-error-500', width: '25%' }
  if (password.length < 10) return { label: 'Svagt', color: 'bg-warning-500', width: '50%' }
  if (password.length < 14) return { label: 'Bra', color: 'bg-success-400', width: '75%' }
  return { label: 'Starkt', color: 'bg-success-600', width: '100%' }
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const { user, deleteAccount } = useAuth()
  const { profile, isReady } = useActiveProfile()
  const updateProfile = useUpdateProfile()
  const { data: userProfile } = useUserProfile()
  const updateUsername = useUpdateUsername()

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

  // Sync local state when profile loads (only if we haven't changed it yet)
  const [basicInfoInitialized, setBasicInfoInitialized] = useState(false)
  if (isReady && profile && !basicInfoInitialized) {
    setBirthDate(profile.birth_date ?? undefined)
    setGender(profile.gender ?? '')
    setHeight(profile.height_cm ?? undefined)
    setBasicInfoInitialized(true)
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

  const passwordStrength = getPasswordStrength(passwordInput)

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
      toast.success('Grundläggande information sparad')
    } catch (error) {
      console.error('Error saving basic info:', error)
      toast.error('Kunde inte spara grundläggande information')
    }
  }

  // Save username
  const handleSaveUsername = async () => {
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
          toast.error('Användarnamnet är redan taget')
        } else if (result.error === 'invalid_format') {
          toast.error('Ogiltigt format. Använd bokstäver, siffror och _')
        } else {
          toast.error('Kunde inte uppdatera användarnamn')
        }
        return
      }
      toast.success('Användarnamn uppdaterat')
      closeEditor()
    } catch (error) {
      toast.error(translateAuthError(error))
    }
  }

  // Save email
  const handleSaveEmail = async () => {
    const trimmed = emailInput.trim().toLowerCase()
    if (!trimmed) return
    if (trimmed === user?.email?.toLowerCase()) {
      toast.error('Den nya e-postadressen är samma som den nuvarande')
      return
    }
    setIsUpdatingEmail(true)
    try {
      const { error } = await supabase.auth.updateUser({ email: trimmed })
      if (error) throw error
      setEmailPending(true)
      toast.success(`Bekräftelsemejl skickat till ${trimmed}`, {
        description: 'Bytet aktiveras när du klickar länken i mejlet.',
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
      toast.error('Lösenordet måste vara minst 6 tecken')
      return
    }
    if (passwordInput !== passwordConfirm) {
      toast.error('Lösenorden matchar inte')
      return
    }
    setIsUpdatingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordInput })
      if (error) throw error
      toast.success('Lösenordet har uppdaterats')
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
    toast.success(
      mode === 'auto'
        ? 'Dagen avslutas nu automatiskt vid midnatt'
        : 'Du avslutar nu dagen manuellt med knappen'
    )
  }

  // Delete account
  const handleDeleteAccount = async () => {
    setIsDeleting(true)
    try {
      await deleteAccount()
      toast.success('Ditt konto har raderats.')
      navigate('/', { replace: true })
    } catch (error) {
      console.error('Delete account error:', error)
      toast.error('Något gick fel vid radering av kontot. Försök igen.')
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
            Inställningar
          </h1>
          <p className="text-sm md:text-base text-neutral-600 mt-1 md:mt-2">
            Hantera ditt konto och appinställningar
          </p>
        </div>

        {/* Grundläggande information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Grundläggande information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isReady ? (
              <>
                <BasicInfoFields
                  birthDate={birthDate}
                  gender={gender}
                  height={height}
                  onBirthDateChange={setBirthDate}
                  onGenderChange={setGender}
                  onHeightChange={setHeight}
                  locked={false}
                  showLockNotice={false}
                />
                <button
                  onClick={handleSaveBasicInfo}
                  disabled={updateProfile.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateProfile.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {updateProfile.isPending ? 'Sparar...' : 'Spara grundläggande information'}
                </button>
              </>
            ) : (
              <div className="py-4 text-sm text-neutral-500">Laddar...</div>
            )}
          </CardContent>
        </Card>

        {/* Konto */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Konto</CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-neutral-100">
            {/* Username row */}
            <div className="py-3">
              {openEditor === 'username' ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Användarnamn
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={usernameInput}
                      onChange={e => setUsernameInput(e.target.value)}
                      placeholder="@användarnamn"
                      className="flex-1 px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
                  <p className="text-xs text-neutral-400">
                    Bokstäver, siffror och _ (2–50 tecken). Måste vara unikt.
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">
                      Användarnamn
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
                    Redigera
                  </button>
                </div>
              )}
            </div>

            {/* Email row */}
            <div className="py-3">
              {openEditor === 'email' ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    E-postadress
                  </label>
                  {emailPending ? (
                    <div className="text-sm text-success-700 bg-success-50 border border-success-200 rounded-lg px-3 py-2">
                      Bekräftelsemejl skickat till <strong>{emailInput}</strong>. Klicka länken i
                      mejlet för att aktivera bytet.
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
                    <p className="text-xs text-neutral-400">
                      Ett bekräftelsemejl skickas till den nya adressen.
                    </p>
                  )}
                  {emailPending && (
                    <button
                      onClick={closeEditor}
                      className="text-xs text-neutral-500 hover:text-neutral-700 underline"
                    >
                      Stäng
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">
                      E-postadress
                    </p>
                    <p className="text-sm font-medium text-neutral-900">{user?.email ?? '—'}</p>
                  </div>
                  <button
                    onClick={() => openEditorFor('email')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Redigera
                  </button>
                </div>
              )}
            </div>

            {/* Password row */}
            <div className="py-3">
              {openEditor === 'password' ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-neutral-500 uppercase tracking-wide">
                    Nytt lösenord
                  </label>
                  <input
                    type="password"
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Minst 6 tecken"
                    className="w-full px-3 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    autoFocus
                  />
                  {passwordInput.length > 0 && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-neutral-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                          style={{ width: passwordStrength.width }}
                        />
                      </div>
                      <p className="text-xs text-neutral-500">{passwordStrength.label}</p>
                    </div>
                  )}
                  <input
                    type="password"
                    value={passwordConfirm}
                    onChange={e => setPasswordConfirm(e.target.value)}
                    placeholder="Bekräfta lösenord"
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
                    <p className="text-xs text-error-600">Lösenorden matchar inte</p>
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
                      {isUpdatingPassword ? 'Sparar...' : 'Spara lösenord'}
                    </button>
                    <button
                      onClick={closeEditor}
                      className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      Avbryt
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-0.5">
                      Lösenord
                    </p>
                    <p className="text-sm font-medium text-neutral-900 tracking-widest">••••••••</p>
                  </div>
                  <button
                    onClick={() => openEditorFor('password')}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Redigera
                  </button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appinställningar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-neutral-900 mb-3">Dagavslutning</p>
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
                    <span className="text-sm font-medium text-neutral-900">Manuell</span>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Avsluta dagen själv med knappen &quot;Avsluta dag&quot;
                    </p>
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
                    <span className="text-sm font-medium text-neutral-900">Automatisk</span>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Dagen avslutas automatiskt vid midnatt
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Delete Account Card — Farozon */}
        <Card className="border-2 border-error-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-error-700">
              <AlertTriangle className="h-5 w-5" />
              Farozon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border-2 border-error-200 bg-error-50/50 p-4 space-y-3">
              {deleteStep === 0 && (
                <>
                  <p className="text-sm text-neutral-700">
                    Om du raderar ditt konto försvinner all data permanent. Denna åtgärd kan inte
                    ångras.
                  </p>
                  <button
                    onClick={() => setDeleteStep(1)}
                    className="px-4 py-2 text-sm font-medium text-error-700 bg-error-100 hover:bg-error-200 rounded-lg transition-colors"
                  >
                    Radera mitt konto
                  </button>
                </>
              )}
              {deleteStep === 1 && (
                <>
                  <p className="text-sm font-medium text-error-700">
                    Är du säker? All din data kommer att raderas permanent.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDeleteStep(2)}
                      className="px-4 py-2 text-sm font-medium text-white bg-error-600 hover:bg-error-700 rounded-lg transition-colors"
                    >
                      Ja, jag är säker
                    </button>
                    <button
                      onClick={resetDeleteFlow}
                      className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      Avbryt
                    </button>
                  </div>
                </>
              )}
              {deleteStep === 2 && (
                <>
                  <p className="text-sm font-medium text-error-700">
                    Skriv <span className="font-bold">RADERA</span> för att bekräfta:
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="Skriv RADERA"
                    className="w-full px-3 py-2 text-sm border border-error-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-error-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={confirmText !== 'RADERA' || isDeleting}
                      className="px-4 py-2 text-sm font-medium text-white bg-error-600 hover:bg-error-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isDeleting ? 'Raderar...' : 'Radera permanent'}
                    </button>
                    <button
                      onClick={resetDeleteFlow}
                      className="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                    >
                      Avbryt
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
