import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

export function useDataExport() {
  const [isExporting, setIsExporting] = useState(false)

  const exportData = async (format: 'json' | 'csv' = 'json') => {
    setIsExporting(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast.error('Du måste vara inloggad för att exportera data')
        return
      }

      // Call edge function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export-user-data`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`)
      }

      const data = await response.json()

      if (format === 'json') {
        downloadFile(
          JSON.stringify(data, null, 2),
          'calculeat-data-export.json',
          'application/json'
        )
      } else {
        // Simple CSV conversion for basic profile info + meals
        const csv = convertToCSV(data)
        downloadFile(csv, 'calculeat-data-export.csv', 'text/csv')
      }

      toast.success(`Din data har exporterats som ${format.toUpperCase()}`)
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Kunde inte exportera data. Försök igen senare.')
    } finally {
      setIsExporting(false)
    }
  }

  return {
    exportData,
    isExporting,
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

interface ExportData {
  export_date: string
  user_id: string
  user_email: string
  user_profile: Record<string, unknown>
  profiles: Record<string, unknown>[]
  food_items: Record<string, unknown>[]
  meals: Record<string, unknown>[]
  meal_items: Record<string, unknown>[]
  measurements: Record<string, unknown>[]
  consent_audit_log: Record<string, unknown>[]
}

function convertToCSV(data: ExportData): string {
  const lines: string[] = []

  // Header
  lines.push('Calculeat - Dataexport')
  lines.push(`Exportdatum: ${new Date().toLocaleString('sv-SE')}`)
  lines.push('')

  // Profile info
  if (data.user_profile) {
    lines.push('PROFIL')
    lines.push(`Användarnamn: ${String(data.user_profile.username)}`)
    lines.push(`E-post: ${data.user_email}`)
    lines.push(`Kön: ${String(data.user_profile.gender)}`)
    const birthYear = data.user_profile.birth_date
      ? new Date().getFullYear() - new Date(String(data.user_profile.birth_date)).getFullYear()
      : 'N/A'
    lines.push(`Ålder: ${birthYear}`)
    lines.push(`Längd (cm): ${data.user_profile.height_cm}`)
    lines.push(`Vikt (kg): ${data.user_profile.weight_kg}`)
    lines.push('')
  }

  // Meals summary
  if (data.meals && data.meals.length > 0) {
    lines.push('MÅLTIDER (senaste 30 dagar)')
    lines.push('Datum,Typ,Kalorier,Protein (g),Fett (g),Kolhydrater (g)')
    data.meals.forEach(meal => {
      const mealItems = data.meal_items?.filter(mi => mi.meal_id === meal.id) || []
      const totalCals = mealItems.reduce(
        (sum: number, mi) => sum + (Number(mi.calories_consumed) || 0),
        0
      )
      const totalProtein = mealItems.reduce(
        (sum: number, mi) => sum + (Number(mi.protein_g_consumed) || 0),
        0
      )
      const totalFat = mealItems.reduce(
        (sum: number, mi) => sum + (Number(mi.fat_g_consumed) || 0),
        0
      )
      const totalCarbs = mealItems.reduce(
        (sum: number, mi) => sum + (Number(mi.carb_g_consumed) || 0),
        0
      )

      lines.push(
        `"${meal.meal_date}","${meal.meal_type}",${totalCals.toFixed(1)},${totalProtein.toFixed(1)},${totalFat.toFixed(1)},${totalCarbs.toFixed(1)}`
      )
    })
    lines.push('')
  }

  // Measurements
  if (data.measurements && data.measurements.length > 0) {
    lines.push('MÄTNINGAR')
    lines.push('Datum,Vikt (kg),Kroppsfett (%),Midja (cm)')
    data.measurements.slice(0, 30).forEach(m => {
      lines.push(
        `"${m.measurement_date}",${m.weight_kg || 'N/A'},${m.body_fat_percentage || 'N/A'},${m.waist_cm || 'N/A'}`
      )
    })
    lines.push('')
  }

  // Consent log
  if (data.consent_audit_log && data.consent_audit_log.length > 0) {
    lines.push('GODKÄNNANDE')
    lines.push('Datum,Typ,Godkänd')
    data.consent_audit_log.forEach(log => {
      lines.push(`"${log.accepted_at}","${log.consent_type}",${log.accepted ? 'Ja' : 'Nej'}`)
    })
  }

  return lines.join('\n')
}
