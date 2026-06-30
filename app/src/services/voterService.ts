import { apiFetch } from "../lib/api";
import { normalizeMediaUrl } from "../lib/mediaUrl";

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

function normalizeVoter(voter: Voter | null) {
  if (!voter) {
    return null;
  }

  return {
    ...voter,
    photo_url: normalizeMediaUrl(voter.photo_url),
  };
}

function normalizeVoters(voters: Voter[]) {
  return voters.map(voter => normalizeVoter(voter) as Voter);
}

export async function createVoter(data: VoterInsert) {
  const voter = await apiFetch<Voter>("/voters", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return normalizeVoter(voter) as Voter;
}

export async function updateVoter(id: string, data: VoterUpdate) {
  const voter = await apiFetch<Voter>(`/voters/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return normalizeVoter(voter) as Voter;
}

export async function getMyVoter() {
  const voter = await apiFetch<Voter | null>("/voters/me");
  return normalizeVoter(voter);
}

export async function searchVoters(query: string) {
  const trimmed = query.trim();
  if (!trimmed) {
    return [] as Voter[];
  }
  const voters = await apiFetch<Voter[]>(`/voters/search?q=${encodeURIComponent(trimmed)}`);
  return normalizeVoters(voters);
}
