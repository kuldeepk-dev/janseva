import { apiFetch } from "../lib/api";

export type FamilyMember = {
  name: string;
  relation: string;
  gender: "male" | "female" | "other";
};

export type Voter = {
  id: string;
  profile_id: string | null;
  full_name: string | null;
  father_name: string | null;
  dob: string | null;
  anniversary: string | null;
  mobile: string | null;
  voter_id: string | null;
  occupation: string | null;
  gender: string | null;
  village: string | null;
  panchayat: string | null;
  booth_number: string | null;
  photo_url: string | null;
  family_members: FamilyMember[] | null;
  family_size: number | null;
  male_count: number | null;
  female_count: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type VoterInsert = Partial<Voter>;
export type VoterUpdate = Partial<Voter>;

export async function createVoter(data: VoterInsert) {
  return apiFetch<Voter>("/voters", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateVoter(id: string, data: VoterUpdate) {
  return apiFetch<Voter>(`/voters/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getMyVoter() {
  return apiFetch<Voter | null>("/voters/me");
}

export async function searchVoters(query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return [] as Voter[];
  }
  return apiFetch<Voter[]>(`/voters/search?q=${encodeURIComponent(trimmed)}`);
}
