import type { DailyLog } from '@/hooks/useDailyLogs'

/**
 * CSV-export av dagliga loggar (premiumfunktion, se docs/PREMIUM_SPEC.md).
 * Semikolon som avgränsare + BOM så svensk Excel öppnar filen korrekt.
 */

const CSV_HEADERS = [
  'datum',
  'slutförd',
  'kalorier',
  'protein_g',
  'kolhydrater_g',
  'fett_g',
  'gröna_kalorier',
  'gula_kalorier',
  'orange_kalorier',
  'mål_kalorier_min',
  'mål_kalorier_max',
] as const

function csvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  const s = String(value)
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function dailyLogsToCsv(logs: DailyLog[]): string {
  const rows = [...logs]
    .sort((a, b) => a.log_date.localeCompare(b.log_date))
    .map(log =>
      [
        log.log_date.split('T')[0],
        log.is_completed ? 'ja' : 'nej',
        Math.round(log.total_calories),
        Math.round(log.total_protein_g),
        Math.round(log.total_carb_g),
        Math.round(log.total_fat_g),
        Math.round(log.green_calories),
        Math.round(log.yellow_calories),
        Math.round(log.orange_calories),
        log.goal_calories_min != null ? Math.round(log.goal_calories_min) : '',
        log.goal_calories_max != null ? Math.round(log.goal_calories_max) : '',
      ]
        .map(csvField)
        .join(';')
    )

  return [CSV_HEADERS.join(';'), ...rows].join('\n')
}

export function downloadCsv(filename: string, csvContent: string): void {
  // BOM krävs för att Excel ska tolka UTF-8 (å/ä/ö i rubrikerna)
  const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
