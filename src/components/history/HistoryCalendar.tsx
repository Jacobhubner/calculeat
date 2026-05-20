import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstWeekdayOfMonth(year: number, month: number) {
  // 0=Sun..6=Sat → convert to Mon-based: Mon=0..Sun=6
  const day = new Date(year, month, 1).getDay()
  return (day + 6) % 7
}

export function HistoryCalendar({ logs }: Props) {
  const { i18n } = useTranslation('history')
  const navigate = useNavigate()
  const isSv = i18n.language.startsWith('sv')

  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())

  const logMap = new Map<string, DailyLog>()
  for (const log of logs) {
    logMap.set(log.log_date.split('T')[0], log)
  }

  const daysInMonth = getDaysInMonth(year, month)
  const firstWeekday = getFirstWeekdayOfMonth(year, month)
  const todayStr = today.toISOString().split('T')[0]

  const monthLabel = (isSv ? MONTHS_SV : MONTHS_EN)[month]
  const weekdays = isSv ? WEEKDAYS_SV : WEEKDAYS_EN

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

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to full weeks
  while (cells.length % 7 !== 0) cells.push(null)

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
        <span className="text-base font-semibold text-neutral-800">
          {monthLabel} {year}
        </span>
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
          if (!day) {
            return <div key={`empty-${i}`} className="aspect-square" />
          }

          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const log = logMap.get(dateStr)
          const isToday = dateStr === todayStr
          const isFuture = dateStr > todayStr

          let dotColor = ''
          let bgClass = ''
          let textClass = 'text-neutral-700'

          if (log) {
            const min = log.goal_calories_min ?? 0
            const max = log.goal_calories_max ?? 0
            const cal = log.total_calories
            if (log.is_completed) {
              if (max > 0 && cal >= (min ?? 0) && cal <= max) {
                dotColor = 'bg-green-500'
                bgClass = 'bg-green-50 hover:bg-green-100'
                textClass = 'text-green-800 font-semibold'
              } else if (max > 0 && cal > max) {
                dotColor = 'bg-orange-400'
                bgClass = 'bg-orange-50 hover:bg-orange-100'
                textClass = 'text-orange-700 font-semibold'
              } else {
                dotColor = 'bg-blue-400'
                bgClass = 'bg-blue-50 hover:bg-blue-100'
                textClass = 'text-blue-700 font-semibold'
              }
            } else {
              dotColor = 'bg-neutral-300'
              bgClass = 'bg-neutral-50 hover:bg-neutral-100'
            }
          } else if (!isFuture) {
            bgClass = 'hover:bg-neutral-50'
            textClass = 'text-neutral-300'
          }

          return (
            <button
              key={dateStr}
              disabled={isFuture}
              onClick={() => navigate(`/app/history/${dateStr}`)}
              className={`
                relative aspect-square flex flex-col items-center justify-center gap-0.5
                transition-colors rounded-lg m-0.5
                ${bgClass}
                ${isFuture ? 'cursor-default opacity-30' : 'cursor-pointer'}
                ${isToday ? 'ring-2 ring-primary-400 ring-offset-1' : ''}
              `}
            >
              <span
                className={`text-sm leading-none ${textClass} ${isToday ? 'text-primary-600 font-bold' : ''}`}
              >
                {day}
              </span>
              {log && <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />}
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
          <span className="h-2 w-2 rounded-full bg-green-500" /> {isSv ? 'Inom mål' : 'Within goal'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-orange-400" /> {isSv ? 'Över mål' : 'Over goal'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-blue-400" /> {isSv ? 'Under mål' : 'Under goal'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-neutral-300" />{' '}
          {isSv ? 'Ej avslutad' : 'Not completed'}
        </span>
      </div>
    </div>
  )
}
