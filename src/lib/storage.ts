import type { HistoryItem, Settings } from '../types'
import { apiKeyCached } from './secureKey'

const SETTINGS_KEY = 'gardening.settings.v1'
const HISTORY_KEY = 'gardening.history.v1'
const SKIP_KEY = 'gardening.keySkipped.v1'
const MAX_HISTORY = 30

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: 'gemini-2.5-flash',
  language: 'English',
}

export function loadSettings(): Settings {
  let parsed: Partial<Settings> = {}
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    parsed = raw ? JSON.parse(raw) : {}
  } catch {
    /* keep defaults */
  }
  // apiKey is never persisted in this blob — it's supplied from the secure store
  return { ...DEFAULT_SETTINGS, ...parsed, apiKey: apiKeyCached() }
}

export function saveSettings(settings: Settings): void {
  const { apiKey: _drop, ...rest } = settings
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(rest))
}

export function loadHistory(): HistoryItem[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]')
  } catch {
    return []
  }
}

export function addHistory(item: Omit<HistoryItem, 'id' | 'timestamp'>): void {
  const entry: HistoryItem = {
    ...item,
    id: crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
  }
  const list = [entry, ...loadHistory()].slice(0, MAX_HISTORY)
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(list))
  } catch {
    // storage full — drop thumbnails and retry
    const slim = list.map((i) => ({ ...i, thumbnail: undefined }))
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(slim))
    } catch {
      /* give up silently */
    }
  }
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY)
}

export function needsKeyPrompt(): boolean {
  return !apiKeyCached().trim() && !localStorage.getItem(SKIP_KEY)
}

export function dismissKeyPrompt(): void {
  localStorage.setItem(SKIP_KEY, '1')
}
