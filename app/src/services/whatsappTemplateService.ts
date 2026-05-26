import { apiFetch } from "../lib/api";

export type WhatsappTemplate = {
  id: string;
  template_key: string;
  title: string | null;
  body: string | null;
  language: string;
  active: boolean;
  updated_by: string | null;
  updated_at: string;
};

export async function getTemplates() {
  return apiFetch<WhatsappTemplate[]>("/whatsapp-templates");
}

export async function updateTemplate(id: string, body: string) {
  return apiFetch<WhatsappTemplate>(`/whatsapp-templates/${id}`, {
    method: "PUT",
    body: JSON.stringify({ body }),
  });
}
