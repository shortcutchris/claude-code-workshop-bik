// Vitest setup file.
//
// Node 22+ ships an experimental built-in `localStorage` global that requires
// `--localstorage-file=<path>` and otherwise throws on every call. In jsdom-
// based test environments this Node global shadows jsdom's window.localStorage,
// breaking every test that touches storage. We install a fresh in-memory
// `Storage` implementation on both `globalThis` and `window` so tests run
// independently of the host Node version.

class MemoryStorage implements Storage {
  private store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }

  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

const memoryLocalStorage = new MemoryStorage()
const memorySessionStorage = new MemoryStorage()

Object.defineProperty(globalThis, 'localStorage', {
  value: memoryLocalStorage,
  configurable: true,
  writable: true,
})
Object.defineProperty(globalThis, 'sessionStorage', {
  value: memorySessionStorage,
  configurable: true,
  writable: true,
})

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: memoryLocalStorage,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(window, 'sessionStorage', {
    value: memorySessionStorage,
    configurable: true,
    writable: true,
  })
}
