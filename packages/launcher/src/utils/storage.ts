class SafeStorage {
  constructor(private storage: Storage) {}

  get<T>(key: string): T | null {
    try {
      const value = this.storage.getItem(key);
      return value ? JSON.parse(value) as T : null;
    } catch (e) {
      return null;
    }
  }

  set<T>(key: string, value: T): void {
    this.storage.setItem(key, JSON.stringify(value));
  }
}

export const safeLocalStorage = new SafeStorage(window.localStorage);
export const safeSessionStorage = new SafeStorage(window.sessionStorage);
