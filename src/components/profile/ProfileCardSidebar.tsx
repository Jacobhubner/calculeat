/**
 * ProfileCardSidebar - Sidopanel med sparade profiler
 * Följer samma mönster som MeasurementSetSidebar
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import ProfileCardList from './ProfileCardList'
import { Plus, User } from 'lucide-react'

interface ProfileCardSidebarProps {
  onCreateNew: () => void
  hasUnsavedChanges?: boolean
  onSelectProfile: (profileId: string) => void
  onSaveProfile: (profileId: string) => void
  onDeleteProfile?: (profileId: string) => void
  isSaving?: boolean
  canSave?: boolean
}

export default function ProfileCardSidebar({
  onCreateNew,
  hasUnsavedChanges = false,
  onSelectProfile,
  onSaveProfile,
  onDeleteProfile,
  isSaving = false,
  canSave = true,
}: ProfileCardSidebarProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary-600" />
            Profiler
          </div>
          {/* New Profile Button - Plus icon */}
          <Button
            onClick={onCreateNew}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0 rounded-full bg-primary-600 hover:bg-primary-700 text-white border-0"
            aria-label="Ny profil"
            title="Ny profil"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* List of saved profiles */}
        <ProfileCardList
          hasUnsavedChanges={hasUnsavedChanges}
          onSelectProfile={onSelectProfile}
          onSaveProfile={onSaveProfile}
          onDeleteProfile={onDeleteProfile}
          isSaving={isSaving}
          canSave={canSave}
        />
      </CardContent>
    </Card>
  )
}
