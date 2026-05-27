export type Role = "citizen" | "operator" | "officer" | "leader" | "admin";

type RouteRule = RegExp;

// Regex rules ensure dynamic paths (e.g., /complaints/123) are matched safely.
export const PUBLIC_ROUTES: RouteRule[] = [/^\/login$/, /^\/otp$/, /^\/feed$/];

export const ROLE_ROUTES: Record<Role, RouteRule[]> = {
  citizen: [
    /^\/dashboard$/,
    /^\/register$/,
    /^\/citizen\/profile$/,
    /^\/complaints$/,
    /^\/complaints\/new$/,
    /^\/complaints\/[^/]+$/,
    /^\/feed$/,
  ],
  operator: [
    /^\/operator$/,
    /^\/operator\/profile$/,
    /^\/register$/,
    /^\/complaints$/,
    /^\/complaints\/new$/,
    /^\/complaints\/[^/]+$/,
    /^\/operator\/assign$/,
    /^\/leader\/post\/new$/,
  ],
  officer: [
    /^\/officer$/,
    /^\/officer\/queue$/,
    /^\/officer\/profile$/,
    /^\/officer\/complaint\/[^/]+$/,
  ],
  leader: [
    /^\/leader$/,
    /^\/leadership\/analytics-map$/,
    /^\/leadership\/heatmap$/,
    /^\/leadership\/settings$/,
    /^\/admin$/,
    /^\/admin\/settings$/,
    /^\/admin\/complaint-lifecycle$/,
    /^\/leader\/post\/new$/,
    /^\/admin\/whatsapp$/,
    /^\/complaints$/,
    /^\/complaints\/[^/]+$/,
    /^\/feed$/,
  ],
  admin: [
    /^\/admin$/,
    /^\/admin\/settings$/,
    /^\/admin\/complaint-lifecycle$/,
    /^\/admin\/whatsapp$/,
  ],
};

export const ROLE_HOME: Record<Role, string> = {
  citizen: "/dashboard",
  operator: "/operator",
  officer: "/officer",
  leader: "/leader",
  admin: "/admin/settings",
};

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(rule => rule.test(pathname));
}

export function canAccessRoute(pathname: string, role: Role) {
  return ROLE_ROUTES[role].some(rule => rule.test(pathname));
}
