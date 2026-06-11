import { apiFetch } from "../lib/api";
import type { Complaint } from "./complaintService";

type OfficerStats = {
  assigned: number;
  dueToday: number;
  resolvedMonth: number;
};

export type OfficerDirectoryItem = {
  id: string;
  profile_id: string | null;
  department_id: string | null;
  full_name: string | null;
  email: string | null;
  total_complaints_assigned?: number | null;
  pending_complaints?: number | null;
};

export async function getOfficerQueue() {
  return apiFetch<Complaint[]>("/officer/queue");
}

export async function getOfficerStats(): Promise<OfficerStats> {
  return apiFetch<OfficerStats>("/officer/stats");
}

export async function getDepartmentOfficers(departmentId: string) {
  return apiFetch<OfficerDirectoryItem[]>(
    `/departments/${departmentId}/officers`,
  );
}
