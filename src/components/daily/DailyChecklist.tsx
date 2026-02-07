import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, X, Sparkles } from 'lucide-react'

interface ChecklistItem {
  id: string
  label: string
  isComplete: boolean
  description?: string
}

interface DailyChecklistProps {
  caloriesOk: boolean
  macrosOk: boolean
  colorBalanceOk: boolean
  showCard?: boolean
  className?: string
}

/**
 * Checklist widget showing daily nutrition goals progress
 * 3 items: Calories, Macros, Color Balance
 */
export function DailyChecklist({
  caloriesOk,
  macrosOk,
  colorBalanceOk,
  showCard = true,
  className,
}: DailyChecklistProps) {
  const items: ChecklistItem[] = [
    {
      id: 'calories',
      label: 'Kalorier inom mål',
      isComplete: caloriesOk,
      description: 'Totalt kaloriintag inom min-max intervallet',
    },
    {
      id: 'macros',
      label: 'Makros balanserade',
      isComplete: macrosOk,
      description: 'Protein, kolhydrater och fett inom målintervallen',
    },
    {
      id: 'colors',
      label: 'Färgbalans i mål',
      isComplete: colorBalanceOk,
      description: 'Grön, gul och orange mat i rätt proportioner',
    },
  ]

  const completedCount = items.filter(item => item.isComplete).length
  const totalCount = items.length
  const allComplete = completedCount === totalCount

  const content = (
    <div className="space-y-3">
      {/* Checklist items */}
      <div className="space-y-2">
        {items.map(item => (
          <ChecklistRow key={item.id} item={item} />
        ))}
      </div>

      {/* Progress summary */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm text-neutral-600">
            {completedCount}/{totalCount} uppnått
          </span>
          {allComplete && (
            <span className="flex items-center gap-1 text-sm font-medium text-green-600">
              <Sparkles className="h-4 w-4" />
              Perfekt dag!
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-2 h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              allComplete ? 'bg-green-500' : 'bg-primary-500'
            )}
            style={{ width: `${(completedCount / totalCount) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )

  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-lg">✅</span>
            Dagens checklista
          </CardTitle>
        </CardHeader>
        <CardContent>{content}</CardContent>
      </Card>
    )
  }

  return <div className={className}>{content}</div>
}

interface ChecklistRowProps {
  item: ChecklistItem
}

function ChecklistRow({ item }: ChecklistRowProps) {
  return (
    <div
      className={cn(
        'flex items-center gap-3 p-2 rounded-lg transition-colors',
        item.isComplete ? 'bg-green-50' : 'bg-neutral-50'
      )}
    >
      <div
        className={cn(
          'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0',
          item.isComplete ? 'bg-green-500 text-white' : 'bg-neutral-200 text-neutral-400'
        )}
      >
        {item.isComplete ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      </div>
      <div className="flex-1">
        <span
          className={cn(
            'text-sm font-medium',
            item.isComplete ? 'text-green-700' : 'text-neutral-600'
          )}
        >
          {item.label}
        </span>
      </div>
    </div>
  )
}

interface ChecklistSummaryBadgeProps {
  completedCount: number
  totalCount: number
  className?: string
}

/**
 * Compact badge showing checklist progress (e.g., "2/3")
 */
export function ChecklistSummaryBadge({
  completedCount,
  totalCount,
  className,
}: ChecklistSummaryBadgeProps) {
  const allComplete = completedCount === totalCount

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-sm font-medium',
        allComplete
          ? 'bg-green-100 text-green-700'
          : completedCount > 0
            ? 'bg-amber-100 text-amber-700'
            : 'bg-neutral-100 text-neutral-600',
        className
      )}
    >
      {allComplete ? (
        <>
          <Sparkles className="h-3.5 w-3.5" />
          <span>Alla mål!</span>
        </>
      ) : (
        <>
          <span>
            {completedCount}/{totalCount}
          </span>
          <span className="text-xs opacity-75">mål</span>
        </>
      )}
    </div>
  )
}
