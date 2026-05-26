type StorageAdapter = {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
};

const memoryStorage = (() => {
  const store = new Map<string, string>();
  return {
    async getItem(key: string) {
      return store.get(key) ?? null;
    },
    async setItem(key: string, value: string) {
      store.set(key, value);
    },
    async removeItem(key: string) {
      store.delete(key);
    },
  } satisfies StorageAdapter;
})();

const secureStoreAdapter = (() => {
  try {
    const SecureStore =
      require("expo-secure-store") as typeof import("expo-secure-store");
    return {
      async getItem(key: string) {
        return SecureStore.getItemAsync(key);
      },
      async setItem(key: string, value: string) {
        await SecureStore.setItemAsync(key, value);
      },
      async removeItem(key: string) {
        await SecureStore.deleteItemAsync(key);
      },
    } satisfies StorageAdapter;
  } catch {
    return null;
  }
})();

const storage = secureStoreAdapter ?? memoryStorage;

export async function getToken(key: string) {
  return storage.getItem(key);
}

export async function setToken(key: string, value: string) {
  await storage.setItem(key, value);
}

export async function clearToken(key: string) {
  await storage.removeItem(key);
}
