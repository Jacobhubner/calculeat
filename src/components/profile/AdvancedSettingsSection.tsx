/**
 * AdvancedSettingsSection - Kollapsbar sektion för avancerade inställningar
 * Innehåller BasicInfoFields
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Settings, ChevronDown, AlertTriangle, Loader2 } from 'lucide-react'
import BasicInfoFields from './BasicInfoFields'
import { useAuth } from '@/contexts/AuthContext'
import type { Gender } from '@/lib/types'

interface AdvancedSettingsSectionProps {
  // BasicInfoFields props
  birthDate?: string
  gender?: Gender | ''
  height?: number
  onBirthDateChange: (birthDate: string) => void
  onGenderChange: (gender: Gender | '') => void
  onHeightChange: (height: number | undefined) => void
  locked: boolean
  showLockNotice: boolean
}

export default function AdvancedSettingsSection({
  birthDate,
  gender,
  height,
  onBirthDateChange,
  onGenderChange,
  onHeightChange,
  locked,
  showLockNotice,
}: AdvancedSettingsSectionProps) {
  const [isOpen, setIsOpen] = useState(false) // Stängd som default
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2>(0)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteAccount } = useAuth()
  const navigate = useNavigate()

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
    <Card className="border-2 border-neutral-300">
      <CardHeader className="pb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between hover:opacity-70 transition-opacity"
          type="button"
        >
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-neutral-600" />
            Avancerade inställningar
          </CardTitle>
          <ChevronDown
            className={`h-5 w-5 text-neutral-600 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-4 pt-0">
          <BasicInfoFields
            birthDate={birthDate}
            gender={gender}
            height={height}
            onBirthDateChange={onBirthDateChange}
            onGenderChange={onGenderChange}
            onHeightChange={onHeightChange}
            locked={locked}
            showLockNotice={showLockNotice}
          />

          <Separator className="my-6" />

          {/* Farozon */}
          <div className="rounded-lg border-2 border-error-200 bg-error-50/50 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-error-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Farozon
            </h3>

            {deleteStep === 0 && (
              <button
                onClick={() => setDeleteStep(1)}
                className="w-full rounded-lg border-2 border-error-300 bg-white px-4 py-2.5 text-sm font-medium text-error-600 hover:bg-error-50 transition-colors"
                type="button"
              >
                Radera mitt konto
              </button>
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
      )}
    </Card>
  )
}
