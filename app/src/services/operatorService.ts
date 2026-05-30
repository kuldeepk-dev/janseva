import { apiFetch } from "../lib/api";

export type OperatorStats = {
  registeredToday: number;
  complaintsLogged: number;
  walkInsServed: number;
  pendingTasks: number;
};

export type ActivityLog = {
  id: string;
  actor_profile_id: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
};

export async function getOperatorStats() {
  return apiFetch<OperatorStats>("/operator/stats");
}

export async function getActivityLogs(limit = 10) {
  return apiFetch<ActivityLog[]>(`/operator/activity-logs?limit=${limit}`);
}
