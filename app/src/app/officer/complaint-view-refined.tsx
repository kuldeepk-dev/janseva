import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  getComplaintById,
  updateComplaintStatus,
  type Complaint,
} from "../../services/complaintService";
import { getProfileById, type Profile } from "../../services/authService";

function HistoryItem({
  icon,
  title,
  subtitle,
  extra,
  tone = "default",
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  extra?: string;
  tone?: "default" | "green";
}) {
  const bg = tone === "green" ? "#6FFBBE" : "#D9E3F4";
  const color = tone === "green" ? "#005236" : "#444651";
  return (
    <View style={styles.historyItem}>
      <View style={[styles.historyIcon, { backgroundColor: bg }]}>
        <MaterialIcons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyTitle}>{title}</Text>
        <Text style={styles.historySubtitle}>{subtitle}</Text>
        {extra ? <Text style={styles.historyExtra}>{extra}</Text> : null}
      </View>
    </View>
  );
}

export default function OfficerComplaintViewRefinedScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [citizenProfile, setCitizenProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!id) {
        setError("No complaint ID provided.");
        setIsLoading(false);
        return;
      }
      try {
        const data = await getComplaintById(id);
        if (!isActive) return;
        if (!data) {
          setError("Complaint not found.");
          return;
        }
        setComplaint(data);
        const citizenId = data.citizen_profile_id ?? data.submitted_by;
        if (citizenId) {
          const profile = await getProfileById(citizenId);
          if (!isActive) return;
          setCitizenProfile(profile);
        } else {
          setCitizenProfile(null);
        }
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Failed to load complaint.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, [id]);

  const statusLabel = complaint?.status ? complaint.status.replace(/_/g, " ") : "unknown";
  const priority = complaint?.priority ?? "normal";
  const priorityLabel =
    priority === "critical" ? "CRITICAL" : priority === "urgent" ? "URGENT" : "NORMAL";

  const handleStatusUpdate = async (
    nextStatus: "in_progress" | "resolved",
    successMessage: string,
  ) => {
    if (!complaint || isUpdating) return;
    try {
      setIsUpdating(true);
      const updated = await updateComplaintStatus(
        complaint.id,
        nextStatus,
        note.trim() || undefined,
      );
      setComplaint(updated);
      setError(null);
      Alert.alert("Status Updated", successMessage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/officer/queue" as never);
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#00236F" />
          </TouchableOpacity>
          <Text style={styles.idTitle}>
            Complaint #{complaint?.complaint_number ?? complaint?.id ?? "Loading..."}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isLoading ? <Text style={styles.muted}>Loading complaint...</Text> : null}

        {complaint ? (
          <>
            <View style={styles.heroRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.heroBadges}>
                  <View style={styles.badgeUrgent}>
                    <Text style={styles.badgeUrgentText}>{priorityLabel}</Text>
                  </View>
                  <View style={styles.badgeReview}>
                    <Text style={styles.badgeReviewText}>{statusLabel}</Text>
                  </View>
                </View>
                <View style={styles.locationRow}>
                  <MaterialIcons name="location-on" size={18} color="#00236F" />
                  <Text style={styles.locationText}>
                    {complaint.location_text ?? "Location not specified"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.slaCard}>
              <View style={styles.slaIcon}>
                <MaterialIcons name="timer" size={22} color="#FFFFFF" />
              </View>
              <View>
                <Text style={styles.slaTitle}>Expected Resolution</Text>
                <Text style={styles.slaTime}>
                  {complaint.expected_resolution_at
                    ? new Date(complaint.expected_resolution_at).toLocaleDateString()
                    : "Not set"}
                </Text>
                <Text style={styles.slaSub}>
                  Created: {new Date(complaint.created_at).toLocaleString()}
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHead}>COMPLAINT DETAILS</Text>
              <View style={styles.metaGrid}>
                <View>
                  <Text style={styles.metaLabel}>Category</Text>
                  <Text style={styles.metaValue}>{complaint.category ?? "Uncategorized"}</Text>
                </View>
                <View>
                  <Text style={styles.metaLabel}>Sub-Category</Text>
                  <Text style={styles.metaValue}>{complaint.sub_category ?? "Not specified"}</Text>
                </View>
              </View>
              <Text style={styles.description}>
                {complaint.description ?? "No complaint description available."}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHead}>CITIZEN DETAILS</Text>
              <View style={styles.citizenRow}>
                <View style={styles.initials}>
                  <Text style={styles.initialsText}>
                    {(citizenProfile?.full_name?.slice(0, 2) ?? "CI").toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.citizenName}>
                    {citizenProfile?.full_name ?? "Citizen"}
                  </Text>
                  <Text style={styles.citizenPhone}>
                    {citizenProfile?.mobile ?? "No mobile linked"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHead}>INTERNAL AUDIT NOTES</Text>
              <TextInput
                multiline
                placeholder="Add a note for the audit trail..."
                placeholderTextColor="#757682"
                style={styles.noteInput}
                value={note}
                onChangeText={setNote}
              />
              <TouchableOpacity
                style={styles.saveNoteBtn}
                onPress={() => Alert.alert("Notes", "Note capture can be wired next.")}
              >
                <Text style={styles.saveNoteText}>Save Note</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.card}>
              <Text style={styles.takeAction}>Take Action</Text>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={() =>
                  void handleStatusUpdate(
                    "in_progress",
                    "Complaint marked In Progress.",
                  )
                }
                disabled={isUpdating}
              >
                <MaterialIcons name="play-arrow" size={18} color="#FFFFFF" />
                <Text style={styles.primaryBtnText}>
                  {isUpdating ? "Updating..." : "Mark In Progress"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={() =>
                  void handleStatusUpdate(
                    "resolved",
                    "Complaint marked Resolved.",
                  )
                }
                disabled={isUpdating}
              >
                <MaterialIcons name="task-alt" size={18} color="#00714D" />
                <Text style={styles.secondaryBtnText}>
                  {isUpdating ? "Updating..." : "Mark Resolved"}
                </Text>
              </TouchableOpacity>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.smallAction}
                  onPress={() => Alert.alert("Assign", "Assign junior can be wired next.")}
                >
                  <MaterialIcons name="person-add" size={18} color="#121C28" />
                  <Text style={styles.smallActionText}>Assign Junior</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallAction}
                  onPress={() => Alert.alert("Escalate", "Escalation logged.")}
                >
                  <MaterialIcons name="priority-high" size={18} color="#BA1A1A" />
                  <Text style={styles.smallActionText}>Escalate</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.cardHead}>COMPLAINT HISTORY</Text>
              <HistoryItem
                icon="person-search"
                tone="green"
                title="Assigned to Officer"
                subtitle="Live assignment from backend"
                extra={complaint.assigned_officer_id ?? "Unassigned"}
              />
              <HistoryItem
                icon="visibility"
                title={`Status changed to '${complaint.status ?? "unassigned"}'`}
                subtitle="Current live complaint state"
              />
              <HistoryItem
                icon="how-to-reg"
                title="Complaint Registered"
                subtitle={new Date(complaint.created_at).toLocaleString()}
                extra={`Ref ID: ${complaint.complaint_number ?? complaint.id}`}
              />
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  idTitle: {
    color: "#00236F",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 6,
  },
  content: { padding: 16, gap: 12, paddingBottom: 108 },
  muted: { color: "#444651", fontSize: 14 },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  heroRow: { gap: 8 },
  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  badgeUrgent: {
    backgroundColor: "#1E3A8A",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeUrgentText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  badgeReview: {
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeReviewText: { color: "#444651", fontSize: 11, fontWeight: "700" },
  locationRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: { color: "#444651", fontSize: 14, flex: 1 },
  slaCard: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: "#F5B4B4",
    borderRadius: 12,
    backgroundColor: "#FFF1F1",
    padding: 12,
  },
  slaIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#BA1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  slaTitle: {
    color: "#BA1A1A",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  slaTime: {
    color: "#BA1A1A",
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 26,
  },
  slaSub: { color: "#444651", fontSize: 12 },
  card: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 10,
  },
  cardHead: {
    color: "#444651",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
    paddingTop: 10,
  },
  metaLabel: { color: "#757682", fontSize: 11 },
  metaValue: { color: "#121C28", fontSize: 13, fontWeight: "600" },
  description: { color: "#121C28", fontSize: 17, lineHeight: 25 },
  citizenRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  initials: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: { color: "#00236F", fontSize: 18, fontWeight: "700" },
  citizenName: { color: "#00236F", fontSize: 18, fontWeight: "700" },
  citizenPhone: { color: "#444651", fontSize: 14 },
  noteInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    padding: 10,
    color: "#121C28",
    textAlignVertical: "top",
  },
  saveNoteBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#00236F",
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveNoteText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  takeAction: { color: "#00236F", fontSize: 20, fontWeight: "700" },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#00236F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  secondaryBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#006C49",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryBtnText: { color: "#00714D", fontSize: 14, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 8 },
  smallAction: {
    flex: 1,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  smallActionText: { color: "#121C28", fontSize: 12, fontWeight: "600" },
  historyItem: { flexDirection: "row", gap: 10, paddingBottom: 8 },
  historyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  historyTitle: { color: "#121C28", fontSize: 13, fontWeight: "700" },
  historySubtitle: { color: "#444651", fontSize: 12 },
  historyExtra: { color: "#757682", fontSize: 11, marginTop: 1 },
});
