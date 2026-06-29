import { Stack, usePathname, useRouter } from "expo-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { CitizenBottomLayout } from "../components/CitizenBottomLayout";
import { OperatorBottomLayout } from "../components/OperatorBottomLayout";
import { AdminBottomLayout } from "../components/AdminBottomLayout";
import { BoothWorkerBottomLayout } from "../components/BoothWorkerBottomLayout";
import { LeadershipBottomNav } from "../components/LeadershipBottomNav";
import {
  canAccessRoute,
  isPublicRoute,
  ROLE_HOME,
} from "../constants/permissions";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

function getCitizenTab(pathname: string) {
  if (pathname === "/dashboard" || pathname === "/citizen/dashboard") {
    return "home";
  }
  if (
    pathname === "/complaints" ||
    pathname === "/complaints/new" ||
    pathname === "/citizen/new-complaint" ||
    pathname === "/citizen/track-complaint" ||
    pathname === "/citizen/register-voter-profile" ||
    pathname === "/register" ||
    /^\/complaints\/[^/]+$/.test(pathname)
  ) {
    return "grievance";
  }
  if (pathname === "/feed" || pathname === "/citizen/social-feed") {
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
  return null;
}

function getBoothWorkerTab(pathname: string) {
  if (pathname === "/booth-worker" || pathname === "/booth-worker/dashboard") {
    return "home";
  }
  if (pathname === "/booth-worker/voters") {
    return "voters";
  }
  if (pathname === "/booth-worker/posts") {
    return "posts";
  }
  if (pathname === "/booth-worker/profile") {
    return "profile";
  }
  return null;
}

function getLeaderTab(pathname: string) {
  if (pathname === "/leader" || pathname === "/leader/index") {
    return "dashboard";
  }
  if (
    pathname === "/feed" ||
    pathname === "/citizen/social-feed" ||
    pathname === "/leadership/social-feed" ||
    pathname === "/leadership/share-tracker"
  ) {
    return "social";
  }
  if (
    pathname === "/leadership/create-post" ||
    pathname === "/leader/post/new"
  ) {
    return "social";
  }
  if (pathname === "/leadership/settings") {
    return "menu";
  }
  if (pathname === "/leadership/analytics-map" || pathname === "/leadership/heatmap") {
    return "dashboard";
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
  const activeBoothWorkerTab =
    userRole === "booth_worker" ? getBoothWorkerTab(pathname) : null;
  const activeAdminTab = userRole === "admin" ? getAdminTab(pathname) : null;
  const activeLeaderTab = userRole === "leader" ? getLeaderTab(pathname) : null;
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
        <CitizenBottomLayout
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
      userRole === "booth_worker" &&
      activeBoothWorkerTab ? (
        <BoothWorkerBottomLayout
          activeTab={
            activeBoothWorkerTab as "home" | "voters" | "posts" | "profile"
          }
        />
      ) : null}
      {isHydrated && isLoggedIn && userRole === "admin" && activeAdminTab ? (
        <AdminBottomLayout
          activeTab={activeAdminTab as "settings" | "complaints"}
        />
      ) : null}
      {isHydrated && isLoggedIn && userRole === "leader" && activeLeaderTab ? (
        <LeadershipBottomNav
          activeTab={
            activeLeaderTab as "dashboard" | "social" | "menu"
          }
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
