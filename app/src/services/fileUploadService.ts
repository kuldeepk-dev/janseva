import { apiConfigError } from "../lib/api";
import { getToken } from "../lib/tokenStorage";

export type UploadFile = {
  uri: string;
  name: string;
  type: string;
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
const TOKEN_KEY = "auth_token";

async function uploadFile(endpoint: string, file: UploadFile) {
  if (!API_BASE_URL || apiConfigError) {
    throw new Error(apiConfigError ?? "API is not configured.");
  }
  const token = await getToken(TOKEN_KEY);
  const form = new FormData();
  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Upload failed.");
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}

export async function uploadVoterPhoto(file: UploadFile) {
  return uploadFile("/uploads/voter-photo", file);
}

export async function uploadComplaintAttachment(file: UploadFile) {
  return uploadFile("/uploads/complaint-attachment", file);
}

export async function uploadSocialPostImage(file: UploadFile) {
  return uploadFile("/uploads/social-post-image", file);
}
