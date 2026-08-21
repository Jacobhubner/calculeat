import { describe, it, expect, vi } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCalibrationAvailability } from './useCalibrationAvailability'
import {
  MIN_LOG_DAYS_FOR_CALIBRATION,
  buildClusters,
  runCalibration,
  calibrationNow,
} from '@/lib/calculations/calibration'
import type { Profile, WeightHistory } from '@/lib/types'

// Entitlements slås av: testerna gäller datakraven, inte plangränserna.
vi.mock('@/hooks/useEntitlements', () => ({
  useEntitlements: () => ({ limits: { free_calibration_grace: -1 } }),
  isUnlimited: (v: number) => v === -1,
}))

/**
 * Grinden måste matcha runCalibration exakt. Gör den inte det visar appen
 * "Kalibrera nu" och användaren möts av ett felmeddelande efter klicket.
 */

/**
 * Vägningar räknade från kalibreringens egen klocka, inte Date.now().
 *
 * Fönstret slutar vid dygnsslutet. Med Date.now() som nollpunkt låg en
 * vägning "14 dagar sedan" utanför fönstret när testet kördes på
 * eftermiddagen — samma test föll eller passerade beroende på klockslag.
 */
function weights(count: number, spanDays = 14): WeightHistory[] {
  const now = calibrationNow().getTime()
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(now - (spanDays - (i * spanDays) / Math.max(1, count - 1)) * 86400000)
    return {
      id: `w${i}`,
      user_id: 'u1',
      weight_kg: 85 - i * 0.1,
      recorded_at: d.toISOString(),
      created_at: d.toISOString(),
    }
  })
}

const profile = { tdee: 2500, lifetime_calibration_count: 0 } as unknown as Profile

describe('useCalibrationAvailability — loggkravet', () => {
  it('nekar utan loggdagar även när vikterna räcker', () => {
    const { result } = renderHook(() => useCalibrationAvailability(profile, weights(10), null, 0))
    expect(result.current.isAvailable).toBe(false)
    expect(result.current.reason).toContain('loggade dagar')
  })

  it('nekar strax under tröskeln', () => {
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(10), null, MIN_LOG_DAYS_FOR_CALIBRATION - 1)
    )
    expect(result.current.isAvailable).toBe(false)
  })

  it('tillåter när båda kraven är uppfyllda', () => {
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(10), null, MIN_LOG_DAYS_FOR_CALIBRATION)
    )
    expect(result.current.isAvailable).toBe(true)
  })

  it('antar noll loggdagar när parametern utelämnas', () => {
    // Säker default: hellre neka än att erbjuda en kalibrering som failar
    const { result } = renderHook(() => useCalibrationAvailability(profile, weights(10), null))
    expect(result.current.isAvailable).toBe(false)
  })
})

describe('useCalibrationAvailability — progress', () => {
  it('rapporterar båda kraven separat', () => {
    const { result } = renderHook(() => useCalibrationAvailability(profile, weights(2), null, 3))
    const p = result.current.progress
    expect(p.logDays.current).toBe(3)
    expect(p.logDays.required).toBe(MIN_LOG_DAYS_FOR_CALIBRATION)
    expect(p.weighIns.required).toBeGreaterThan(0)
  })

  it('daysRemaining styrs av det krav som ligger längst efter', () => {
    // 1 vägning (behöver 4) = 3 kvar; 6 loggdagar (behöver 7) = 1 kvar
    const { result } = renderHook(() => useCalibrationAvailability(profile, weights(1), null, 6))
    const p = result.current.progress
    const expected = Math.max(
      p.weighIns.required - p.weighIns.current,
      p.logDays.required - p.logDays.current
    )
    expect(p.daysRemaining).toBe(expected)
  })

  it('daysRemaining är 0 när allt är uppfyllt', () => {
    const { result } = renderHook(() => useCalibrationAvailability(profile, weights(10), null, 20))
    expect(result.current.progress.daysRemaining).toBe(0)
  })

  it('går aldrig under noll vid överskott', () => {
    const { result } = renderHook(() => useCalibrationAvailability(profile, weights(30), null, 60))
    expect(result.current.progress.daysRemaining).toBe(0)
  })
})

describe('useCalibrationAvailability — nya vägningar efter kalibrering', () => {
  /**
   * MIN_NEW_WEIGHTS_AFTER_CALIBRATION är ett minimum "before re-applying".
   * Utan nya mätningar körs kalibreringen på samma underlag som förra
   * gången och kan inte ge något nytt svar.
   *
   * Grinden satte tidigare bara en reason och lämnade isAvailable: true, så
   * kortet visade "0 av 3 nya viktmätningar" med en aktiv Kalibrera-knapp
   * bredvid.
   */
  const nyligenKalibrerad = {
    id: 'c1',
    calibrated_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  } as unknown as Parameters<typeof useCalibrationAvailability>[2]

  it('är otillgänglig direkt efter en kalibrering', () => {
    // Vägningarna ligger FÖRE kalibreringen, alltså noll nya efter den.
    // Spridda över dag 10-24 bakåt: uppfyller klusterkraven, men ALLA
    // ligger före kalibreringen för två dagar sedan.
    const gamla = weights(6, 14).map(w => ({
      ...w,
      recorded_at: new Date(new Date(w.recorded_at).getTime() - 10 * 86400000).toISOString(),
    }))
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, gamla, nyligenKalibrerad, 20)
    )
    expect(result.current.isAvailable).toBe(false)
    expect(result.current.reason).toContain('nya viktmätningar')
  })

  it('rapporterar framsteg så beredskapskortet kan visa det', () => {
    // Spridda över dag 10-24 bakåt: uppfyller klusterkraven, men ALLA
    // ligger före kalibreringen för två dagar sedan.
    const gamla = weights(6, 14).map(w => ({
      ...w,
      recorded_at: new Date(new Date(w.recorded_at).getTime() - 10 * 86400000).toISOString(),
    }))
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, gamla, nyligenKalibrerad, 20)
    )
    expect(result.current.progress.weighIns.current).toBe(0)
    expect(result.current.progress.weighIns.required).toBeGreaterThan(0)
  })
})

describe('useCalibrationAvailability — när kalibrering REKOMMENDERAS', () => {
  /**
   * Rekommendationen kräver hög tillförlitlighet (minst tre vägningar i
   * vardera änden). Att uppmana till kalibrering på tunt underlag ger ett
   * svar som ser lika auktoritativt ut som ett välgrundat.
   *
   * Funktionen förblir TILLGÄNGLIG vid svagare underlag — appen ber bara
   * inte om den.
   */
  it('rekommenderar inte första kalibreringen på tunt underlag', () => {
    // Två vägningar räcker inte till "high".
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(2, 14), null, 20)
    )
    expect(result.current.isRecommended).toBe(false)
  })

  it('rekommenderar när underlaget räcker', () => {
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(8, 14), null, 20)
    )
    if (result.current.confidencePreview === 'high') {
      expect(result.current.isRecommended).toBe(true)
    }
  })

  it('håller funktionen tillgänglig även när den inte rekommenderas', () => {
    // Skillnaden mellan "kan" och "bör" — ett tunt underlag ska inte låsa
    // ute den som ändå vill köra.
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(4, 14), null, 20)
    )
    expect(result.current.isAvailable).toBe(true)
  })
})

describe('useCalibrationAvailability — trappan och blockeringsorsak', () => {
  /**
   * Kortet visar tre mätperioder som en stege. Utan reachedPeriods kunde
   * det bara mäta mot 14-dagarskraven, och användaren såg aldrig att en
   * längre period ger säkrare resultat.
   */
  it('rapporterar aktiv period och uppnådda nivåer', () => {
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(8, 28), null, 20)
    )
    expect([14, 21, 28]).toContain(result.current.progress.activePeriod)
    expect(Array.isArray(result.current.progress.reachedPeriods)).toBe(true)
  })

  it('pekar ut klustringen när vägningarna ligger för tätt', () => {
    // Alla mätningar de senaste tre dagarna: antalet räcker, men de hamnar
    // bara i fönstrets sista tredjedel.
    const nu = calibrationNow().getTime()
    const tata = Array.from({ length: 6 }, (_, i) => ({
      id: `t${i}`,
      user_id: 'u1',
      weight_kg: 85 - i * 0.1,
      recorded_at: new Date(nu - i * 3600000).toISOString(),
      created_at: new Date(nu - i * 3600000).toISOString(),
    })) as unknown as Parameters<typeof useCalibrationAvailability>[1]

    const { result } = renderHook(() => useCalibrationAvailability(profile, tata, null, 20))
    // Antalet är uppfyllt...
    expect(result.current.progress.weighIns.current).toBeGreaterThanOrEqual(
      result.current.progress.weighIns.required
    )
    // ...men ingen period håller, och orsaken ska framgå.
    expect(result.current.progress.reachedPeriods).toHaveLength(0)
    expect(result.current.progress.blocking).toBe('clusterGap')
  })

  it('erkänner när inga vägningar räddar mätperioden', () => {
    // Sex mätningar inom en timme. De ligger så tätt att de bildar ETT
    // moln: fönstret hinner glida förbi dem innan de kan bli ett
    // startkluster, och två nya vägningar räcker inte i andra änden.
    // Verifierat mot buildClusters — inget läge inom 30 dagar håller.
    const nu = Date.now()
    const tata = Array.from({ length: 6 }, (_, i) => ({
      id: `t${i}`,
      user_id: 'u1',
      weight_kg: 85 - i * 0.1,
      recorded_at: new Date(nu - i * 3600000).toISOString(),
      created_at: new Date(nu - i * 3600000).toISOString(),
    })) as unknown as Parameters<typeof useCalibrationAvailability>[1]

    const { result } = renderHook(() => useCalibrationAvailability(profile, tata, null, 20))
    // Ärligt svar i stället för ett datum som inte infrias. Den gamla
    // formeln svarade 5 dagar här — och efter fem dagar hade ingenting
    // hänt.
    expect(result.current.progress.clusterOutlook).toBe('windowExpiring')
    expect(result.current.progress.daysUntilNextWeighInUseful).toBeNull()
  })

  it('sätter blocking till none när inget hindrar', () => {
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, weights(8, 28), null, 20)
    )
    if (result.current.isAvailable) {
      expect(result.current.progress.blocking).toBe('none')
      expect(result.current.progress.daysUntilNextWeighInUseful).toBeNull()
    }
  })
})

describe('useCalibrationAvailability — nedräkningen vid klusterbrist', () => {
  /**
   * Nedräkningen räknades förut med formeln zoneDays − daysSinceOldest,
   * som mätte när äldsta mätningen lämnar SLUTzonen i stället för när den
   * når STARTzonen. I flera lägen gav den 0 fastän ingen vägning hjälpte:
   * kortet sa "väg dig i dag", ingenting hände, och samma uppmaning kom
   * tillbaka nästa dag. Nu simuleras regeln dag för dag.
   */
  const offsets = (offs: number[]): WeightHistory[] =>
    offs.map((d, i) => {
      const iso = new Date(calibrationNow().getTime() - d * 86400000).toISOString()
      return {
        id: `w${i}`,
        user_id: 'u1',
        weight_kg: 85 - i * 0.05,
        recorded_at: iso,
        created_at: iso,
      } as WeightHistory
    })

  it('säger "väg dig i dag" bara när en vägning i dag faktiskt räcker', () => {
    // Fyra gamla vägningar bildar redan ett startkluster — det som saknas
    // är en färsk mätning i andra änden.
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, offsets([13, 12, 11, 10]), null, 20)
    )
    expect(result.current.progress.blocking).toBe('clusterGap')
    expect(result.current.progress.clusterOutlook).toBe('weighToday')
    expect(result.current.progress.daysUntilNextWeighInUseful).toBe(0)
  })

  it('ger en väntetid när allt ligger i samma ände', () => {
    // Alla mätningar är timmar gamla: de kan inte bilda både start- och
    // slutkluster förrän de hunnit åldras in i startzonen.
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, offsets([0.1, 0.2, 0.3, 0.4]), null, 20)
    )
    expect(result.current.progress.clusterOutlook).toBe('weighLater')
    const dagar = result.current.progress.daysUntilNextWeighInUseful
    expect(dagar).not.toBeNull()
    expect(dagar!).toBeGreaterThan(0)
  })

  it('lovar aldrig en dag då klustret ändå inte håller', () => {
    // Kontrollerar löftet mot den riktiga regeln: väger användaren sig den
    // utlovade dagen (och dagen före, som simuleringen antar) ska
    // buildClusters faktiskt ge två fullstora kluster.
    for (const offs of [
      [0.1, 0.2, 0.3, 0.4],
      [3, 2, 1, 0],
      [6, 5, 4, 3],
    ]) {
      const { result } = renderHook(() =>
        useCalibrationAvailability(profile, offsets(offs), null, 20)
      )
      const dagar = result.current.progress.daysUntilNextWeighInUseful
      if (dagar === null) continue

      const now = calibrationNow().getTime()
      const target = now + dagar * 86400000
      const historik = offs.map(o => now - o * 86400000)
      const nya = [target, target - 86400000]
      const alla = [...historik, ...nya].map((t, i) => ({
        id: `x${i}`,
        user_id: 'u1',
        weight_kg: 85 - i * 0.05,
        recorded_at: new Date(t).toISOString(),
        created_at: new Date(t).toISOString(),
      })) as WeightHistory[]

      const c = buildClusters(alla, 14, new Date(target))
      expect(c).not.toBeNull()
      expect(c!.startCluster.count).toBeGreaterThanOrEqual(2)
      expect(c!.endCluster.count).toBeGreaterThanOrEqual(2)
    }
  })

  it('sätter notBlocking när klustringen inte är hindret', () => {
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, offsets([13, 12, 1, 0]), null, 20)
    )
    expect(result.current.progress.clusterOutlook).toBe('notBlocking')
    expect(result.current.progress.daysUntilNextWeighInUseful).toBeNull()
  })
})

describe('useCalibrationAvailability — hinder som mer data inte löser', () => {
  /**
   * Kortet läste förut bara progress och aldrig reason. Den som var spärrad
   * av gratisnivåns intervall fick därför nedräkningar och "väg dig igen" —
   * en uppmaning som garanterat inte leder någonstans på 150 dagar.
   */
  it('flaggar saknat TDEE i stället för att räkna ned', () => {
    const utanTdee = { lifetime_calibration_count: 0 } as unknown as Profile
    const { result } = renderHook(() => useCalibrationAvailability(utanTdee, weights(10), null, 20))
    expect(result.current.isAvailable).toBe(false)
    expect(result.current.progress.hardBlock).toBe('missingTdee')
  })

  it('lämnar hardBlock som none när det bara saknas data', () => {
    const { result } = renderHook(() => useCalibrationAvailability(profile, weights(2), null, 3))
    expect(result.current.progress.hardBlock).toBe('none')
    expect(result.current.progress.hardBlockDaysLeft).toBeNull()
  })
})

describe('useCalibrationAvailability — vägningarnas spridning', () => {
  /**
   * "4 / 4" ser uppfyllt ut även när alla fyra ligger i samma ände av
   * perioden. Två separata siffror gör skillnaden synlig vid talet självt.
   */
  const offsets = (offs: number[]): WeightHistory[] =>
    offs.map((d, i) => {
      const iso = new Date(calibrationNow().getTime() - d * 86400000).toISOString()
      return {
        id: `w${i}`,
        user_id: 'u1',
        weight_kg: 85 - i * 0.05,
        recorded_at: iso,
        created_at: iso,
      } as WeightHistory
    })

  it('ger noll i båda ändar när vägningarna ligger i rad', () => {
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, offsets([3, 2, 1, 0]), null, 20)
    )
    // Antalet är uppfyllt men spridningen avslöjar att talet inte räcker.
    expect(result.current.progress.weighInSpread.early).toBe(0)
    expect(result.current.progress.weighInSpread.late).toBe(0)
  })

  it('räknar tidiga och sena var för sig när de är spridda', () => {
    const { result } = renderHook(() =>
      useCalibrationAvailability(profile, offsets([13, 12, 1, 0]), null, 20)
    )
    expect(result.current.progress.weighInSpread.early).toBeGreaterThanOrEqual(2)
    expect(result.current.progress.weighInSpread.late).toBeGreaterThanOrEqual(2)
  })
})

describe('useCalibrationAvailability — grinden mot motorn', () => {
  /**
   * Kortets löfte måste hålla vid knapptrycket.
   *
   * Hooken kontrollerade klusterstorlek men aldrig 7-dagarsregeln,
   * runCalibration tvärtom. De två grindarna kunde därför säga olika saker
   * om samma data — 17 % av de "redo" lägena nekades i praktiken. Sedan
   * separationskravet flyttats in i buildClusters ärver båda den.
   */
  it('säger aldrig redo om något motorn nekar på klusterskäl', () => {
    const now = new Date()
    // 0,4 dagars marginal: en vägning ligger aldrig exakt på fönsterkanten,
    // där millisekunder mellan två klockavläsningar avgör utfallet.
    const at = (offs: number[]): WeightHistory[] =>
      offs.map((o, i) => {
        const iso = new Date(now.getTime() - (o - 0.4) * 86400000).toISOString()
        return {
          id: `w${i}`,
          user_id: 'u1',
          weight_kg: 85 - o * 0.03,
          recorded_at: iso,
          created_at: iso,
        } as WeightHistory
      })

    let missmatch = 0
    const rec = (from: number, acc: number[]) => {
      if (acc.length === 4) {
        const hist = at(acc)
        const { result } = renderHook(() => useCalibrationAvailability(profile, hist, null, 20))
        if (result.current.isAvailable) {
          const r = runCalibration({
            weightHistory: hist,
            periodDays: 14,
            currentTDEE: 2500,
            targetCalories: 2100,
            actualCaloriesAvg: 2100,
            foodLogCompleteness: 100,
            daysWithLogData: 20,
            isFirstCalibration: true,
            now,
          })
          if (
            typeof r === 'string' &&
            (r.includes('kort tid') || r.includes('start- och slutvikt'))
          ) {
            missmatch++
          }
        }
        return
      }
      for (let d = from; d <= 14; d++) rec(d + 1, [...acc, d])
    }
    rec(0, [])

    expect(missmatch).toBe(0)
  })
})
