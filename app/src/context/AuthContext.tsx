import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Role } from "../constants/permissions";

type AuthContextValue = {
  userRole: Role | null;
  isLoggedIn: boolean;
  isHydrated: boolean;
  login: (role: Role) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "auth_role";

let cachedStorage:
  | {
      getItem: (key: string) => Promise<string | null>;
      setItem: (key: string, value: string) => Promise<void>;
      removeItem: (key: string) => Promise<void>;
    }
  | null
  | undefined;

// AsyncStorage is optional; fall back to in-memory state if unavailable.
async function getStorage() {
  if (cachedStorage !== undefined) {
    return cachedStorage;
  }

  try {
    const mod = require("@react-native-async-storage/async-storage");
    cachedStorage = mod.default ?? mod;
    return cachedStorage;
  } catch {
    cachedStorage = null;
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [userRole, setUserRole] = useState<Role | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let isActive = true;

    const hydrate = async () => {
      const storage = await getStorage();
      if (!isActive) {
        return;
      }

      if (storage) {
        const storedRole = await storage.getItem(STORAGE_KEY);
        if (
          storedRole === "citizen" ||
          storedRole === "operator" ||
          storedRole === "officer" ||
          storedRole === "leader"
        ) {
          setUserRole(storedRole);
        }
      }

      setIsHydrated(true);
    };

    void hydrate();

    return () => {
      isActive = false;
    };
  }, []);

  const login = (role: Role) => {
    setUserRole(role);
    void (async () => {
      const storage = await getStorage();
      if (storage) {
        await storage.setItem(STORAGE_KEY, role);
      }
    })();
  };

  const logout = () => {
    setUserRole(null);
    void (async () => {
      const storage = await getStorage();
      if (storage) {
        await storage.removeItem(STORAGE_KEY);
      }
    })();
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      userRole,
      isLoggedIn: userRole !== null,
      isHydrated,
      login,
      logout,
    }),
    [userRole, isHydrated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
