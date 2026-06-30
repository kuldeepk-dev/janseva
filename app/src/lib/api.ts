import { clearToken, getToken, setToken } from "./tokenStorage";
import { normalizeMediaUrl } from "./mediaUrl";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

export const apiConfigError = !apiBaseUrl
  ? "API is not configured. Add EXPO_PUBLIC_API_BASE_URL to your .env file and restart Expo."
  : null;

const TOKEN_KEY = "auth_token";

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  if (!apiBaseUrl) {
    throw new Error(apiConfigError ?? "API is not configured.");
  }

  const token = await getToken(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status}).`);
  }

  return response.json() as Promise<T>;
}

type UploadFile = {
  uri: string;
  name?: string | null;
  type?: string | null;
};

export async function apiUploadFile<T>(path: string, file: UploadFile) {
  if (!apiBaseUrl) {
    throw new Error(apiConfigError ?? "API is not configured.");
  }

  const token = await getToken(TOKEN_KEY);
  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const form = new FormData();
  const name = file.name || `upload-${Date.now()}.jpg`;
  const type = file.type || "image/jpeg";

  form.append("file", {
    uri: file.uri,
    name,
    type,
  } as any);

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Upload failed (${response.status}).`);
  }

  const data = (await response.json()) as T;
  if (data && typeof data === "object" && "url" in (data as Record<string, unknown>)) {
    const currentUrl = (data as Record<string, unknown>).url;
    if (typeof currentUrl === "string") {
      (data as Record<string, unknown>).url = normalizeMediaUrl(currentUrl);
    }
  }

  return data;
}

export async function setAuthToken(token: string) {
  await setToken(TOKEN_KEY, token);
}

export async function clearAuthToken() {
  await clearToken(TOKEN_KEY);
}
