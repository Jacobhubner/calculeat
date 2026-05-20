import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ChevronUp } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { DailyLog } from '@/hooks/useDailyLogs'

interface Props {
  logs: DailyLog[]
}

const WEEKDAYS_SV = ['Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör', 'Sön']
const WEEKDAYS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS_SV = [
  'Januari',
  'Februari',
  'Mars',
  'April',
  'Maj',
  'Juni',
  'Juli',
  'Augusti',
  'September',
  'Oktober',
  'November',
  'December',
]
const MONTHS_SV_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Maj',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Okt',
  'Nov',
  'Dec',
]
const MONTHS_EN = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const MONTHS_EN_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstWeekdayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7
}

function dayColor(log: DailyLog): { dot: string; bg: string; text: string } {
  const min = log.goal_calories_min ?? 0
  const max = log.goal_calories_max ?? 0
  const cal = log.total_calories
  if (!log.is_completed)
    return {
      dot: 'bg-neutral-300',
      bg: 'bg-neutral-50 hover:bg-neutral-100',
      text: 'text-neutral-600',
    }
  if (max > 0 && cal >= min && cal <= max)
    return {
      dot: 'bg-green-500',
      bg: 'bg-green-50 hover:bg-green-100',
      text: 'text-green-800 font-semibold',
    }
  if (max > 0 && cal > max)
    return {
      dot: 'bg-orange-400',
      bg: 'bg-orange-50 hover:bg-orange-100',
      text: 'text-orange-700 font-semibold',
    }
  return {
    dot: 'bg-blue-400',
    bg: 'bg-blue-50 hover:bg-blue-100',
    text: 'text-blue-700 font-semibold',
  }
}

export function HistoryCalendar({ logs }: Props) {
  const { i18n } = useTranslation('history')
  const navigate = useNavigate()
  const isSv = i18n.language.startsWith('sv')

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [view, setView] = useState<'month' | 'year'>('month')

  const logMap = new Map<string, DailyLog>()
  for (const log of logs) logMap.set(log.log_date.split('T')[0], log)

  const todayStr = today.toISOString().split('T')[0]
  const monthNames = isSv ? MONTHS_SV : MONTHS_EN
  const monthShort = isSv ? MONTHS_SV_SHORT : MONTHS_EN_SHORT
  const weekdays = isSv ? WEEKDAYS_SV : WEEKDAYS_EN

  // ── Year view ──────────────────────────────────────────────
  if (view === 'year') {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <button
            onClick={() => setYear(y => y - 1)}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <span className="text-base font-semibold text-neutral-800">{year}</span>
          <button
            onClick={() => setYear(y => y + 1)}
            className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 p-4">
          {Array.from({ length: 12 }, (_, m) => {
            const isCurrentMonth = m === today.getMonth() && year === today.getFullYear()
            const isFuture =
              new Date(year, m, 1) > new Date(today.getFullYear(), today.getMonth(), 1)
            // Count logs this month
            const count = logs.filter(l => {
              const d = l.log_date.split('T')[0]
              return d.startsWith(`${year}-${String(m + 1).padStart(2, '0')}`)
            }).length

            return (
              <button
                key={m}
                disabled={isFuture}
                onClick={() => {
                  setMonth(m)
                  setView('month')
                }}
                className={`
                  rounded-xl px-3 py-4 text-center transition-colors
                  ${isFuture ? 'opacity-30 cursor-default' : 'cursor-pointer hover:bg-primary-50'}
                  ${isCurrentMonth ? 'ring-2 ring-primary-400' : ''}
                  ${m === month && !isFuture ? 'bg-primary-50' : ''}
                `}
              >
                <p
                  className={`text-sm font-semibold ${isCurrentMonth ? 'text-primary-600' : 'text-neutral-700'}`}
                >
                  {monthShort[m]}
                </p>
                {count > 0 && (
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {count} {isSv ? 'dgr' : 'days'}
                  </p>
                )}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Month view ─────────────────────────────────────────────
  const daysInMonth = getDaysInMonth(year, month)
  const firstWeekday = getFirstWeekdayOfMonth(year, month)

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11)
      setYear(y => y - 1)
    } else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0)
      setYear(y => y + 1)
    } else setMonth(m => m + 1)
  }

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
        <button
          onClick={prevMonth}
          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setView('year')}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition-colors group"
        >
          <span className="text-base font-semibold text-neutral-800">
            {monthNames[month]} {year}
          </span>
          <ChevronUp className="h-4 w-4 text-neutral-400 group-hover:text-neutral-600 transition-colors" />
        </button>
        <button
          onClick={nextMonth}
          className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors text-neutral-500"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Weekday labels */}
      <div className="grid grid-cols-7 border-b border-neutral-100">
        {weekdays.map(d => (
          <div key={d} className="py-2 text-center text-xs font-medium text-neutral-400">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} className="aspect-square" />

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const log = logMap.get(dateStr)
          const isToday = dateStr === todayStr
          const isFuture = dateStr > todayStr

          const colors = log ? dayColor(log) : null

          return (
            <button
              key={dateStr}
              disabled={isFuture}
              onClick={() => navigate(`/app/history/${dateStr}`)}
              className={`
                aspect-square flex flex-col items-center justify-center gap-0.5
                transition-colors rounded-lg m-0.5
                ${colors ? colors.bg : isFuture ? '' : 'hover:bg-neutral-50'}
                ${isFuture ? 'cursor-default opacity-30' : 'cursor-pointer'}
                ${isToday ? 'ring-2 ring-primary-400 ring-offset-1' : ''}
              `}
            >
              <span
                className={`text-sm leading-none ${colors ? colors.text : 'text-neutral-300'} ${isToday ? '!text-primary-600 font-bold' : ''}`}
              >
                {day}
              </span>
              {log && <span className={`h-1.5 w-1.5 rounded-full ${colors!.dot}`} />}
              {log && (
                <span className="text-[9px] leading-none text-neutral-400">
                  {log.total_calories}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-5 py-3 border-t border-neutral-100 text-xs text-neutral-500">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500" />
          {isSv ? 'Inom mål' : 'Within goal'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-orange-400" />
          {isSv ? 'Över mål' : 'Over goal'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400" />
          {isSv ? 'Under mål' : 'Under goal'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-neutral-300" />
          {isSv ? 'Ej avslutad' : 'Not completed'}
        </span>
      </div>
    </div>
  )
}
