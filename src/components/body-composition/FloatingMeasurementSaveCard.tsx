/**
 * FloatingMeasurementSaveCard
 * Compact floating card that appears when there are unsaved measurements
 * Shows current date and save button
 */

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Save } from 'lucide-react'

interface FloatingMeasurementSaveCardProps {
  hasChanges: boolean
  onSave: () => void
  isSaving: boolean
}

export default function FloatingMeasurementSaveCard({
  hasChanges,
  onSave,
  isSaving,
}: FloatingMeasurementSaveCardProps) {
  // Only show if there are actual changes to save
  if (!hasChanges) return null

  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0]

  // Format date for display
  const displayDate = new Date(today).toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Card className="fixed right-4 bottom-4 z-50 shadow-xl border-2 border-accent-200 w-64 md:w-72">
      <CardContent className="p-4 space-y-3">
        {/* Date Display */}
        <div>
          <label className="text-xs font-medium text-neutral-700 mb-1 block">Sparas som</label>
          <div className="text-sm font-medium text-neutral-900">{displayDate}</div>
          <div className="text-xs text-neutral-500 mt-0.5">{today}</div>
        </div>

        {/* Save Button */}
        <Button onClick={onSave} disabled={isSaving || !hasChanges} className="w-full" size="sm">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Sparar...' : 'Spara mätningar'}
        </Button>
      </CardContent>
    </Card>
  )
}
