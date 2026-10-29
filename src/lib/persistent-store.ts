export const STORAGE_PREFIX = 'shuttle-school:v1:';

export interface PersistentStore<T> {
  get: () => T;
  set: (next: T | ((prev: T) => T)) => void;
  subscribe: (listener: () => void) => () => void;
  /** Re-reads storage; used when another tab writes the same key. */
  reload: () => void;
}

function safeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null; // Access can throw in private mode or with storage blocked.
  }
}

/**
 * A tiny observable value backed by localStorage. Stored data is validated on
 * read; anything missing or malformed falls back to `defaults`, so a corrupted
 * entry can never crash the app.
 */
export function createPersistentStore<T>(
  name: string,
  /** Returns the validated value, or `undefined` if `raw` is not usable. */
  parse: (raw: unknown) => T | undefined,
  defaults: T,
  migrate?: (storage: Storage) => T | undefined,
): PersistentStore<T> {
  const key = STORAGE_PREFIX + name;
  const listeners = new Set<() => void>();

  const read = (): T => {
    const storage = safeStorage();
    if (!storage) return defaults;
    try {
      const raw = storage.getItem(key);
      if (raw === null) return migrate?.(storage) ?? defaults;
      return parse(JSON.parse(raw)) ?? defaults;
    } catch {
      return defaults;
    }
  };

  let value: T = read();
  const emit = () => {
    listeners.forEach((l) => {
      l();
    });
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key === key) {
        value = read();
        emit();
      }
    });
  }

  return {
    get: () => value,
    set(next) {
      value = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
      try {
        safeStorage()?.setItem(key, JSON.stringify(value));
      } catch {
        // Quota exceeded or storage blocked: keep the in-memory value.
      }
      emit();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reload() {
      value = read();
      emit();
    },
  };
}
