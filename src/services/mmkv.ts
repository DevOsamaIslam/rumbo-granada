import { createMMKV } from 'react-native-mmkv';

/**
 * MMKV is a Nitro native module: `createMMKV()` never throws, but it returns a
 * HybridObject whose methods only exist once the native module is registered. On
 * web (and in a broken native setup) the call succeeds and `instance.getString` is
 * undefined, so the crash surfaces later at the first use:
 *
 *   TypeError: undefined is not a function  (mmkv.getString)
 *
 * Always create MMKV through this helper so every caller degrades to an in-memory
 * store instead of crashing when the native module is missing.
 */
export interface KeyValueStorage {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
  remove(key: string): void;
  getAllKeys(): string[];
}

/** In-memory fallback used when the MMKV native module is unavailable. */
export function createMemoryStorage(): KeyValueStorage {
  const store = new Map<string, string>();
  return {
    getString: (key) => store.get(key),
    set: (key, value) => {
      store.set(key, value);
    },
    remove: (key) => {
      store.delete(key);
    },
    getAllKeys: () => Array.from(store.keys()),
  };
}

/**
 * Creates an MMKV instance, or a memory-backed stand-in when the native module is
 * not available. The return type is intentionally the full `MMKV` shape so it can
 * be passed to APIs like `Storage.setInstance()` without casts.
 */
export function createSafeMMKV(config: { id: string }): KeyValueStorage {
  try {
    const instance = createMMKV(config) as Partial<KeyValueStorage> | undefined;
    if (
      typeof instance?.getString !== 'function' ||
      typeof instance?.set !== 'function' ||
      typeof instance?.remove !== 'function'
    ) {
      return createMemoryStorage();
    }
    return instance as KeyValueStorage;
  } catch {
    return createMemoryStorage();
  }
}

const instances = new Map<string, KeyValueStorage>();

/**
 * Creates (or reuses) a safe MMKV instance for the given id, resolving it lazily on
 * first use so the native module has time to register during app bootstrap.
 */
export function getSafeMMKV(config: { id: string }): KeyValueStorage {
  const existing = instances.get(config.id);
  if (existing) return existing;
  const created = createSafeMMKV(config);
  instances.set(config.id, created);
  return created;
}

/**
 * Test-only hook: clears the per-id instance cache so a re-mocked
 * `react-native-mmkv` takes effect on the next `getSafeMMKV` call.
 */
export function __resetSafeMMKVForTests(): void {
  instances.clear();
}

export { createMMKV };