/**
 * Built-in (trial) API key.
 *
 * Lets first-time users try the AI features without supplying their own key,
 * limited to a few calls per 24h per device.
 *
 * Note: the key is obfuscated, not truly secret — anything shipped in a client
 * bundle can be extracted by a determined user. The 3/day device quota is the
 * real mitigation. For hard enforcement a backend proxy would be required.
 */

const SEED = 'ghp:gardeningAI:v1'
const BLOB = 'JjleewVZICpTIkQ8UwZkCBVcJQ8Xe14TIhQxOAAPLBU8WTsCNjdICFcIAy8cWygKKwotVwE='

export const BUILTIN_LIMIT = 3
const DAY_MS = 24 * 60 * 60 * 1000
const QUOTA_KEY = 'gardening.trial.v1'

export function builtinApiKey(): string {
  const bytes = atob(BLOB)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += String.fromCharCode(bytes.charCodeAt(i) ^ SEED.charCodeAt(i % SEED.length))
  }
  return out
}

function stamps(): number[] {
  try {
    return JSON.parse(localStorage.getItem(QUOTA_KEY) || '[]')
  } catch {
    return []
  }
}

export function builtinQuotaLeft(): number {
  const cutoff = Date.now() - DAY_MS
  return Math.max(0, BUILTIN_LIMIT - stamps().filter((s) => s > cutoff).length)
}

export function consumeBuiltin(): boolean {
  if (builtinQuotaLeft() <= 0) return false
  const cutoff = Date.now() - DAY_MS
  const kept = stamps().filter((s) => s > cutoff)
  kept.push(Date.now())
  localStorage.setItem(QUOTA_KEY, JSON.stringify(kept))
  return true
}
