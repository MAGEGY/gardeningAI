import { describe, expect, it, vi } from 'vitest'
import { geocode, weatherKey } from './weather'

describe('weatherKey', () => {
  it('maps WMO codes to translation keys', () => {
    for (const c of [0, 1]) expect(weatherKey(c)).toBe('w.clear')
    for (const c of [2, 3]) expect(weatherKey(c)).toBe('w.cloudy')
    for (const c of [45, 48]) expect(weatherKey(c)).toBe('w.fog')
    for (const c of [51, 57]) expect(weatherKey(c)).toBe('w.drizzle')
    for (const c of [61, 67, 80, 82]) expect(weatherKey(c)).toBe('w.rain')
    for (const c of [71, 77, 85, 86]) expect(weatherKey(c)).toBe('w.snow')
    for (const c of [95, 99]) expect(weatherKey(c)).toBe('w.storm')
  })
})

describe('geocode', () => {
  it('returns coordinates and label, and passes the language through', async () => {
    const fetchMock = vi.fn(async (_url: string) => ({
      json: async () => ({
        results: [{ name: 'Cairo', admin1: 'Cairo Governorate', country: 'Egypt', latitude: 30.06, longitude: 31.25 }],
      }),
    }))
    vi.stubGlobal('fetch', fetchMock)
    const hit = await geocode('القاهرة', 'ar')
    expect(hit).toEqual({ lat: 30.06, lon: 31.25, label: 'Cairo, Cairo Governorate, Egypt' })
    expect(fetchMock.mock.calls[0][0]).toContain('language=ar')
    vi.unstubAllGlobals()
  })

  it('returns null when results is empty', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ json: async () => ({ results: [] }) })))
    expect(await geocode('nowhere')).toBeNull()
    vi.unstubAllGlobals()
  })
})
