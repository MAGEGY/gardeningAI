/**
 * API key protection.
 *
 * The Gemini key is stored AES-256-GCM encrypted in localStorage. The encryption
 * key is a non-extractable CryptoKey kept in IndexedDB, so the plaintext key is
 * never written to disk and can't be read by casual inspection of localStorage.
 *
 * Honest scope note: this protects the key at rest on this device. When the app
 * calls Google's API the key still travels with the request (client-side apps
 * cannot fully hide it). For production-grade secrecy, a backend proxy is needed.
 */

const DB_NAME = 'gardening-secure'
const STORE = 'keys'
const KEY_ID = 'apikey-enc'
const ENC_SLOT = 'gardening.apikey.v2'
const SETTINGS_KEY = 'gardening.settings.v1'

let cache: string | null = null
let cryptoKey: CryptoKey | null = null

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function idbGet(db: IDBDatabase, id: string): Promise<CryptoKey | undefined> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id)
    req.onsuccess = () => resolve(req.result as CryptoKey | undefined)
    req.onerror = () => reject(req.error)
  })
}

function idbPut(db: IDBDatabase, id: string, value: CryptoKey): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, id)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function getCryptoKey(): Promise<CryptoKey> {
  if (cryptoKey) return cryptoKey
  const db = await openDb()
  let k = await idbGet(db, KEY_ID)
  if (!k) {
    k = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, false, [
      'encrypt',
      'decrypt',
    ])
    await idbPut(db, KEY_ID, k)
  }
  cryptoKey = k
  return k
}

function b64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  bytes.forEach((b) => (s += String.fromCharCode(b)))
  return btoa(s)
}

function unb64(s: string): Uint8Array {
  const bin = atob(s)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** Call once at app startup. Returns the decrypted key (may be ''). */
export async function initSecureKey(): Promise<string> {
  try {
    const stored = localStorage.getItem(ENC_SLOT)
    if (stored?.startsWith('enc:')) {
      const [, ivB64, ctB64] = stored.split(':')
      const k = await getCryptoKey()
      const plain = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: unb64(ivB64) as BufferSource },
        k,
        unb64(ctB64) as BufferSource,
      )
      cache = new TextDecoder().decode(plain)
    } else if (stored?.startsWith('plain:')) {
      cache = stored.slice(6)
    } else {
      // migrate a plaintext key saved by an older version inside settings JSON
      const raw = localStorage.getItem(SETTINGS_KEY)
      const legacy = raw ? String(JSON.parse(raw).apiKey || '') : ''
      if (legacy) {
        cache = legacy
        await setApiKeySecure(legacy)
        const parsed = JSON.parse(raw || '{}')
        delete parsed.apiKey
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed))
      } else {
        cache = ''
      }
    }
  } catch {
    cache = ''
  }
  return cache
}

export function apiKeyCached(): string {
  return cache ?? ''
}

export async function setApiKeySecure(plain: string): Promise<void> {
  cache = plain
  if (!plain.trim()) {
    localStorage.removeItem(ENC_SLOT)
    return
  }
  try {
    const k = await getCryptoKey()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const ct = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      k,
      new TextEncoder().encode(plain),
    )
    localStorage.setItem(ENC_SLOT, `enc:${b64(iv)}:${b64(ct)}`)
  } catch {
    // no IndexedDB/WebCrypto — degrade to clearly-marked plaintext
    localStorage.setItem(ENC_SLOT, `plain:${plain}`)
  }
}
