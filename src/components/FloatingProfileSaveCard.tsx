/**
 * Floating Profile Save Card
 * Compact floating card that appears after scrolling past results
 * Shows profile name input and save button
 */

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Save } from 'lucide-react'

interface FloatingProfileSaveCardProps {
  profileName: string
  onProfileNameChange: (name: string) => void
  onSave: () => void
  isSaving: boolean
  hasChanges: boolean
}

export default function FloatingProfileSaveCard({
  profileName,
  onProfileNameChange,
  onSave,
  isSaving,
  hasChanges,
}: FloatingProfileSaveCardProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      // Show card after scrolling 300px down
      const scrollThreshold = 300
      setIsVisible(window.scrollY > scrollThreshold)
    }

    window.addEventListener('scroll', handleScroll)
    handleScroll() // Check initial position

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!isVisible) return null

  return (
    <Card className="fixed right-4 bottom-4 z-50 shadow-xl border-2 border-accent-200 w-64 md:w-72">
      <CardContent className="p-4 space-y-3">
        {/* Profile Name Input */}
        <div>
          <label className="text-xs font-medium text-neutral-700 mb-1 block">Profilnamn</label>
          <Input
            type="text"
            value={profileName}
            onChange={e => onProfileNameChange(e.target.value)}
            placeholder="Min profil"
            className="text-sm"
          />
        </div>

        {/* Save Button */}
        <Button onClick={onSave} disabled={isSaving || !hasChanges} className="w-full" size="sm">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Sparar...' : hasChanges ? 'Spara ändringar' : 'Inga ändringar'}
        </Button>
      </CardContent>
    </Card>
  )
}
