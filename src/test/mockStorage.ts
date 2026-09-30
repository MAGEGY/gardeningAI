import { vi } from 'vitest'

type Store = Map<string, string>

/**
 * Install an in-memory localStorage for tests (Node has none).
 * Returns the backing store so tests can seed values directly.
 */
export function mockLocalStorage(): Store {
  const store: Store = new Map()
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => (store.has(k) ? store.get(k) : null),
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => store.clear(),
  })
  return store
}
