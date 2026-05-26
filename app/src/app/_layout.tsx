import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import {
  canAccessRoute,
  isPublicRoute,
  ROLE_HOME,
} from "../constants/permissions";

function RouteGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isHydrated, userRole } = useAuth();

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (isPublicRoute(pathname)) {
      if (isLoggedIn && userRole && (pathname === "/login" || pathname === "/otp")) {
        router.replace(ROLE_HOME[userRole] as never);
      }
      return;
    }

    if (!isLoggedIn || !userRole) {
      router.replace("/login");
      return;
    }

    if (!canAccessRoute(pathname, userRole)) {
      router.replace(ROLE_HOME[userRole] as never);
    }
  }, [isHydrated, isLoggedIn, pathname, router, userRole]);

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RouteGuard />
    </AuthProvider>
  );
}
