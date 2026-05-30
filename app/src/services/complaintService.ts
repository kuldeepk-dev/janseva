// Officer sub-assign: assign to another officer within department
export async function subAssignComplaint(
  id: string,
  officerId: string,
  note?: string,
) {
  return apiFetch<Complaint>(`/complaints/${id}/subassign`, {
    method: "POST",
    body: JSON.stringify({ officerId, note }),
  });
}

// Officer escalate: escalate to senior/admin
export async function escalateComplaint(id: string, note?: string) {
  return apiFetch<Complaint>(`/complaints/${id}/escalate`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });
}
import { apiFetch } from "../lib/api";

const SLA_HOURS: Record<"normal" | "urgent" | "critical", number> = {
  normal: 24 * 7,
  urgent: 24 * 3,
  critical: 24,
};

export type Complaint = {
  id: string;
  complaint_number: string | null;
  citizen_profile_id: string | null;
  voter_id: string | null;
  submitted_by: string | null;
  category: string | null;
  sub_category: string | null;
  description: string | null;
  location_text: string | null;
  attachment_url: string | null;
  assigned_department_id: string | null;
  assigned_officer_id: string | null;
  priority: "normal" | "urgent" | "critical" | null;
  status:
    | "unassigned"
    | "assigned"
    | "acknowledged"
    | "in_progress"
    | "resolved"
    | "escalated"
    | "closed"
    | "reopened"
    | null;
  resolution_note: string | null;
  expected_resolution_at: string | null;
  resolved_at: string | null;
  reopened_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ComplaintInsert = Partial<Complaint>;

type ComplaintStatus = NonNullable<Complaint["status"]>;

type AssignmentData = {
  assignedDepartmentId: string;
  priority: "normal" | "urgent" | "critical";
  note?: string;
};

export type Department = {
  id: string;
  name: string;
  category: string | null;
  created_at: string;
};

export type ComplaintTimelineEvent = {
  id: string;
  complaint_id: string;
  actor_profile_id: string | null;
  old_status: string | null;
  new_status: string | null;
  note: string | null;
  satisfied: boolean | null;
  created_at: string;
};

function addHours(date: Date, hours: number) {
  const result = new Date(date);
  result.setHours(result.getHours() + hours);
  return result.toISOString();
}

export async function createComplaint(data: ComplaintInsert) {
  return apiFetch<Complaint>("/complaints", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMyComplaints() {
  return apiFetch<Complaint[]>("/complaints/me");
}

export async function getComplaintById(id: string) {
  return apiFetch<Complaint | null>(`/complaints/${id}`);
}

export async function getAllComplaints() {
  return apiFetch<Complaint[]>("/complaints");
}

export async function assignComplaint(id: string, assignment: AssignmentData) {
  const expectedResolution = addHours(
    new Date(),
    SLA_HOURS[assignment.priority],
  );
  return apiFetch<Complaint>(`/complaints/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({
      ...assignment,
      expected_resolution_at: expectedResolution,
    }),
  });
}

export async function updateComplaintStatus(
  id: string,
  status: ComplaintStatus,
  note?: string,
) {
  return apiFetch<Complaint>(`/complaints/${id}/status`, {
    method: "POST",
    body: JSON.stringify({ status, note }),
  });
}

export async function reopenComplaint(id: string) {
  return apiFetch<Complaint>(`/complaints/${id}/reopen`, {
    method: "POST",
  });
}

export async function closeComplaint(
  id: string,
  satisfied: boolean,
  note?: string,
) {
  return apiFetch<Complaint>(`/complaints/${id}/feedback`, {
    method: "POST",
    body: JSON.stringify({ satisfied, note }),
  });
}

export async function getComplaintTimeline(id: string) {
  return apiFetch<ComplaintTimelineEvent[]>(`/complaints/${id}/timeline`);
}

export async function getDepartments() {
  return apiFetch<Department[]>("/departments");
}
