import { apiFetch } from "../lib/api";
import type { Complaint } from "./complaintService";

type OfficerStats = {
  assigned: number;
  dueToday: number;
  resolvedMonth: number;
};

export async function getOfficerQueue() {
  return apiFetch<Complaint[]>("/officer/queue");
}

export async function getOfficerStats(): Promise<OfficerStats> {
  return apiFetch<OfficerStats>("/officer/stats");
}
