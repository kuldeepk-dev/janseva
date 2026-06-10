import { apiFetch } from "../lib/api";

export type RoutingRule = {
  id: string;
  category: string;
  department_id: string;
  sla_days: number;
  created_at: string;
  updated_at: string;
};

export type OfficerDirectory = {
  id: string;
  department_id: string | null;
  full_name: string | null;
  contact: string | null;
  sla_days: number | null;
  categories: string[] | null;
};

type RoutingRulePayload = {
  category: string;
  department_id: string;
  sla_days: number;
};

type RoutingRuleUpdate = Partial<RoutingRulePayload>;

type DepartmentPayload = {
  name: string;
  contact?: string | null;
  sla_days?: number | null;
  categories?: string[] | null;
};

type OfficerPayload = {
  department_id?: string | null;
  full_name: string;
  contact?: string | null;
  sla_days?: number | null;
  categories?: string[] | null;
};

export async function getRoutingRules() {
  return apiFetch<RoutingRule[]>("/routing-rules");
}

export async function createRoutingRule(payload: RoutingRulePayload) {
  return apiFetch<RoutingRule>("/routing-rules", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateRoutingRule(
  id: string,
  payload: RoutingRuleUpdate,
) {
  return apiFetch<RoutingRule>(`/routing-rules/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function testRoutingRule(category: string) {
  return apiFetch<{ rule: RoutingRule | null }>("/routing-rules/test", {
    method: "POST",
    body: JSON.stringify({ category }),
  });
}

export async function deleteRoutingRule(id: string) {
  return apiFetch<{ ok: boolean }>(`/routing-rules/${id}`, {
    method: "DELETE",
  });
}

export async function createDepartment(payload: DepartmentPayload) {
  return apiFetch("/departments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateDepartment(id: string, payload: DepartmentPayload) {
  return apiFetch(`/departments/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function createOfficer(payload: OfficerPayload) {
  return apiFetch("/officers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
