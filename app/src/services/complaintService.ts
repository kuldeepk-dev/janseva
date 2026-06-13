import { apiFetch } from "../lib/api";

export type ComplaintStatus =
  | "unassigned"
  | "assigned"
  | "acknowledged"
  | "in_progress"
  | "resolved"
  | "escalated"
  | "closed"
  | "reopened";

export type Complaint = {
  id: string;
  complaint_number: string | null;
  citizen_profile_id: string | null;
  voter_id: string | null;
  submitted_by: string | null;
  created_by_role: "citizen" | "operator" | "leader" | "admin" | null;
  created_by_user_id: string | null;
  created_on_behalf_of_citizen_id: string | null;
  source: "citizen" | "operator" | null;
  reported_citizen_name: string | null;
  reported_citizen_mobile: string | null;
  category: string | null;
  sub_category: string | null;
  description: string | null;
  location_text: string | null;
  attachment_url: string | null;
  assigned_department_id: string | null;
  priority: "normal" | "urgent" | "critical" | null;
  status: ComplaintStatus | null;
  internal_notes: string | null;
  operator_note: string | null;
  operator_note_updated_at: string | null;
  resolution_note: string | null;
  resolution_details: string | null;
  expected_resolution_at: string | null;
  resolved_at: string | null;
  reopened_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ComplaintInsert = Partial<Complaint>;

type AssignmentData = {
  assignedDepartmentId: string;
  priority: "normal" | "urgent" | "critical";
  note?: string;
  expectedResolutionAt?: string;
  internalNotes?: string;
};

type ComplaintDetailsUpdate = {
  category?: string;
  subCategory?: string;
  description?: string;
  locationText?: string;
  internalNotes?: string;
  resolutionDetails?: string;
  reportedCitizenName?: string;
  reportedCitizenMobile?: string;
  citizenProfileId?: string | null;
  note?: string;
};

type ComplaintStatusUpdate = {
  status: ComplaintStatus;
  note?: string;
  internalNotes?: string;
  resolutionDetails?: string;
  resolutionNote?: string;
};

export type Department = {
  id: string;
  name: string;
  category: string | null;
  contact?: string | null;
  sla_days?: number | null;
  categories?: string[] | null;
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

function addDays(date: Date, days: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
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
  return apiFetch<Complaint>(`/complaints/${id}/assign`, {
    method: "POST",
    body: JSON.stringify({
      ...assignment,
      expectedResolutionAt:
        assignment.expectedResolutionAt ?? addDays(new Date(), 7),
    }),
  });
}

export async function updateComplaintDetails(
  id: string,
  updates: ComplaintDetailsUpdate,
) {
  return apiFetch<Complaint>(`/complaints/${id}/details`, {
    method: "POST",
    body: JSON.stringify(updates),
  });
}

export async function updateComplaintStatus(
  id: string,
  update: ComplaintStatusUpdate,
) {
  return apiFetch<Complaint>(`/complaints/${id}/status`, {
    method: "POST",
    body: JSON.stringify(update),
  });
}

export async function escalateComplaint(
  id: string,
  note?: string,
  internalNotes?: string,
) {
  return apiFetch<Complaint>(`/complaints/${id}/escalate`, {
    method: "POST",
    body: JSON.stringify({ note, internalNotes }),
  });
}

export async function reopenComplaint(id: string) {
  return apiFetch<Complaint>(`/complaints/${id}/reopen`, {
    method: "POST",
  });
}

export async function submitComplaintFeedback(
  id: string,
  satisfied: boolean,
  note?: string,
) {
  return apiFetch<Complaint>(`/complaints/${id}/citizen-feedback`, {
    method: "POST",
    body: JSON.stringify({ satisfied, note }),
  });
}

export async function closeComplaint(
  id: string,
  satisfied: boolean,
  note?: string,
) {
  return submitComplaintFeedback(id, satisfied, note);
}

export async function getComplaintTimeline(id: string) {
  return apiFetch<ComplaintTimelineEvent[]>(`/complaints/${id}/timeline`);
}

export async function getDepartments() {
  return apiFetch<Department[]>("/departments");
}
