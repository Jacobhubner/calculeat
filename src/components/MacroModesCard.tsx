/**
 * Macro Modes Card Component
 * Allows users to quickly apply predefined macro modes
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Target, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useApplyMacroMode, usePreviewMacroMode } from '@/hooks/useMacroModes'
import { useProfileStore } from '@/stores/profileStore'
import { useAuth } from '@/contexts/AuthContext'
import { useProfiles } from '@/hooks'
import { toast } from 'sonner'

export default function MacroModesCard() {
  const activeProfile = useProfileStore(state => state.activeProfile)
  const { profile: legacyProfile } = useAuth()
  const { data: allProfiles = [], isLoading } = useProfiles()

  // Get full profile data from allProfiles to ensure we have complete data
  // activeProfile from store might only have {id, profile_name} after page refresh
  const fullProfile = activeProfile ? allProfiles.find(p => p.id === activeProfile.id) : undefined

  // Use full profile if available, otherwise fall back to legacy profile
  const profile = fullProfile || legacyProfile

  const applyMode = useApplyMacroMode()

  const nnrPreview = usePreviewMacroMode('nnr')
  const offseasonPreview = usePreviewMacroMode('offseason')
  const onseasonPreview = usePreviewMacroMode('onseason')

  // Function to check if a preset already matches current profile settings
  const isModeActive = (mode: 'nnr' | 'offseason' | 'onseason'): boolean => {
    if (!profile) return false

    const preview =
      mode === 'nnr' ? nnrPreview : mode === 'offseason' ? offseasonPreview : onseasonPreview
    if (!preview) return false

    // Compare with tolerance of 1% for rounding differences
    const tolerance = 1
    const matchesFat =
      Math.abs((profile.fat_min_percent ?? 0) - preview.fatMinPercent) <= tolerance &&
      Math.abs((profile.fat_max_percent ?? 0) - preview.fatMaxPercent) <= tolerance
    const matchesCarb =
      Math.abs((profile.carb_min_percent ?? 0) - preview.carbMinPercent) <= tolerance &&
      Math.abs((profile.carb_max_percent ?? 0) - preview.carbMaxPercent) <= tolerance
    const matchesProtein =
      Math.abs((profile.protein_min_percent ?? 0) - preview.proteinMinPercent) <= tolerance &&
      Math.abs((profile.protein_max_percent ?? 0) - preview.proteinMaxPercent) <= tolerance

    return matchesFat && matchesCarb && matchesProtein
  }

  const handleApplyMode = (mode: 'nnr' | 'offseason' | 'onseason') => {
    applyMode.mutate(
      { mode },
      {
        onSuccess: () => {
          toast.success(`${getModeTitle(mode)} tillämpat!`, {
            description: 'Dina makromål har uppdaterats.',
          })
        },
        onError: error => {
          toast.error('Kunde inte tillämpa makroläge', {
            description: error.message,
          })
        },
      }
    )
  }

  const getModeTitle = (mode: 'nnr' | 'offseason' | 'onseason') => {
    switch (mode) {
      case 'nnr':
        return 'NNR Mode'
      case 'offseason':
        return 'Off-Season Mode'
      case 'onseason':
        return 'On-Season Mode'
    }
  }

  const getModeIcon = (mode: 'nnr' | 'offseason' | 'onseason') => {
    switch (mode) {
      case 'nnr':
        return <Minus className="h-4 w-4" />
      case 'offseason':
        return <TrendingUp className="h-4 w-4" />
      case 'onseason':
        return <TrendingDown className="h-4 w-4" />
    }
  }

  // Wait for profiles to load before enabling buttons
  // Also check that we have complete profile data
  const canApplyOnSeason =
    !isLoading && !!profile?.body_fat_percentage && !!profile?.weight_kg && !!fullProfile
  const canApplyAny =
    !isLoading &&
    !!profile?.weight_kg &&
    !!profile?.calories_min &&
    !!profile?.calories_max &&
    !!fullProfile

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Target className="h-5 w-5 text-accent-600" />
          Snabbval Makrolägen
        </CardTitle>
        <CardDescription>
          Tillämpa fördefinierade makrofördelningar baserat på ditt mål
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canApplyAny && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              Fyll i vikt och kalorimål för att använda makrolägen.
            </p>
          </div>
        )}

        {/* NNR Mode */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getModeIcon('nnr')}
              <span className="font-semibold">NNR Mode</span>
              <Badge variant="outline">Bibehåll vikt</Badge>
            </div>
            <Button
              size="sm"
              variant={isModeActive('nnr') ? 'default' : 'outline'}
              onClick={() => handleApplyMode('nnr')}
              disabled={!canApplyAny || applyMode.isPending || isModeActive('nnr')}
            >
              {isModeActive('nnr') ? 'Redan aktivt' : 'Använd'}
            </Button>
          </div>
          <p className="text-sm text-neutral-600">
            Nordic Nutrition Recommendations - Balanserad makrofördelning för allmänheten
          </p>
          {nnrPreview && (
            <div className="text-xs text-neutral-500 space-y-1 pl-6">
              <div>
                Protein: {nnrPreview.proteinMinPercent.toFixed(0)}-
                {nnrPreview.proteinMaxPercent.toFixed(0)}%
              </div>
              <div>
                Kolhydrater: {nnrPreview.carbMinPercent.toFixed(0)}-
                {nnrPreview.carbMaxPercent.toFixed(0)}%
              </div>
              <div>
                Fett: {nnrPreview.fatMinPercent.toFixed(0)}-{nnrPreview.fatMaxPercent.toFixed(0)}%
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Off-Season Mode */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getModeIcon('offseason')}
              <span className="font-semibold">Off-Season Mode</span>
              <Badge
                variant="outline"
                className="bg-success-50 text-success-700 border-success-200"
              >
                Bulk
              </Badge>
            </div>
            <Button
              size="sm"
              variant={isModeActive('offseason') ? 'default' : 'outline'}
              onClick={() => handleApplyMode('offseason')}
              disabled={!canApplyAny || applyMode.isPending || isModeActive('offseason')}
            >
              {isModeActive('offseason') ? 'Redan aktivt' : 'Använd'}
            </Button>
          </div>
          <p className="text-sm text-neutral-600">
            Bodybuilding bulk - Hög protein, ökad kaloriintag för muskelökning
          </p>
          {offseasonPreview && (
            <div className="text-xs text-neutral-500 space-y-1 pl-6">
              <div>
                Protein: {offseasonPreview.proteinMinPercent.toFixed(0)}-
                {offseasonPreview.proteinMaxPercent.toFixed(0)}%
              </div>
              <div>
                Kolhydrater: {offseasonPreview.carbMinPercent.toFixed(0)}-
                {offseasonPreview.carbMaxPercent.toFixed(0)}%
              </div>
              <div>
                Fett: {offseasonPreview.fatMinPercent.toFixed(0)}-
                {offseasonPreview.fatMaxPercent.toFixed(0)}%
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* On-Season Mode */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getModeIcon('onseason')}
              <span className="font-semibold">On-Season Mode</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                Cut
              </Badge>
            </div>
            <Button
              size="sm"
              variant={isModeActive('onseason') ? 'default' : 'outline'}
              onClick={() => handleApplyMode('onseason')}
              disabled={!canApplyOnSeason || applyMode.isPending || isModeActive('onseason')}
            >
              {isModeActive('onseason') ? 'Redan aktivt' : 'Använd'}
            </Button>
          </div>
          <p className="text-sm text-neutral-600">
            Competition cut - Mycket hög protein för att bevara muskelmassa, lägre fett
          </p>
          {!canApplyOnSeason && (
            <div className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded p-2">
              Kräver kroppsvikt och kroppsfettprocent för att beräkna FFM (fettfri kroppsmassa)
            </div>
          )}
          {onseasonPreview && canApplyOnSeason && (
            <div className="text-xs text-neutral-500 space-y-1 pl-6">
              <div>
                Protein: {onseasonPreview.proteinMinPercent.toFixed(0)}-
                {onseasonPreview.proteinMaxPercent.toFixed(0)}%
              </div>
              <div>
                Kolhydrater: {onseasonPreview.carbMinPercent.toFixed(0)}-
                {onseasonPreview.carbMaxPercent.toFixed(0)}%
              </div>
              <div>
                Fett: {onseasonPreview.fatMinPercent.toFixed(0)}-
                {onseasonPreview.fatMaxPercent.toFixed(0)}%
              </div>
            </div>
          )}
        </div>

        <Separator />

        <div className="text-xs text-neutral-500 space-y-1">
          <p>
            💡 <strong>Tips:</strong>
          </p>
          <p>• NNR för allmän hälsa och viktstabilitet</p>
          <p>• Off-Season för att bygga muskelmassa</p>
          <p>• On-Season för fettförbränning med muskelbevarande</p>
        </div>
      </CardContent>
    </Card>
  )
}
