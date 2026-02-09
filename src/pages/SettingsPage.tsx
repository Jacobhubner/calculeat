/**
 * SettingsPage - Huvudsida för appinställningar
 * Innehåller radera konto och andra inställningar
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Loader2, Settings as SettingsIcon } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

type CompletionMode = 'manual' | 'auto'

export default function SettingsPage() {
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [completionMode, setCompletionMode] = useState<CompletionMode>(
    () => (localStorage.getItem('day-completion-mode') as CompletionMode) || 'manual'
  )
  const { deleteAccount } = useAuth()
  const navigate = useNavigate()

  const handleCompletionModeChange = (mode: CompletionMode) => {
    setCompletionMode(mode)
    localStorage.setItem('day-completion-mode', mode)
    toast.success(
      mode === 'auto'
        ? 'Dagen avslutas nu automatiskt vid midnatt'
        : 'Du avslutar nu dagen manuellt med knappen'
    )
  }

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

        {/* Delete Account Card */}
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
                  <p className="text-sm text-error-700">
                    Radera ditt konto permanent. Detta går inte att ångra.
                  </p>
                  <button
                    onClick={() => setDeleteStep(1)}
                    className="w-full rounded-lg border-2 border-error-300 bg-white px-4 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 transition-colors"
                    type="button"
                  >
                    Radera mitt konto
                  </button>
                </>
              )}

              {deleteStep === 1 && (
                <div className="space-y-3">
                  <p className="text-sm text-error-700">
                    Alla dina data raderas permanent — livsmedel, recept, historik, profiler och
                    måttset. Detta går inte att ångra.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={resetDeleteFlow}
                      className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                      type="button"
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={() => setDeleteStep(2)}
                      className="flex-1 rounded-lg bg-error-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-700 transition-colors"
                      type="button"
                    >
                      Ja, jag vill radera mitt konto
                    </button>
                  </div>
                </div>
              )}

              {deleteStep === 2 && (
                <div className="space-y-3">
                  <p className="text-sm text-error-700">
                    Är du helt säker? Skriv <strong>RADERA</strong> nedan för att bekräfta.
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={e => setConfirmText(e.target.value)}
                    placeholder="Skriv RADERA"
                    className="w-full rounded-lg border-2 border-error-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-error-500 focus:border-error-500"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={resetDeleteFlow}
                      className="flex-1 rounded-lg border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-600 hover:bg-neutral-50 transition-colors"
                      type="button"
                      disabled={isDeleting}
                    >
                      Avbryt
                    </button>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={confirmText !== 'RADERA' || isDeleting}
                      className="flex-1 rounded-lg bg-error-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-error-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      type="button"
                    >
                      {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                      {isDeleting ? 'Raderar...' : 'Radera permanent'}
                    </button>
                  </div>
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
      </div>
    </DashboardLayout>
  )
}
