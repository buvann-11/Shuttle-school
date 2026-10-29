import { createPersistentStore, STORAGE_PREFIX } from './persistent-store';

const parse = (raw: unknown) => (typeof raw === 'number' ? raw : undefined);

describe('createPersistentStore', () => {
  it('returns defaults when nothing is stored', () => {
    expect(createPersistentStore('n1', parse, 7).get()).toBe(7);
  });

  it('reads, writes and notifies subscribers', () => {
    const store = createPersistentStore('n2', parse, 0);
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.set(5);
    store.set((n) => n + 1);
    expect(store.get()).toBe(6);
    expect(localStorage.getItem(`${STORAGE_PREFIX}n2`)).toBe('6');
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.set(9);
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it('falls back to defaults on corrupted JSON or invalid data', () => {
    localStorage.setItem(`${STORAGE_PREFIX}n3`, '{not json');
    expect(createPersistentStore('n3', parse, 1).get()).toBe(1);
    localStorage.setItem(`${STORAGE_PREFIX}n4`, '"text"');
    expect(createPersistentStore('n4', parse, 2).get()).toBe(2);
  });

  it('uses the migration only when the key is absent', () => {
    const migrate = vi.fn(() => 42);
    expect(createPersistentStore('n5', parse, 0, migrate).get()).toBe(42);
    localStorage.setItem(`${STORAGE_PREFIX}n6`, '3');
    expect(createPersistentStore('n6', parse, 0, migrate).get()).toBe(3);
    expect(migrate).toHaveBeenCalledTimes(1);
  });

  it('keeps working in memory when storage throws', () => {
    const store = createPersistentStore('n7', parse, 0);
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    expect(() => {
      store.set(3);
    }).not.toThrow();
    expect(store.get()).toBe(3);
    spy.mockRestore();
  });

  it('picks up writes from another tab', () => {
    const store = createPersistentStore('n8', parse, 0);
    const listener = vi.fn();
    store.subscribe(listener);
    localStorage.setItem(`${STORAGE_PREFIX}n8`, '11');
    window.dispatchEvent(new StorageEvent('storage', { key: `${STORAGE_PREFIX}n8` }));
    expect(store.get()).toBe(11);
    expect(listener).toHaveBeenCalled();
  });
});
