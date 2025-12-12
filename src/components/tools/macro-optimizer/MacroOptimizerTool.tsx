import { useState, useMemo } from 'react';
import { PieChart, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProfileData, useMissingProfileData } from '@/hooks/useProfileData';
import MissingDataCard from '../common/MissingDataCard';
import { useUpdateProfile } from '@/hooks';
import { toast } from 'sonner';

type MacroMode = 'nnr' | 'offseason' | 'onseason' | 'custom';

interface MacroRange {
  protein: { min: number; max: number };
  fat: { min: number; max: number };
  carbs: { min: number; max: number };
}

interface MacroResult {
  protein: { grams: number; calories: number; percentage: number };
  fat: { grams: number; calories: number; percentage: number };
  carbs: { grams: number; calories: number; percentage: number };
}

const MACRO_MODES: Record<MacroMode, { label: string; description: string; ranges: MacroRange }> =
  {
    nnr: {
      label: 'NNR (Nordiska Näringsrekommendationer)',
      description: 'Balanserad kosthållning för allmän hälsa',
      ranges: {
        protein: { min: 10, max: 20 },
        fat: { min: 25, max: 40 },
        carbs: { min: 45, max: 60 },
      },
    },
    offseason: {
      label: 'Off-season (Muskelbyggande)',
      description: 'Optimerad för muskeltillväxt och återhämtning',
      ranges: {
        protein: { min: 15, max: 25 },
        fat: { min: 20, max: 30 },
        carbs: { min: 50, max: 60 },
      },
    },
    onseason: {
      label: 'On-season (Cutting/Tävling)',
      description: 'Högt protein för att bevara muskelmassa under cutting',
      ranges: {
        protein: { min: 25, max: 35 },
        fat: { min: 20, max: 30 },
        carbs: { min: 40, max: 50 },
      },
    },
    custom: {
      label: 'Anpassat',
      description: 'Skapa din egen makrofördelning',
      ranges: {
        protein: { min: 10, max: 40 },
        fat: { min: 15, max: 45 },
        carbs: { min: 20, max: 65 },
      },
    },
  };

export default function MacroOptimizerTool() {
  const profileData = useProfileData(['weight_kg', 'body_fat_percentage']);
  const missingFields = useMissingProfileData(['weight_kg']);
  const updateProfileMutation = useUpdateProfile();

  // State
  const [mode, setMode] = useState<MacroMode>('nnr');
  const [targetCalories, setTargetCalories] = useState<number>(2000);
  const [proteinPercentage, setProteinPercentage] = useState<number>(20);
  const [fatPercentage, setFatPercentage] = useState<number>(30);

  // Beräkna kolhydrater automatiskt för att summera till 100%
  const carbsPercentage = useMemo(() => {
    return 100 - proteinPercentage - fatPercentage;
  }, [proteinPercentage, fatPercentage]);

  // Beräkna makron i gram
  const macros = useMemo<MacroResult>(() => {
    const proteinCalories = (targetCalories * proteinPercentage) / 100;
    const fatCalories = (targetCalories * fatPercentage) / 100;
    const carbsCalories = (targetCalories * carbsPercentage) / 100;

    return {
      protein: {
        grams: Math.round(proteinCalories / 4),
        calories: Math.round(proteinCalories),
        percentage: proteinPercentage,
      },
      fat: {
        grams: Math.round(fatCalories / 9),
        calories: Math.round(fatCalories),
        percentage: fatPercentage,
      },
      carbs: {
        grams: Math.round(carbsCalories / 4),
        calories: Math.round(carbsCalories),
        percentage: carbsPercentage,
      },
    };
  }, [targetCalories, proteinPercentage, fatPercentage, carbsPercentage]);

  // Protein per kg kroppsvikt (om tillgängligt)
  const proteinPerKg = useMemo(() => {
    if (!profileData?.weight_kg) return null;
    return macros.protein.grams / profileData.weight_kg;
  }, [macros.protein.grams, profileData?.weight_kg]);

  // Validering av percentages
  const isValid = useMemo(() => {
    return carbsPercentage >= 0 && carbsPercentage <= 100;
  }, [carbsPercentage]);

  // När läge ändras, sätt default percentages
  const handleModeChange = (newMode: MacroMode) => {
    setMode(newMode);
    const ranges = MACRO_MODES[newMode].ranges;

    // Sätt till mitten av varje intervall
    const proteinMid = (ranges.protein.min + ranges.protein.max) / 2;
    const fatMid = (ranges.fat.min + ranges.fat.max) / 2;

    setProteinPercentage(Math.round(proteinMid));
    setFatPercentage(Math.round(fatMid));
  };

  const handleSaveMissingData = async (data: any) => {
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
          <h2 className="text-2xl font-bold text-gray-900">Makro-optimerare</h2>
          <p className="text-neutral-600 mt-1">
            Optimera din makrofördelning baserat på dina mål
          </p>
        </div>
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          Mål & Planering
        </Badge>
      </div>

      {/* Saknad Data */}
      {missingFields.length > 0 && (
        <MissingDataCard
          missingFields={missingFields.map(field => ({
            key: field.key,
            label: field.label,
            type: 'number',
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
              <p className="font-medium mb-1">Om Makro-optimeraren</p>
              <p className="text-blue-700">
                Välj ett färdigt läge eller skapa din egen makrofördelning. Alla lägen har
                rekommenderade intervall baserade på forskning och beprövad erfarenhet från träning
                och nutrition.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Vänster: Inställningar */}
        <div className="space-y-6">
          {/* Lägesväljare */}
          <Card>
            <CardHeader>
              <CardTitle>Välj Makro-läge</CardTitle>
              <CardDescription>Välj ett färdigt läge eller anpassa själv</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Object.keys(MACRO_MODES) as MacroMode[]).map(modeKey => (
                  <Button
                    key={modeKey}
                    variant={mode === modeKey ? 'default' : 'outline'}
                    className="h-auto p-4 flex flex-col items-start"
                    onClick={() => handleModeChange(modeKey)}
                  >
                    <span className="font-semibold text-sm">{MACRO_MODES[modeKey].label}</span>
                    <span className="text-xs text-neutral-500 mt-1 text-left">
                      {MACRO_MODES[modeKey].description}
                    </span>
                  </Button>
                ))}
              </div>

              {/* Visa rekommenderade intervall */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-lg p-4 mt-4">
                <p className="text-sm font-medium text-neutral-900 mb-2">
                  Rekommenderade intervall:
                </p>
                <div className="space-y-1 text-sm text-neutral-600">
                  <div className="flex justify-between">
                    <span>Protein:</span>
                    <span className="font-medium">
                      {MACRO_MODES[mode].ranges.protein.min}% -{' '}
                      {MACRO_MODES[mode].ranges.protein.max}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fett:</span>
                    <span className="font-medium">
                      {MACRO_MODES[mode].ranges.fat.min}% - {MACRO_MODES[mode].ranges.fat.max}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kolhydrater:</span>
                    <span className="font-medium">
                      {MACRO_MODES[mode].ranges.carbs.min}% - {MACRO_MODES[mode].ranges.carbs.max}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Kalorier Input */}
          <Card>
            <CardHeader>
              <CardTitle>Målkalorier</CardTitle>
              <CardDescription>Ställ in ditt dagliga kaloriintag</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="calories">Kalorier per dag</Label>
                <Input
                  id="calories"
                  type="number"
                  min="1000"
                  max="5000"
                  step="50"
                  value={targetCalories}
                  onChange={e => setTargetCalories(parseInt(e.target.value) || 2000)}
                  className="text-lg font-semibold"
                />
              </div>
            </CardContent>
          </Card>

          {/* Makro Sliders */}
          <Card>
            <CardHeader>
              <CardTitle>Justera Makrofördelning</CardTitle>
              <CardDescription>
                {isValid
                  ? 'Justera protein och fett - kolhydrater fylls i automatiskt'
                  : 'Fel: Makron summerar inte till 100%'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Protein Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Protein</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={MACRO_MODES[mode].ranges.protein.min}
                      max={MACRO_MODES[mode].ranges.protein.max}
                      value={proteinPercentage}
                      onChange={e => setProteinPercentage(parseInt(e.target.value) || 20)}
                      className="w-16 text-center"
                    />
                    <span className="text-sm text-neutral-600">%</span>
                  </div>
                </div>
                <Slider
                  value={[proteinPercentage]}
                  onValueChange={([value]) => setProteinPercentage(value)}
                  min={MACRO_MODES[mode].ranges.protein.min}
                  max={MACRO_MODES[mode].ranges.protein.max}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Fat Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Fett</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={MACRO_MODES[mode].ranges.fat.min}
                      max={MACRO_MODES[mode].ranges.fat.max}
                      value={fatPercentage}
                      onChange={e => setFatPercentage(parseInt(e.target.value) || 30)}
                      className="w-16 text-center"
                    />
                    <span className="text-sm text-neutral-600">%</span>
                  </div>
                </div>
                <Slider
                  value={[fatPercentage]}
                  onValueChange={([value]) => setFatPercentage(value)}
                  min={MACRO_MODES[mode].ranges.fat.min}
                  max={MACRO_MODES[mode].ranges.fat.max}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Carbs Display (Auto-calculated) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Kolhydrater (automatiskt)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={carbsPercentage}
                      disabled
                      className={`w-16 text-center ${
                        isValid ? '' : 'border-red-500 text-red-600'
                      }`}
                    />
                    <span className="text-sm text-neutral-600">%</span>
                  </div>
                </div>
                <div className="bg-neutral-100 h-10 rounded-lg flex items-center justify-center">
                  <span className="text-sm text-neutral-500">
                    Beräknas automatiskt: 100% - Protein - Fett
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Höger: Resultat */}
        {isValid && (
          <div className="space-y-6">
            {/* Makro Resultat */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Din Makrofördelning</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Protein */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-blue-700">Protein</span>
                    <span className="text-xl font-bold text-blue-900">
                      {macros.protein.percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Gram:</span>
                    <span className="font-semibold text-neutral-900">
                      {macros.protein.grams} g
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Kalorier:</span>
                    <span className="font-semibold text-neutral-900">
                      {macros.protein.calories} kcal
                    </span>
                  </div>
                  {proteinPerKg && (
                    <div className="flex justify-between text-sm mt-2 pt-2 border-t border-blue-200">
                      <span className="text-neutral-600">Per kg kroppsvikt:</span>
                      <span className="font-semibold text-blue-700">
                        {proteinPerKg.toFixed(1)} g/kg
                      </span>
                    </div>
                  )}
                </div>

                {/* Fat */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-yellow-700">Fett</span>
                    <span className="text-xl font-bold text-yellow-900">
                      {macros.fat.percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Gram:</span>
                    <span className="font-semibold text-neutral-900">{macros.fat.grams} g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Kalorier:</span>
                    <span className="font-semibold text-neutral-900">
                      {macros.fat.calories} kcal
                    </span>
                  </div>
                </div>

                {/* Carbs */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-medium text-green-700">Kolhydrater</span>
                    <span className="text-xl font-bold text-green-900">
                      {macros.carbs.percentage}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Gram:</span>
                    <span className="font-semibold text-neutral-900">{macros.carbs.grams} g</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Kalorier:</span>
                    <span className="font-semibold text-neutral-900">
                      {macros.carbs.calories} kcal
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Totalt</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-neutral-600 mb-1">Totala kalorier</p>
                  <p className="text-3xl font-bold text-purple-700">{targetCalories}</p>
                  <p className="text-sm text-neutral-500 mt-1">kcal per dag</p>
                </div>

                <div className="mt-4 text-xs text-neutral-500 text-center">
                  Protein: {macros.protein.percentage}% | Fett: {macros.fat.percentage}% |
                  Kolhydrater: {macros.carbs.percentage}%
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
