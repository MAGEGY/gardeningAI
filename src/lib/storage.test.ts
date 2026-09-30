import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_SETTINGS,
  addHistory,
  clearHistory,
  dismissKeyPrompt,
  loadHistory,
  loadSettings,
  needsKeyPrompt,
  saveSettings,
} from './storage'
import type { PlantProfile } from '../types'
import { mockLocalStorage } from '../test/mockStorage'

const SETTINGS_KEY = 'gardening.settings.v1'

const profile: PlantProfile = {
  identified: true,
  commonName: 'Bay laurel',
  scientificName: 'Laurus nobilis',
  family: 'Lauraceae',
  genus: 'Laurus',
  description: 'Aromatic evergreen.',
  characteristics: [],
  uses: ['culinary'],
  notes: [],
  irrigation: { frequency: '', amount: '', method: '', notes: '' },
  planting: { season: '', soil: '', depth: '', spacing: '', sunlight: '', germination: '' },
  care: { sunlight: '', soil: '', temperature: '', humidity: '', fertilizer: '', pruning: '' },
  nativeRegion: 'Mediterranean',
  growthHabit: '',
  lifespan: '',
  bloomSeason: '',
  toxicity: '',
  confidence: 0.9,
  alternatives: [],
  relatedPlants: [],
}

beforeEach(() => {
  mockLocalStorage()
})

describe('settings', () => {
  it('returns defaults when nothing is stored', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('migrates deprecated models to the current default', () => {
    localStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ model: 'gemini-2.5-flash', language: 'Arabic' }),
    )
    const s = loadSettings()
    expect(s.model).toBe(DEFAULT_SETTINGS.model)
    expect(s.language).toBe('Arabic')
  })

  it('keeps unknown current models as-is', () => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ model: 'gemini-x-custom' }))
    expect(loadSettings().model).toBe('gemini-x-custom')
  })

  it('never persists the apiKey in the settings blob', () => {
    saveSettings({ ...DEFAULT_SETTINGS, apiKey: 'super-secret' })
    const raw = JSON.parse(localStorage.getItem(SETTINGS_KEY) as string)
    expect(raw.apiKey).toBeUndefined()
    expect(loadSettings().apiKey).toBe('')
  })
})

describe('history', () => {
  it('caps the list at 30, newest first', () => {
    for (let i = 0; i < 35; i++) {
      addHistory({ kind: 'search', title: `plant-${i}`, payload: profile })
    }
    const list = loadHistory()
    expect(list).toHaveLength(30)
    expect(list[0].title).toBe('plant-34')
    expect(list[29].title).toBe('plant-5')
  })

  it('drops thumbnails and still saves when storage is full', () => {
    const store = mockLocalStorage()
    const realSet = store.set.bind(store)
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        if (v.includes('"thumbnail"')) throw new Error('QuotaExceededError')
        realSet(k, v)
      },
      removeItem: (k: string) => store.delete(k),
      clear: () => store.clear(),
    })
    addHistory({ kind: 'identify', title: 'X', thumbnail: 'data:image/png;base64,AAAA', payload: profile })
    const list = loadHistory()
    expect(list).toHaveLength(1)
    expect(list[0].thumbnail).toBeUndefined()
  })

  it('clearHistory empties the list', () => {
    addHistory({ kind: 'search', title: 'mint', payload: profile })
    clearHistory()
    expect(loadHistory()).toHaveLength(0)
  })
})

describe('key prompt', () => {
  it('asks when there is no key and no dismissal', () => {
    expect(needsKeyPrompt()).toBe(true)
  })

  it('stops asking after dismissal', () => {
    dismissKeyPrompt()
    expect(needsKeyPrompt()).toBe(false)
  })
})
