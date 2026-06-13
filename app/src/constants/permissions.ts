export type Role = "citizen" | "operator" | "leader" | "admin";

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
    /^\/operator\/complaints$/,
    /^\/operator\/complaints\/new$/,
    /^\/operator\/complaints\/[^/]+$/,
    /^\/leader\/post\/new$/,
  ],
  leader: [
    /^\/leader$/,
    /^\/leadership\/create-post$/,
    /^\/leadership\/analytics-map$/,
    /^\/leadership\/heatmap$/,
    /^\/leadership\/settings$/,
    /^\/admin$/,
    /^\/admin\/settings$/,
    /^\/admin\/routing$/,
    /^\/admin\/complaint-lifecycle$/,
    /^\/leader\/post\/new$/,
    /^\/complaints$/,
    /^\/complaints\/[^/]+$/,
    /^\/feed$/,
  ],
  admin: [
    /^\/admin$/,
    /^\/admin\/settings$/,
    /^\/admin\/routing$/,
    /^\/admin\/complaint-lifecycle$/,
  ],
};

export const ROLE_HOME: Record<Role, string> = {
  citizen: "/dashboard",
  operator: "/operator",
  leader: "/leader",
  admin: "/admin/settings",
};

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(rule => rule.test(pathname));
}

export function canAccessRoute(pathname: string, role: Role) {
  return ROLE_ROUTES[role].some(rule => rule.test(pathname));
}
