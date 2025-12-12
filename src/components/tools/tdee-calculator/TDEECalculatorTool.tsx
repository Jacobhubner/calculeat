import { useState, useMemo } from 'react';
import { Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { useProfileData, useMissingProfileData } from '@/hooks/useProfileData';
import MissingDataCard from '../common/MissingDataCard';
import { useUpdateProfile } from '@/hooks';
import { calculateBMR, calculateTDEE } from '@/lib/calculations/bmr';
import { toast } from 'sonner';
import type { Profile } from '@/lib/types';

type GoalType = 'maintain' | 'loss' | 'gain';
type DeficitLevel = 'conservative' | 'moderate' | 'aggressive';

export default function TDEECalculatorTool() {
  const profileData = useProfileData([
    'weight_kg',
    'height_cm',
    'age',
    'gender',
    'pal_system',
    'activity_level',
  ]);

  const missingFields = useMissingProfileData(['weight_kg', 'height_cm', 'age', 'gender']);
  const updateProfileMutation = useUpdateProfile();

  // Local state
  const [goal, setGoal] = useState<GoalType>('maintain');
  const [deficitLevel, setDeficitLevel] = useState<DeficitLevel>('moderate');

  // Beräkna BMR
  const bmr = useMemo(() => {
    if (!profileData?.weight_kg || !profileData?.height_cm || !profileData?.age || !profileData?.gender) {
      return null;
    }

    return calculateBMR(
      profileData.weight_kg,
      profileData.height_cm,
      profileData.age,
      profileData.gender
    );
  }, [profileData]);

  // Beräkna TDEE
  const tdee = useMemo(() => {
    if (!bmr || !profileData?.activity_level) return null;

    return calculateTDEE(bmr, profileData.activity_level);
  }, [bmr, profileData]);

  // Beräkna kaloriintervall baserat på mål
  const calorieRange = useMemo(() => {
    if (!tdee) return null;

    const deficitLevels = {
      conservative: 0.10, // 10% deficit/surplus
      moderate: 0.15, // 15% deficit/surplus
      aggressive: 0.20, // 20% deficit/surplus
    };

    const multiplier = deficitLevels[deficitLevel];

    if (goal === 'maintain') {
      return {
        min: Math.round(tdee * 0.95),
        max: Math.round(tdee * 1.05),
        change: 0,
      };
    } else if (goal === 'loss') {
      const deficit = Math.round(tdee * multiplier);
      return {
        min: Math.round(tdee - deficit),
        max: Math.round(tdee - deficit * 0.7),
        change: -deficit,
      };
    } else {
      // gain
      const surplus = Math.round(tdee * multiplier);
      return {
        min: Math.round(tdee + surplus * 0.7),
        max: Math.round(tdee + surplus),
        change: surplus,
      };
    }
  }, [tdee, goal, deficitLevel]);

  // Estimera veckoändring (kg per vecka)
  const weeklyChange = useMemo(() => {
    if (!calorieRange) return null;

    // 1 kg kroppsfett ≈ 7700 kcal
    const dailyChange = calorieRange.change;
    const weeklyCalorieChange = dailyChange * 7;
    const weeklyKgChange = weeklyCalorieChange / 7700;

    return weeklyKgChange;
  }, [calorieRange]);

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
          <h2 className="text-2xl font-bold text-gray-900">TDEE & Kaloriuträknare</h2>
          <p className="text-neutral-600 mt-1">
            Beräkna ditt totala dagliga energibehov och kaloriintervall för dina mål
          </p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
          Energi & Metabol
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
              <p className="font-medium mb-1">Om TDEE (Total Daily Energy Expenditure)</p>
              <p className="text-blue-700">
                TDEE är det totala antalet kalorier du förbränner per dag, inklusive basalmetabolism
                (BMR) och fysisk aktivitet. Genom att justera ditt kaloriintag relativt din TDEE kan
                du kontrollera din vikt.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Vänster: BMR & TDEE Display */}
        <div className="space-y-6">
          {/* BMR Card */}
          {bmr && (
            <Card>
              <CardHeader>
                <CardTitle>Basalmetabolism (BMR)</CardTitle>
                <CardDescription>Din kropps energibehov i vila</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-neutral-600 mb-2">Ditt BMR</p>
                  <p className="text-4xl font-bold text-blue-700">{Math.round(bmr)}</p>
                  <p className="text-sm text-neutral-500 mt-1">kcal per dag</p>
                </div>

                <div className="mt-4 text-sm text-neutral-600">
                  <p>
                    BMR är antalet kalorier din kropp förbränner i vila för att upprätthålla vitala
                    funktioner som andning, cirkulation och cellproduktion.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* TDEE Card */}
          {tdee && (
            <Card>
              <CardHeader>
                <CardTitle>Total Daglig Energiförbrukning (TDEE)</CardTitle>
                <CardDescription>
                  BMR + Fysisk aktivitet (Aktivitetsnivå:{' '}
                  {profileData?.activity_level?.toFixed(2)})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6 text-center">
                  <p className="text-sm text-neutral-600 mb-2">Din TDEE</p>
                  <p className="text-4xl font-bold text-green-700">{Math.round(tdee)}</p>
                  <p className="text-sm text-neutral-500 mt-1">kcal per dag</p>
                </div>

                {/* Activity Level Reference */}
                <div className="mt-4 bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-neutral-900 mb-2">
                    Aktivitetsnivå Referens (PAL):
                  </p>
                  <div className="space-y-1 text-xs text-neutral-600">
                    <div className="flex justify-between">
                      <span>1.2 - Sittande (inaktiv)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1.375 - Lätt aktiv (1-3 dagar/vecka)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1.55 - Måttligt aktiv (3-5 dagar/vecka)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1.725 - Mycket aktiv (6-7 dagar/vecka)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1.9 - Extra aktiv (fysiskt jobb + träning)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Höger: Mål & Kaloriintervall */}
        {tdee && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ditt Mål</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Målväljare */}
                <div>
                  <Label htmlFor="goal">Välj mål</Label>
                  <Select
                    id="goal"
                    value={goal}
                    onChange={e => setGoal(e.target.value as GoalType)}
                  >
                    <option value="maintain">Bibehåll vikt</option>
                    <option value="loss">Gå ner i vikt</option>
                    <option value="gain">Gå upp i vikt</option>
                  </Select>
                </div>

                {/* Deficit/Surplus nivå (endast om loss eller gain) */}
                {goal !== 'maintain' && (
                  <div>
                    <Label htmlFor="deficit">Nivå</Label>
                    <Select
                      id="deficit"
                      value={deficitLevel}
                      onChange={e => setDeficitLevel(e.target.value as DeficitLevel)}
                    >
                      <option value="conservative">Konservativ (10%)</option>
                      <option value="moderate">Måttlig (15%)</option>
                      <option value="aggressive">Aggressiv (20%)</option>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Kaloriintervall */}
            {calorieRange && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Ditt Kaloriintervall</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200 rounded-lg p-4">
                    <div className="text-center">
                      <p className="text-sm text-neutral-600 mb-2">Målkalorier per dag</p>
                      <p className="text-3xl font-bold text-orange-700">
                        {calorieRange.min} - {calorieRange.max}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">kcal</p>
                    </div>

                    {calorieRange.change !== 0 && (
                      <div className="mt-4 pt-4 border-t border-orange-200">
                        <div className="flex justify-between text-sm">
                          <span className="text-neutral-600">Daglig förändring:</span>
                          <span
                            className={`font-bold ${
                              calorieRange.change > 0 ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {calorieRange.change > 0 ? '+' : ''}
                            {calorieRange.change} kcal
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Estimerad veckoändring */}
                  {weeklyChange !== null && weeklyChange !== 0 && (
                    <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4">
                      <p className="text-sm text-neutral-600 mb-2">Estimerad viktändring:</p>
                      <p
                        className={`text-2xl font-bold ${
                          weeklyChange > 0 ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {weeklyChange > 0 ? '+' : ''}
                        {weeklyChange.toFixed(2)} kg
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">per vecka</p>

                      <p className="text-xs text-neutral-500 mt-3">
                        * Baserat på 1 kg kroppsfett ≈ 7700 kcal. Faktisk viktändring kan variera
                        beroende på flera faktorer.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
