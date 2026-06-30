const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

function buildProxyUrl(key: string) {
  if (!API_BASE_URL) {
    return null;
  }

  return `${API_BASE_URL.replace(/\/+$/, "")}/uploads/s3/${key
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/")}`;
}

export function normalizeMediaUrl(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  if (!API_BASE_URL) {
    return url;
  }

  if (url.startsWith(`${API_BASE_URL.replace(/\/+$/, "")}/uploads/s3/`)) {
    return url;
  }

  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith("amazonaws.com")) {
      return url;
    }

    const pathParts = parsed.pathname.split("/").filter(Boolean);
    if (!pathParts.length) {
      return url;
    }

    let key = "";
    if (parsed.hostname.includes(".s3.")) {
      key = pathParts.join("/");
    } else if (pathParts.length >= 2) {
      key = pathParts.slice(1).join("/");
    }

    return key ? buildProxyUrl(key) ?? url : url;
  } catch {
    return url;
  }
}

export function normalizeMediaUrls(urls: string[] | null | undefined) {
  if (!urls?.length) {
    return null;
  }

  return urls.map(item => normalizeMediaUrl(item)).filter(Boolean) as string[];
}
