import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { apiConfigError } from "../../lib/api";
import {
  closeComplaint,
  getComplaintById,
  getComplaintTimeline,
  reopenComplaint,
} from "../../services/complaintService";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ComplaintLifecycleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [status, setStatus] = useState<
    "In Progress" | "Resolved" | "Reopened" | "Closed"
  >("Resolved");
  const [complaintNumber, setComplaintNumber] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [operatorNote, setOperatorNote] = useState("");
  const [operatorNoteAt, setOperatorNoteAt] = useState("");
  const [timeline, setTimeline] = useState<
    Array<{
      id: string;
      new_status: string | null;
      note: string | null;
      created_at: string;
    }>
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const statusLabel = useMemo(
    () =>
      status === "Reopened"
        ? "REOPENED"
        : status === "Closed"
          ? "CLOSED"
          : status.toUpperCase(),
    [status],
  );

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (!id || apiConfigError) {
        if (apiConfigError) {
          setError(apiConfigError);
        }
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const [data, events] = await Promise.all([
          getComplaintById(id),
          getComplaintTimeline(id),
        ]);

        if (!isActive || !data) {
          return;
        }

        setComplaintNumber(data.complaint_number ?? id);
        setCategory(data.category ?? "");
        setSubCategory(data.sub_category ?? "");
        setDescription(data.description ?? "");
        setLocationText(data.location_text ?? "");
        setOperatorNote(data.operator_note ?? "");
        setOperatorNoteAt(data.operator_note_updated_at ?? "");
        setTimeline(events);

        if (data.status === "resolved") {
          setStatus("Resolved");
        } else if (data.status === "closed") {
          setStatus("Closed");
        } else if (data.status === "reopened") {
          setStatus("Reopened");
        } else {
          setStatus("In Progress");
        }
      } catch (err) {
        if (!isActive) {
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to load.";
        setError(message);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [id]);

  const handleReopen = async () => {
    if (status !== "Resolved") {
      Alert.alert(
        "Action unavailable",
        "You can only reopen a complaint after the operator marks it as resolved.",
      );
      return;
    }
    if (!id || apiConfigError) {
      setStatus("Reopened");
      return;
    }

    setIsLoading(true);
    try {
      await reopenComplaint(id);
      setStatus("Reopened");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Reopen failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (satisfied: boolean) => {
    if (status !== "Resolved") {
      Alert.alert(
        "Action unavailable",
        "You can only confirm or request reopening after the operator marks the complaint as resolved.",
      );
      return;
    }
    if (!id || apiConfigError) {
      setStatus(satisfied ? "Closed" : "Reopened");
      return;
    }

    setIsLoading(true);
    try {
      await closeComplaint(
        id,
        satisfied,
        satisfied ? "Citizen confirmed resolution" : "Citizen requested reopen",
      );
      setStatus(satisfied ? "Closed" : "Reopened");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotSatisfiedPress = () => {
    Alert.alert(
      "Not satisfied?",
      "If you proceed, this complaint will be marked for reopening and sent back to the operator for review.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Proceed",
          style: "destructive",
          onPress: () => {
            void handleFeedback(false);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/complaints" as never);
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#00236F" />
          </TouchableOpacity>
          <Text style={styles.brand}>Jan Seva Portal</Text>
        </View>
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() =>
            Alert.alert("Language", "Language picker coming soon.")
          }
        >
          <Text style={styles.langText}>English</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.breadcrumb}>Complaints › {complaintNumber || "Loading..."}</Text>
        <Text style={styles.title}>Lifecycle Audit Trail</Text>
        <Text style={styles.sub}>
          {category} {subCategory ? `- ${subCategory}` : ""}
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.badges}>
          <View style={styles.primaryBadge}>
            <MaterialIcons name="query-builder" size={16} color="#90A8FF" />
            <Text style={styles.primaryBadgeText}>Active: 48h remaining</Text>
          </View>
          <View
            style={[
              styles.successBadge,
              status !== "In Progress" && styles.reopenBadge,
            ]}
          >
            <Text
              style={[
                styles.successBadgeText,
                status !== "In Progress" && styles.reopenBadgeText,
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        <View style={styles.actionRowTop}>
          {status === "Resolved" ? (
            <TouchableOpacity
              style={styles.reopenBtn}
              onPress={() => handleFeedback(true)}
            >
              <MaterialIcons name="check-circle" size={16} color="#00236F" />
              <Text style={styles.reopenText}>
                {isLoading ? "Saving..." : "Satisfied"}
              </Text>
            </TouchableOpacity>
          ) : null}
          {status === "Resolved" ? (
            <TouchableOpacity style={styles.reopenBtn} onPress={handleReopen}>
              <MaterialIcons name="refresh" size={16} color="#00236F" />
              <Text style={styles.reopenText}>
                {isLoading ? "Reopening..." : "Reopen"}
              </Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() =>
              Alert.alert("Share", "Share via WhatsApp coming soon.")
            }
          >
            <MaterialIcons name="share" size={16} color="#00236F" />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
        </View>

        {status !== "Resolved" ? (
          <View style={styles.lockedNotice}>
            <MaterialIcons name="lock" size={16} color="#8A5A00" />
            <Text style={styles.lockedNoticeText}>
              Citizen actions are locked until the operator marks this complaint
              as resolved.
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.notSatisfiedBtn}
            onPress={handleNotSatisfiedPress}
          >
            <MaterialIcons name="close" size={16} color="#7A4C00" />
            <Text style={styles.notSatisfiedText}>Not satisfied</Text>
          </TouchableOpacity>
        )}

        <View style={styles.citizenCard}>
          <Text style={styles.citizenLabel}>Complaint Details</Text>
          <Text style={styles.citizenName}>{category || "Complaint"}</Text>
          {subCategory ? (
            <Text style={styles.citizenLoc}>Sub-category: {subCategory}</Text>
          ) : null}
          <View style={styles.citizenRow}>
            <MaterialIcons name="location-on" size={16} color="#FFFFFF" />
            <Text style={styles.citizenLoc}>
              {locationText || "Location not specified"}
            </Text>
          </View>
          {description ? <Text style={styles.citizenDesc}>{description}</Text> : null}
        </View>

        {operatorNote ? (
          <View style={styles.operatorNoteCard}>
            <View style={styles.operatorNoteHeader}>
              <MaterialIcons name="campaign" size={18} color="#7A4C00" />
              <Text style={styles.operatorNoteLabel}>Latest Operator Note</Text>
            </View>
            <Text style={styles.operatorNoteText}>{operatorNote}</Text>
            {operatorNoteAt ? (
              <Text style={styles.operatorNoteMeta}>
                {new Date(operatorNoteAt).toLocaleString()}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View style={styles.infoGridCard}>
          <Text style={styles.gridTitle}>Complaint Timeline</Text>
          {timeline.length ? (
            timeline.map(event => (
              <View key={event.id} style={styles.timelineRow}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineBody}>
                  <Text style={styles.timelineStatus}>
                    {event.new_status ?? "updated"}
                  </Text>
                  <Text style={styles.timelineNote}>
                    {event.note ?? "Status changed"}
                  </Text>
                  <Text style={styles.timelineMeta}>
                    {new Date(event.created_at).toLocaleString()}
                  </Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noteText}>No timeline events yet.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 4 },
  brand: { color: "#00236F", fontSize: 21, fontWeight: "700" },
  langBtn: {
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  langText: { color: "#444651", fontSize: 12, fontWeight: "600" },
  content: { padding: 16, paddingBottom: 120, gap: 10 },
  breadcrumb: { color: "#757682", fontSize: 12 },
  title: { color: "#121C28", fontSize: 27, fontWeight: "700" },
  sub: { color: "#444651", fontSize: 14, marginTop: -2 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  primaryBadge: {
    backgroundColor: "#1E3A8A",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  primaryBadgeText: { color: "#90A8FF", fontSize: 12, fontWeight: "700" },
  successBadge: {
    backgroundColor: "#6CF8BB",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  successBadgeText: { color: "#00714D", fontSize: 12, fontWeight: "700" },
  reopenBadge: { backgroundColor: "#E5EEFF" },
  reopenBadgeText: { color: "#00236F" },
  actionRowTop: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginTop: 4,
    flexWrap: "wrap",
  },
  reopenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  reopenText: { color: "#00236F", fontSize: 12, fontWeight: "700" },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  shareText: { color: "#00236F", fontSize: 12, fontWeight: "700" },
  lockedNotice: {
    backgroundColor: "#FFF6E5",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0D9A7",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  lockedNoticeText: {
    color: "#7A4C00",
    fontSize: 12,
    fontWeight: "600",
    flex: 1,
    lineHeight: 18,
  },
  notSatisfiedBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E7C3A1",
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  notSatisfiedText: { color: "#7A4C00", fontSize: 12, fontWeight: "700" },
  citizenCard: {
    backgroundColor: "#00236F",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  citizenLabel: {
    color: "#DCE1FF",
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  citizenName: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  citizenRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  citizenLoc: { color: "#EAF1FF", fontSize: 13 },
  citizenDesc: { color: "#FFFFFF", fontSize: 14, marginTop: 4, lineHeight: 20 },
  operatorNoteCard: {
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "#F5C26B",
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  operatorNoteHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  operatorNoteLabel: {
    color: "#7A4C00",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  operatorNoteText: {
    color: "#4B2F00",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
  },
  operatorNoteMeta: { color: "#8A5A00", fontSize: 11 },
  infoGridCard: {
    backgroundColor: "#E5EEFF",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  gridTitle: {
    color: "#00236F",
    fontSize: 12,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  noteText: {
    color: "#444651",
    fontSize: 13,
    fontStyle: "italic",
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    padding: 10,
  },
  timelineRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00236F",
    marginTop: 6,
  },
  timelineBody: { flex: 1, gap: 2 },
  timelineStatus: {
    color: "#00236F",
    fontWeight: "700",
    textTransform: "capitalize",
  },
  timelineNote: { color: "#444651" },
  timelineMeta: { color: "#757682", fontSize: 12 },
});
