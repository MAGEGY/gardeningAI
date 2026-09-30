import { beforeEach, describe, expect, it, vi } from 'vitest'
import { BUILTIN_LIMIT, builtinApiKey, builtinQuotaLeft, consumeBuiltin } from './builtinKey'
import { mockLocalStorage } from '../test/mockStorage'

const SEED = 'ghp:gardeningAI:v1'
const BLOB = 'JjleewVZICpTIkQ8UwZkCBVcJQ8Xe14TIhQxOAAPLBU8WTsCNjdICFcIAy8cWygKKwotVwE='
const QUOTA_KEY = 'gardening.trial.v1'
const DAY_MS = 24 * 60 * 60 * 1000

/** Re-encode a decoded key the same way builtinKey stores it. */
function encode(plain: string): string {
  const bytes = Array.from(plain).map((ch, i) => ch.charCodeAt(0) ^ SEED.charCodeAt(i % SEED.length))
  return btoa(bytes.map((b) => String.fromCharCode(b)).join(''))
}

beforeEach(() => {
  mockLocalStorage()
})

describe('builtinApiKey', () => {
  it('decodes to the exact stored blob when re-encoded', () => {
    expect(encode(builtinApiKey())).toBe(BLOB)
  })

  it('returns a stable, non-empty ASCII key', () => {
    const key = builtinApiKey()
    expect(key.length).toBeGreaterThan(10)
    expect(/^[\x20-\x7e]+$/.test(key)).toBe(true)
    expect(key).toBe(builtinApiKey())
  })
})

describe('trial quota', () => {
  it('starts with a full quota', () => {
    expect(builtinQuotaLeft()).toBe(BUILTIN_LIMIT)
  })

  it('allows exactly BUILTIN_LIMIT consumes, then refuses', () => {
    for (let i = 0; i < BUILTIN_LIMIT; i++) {
      expect(consumeBuiltin()).toBe(true)
    }
    expect(builtinQuotaLeft()).toBe(0)
    expect(consumeBuiltin()).toBe(false)
  })

  it('ignores stamps older than 24h', () => {
    localStorage.setItem(QUOTA_KEY, JSON.stringify([Date.now() - DAY_MS - 1000]))
    expect(builtinQuotaLeft()).toBe(BUILTIN_LIMIT)
  })

  it('counts stamps inside the 24h window', () => {
    localStorage.setItem(QUOTA_KEY, JSON.stringify([Date.now() - DAY_MS + 60_000]))
    expect(builtinQuotaLeft()).toBe(BUILTIN_LIMIT - 1)
  })

  it('prunes expired stamps on consume', () => {
    localStorage.setItem(QUOTA_KEY, JSON.stringify([Date.now() - DAY_MS - 1000]))
    expect(consumeBuiltin()).toBe(true)
    const stamps = JSON.parse(localStorage.getItem(QUOTA_KEY) as string) as number[]
    expect(stamps).toHaveLength(1)
    expect(stamps[0]).toBeGreaterThan(Date.now() - 60_000)
  })

  it('survives corrupt quota data', () => {
    localStorage.setItem(QUOTA_KEY, 'not-json{')
    expect(builtinQuotaLeft()).toBe(BUILTIN_LIMIT)
  })

  it('consumeBuiltin records a timestamp', () => {
    vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000)
    consumeBuiltin()
    expect(JSON.parse(localStorage.getItem(QUOTA_KEY) as string)).toEqual([1_700_000_000_000])
    vi.restoreAllMocks()
  })
})
