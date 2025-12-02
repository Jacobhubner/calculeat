/**
 * MeasurementSetSidebar - Sidopanel med sparade mätset
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import MeasurementSetList from './MeasurementSetList'
import { Plus, Calendar } from 'lucide-react'
import { useMeasurementSetStore } from '@/stores/measurementSetStore'

export default function MeasurementSetSidebar() {
  const setActiveMeasurementSet = useMeasurementSetStore(state => state.setActiveMeasurementSet)

  const handleCreateNew = () => {
    // Set active measurement set to null to enter "new measurement mode"
    setActiveMeasurementSet(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Calendar className="h-5 w-5 text-primary-600" />
          Sparade mätningar
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* New Measurement Button */}
        <Button onClick={handleCreateNew} variant="outline" className="w-full" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Ny mätning
        </Button>

        {/* List of saved measurement sets */}
        <MeasurementSetList />
      </CardContent>
    </Card>
  )
}
