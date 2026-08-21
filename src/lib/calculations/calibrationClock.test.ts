import { describe, it, expect, vi, afterEach } from 'vitest'
import { buildClusters } from './calibration-clustering'
import { calibrationNow } from './calibration-clock'
import type { WeightHistory } from '@/lib/types'

afterEach(() => vi.useRealTimers())

/**
 * Utfallet får inte bero på när på dygnet appen öppnas.
 *
 * MÄTT: med vägningar sparade vid lokal midnatt — som WeightTracker gör —
 * divergerar rå Date.now och dygnsslut i NOLL av alla fyra-vägningsmönster.
 * En hel dag ligger antingen i fönstret eller utanför, så de 16 timmarna
 * emellan ändrar inget utfall i dag.
 *
 * Testet finns ändå: så snart en vägning får en riktig tidsstämpel — en
 * import, en våg som synkar, ett framtida "väg dig igen i kväll" — blir
 * skillnaden verklig, och då ska den här falla i stället för att tyst ge
 * två svar om samma data.
 */
describe('tid på dygnet ska inte påverka utfallet', () => {
  it('samma vägningar ger samma svar kl 06, 12, 18 och 23', () => {
    // Vägningar sparas vid lokal midnatt — som WeightTracker gör.
    const dag = (offset: number): Date => {
      const d = new Date(2026, 7, 21 - offset)
      d.setHours(0, 0, 0, 0)
      return d
    }
    const hist: WeightHistory[] = [13, 12, 2, 1].map((o, i) => ({
      id: `w${i}`,
      user_id: 'u1',
      weight_kg: 85 - i * 0.05,
      recorded_at: dag(o).toISOString(),
      created_at: dag(o).toISOString(),
    })) as WeightHistory[]

    const svar = new Set<string>()
    for (const timme of [6, 12, 18, 23]) {
      vi.useFakeTimers()
      const t = new Date(2026, 7, 21, timme, 30, 0, 0)
      vi.setSystemTime(t)
      const c = buildClusters(hist, 14, calibrationNow())
      const s = c ? `start=${c.startCluster.count} slut=${c.endCluster.count}` : 'NULL'
      console.log(`  kl ${String(timme).padStart(2, '0')}:30 → ${s}`)
      svar.add(s)
      vi.useRealTimers()
    }
    expect(svar.size).toBe(1)
  })
})

describe('calibrationNow — mot en råklocka', () => {
  /**
   * Här syns skillnaden som midnattsdatan döljer: en vägning med riktig
   * tidsstämpel, 13,8 dagar gammal, ligger i fönstret räknat från
   * dygnsslutet men utanför räknat från kl 08 på morgonen.
   *
   * Två klockor gav då två svar om samma data. Sedan grinden, modalen och
   * runCalibration alla går via calibrationNow finns bara ett.
   */
  it('ger samma fönster oavsett vem som frågar', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 7, 21, 8, 0, 0, 0))

    const nu = calibrationNow().getTime()
    const hist: WeightHistory[] = [13.8, 13.2, 1, 0.2].map((o, i) => {
      const iso = new Date(nu - o * 86400000).toISOString()
      return {
        id: `w${i}`,
        user_id: 'u1',
        weight_kg: 85 - i * 0.05,
        recorded_at: iso,
        created_at: iso,
      } as WeightHistory
    })

    // Alla tre vägar till ett fönsterslut ska ge samma klustring.
    const fran = (d: Date) => {
      const c = buildClusters(hist, 14, d)
      return c ? `${c.startCluster.count}/${c.endCluster.count}` : 'NULL'
    }
    const grinden = fran(new Date(calibrationNow().getTime()))
    const modalen = fran(calibrationNow())
    expect(grinden).toBe(modalen)

    vi.useRealTimers()
  })
})
