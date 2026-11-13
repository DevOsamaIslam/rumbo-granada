import { MMKV } from 'react-native-mmkv';

class Storage {
  private static instance: MMKV | null = null;

  static setInstance(instance: MMKV) {
    Storage.instance = instance;
  }

  static getInstance(): MMKV {
    if (!Storage.instance) {
      throw new Error('MMKV Storage not initialized. Call Storage.setInstance() first.');
    }
    return Storage.instance;
  }

  static getItem(key: string): string | undefined {
    return Storage.getInstance().getString(key);
  }

  static setItem(key: string, value: string): void {
    Storage.getInstance().set(key, value);
  }

  static removeItem(key: string): void {
    Storage.getInstance().remove(key);
  }
}

export { Storage };