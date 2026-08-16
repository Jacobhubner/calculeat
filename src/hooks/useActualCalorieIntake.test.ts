import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React from 'react'
import { useActualCalorieIntake } from './useActualCalorieIntake'

/**
 * Preview-läget är en äkta sandlåda: varje läsning måste filtrera på
 * is_preview. Utan filtret läckte det riktiga kontots loggdagar in i
 * sandlådan — beredskapskortet visade "7/7 loggade dagar" för en ny
 * användare vars logg var helt tom.
 */

const captured: { filters: Record<string, unknown> } = { filters: {} }

vi.mock('@/lib/supabase', () => {
  const builder: Record<string, unknown> = {}
  const chain = () => builder
  Object.assign(builder, {
    select: chain,
    gte: chain,
    lte: chain,
    order: () => Promise.resolve({ data: [], error: null }),
    eq: (col: string, val: unknown) => {
      captured.filters[col] = val
      return builder
    },
  })
  return { supabase: { from: () => builder } }
})

let previewMode = false
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'u1' }, isPreviewMode: previewMode }),
}))

function wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return React.createElement(QueryClientProvider, { client: qc }, children)
}

const start = new Date('2026-08-01T00:00:00Z')
const end = new Date('2026-08-15T00:00:00Z')

beforeEach(() => {
  captured.filters = {}
})

describe('useActualCalorieIntake — sandlådeisolering', () => {
  it('läser bara riktiga loggar utanför preview', async () => {
    previewMode = false
    const { result } = renderHook(() => useActualCalorieIntake(start, end), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(captured.filters.is_preview).toBe(false)
  })

  it('läser bara sandlådans loggar i preview', async () => {
    previewMode = true
    const { result } = renderHook(() => useActualCalorieIntake(start, end), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(captured.filters.is_preview).toBe(true)
  })

  it('filtrerar alltid på is_preview', async () => {
    // Kärnan: filtret får aldrig utelämnas, oavsett läge
    previewMode = true
    const { result } = renderHook(() => useActualCalorieIntake(start, end), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(Object.keys(captured.filters)).toContain('is_preview')
  })
})
