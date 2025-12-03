/**
 * MeasurementSetSidebar - Sidopanel med sparade mätset
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import MeasurementSetList from './MeasurementSetList'
import { Plus, Calendar } from 'lucide-react'

interface MeasurementSetSidebarProps {
  onCreateNew: () => void
  hasUnsavedChanges?: boolean
  onSelectSet: (setId: string) => void
  onSaveSet: (setId: string) => void
  isSaving?: boolean
}

export default function MeasurementSetSidebar({
  onCreateNew,
  hasUnsavedChanges = false,
  onSelectSet,
  onSaveSet,
  isSaving = false,
}: MeasurementSetSidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary-600" />
            Sparade mätningar
          </div>
          {/* New Measurement Button - Plus icon like profile system */}
          <Button
            onClick={onCreateNew}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-full bg-primary-600 hover:bg-primary-700 text-white border-0"
            aria-label="Ny mätning"
            title="Ny mätning"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* List of saved measurement sets */}
        <MeasurementSetList
          hasUnsavedChanges={hasUnsavedChanges}
          onSelectSet={onSelectSet}
          onSaveSet={onSaveSet}
          isSaving={isSaving}
        />
      </CardContent>
    </Card>
  )
}
