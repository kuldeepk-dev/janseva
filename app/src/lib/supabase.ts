import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseConfigError =
  !supabaseUrl || !supabaseAnonKey
    ? "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file and restart Expo."
    : null;

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

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          storage: secureStoreAdapter ?? memoryStorage,
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error(supabaseConfigError ?? "Supabase is not configured.");
  }
  return supabase;
}
