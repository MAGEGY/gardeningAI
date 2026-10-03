import { describe, expect, it, vi } from 'vitest'
import {
  normalizeDiagnosis,
  normalizePlant,
  normalizeSeasonal,
  parseJSONLoose,
  pollinationsChat,
  wikiPlantProfile,
} from './fallback'
import { DEFAULT_SETTINGS } from './storage'

describe('parseJSONLoose', () => {
  it('parses plain JSON', () => {
    expect(parseJSONLoose('{"a":1}')).toEqual({ a: 1 })
  })

  it('parses JSON inside code fences', () => {
    expect(parseJSONLoose('```json\n{"a":1}\n```')).toEqual({ a: 1 })
  })

  it('parses JSON with surrounding prose', () => {
    expect(parseJSONLoose('Here you go:\n{"a":1}\nHope that helps!')).toEqual({ a: 1 })
  })

  it('throws on non-JSON input', () => {
    expect(() => parseJSONLoose('not json at all')).toThrow()
  })
})

describe('normalizers', () => {
  it('fills missing plant fields with defaults', () => {
    const p = normalizePlant({ commonName: 'Potato', description: 'A tuber.' })
    expect(p.identified).toBe(true)
    expect(p.commonName).toBe('Potato')
    expect(p.irrigation).toEqual({ frequency: '', amount: '', method: '', notes: '' })
    expect(p.care.soil).toBe('')
    expect(p.uses).toEqual([])
    expect(p.confidence).toBe(0)
  })

  it('keeps provided plant fields', () => {
    const p = normalizePlant({
      identified: false,
      uses: ['food'],
      irrigation: { frequency: 'weekly' },
      confidence: 0.8,
    })
    expect(p.identified).toBe(false)
    expect(p.uses).toEqual(['food'])
    expect(p.irrigation.frequency).toBe('weekly')
    expect(p.confidence).toBe(0.8)
  })

  it('fills missing diagnosis fields', () => {
    const d = normalizeDiagnosis({ summary: 'Looks fine.' })
    expect(d.isPlant).toBe(true)
    expect(d.overallHealth).toBe('moderate')
    expect(d.issues).toEqual([])
    expect(d.treatment).toEqual({ immediate: [], organic: [], chemical: [] })
    expect(d.urgency).toBe('medium')
  })

  it('maps diagnosis issues safely', () => {
    const d = normalizeDiagnosis({
      issues: [{ name: 'Aphids', symptoms: ['sticky leaves'], confidence: 0.9 }],
    })
    expect(d.issues[0].type).toBe('other')
    expect(d.issues[0].severity).toBe('moderate')
    expect(d.issues[0].symptoms).toEqual(['sticky leaves'])
  })

  it('fills missing seasonal fields', () => {
    const s = normalizeSeasonal({ summary: 'Spring.', plantings: [{ name: 'Tomato' }] })
    expect(s.plantings[0]).toEqual({ name: 'Tomato', type: 'other', action: 'maintain', note: '' })
    expect(s.tasks).toEqual([])
  })
})

describe('pollinationsChat', () => {
  it('extracts the OpenAI-style reply content', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      text: async () => JSON.stringify({ choices: [{ message: { content: 'hello' } }] }),
    })))
    expect(await pollinationsChat([{ type: 'text', text: 'hi' }])).toBe('hello')
    vi.unstubAllGlobals()
  })

  it('returns raw text when the reply is not JSON', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, text: async () => 'plain reply' })))
    expect(await pollinationsChat([{ type: 'text', text: 'hi' }])).toBe('plain reply')
    vi.unstubAllGlobals()
  })

  it('throws on HTTP failure', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, text: async () => '' })))
    await expect(pollinationsChat([{ type: 'text', text: 'hi' }])).rejects.toThrow(/503/)
    vi.unstubAllGlobals()
  })
})

describe('wikiPlantProfile', () => {
  it('searches the right language wiki and maps the summary', async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const u = String(url)
      if (u.includes('/w/api.php')) {
        return { ok: true, json: async () => ({ query: { search: [{ title: 'بطاطس' }] } }) }
      }
      if (u.includes('/api/rest_v1/page/summary/')) {
        return {
          ok: true,
          json: async () => ({ title: 'بطاطس', extract: 'البطاطس نبات درني من الفصيلة الباذنجانية.' }),
        }
      }
      throw new Error(`unexpected url: ${u}`)
    })
    vi.stubGlobal('fetch', fetchMock)

    const p = await wikiPlantProfile(
      { ...DEFAULT_SETTINGS, language: 'Arabic' },
      'بطاطس',
    )
    expect(p.identified).toBe(true)
    expect(p.commonName).toBe('بطاطس')
    expect(p.description).toContain('البطاطس')
    expect(p.notes).toHaveLength(1)
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(String(fetchMock.mock.calls[0][0])).toContain('ar.wikipedia.org')

    vi.unstubAllGlobals()
  })

  it('skips disambiguation pages', async () => {
    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const u = String(url)
      if (u.includes('/w/api.php')) {
        return {
          ok: true,
          json: async () => ({
            query: { search: [{ title: 'Mercury (disambiguation)' }, { title: 'Potato' }] },
          }),
        }
      }
      if (u.includes('Mercury')) {
        return { ok: true, json: async () => ({ title: 'Mercury (disambiguation)', extract: 'may refer to several things.' }) }
      }
      return { ok: true, json: async () => ({ title: 'Potato', extract: 'A starchy tuber.' }) }
    })
    vi.stubGlobal('fetch', fetchMock)

    const p = await wikiPlantProfile(DEFAULT_SETTINGS, 'potato')
    expect(p.commonName).toBe('Potato')
    expect(p.description).toBe('A starchy tuber.')

    vi.unstubAllGlobals()
  })

  it('throws when no article matches', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ query: { search: [] } }),
    })))
    await expect(wikiPlantProfile(DEFAULT_SETTINGS, 'zzzznotaplant')).rejects.toThrow(/No Wikipedia/)
    vi.unstubAllGlobals()
  })
})
