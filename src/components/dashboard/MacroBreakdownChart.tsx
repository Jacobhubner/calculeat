import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface MacroBreakdownChartProps {
  protein: { currentG: number; minG: number; maxG: number; currentPct: number }
  fat: { currentG: number; minG: number; maxG: number; currentPct: number }
  carbs: { currentG: number; minG: number; maxG: number; currentPct: number }
}

export function MacroBreakdownChart({ protein, fat, carbs }: MacroBreakdownChartProps) {
  const { t } = useTranslation('dashboard')

  // Determine status colors for each macro
  const getStatusColor = (current: number, min: number, max: number): string => {
    if (current >= min && current <= max) return '#16a34a' // success-600
    if (current > max) return '#dc2626' // error-600
    return '#f59e0b' // amber-600 (under)
  }

  const proteinColor = getStatusColor(protein.currentG, protein.minG, protein.maxG)
  const fatColor = getStatusColor(fat.currentG, fat.minG, fat.maxG)
  const carbsColor = getStatusColor(carbs.currentG, carbs.minG, carbs.maxG)

  // Pie data
  const pieData = [
    { name: t('macros.protein'), value: protein.currentPct, color: proteinColor },
    { name: t('macros.fat'), value: fat.currentPct, color: fatColor },
    { name: t('macros.carbs'), value: carbs.currentPct, color: carbsColor },
  ]

  // Status indicators
  const getStatusIcon = (current: number, min: number, max: number): string => {
    if (current >= min && current <= max) return '✓'
    if (current > max) return '⚠'
    return '○'
  }

  const macroList = [
    {
      name: t('macros.protein'),
      current: protein.currentG,
      min: protein.minG,
      max: protein.maxG,
      color: proteinColor,
      status: getStatusIcon(protein.currentG, protein.minG, protein.maxG),
    },
    {
      name: t('macros.fat'),
      current: fat.currentG,
      min: fat.minG,
      max: fat.maxG,
      color: fatColor,
      status: getStatusIcon(fat.currentG, fat.minG, fat.maxG),
    },
    {
      name: t('macros.carbs'),
      current: carbs.currentG,
      min: carbs.minG,
      max: carbs.maxG,
      color: carbsColor,
      status: getStatusIcon(carbs.currentG, carbs.minG, carbs.maxG),
    },
  ]

  const renderCustomizedLabel = ({ value }: { value: number }) => {
    if (value === 0) return null
    return `${value}%`
  }

  return (
    <Card variant="gradient">
      <CardHeader className="pb-3">
        <CardTitle>{t('macros.breakdown')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Pie Chart */}
        <div className="flex justify-center h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={75}
                paddingAngle={2}
                dataKey="value"
                label={renderCustomizedLabel}
                labelLine={false}
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => `${value}%`}
                contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Macro Details List */}
        <div className="space-y-3">
          {macroList.map(macro => (
            <div key={macro.name} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: macro.color }} />
                  <span className="text-sm font-medium text-neutral-700">{macro.name}</span>
                </div>
                <span
                  className={cn('text-sm font-semibold', {
                    'text-success-600': macro.status === '✓',
                    'text-error-600': macro.status === '⚠',
                    'text-amber-600': macro.status === '○',
                  })}
                >
                  {macro.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>
                  {Math.round(macro.current)}g of {macro.min}-{macro.max}g
                </span>
                <span className="text-neutral-500">
                  {Math.round((macro.current / (macro.max || 1)) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
