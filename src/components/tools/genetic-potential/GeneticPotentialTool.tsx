import { useState, useMemo } from 'react';
import { Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useProfileData, useMissingProfileData } from '@/hooks/useProfileData';
import MissingDataCard from '../common/MissingDataCard';
import { useUpdateProfile } from '@/hooks';
import {
  calculateAllModels,
  getTargetWeights,
  type GeneticPotentialResult,
} from '@/lib/calculations/geneticPotentialCalculations';
import { toast } from 'sonner';

export default function GeneticPotentialTool() {
  const profileData = useProfileData([
    'height_cm',
    'gender',
    'weight_kg',
    'body_fat_percentage',
  ]);

  const missingFields = useMissingProfileData(['height_cm', 'gender']);
  const updateProfileMutation = useUpdateProfile();

  // Local state för handled/ankel mätningar (inte i profil)
  const [wristCm, setWristCm] = useState<number | ''>('');
  const [ankleCm, setAnkleCm] = useState<number | ''>('');
  const [selectedFormulaIndex, setSelectedFormulaIndex] = useState(0);

  // Beräkna resultat
  const results = useMemo(() => {
    if (!profileData?.height_cm || !profileData?.gender) return null;

    return calculateAllModels({
      heightCm: profileData.height_cm,
      gender: profileData.gender,
      wristCm: wristCm ? Number(wristCm) : undefined,
      ankleCm: ankleCm ? Number(ankleCm) : undefined,
      currentWeight: profileData.weight_kg,
      currentBodyFat: profileData.body_fat_percentage,
    });
  }, [profileData, wristCm, ankleCm]);

  const handleSaveMissingData = async (data: Partial<Profile>) => {
    try {
      await updateProfileMutation.mutateAsync(data);
      toast.success('Profil uppdaterad');
    } catch (error) {
      toast.error('Kunde inte uppdatera profil');
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Genetisk Muskelpotential</h2>
          <p className="text-neutral-600 mt-1">
            Beräkna din maximala muskelmassa baserat på längd och kroppsbyggnad
          </p>
        </div>
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          Kroppsanalys
        </Badge>
      </div>

      {/* Saknad Data */}
      {missingFields.length > 0 && (
        <MissingDataCard
          missingFields={missingFields.map(field => ({
            key: field.key,
            label: field.label,
            type: field.key === 'gender' ? 'select' : 'number',
            options:
              field.key === 'gender'
                ? [
                    { value: 'male', label: 'Man' },
                    { value: 'female', label: 'Kvinna' },
                  ]
                : undefined,
          }))}
          onSave={handleSaveMissingData}
        />
      )}

      {/* Info Alert */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Om Genetisk Muskelpotential</p>
              <p className="text-blue-700">
                Dessa modeller uppskattar din maximala naturliga muskelmassa. Resultaten varierar mellan
                formler beroende på vilka faktorer de tar hänsyn till. Ingen formel är 100% exakt, men
                de ger en användbar riktlinje för realistiska mål.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Vänster: Inputs */}
        <div className="space-y-6">
          {/* Skelettmätningar */}
          <Card>
            <CardHeader>
              <CardTitle>Skelettmätningar (Valfritt)</CardTitle>
              <CardDescription>
                För mer exakta beräkningar med Casey Butt's formel
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="wrist">Handledsmått (cm)</Label>
                  <Input
                    id="wrist"
                    type="number"
                    step="0.1"
                    placeholder="16.5"
                    value={wristCm}
                    onChange={e => setWristCm(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-neutral-500 mt-1">Mät på smalaste punkten</p>
                </div>
                <div>
                  <Label htmlFor="ankle">Ankelmått (cm)</Label>
                  <Input
                    id="ankle"
                    type="number"
                    step="0.1"
                    placeholder="22.0"
                    value={ankleCm}
                    onChange={e => setAnkleCm(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  />
                  <p className="text-xs text-neutral-500 mt-1">Mät på smalaste punkten</p>
                </div>
              </div>

              {/* Mätguide */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 text-sm">
                <p className="font-medium text-neutral-900 mb-2">Mätinstruktioner:</p>
                <ul className="space-y-1 text-neutral-600">
                  <li>• <strong>Handled:</strong> Mät runt handleden på smalaste punkten</li>
                  <li>• <strong>Ankel:</strong> Mät runt ankeln på smalaste punkten (ovanför fotleden)</li>
                  <li>• Använd måttband och mät utan skor</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Resultat per formel */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle>Beräknade Resultat</CardTitle>
                <CardDescription>Olika modeller ger olika uppskattningar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Formula selector buttons */}
                <div className="flex gap-2 flex-wrap">
                  {results.map((result, index) => (
                    <Button
                      key={index}
                      variant={selectedFormulaIndex === index ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedFormulaIndex(index)}
                    >
                      {result.formula.split(' ')[0]}
                    </Button>
                  ))}
                </div>

                {/* Selected formula result */}
                <ResultCard result={results[selectedFormulaIndex]} />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Höger: Nuvarande Status */}
        {results && profileData?.weight_kg && profileData?.body_fat_percentage && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Din Nuvarande Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-600">Vikt:</span>
                    <span className="font-medium">{profileData.weight_kg.toFixed(1)} kg</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-neutral-600">Kroppsfett:</span>
                    <span className="font-medium">{profileData.body_fat_percentage.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Mager massa:</span>
                    <span className="font-medium">
                      {(profileData.weight_kg * (1 - profileData.body_fat_percentage / 100)).toFixed(1)} kg
                    </span>
                  </div>
                </div>

                {/* Progress */}
                {results[0].currentProgress !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-neutral-600">Progress (Berkhan):</span>
                      <span className="font-bold text-primary-600">
                        {results[0].currentProgress.toFixed(0)}%
                      </span>
                    </div>
                    <Progress value={results[0].currentProgress} className="h-2" />
                  </div>
                )}

                {results[0].remainingPotential !== undefined && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-neutral-600 mb-1">Återstående potential:</p>
                    <p className="text-2xl font-bold text-green-600">
                      +{results[0].remainingPotential.toFixed(1)} kg
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">mager massa att bygga</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// Hjälpkomponent för att visa resultat
function ResultCard({ result }: { result: GeneticPotentialResult }) {
  const targetWeights = getTargetWeights(result.maxLeanMass);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-4">
        <p className="text-sm text-neutral-600 mb-1">{result.description}</p>
        <div className="grid grid-cols-2 gap-4 mt-3">
          <div>
            <p className="text-xs text-neutral-500">Maximal mager massa:</p>
            <p className="text-2xl font-bold text-green-700">{result.maxLeanMass.toFixed(1)} kg</p>
          </div>
          <div>
            <p className="text-xs text-neutral-500">Vid låg kroppsfett:</p>
            <p className="text-2xl font-bold text-blue-700">{result.maxWeight.toFixed(1)} kg</p>
          </div>
        </div>
      </div>

      {/* Målvikter vid olika kroppsfett % */}
      <div>
        <h4 className="font-medium text-sm text-neutral-900 mb-2">Målvikt vid olika kroppsfett %:</h4>
        <div className="grid grid-cols-4 gap-2 text-center">
          {targetWeights.slice(0, 8).map(target => (
            <div key={target.bodyFat} className="bg-neutral-50 rounded-lg p-2 border border-neutral-200">
              <p className="text-xs text-neutral-500">{target.bodyFat}%</p>
              <p className="font-semibold text-sm text-neutral-900">{target.weight.toFixed(1)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
