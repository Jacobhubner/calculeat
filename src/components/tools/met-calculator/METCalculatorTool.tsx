import { useState, useMemo } from 'react';
import { Flame, Plus, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { useProfileData } from '@/hooks/useProfileData';
import {
  MET_CATEGORIES,
  MET_ACTIVITIES,
  searchActivities,
  type METActivity,
} from '@/lib/constants/metActivities';
import {
  calculateCaloriesBurned,
  getIntensityLevel,
} from '@/lib/calculations/metCalculations';
import { toast } from 'sonner';

interface SelectedActivity extends METActivity {
  durationMinutes: number;
  calories: number;
}

export default function METCalculatorTool() {
  const profileData = useProfileData(['weight_kg']);

  // Debug: Logga vikten
  console.log('MET Calculator - profileData:', profileData);
  console.log('MET Calculator - weight_kg:', profileData?.weight_kg);

  // Search and filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActivities, setSelectedActivities] = useState<SelectedActivity[]>([]);

  // Filtrera aktiviteter
  const filteredActivities = useMemo(() => {
    return searchActivities(searchTerm, selectedCategory === 'All' ? undefined : selectedCategory);
  }, [searchTerm, selectedCategory]);

  // Beräkna totala kalorier
  const totalCalories = useMemo(() => {
    return selectedActivities.reduce((sum, activity) => sum + activity.calories, 0);
  }, [selectedActivities]);

  const totalDuration = useMemo(() => {
    return selectedActivities.reduce((sum, activity) => sum + activity.durationMinutes, 0);
  }, [selectedActivities]);

  const handleAddActivity = (activity: METActivity, duration: number) => {
    if (!profileData?.weight_kg) {
      toast.error('Vänligen fyll i din vikt först');
      return;
    }

    // Validate duration
    if (duration <= 0) {
      toast.error('Varaktighet måste vara större än 0');
      return;
    }

    const calories = calculateCaloriesBurned(activity.met, profileData.weight_kg, duration);

    // Validate calculation result
    if (calories <= 0 || !isFinite(calories)) {
      toast.error('Det gick inte att beräkna kalorier. Kontrollera dina värden.');
      return;
    }

    setSelectedActivities(prev => [
      ...prev,
      {
        ...activity,
        durationMinutes: duration,
        calories,
      },
    ]);

    toast.success(`${activity.activity} tillagd`);
  };

  const handleRemoveActivity = (index: number) => {
    setSelectedActivities(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">MET Aktivitetskalkylator</h2>
          <p className="text-neutral-600 mt-1">
            Beräkna kalorier förbrända från över 1100 aktiviteter med metriska enheter
          </p>
        </div>
        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
          Energi & Metabol
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Vänster: Aktivitetssökning */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Sök Aktiviteter</CardTitle>
              <CardDescription>
                Hitta aktiviteter från {MET_ACTIVITIES.length} olika alternativ
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Kategoriväljare */}
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select
                  id="category"
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                >
                  <option value="All">Alla kategorier</option>
                  {MET_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </Select>
              </div>

              {/* Sökfält */}
              <div>
                <Label htmlFor="search">Sök aktivitet</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-neutral-400" />
                  <Input
                    id="search"
                    placeholder="Sök på aktivitet, kod eller intensitet..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <p className="text-xs text-neutral-500 mt-1">
                  Tips: Sök på "lätt", "måttlig", "hög" eller "mycket hög" för intensitetsnivå
                </p>
              </div>

              {/* Resultaträknare */}
              {(searchTerm || selectedCategory !== 'All') && filteredActivities.length > 0 && (
                <div className="text-sm text-neutral-600">
                  Hittade {filteredActivities.length} aktivitet{filteredActivities.length !== 1 ? 'er' : ''}
                </div>
              )}

              {/* Aktivitetslista */}
              <div className="max-h-96 overflow-y-auto border rounded-lg">
                {filteredActivities.length === 0 ? (
                  <div className="p-8 text-center text-neutral-500">
                    Inga aktiviteter hittades
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredActivities.map(activity => (
                      <ActivityRow
                        key={activity.id}
                        activity={activity}
                        onAdd={handleAddActivity}
                        disabled={!profileData?.weight_kg}
                      />
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Höger: Valda aktiviteter och resultat */}
        <div className="space-y-6">
          {/* Sammanfattning */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Totalt</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-neutral-600">Aktiviteter:</span>
                <span className="font-bold">{selectedActivities.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-600">Tid:</span>
                <span className="font-bold">{totalDuration} min</span>
              </div>
              <div className="pt-3 border-t">
                <div className="flex justify-between items-baseline">
                  <span className="text-neutral-600">Kalorier:</span>
                  <span className="text-3xl font-bold text-orange-600">{totalCalories.toFixed(0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valda aktiviteter */}
          {selectedActivities.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Valda Aktiviteter</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedActivities([])}
                    className="text-error-600 hover:text-error-700"
                  >
                    Rensa alla
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {selectedActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg border border-neutral-200"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-900 truncate">
                          {activity.activity}
                        </p>
                        <p className="text-xs text-neutral-500">
                          {activity.durationMinutes} min · {activity.met} MET
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-3">
                        <span className="text-sm font-bold text-neutral-900">
                          {activity.calories.toFixed(0)} kcal
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveActivity(index)}
                          className="h-8 w-8 p-0 text-error-600 hover:text-error-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Hjälpkomponent för aktivitetsrad
function ActivityRow({
  activity,
  onAdd,
  disabled,
}: {
  activity: METActivity;
  onAdd: (activity: METActivity, duration: number) => void;
  disabled: boolean;
}) {
  const [duration, setDuration] = useState<number>(30);
  const [showDuration, setShowDuration] = useState(false);

  const intensity = getIntensityLevel(activity.met);

  const handleAdd = () => {
    if (duration > 0) {
      onAdd(activity, duration);
      setShowDuration(false);
      setDuration(30);
    }
  };

  return (
    <div className="p-3 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900">{activity.activity}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-neutral-500">{activity.category}</span>
            <Badge variant="secondary" className={`text-xs ${intensity.color}`}>
              {activity.met} MET
            </Badge>
          </div>
        </div>

        {!showDuration ? (
          <Button
            size="sm"
            onClick={() => setShowDuration(true)}
            disabled={disabled}
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1" />
            Lägg till
          </Button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <Input
              type="number"
              min="1"
              value={duration}
              onChange={e => setDuration(parseInt(e.target.value) || 0)}
              className="w-16 h-8 text-sm"
              placeholder="min"
            />
            <Button size="sm" onClick={handleAdd} className="h-8">
              OK
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
