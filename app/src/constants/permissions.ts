export type Role = "citizen" | "operator" | "officer" | "leader";

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
    /^\/register$/,
    /^\/complaints$/,
    /^\/complaints\/new$/,
    /^\/complaints\/[^/]+$/,
    /^\/operator\/assign$/,
    /^\/leader\/post\/new$/,
  ],
  officer: [/^\/officer$/, /^\/officer\/complaint\/[^/]+$/],
  leader: [
    /^\/leader$/,
    /^\/leader\/post\/new$/,
    /^\/admin\/whatsapp$/,
    /^\/complaints$/,
    /^\/complaints\/[^/]+$/,
    /^\/feed$/,
  ],
};

export const ROLE_HOME: Record<Role, string> = {
  citizen: "/dashboard",
  operator: "/operator",
  officer: "/officer",
  leader: "/leader",
};

export function isPublicRoute(pathname: string) {
  return PUBLIC_ROUTES.some(rule => rule.test(pathname));
}

export function canAccessRoute(pathname: string, role: Role) {
  return ROLE_ROUTES[role].some(rule => rule.test(pathname));
}
