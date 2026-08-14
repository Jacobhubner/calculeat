import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase'
import { localDateString } from '@/lib/utils/localDate'

/** Exporten kan ta tid för konton med mycket data — men inte hur länge som helst. */
const EXPORT_TIMEOUT_MS = 90_000

type ExportFormat = 'json' | 'csv'

/** Nycklar i exportsvaret som inte är radtabeller. */
const NON_TABLE_KEYS = new Set(['export_metadata', 'account', 'user_profile'])

export function useDataExport() {
  const { t } = useTranslation('settings')
  const [isExporting, setIsExporting] = useState(false)

  const exportData = async (format: ExportFormat = 'json') => {
    setIsExporting(true)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), EXPORT_TIMEOUT_MS)

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast.error(t('dataExport.errors.notLoggedIn'))
        return
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-user-data`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${session.access_token}` },
          signal: controller.signal,
        }
      )

      if (response.status === 401) {
        toast.error(t('dataExport.errors.sessionExpired'))
        return
      }
      if (!response.ok) {
        throw new Error(`Export failed: ${response.status} ${response.statusText}`)
      }

      const data = (await response.json()) as ExportResponse
      // Lokalt datum: en export kl 01:00 ska heta dagens datum, inte gårdagens.
      const date = localDateString()

      if (format === 'json') {
        downloadFile(
          JSON.stringify(data, null, 2),
          `calculeat-data-export-${date}.json`,
          'application/json;charset=utf-8'
        )
      } else {
        downloadFile(
          convertToCSV(data),
          `calculeat-data-export-${date}.csv`,
          'text/csv;charset=utf-8'
        )
      }

      // Var ärlig om exporten blev ofullständig — en tyst lucka i en
      // GDPR-export är värre än ett synligt fel.
      const partial = data.export_metadata?.partial_failures
      if (partial && Object.keys(partial).length > 0) {
        toast.warning(t('dataExport.partialWarning'))
        console.warn('Export partial failures:', partial)
      } else {
        toast.success(t('dataExport.success', { format: format.toUpperCase() }))
      }
    } catch (error) {
      console.error('Export error:', error)
      if (error instanceof DOMException && error.name === 'AbortError') {
        toast.error(t('dataExport.errors.timeout'))
      } else if (error instanceof TypeError) {
        toast.error(t('dataExport.errors.network'))
      } else {
        toast.error(t('dataExport.errors.generic'))
      }
    } finally {
      clearTimeout(timeout)
      setIsExporting(false)
    }
  }

  return { exportData, isExporting }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  // BOM så att Excel öppnar UTF-8 korrekt (åäö).
  const blob = new Blob(['﻿', content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

interface ExportResponse {
  export_metadata?: {
    format_version?: number
    exported_at?: string
    partial_failures?: Record<string, string> | null
  }
  account?: Record<string, unknown>
  user_profile?: Record<string, unknown> | null
  [table: string]: unknown
}

/** RFC 4180-escaping. Krävs — livsmedelsnamn med komma är fullt normalt. */
function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ''

  let str: string
  if (typeof value === 'object') {
    str = JSON.stringify(value)
  } else {
    str = String(value)
  }

  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

/** En sektion per tabell med egen header — union av alla kolumner, inget trunkeras. */
function tableSection(name: string, rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return []

  const columns = Array.from(
    rows.reduce<Set<string>>((set, row) => {
      Object.keys(row).forEach(k => set.add(k))
      return set
    }, new Set())
  )

  const lines = [`# ${name} (${rows.length})`, columns.map(csvCell).join(',')]
  for (const row of rows) {
    lines.push(columns.map(col => csvCell(row[col])).join(','))
  }
  lines.push('')
  return lines
}

function convertToCSV(data: ExportResponse): string {
  const lines: string[] = [
    '# Calculeat — dataexport (GDPR art. 15 och 20)',
    `# Exporterad: ${data.export_metadata?.exported_at ?? new Date().toISOString()}`,
    '# Varje sektion inleds med "# <tabell> (<antal rader>)" följt av en rubrikrad.',
    '',
  ]

  if (data.account) {
    lines.push(...tableSection('account', [data.account]))
  }
  if (data.user_profile) {
    lines.push(...tableSection('user_profile', [data.user_profile]))
  }

  // Alla radtabeller — ingen trunkering, inga utelämnade tabeller.
  for (const [key, value] of Object.entries(data)) {
    if (NON_TABLE_KEYS.has(key)) continue
    if (!Array.isArray(value)) continue
    lines.push(...tableSection(key, value as Record<string, unknown>[]))
  }

  return lines.join('\n')
}
