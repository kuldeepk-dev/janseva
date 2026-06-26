import { apiFetch } from "../lib/api";

export type OperatorStats = {
  registeredToday: number;
  complaintsLogged: number;
  walkInsServed: number;
  pendingTasks: number;
};

export type OperatorDirectoryItem = {
  id: string;
  profile_id: string | null;
  full_name: string | null;
  email: string | null;
  mobile: string | null;
  preferred_language: string;
  created_at: string | null;
  updated_at: string | null;
  total_complaints_assigned: number;
  pending_complaints: number;
  activity_count: number;
  last_activity_at: string | null;
  role: "operator";
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

export async function getOperatorDirectory() {
  return apiFetch<OperatorDirectoryItem[]>("/operator/operators");
}

export async function getActivityLogs(limit = 10) {
  return apiFetch<ActivityLog[]>(`/operator/activity-logs?limit=${limit}`);
}
