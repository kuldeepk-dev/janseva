import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { AppBottomLayout } from "../components/AppBottomLayout";
import { OperatorBottomLayout } from "../components/OperatorBottomLayout";
import { OfficerBottomLayout } from "../components/OfficerBottomLayout";
import { AdminBottomLayout } from "../components/AdminBottomLayout";
import {
  canAccessRoute,
  isPublicRoute,
  ROLE_HOME,
} from "../constants/permissions";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

function getCitizenTab(pathname: string) {
  if (pathname === "/dashboard") {
    return "home";
  }
  if (
    pathname === "/complaints" ||
    pathname === "/complaints/new" ||
    /^\/complaints\/[^/]+$/.test(pathname)
  ) {
    return "grievance";
  }
  if (pathname === "/feed") {
    return "feed";
  }
  if (pathname === "/citizen/profile") {
    return "profile";
  }
  return null;
}

function getOperatorTab(pathname: string) {
  if (pathname === "/operator" || pathname === "/operator/dashboard") {
    return "home";
  }
  if (
    pathname === "/operator/assign" ||
    pathname === "/operator/complaints" ||
    /^\/operator\/complaints\/[^/]+$/.test(pathname)
  ) {
    return "assign";
  }
  if (pathname === "/operator/profile") {
    return "profile";
  }
  return null;
}

function getOfficerTab(pathname: string) {
  if (pathname === "/officer" || pathname === "/officer/dashboard") {
    return "home";
  }
  if (
    pathname === "/officer/queue" ||
    /^\/officer\/complaint\/[^/]+$/.test(pathname) ||
    pathname === "/officer/complaint-view-refined"
  ) {
    return "queue";
  }
  if (pathname === "/officer/profile") {
    return "profile";
  }
  return null;
}

function getAdminTab(pathname: string) {
  if (pathname === "/admin/settings") {
    return "settings";
  }
  if (pathname === "/admin/routing") {
    return "settings";
  }
  if (pathname === "/admin/complaint-lifecycle") {
    return "complaints";
  }
  if (pathname === "/admin/whatsapp") {
    return "whatsapp";
  }
  return null;
}

function RouteGuard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, isHydrated, userRole, isLoggingOut } = useAuth();
  const activeTab = userRole === "citizen" ? getCitizenTab(pathname) : null;
  const activeOperatorTab =
    userRole === "operator" ? getOperatorTab(pathname) : null;
  const activeOfficerTab =
    userRole === "officer" ? getOfficerTab(pathname) : null;
  const activeAdminTab = userRole === "admin" ? getAdminTab(pathname) : null;
  const publicRoute = isPublicRoute(pathname);
  const isAuthorized = isLoggedIn && !!userRole && !isLoggingOut;

  useEffect(() => {
    if (!isHydrated) {
      return;
    }

    if (publicRoute) {
      if (
        isLoggedIn &&
        userRole &&
        (pathname === "/login" || pathname === "/otp")
      ) {
        router.replace(ROLE_HOME[userRole] as never);
      }
      return;
    }

    if (!isLoggedIn || !userRole || isLoggingOut) {
      router.replace("/login");
      return;
    }

    if (!canAccessRoute(pathname, userRole)) {
      router.replace(ROLE_HOME[userRole] as never);
    }
  }, [isHydrated, isLoggedIn, isLoggingOut, pathname, router, userRole]);

  if (!isHydrated || isLoggingOut) {
    return null;
  }

  // Block rendering protected screens for logged-out users to avoid flash.
  if (!publicRoute && !isAuthorized) {
    return null;
  }

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
      {isHydrated && isLoggedIn && userRole === "citizen" && activeTab ? (
        <AppBottomLayout
          activeTab={activeTab as "home" | "grievance" | "feed" | "profile"}
        />
      ) : null}
      {isHydrated &&
      isLoggedIn &&
      userRole === "operator" &&
      activeOperatorTab ? (
        <OperatorBottomLayout
          activeTab={activeOperatorTab as "home" | "assign" | "profile"}
        />
      ) : null}
      {isHydrated &&
      isLoggedIn &&
      userRole === "officer" &&
      activeOfficerTab ? (
        <OfficerBottomLayout
          activeTab={activeOfficerTab as "home" | "queue" | "profile"}
        />
      ) : null}
      {isHydrated && isLoggedIn && userRole === "admin" && activeAdminTab ? (
        <AdminBottomLayout
          activeTab={activeAdminTab as "settings" | "complaints" | "whatsapp"}
        />
      ) : null}
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RouteGuard />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
