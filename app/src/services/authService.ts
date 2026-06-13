import { apiFetch, clearAuthToken, setAuthToken } from "../lib/api";

export type Profile = {
  id: string;
  role: "citizen" | "operator" | "leader" | "admin";
  full_name: string | null;
  mobile: string | null;
  email: string | null;
  preferred_language: string;
  created_at: string;
  updated_at: string;
};

export type CitizenDirectoryItem = {
  id: string;
  profile_id: string | null;
  full_name: string | null;
  voter_id: string | null;
  mobile: string | null;
  booth_number: string | null;
  created_by_role: "citizen" | "operator" | "leader" | "admin" | null;
};

function normalizePhone(mobile: string) {
  const trimmed = mobile.replace(/\s+/g, "");
  if (trimmed.startsWith("+")) {
    return trimmed;
  }
  if (trimmed.length === 10) {
    return `+91${trimmed}`;
  }
  return trimmed;
}

export async function signInWithOtp(mobile: string) {
  const phone = normalizePhone(mobile);
  return apiFetch<{ ok: boolean; devOtp?: string }>("/auth/otp/request", {
    method: "POST",
    body: JSON.stringify({ mobile: phone }),
  });
}

export async function verifyOtp(mobile: string, token: string) {
  const phone = normalizePhone(mobile);
  const data = await apiFetch<{ token: string; profile: Profile }>(
    "/auth/otp/verify",
    {
      method: "POST",
      body: JSON.stringify({ mobile: phone, token }),
    },
  );
  await setAuthToken(data.token);
  return data;
}

export async function getCitizenDirectory() {
  return apiFetch<CitizenDirectoryItem[]>("/auth/citizen-directory");
}

export async function signInCitizenProfile(profileId: string) {
  const data = await apiFetch<{ token: string; profile: Profile }>(
    "/auth/citizen/login",
    {
      method: "POST",
      body: JSON.stringify({ profile_id: profileId }),
    },
  );
  await setAuthToken(data.token);
  return data;
}

export async function signInStaff(email: string, password: string) {
  const data = await apiFetch<{ token: string; profile: Profile }>(
    "/auth/staff/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
  );
  await setAuthToken(data.token);
  return data;
}

export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    return await apiFetch<Profile | null>("/profiles/me");
  } catch {
    return null;
  }
}

export async function getProfileById(id: string): Promise<Profile | null> {
  try {
    return await apiFetch<Profile | null>(`/profiles/${id}`);
  } catch {
    return null;
  }
}

export async function logout() {
  await clearAuthToken();
}
