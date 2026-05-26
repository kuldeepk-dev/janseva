import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { apiConfigError } from "../../lib/api";
import {
  getComplaintById,
  updateComplaintStatus,
} from "../../services/complaintService";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function TimelineItem({
  title,
  subtitle,
  time,
  tone = "default",
}: {
  title: string;
  subtitle: string;
  time: string;
  tone?: "default" | "warn";
}) {
  const color = tone === "warn" ? "#BA1A1A" : "#00714D";
  const bg = tone === "warn" ? "#FFDAD6" : "#6CF8BB";
  return (
    <View style={styles.timelineItem}>
      <View style={[styles.timelineDot, { backgroundColor: bg }]}>
        <MaterialIcons
          name={tone === "warn" ? "warning" : "check"}
          size={14}
          color={color}
        />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.timelineHead}>
          <Text
            style={[
              styles.timelineTitle,
              tone === "warn" && { color: "#BA1A1A" },
            ]}
          >
            {title}
          </Text>
          <Text style={styles.timelineTime}>{time}</Text>
        </View>
        <Text style={styles.timelineSub}>{subtitle}</Text>
      </View>
    </View>
  );
}

export default function OfficerComplaintViewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [status, setStatus] = useState("Assigned");
  const [complaintNumber, setComplaintNumber] = useState("#JS-99231");
  const [summary, setSummary] = useState(
    "Pothole & Drainage Issue at West Gate Colony",
  );
  const [category, setCategory] = useState("Public Works");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (!id || apiConfigError) {
        if (apiConfigError) {
          setError(apiConfigError);
        }
        return;
      }
      const isUuid = /^[0-9a-f-]{36}$/i.test(id);
      if (!isUuid) {
        return;
      }
      setIsLoading(true);
      try {
        const data = await getComplaintById(id);
        if (!isActive || !data) {
          return;
        }
        setComplaintNumber(data.complaint_number ?? id);
        setSummary(data.description ?? "Complaint details");
        setCategory(data.category ?? "Complaint");
        setStatus(data.status ?? "Assigned");
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

  const handleStatusChange = async (
    nextStatus: "acknowledged" | "in_progress" | "resolved" | "escalated",
  ) => {
    if (!id || apiConfigError) {
      setStatus(
        nextStatus === "in_progress"
          ? "In Progress"
          : nextStatus === "acknowledged"
            ? "Acknowledged"
            : nextStatus === "resolved"
              ? "Resolved"
              : "Escalated",
      );
      return;
    }
    const isUuid = /^[0-9a-f-]{36}$/i.test(id);
    if (!isUuid) {
      return;
    }
    setIsLoading(true);
    try {
      await updateComplaintStatus(id, nextStatus, "Updated by officer");
      setStatus(
        nextStatus === "in_progress"
          ? "In Progress"
          : nextStatus === "acknowledged"
            ? "Acknowledged"
            : nextStatus === "resolved"
              ? "Resolved"
              : "Escalated",
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Update failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.push("/officer" as never)}
          >
            <MaterialIcons name="arrow-back" size={20} color="#444651" />
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
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.badgeRow}>
              <Text style={styles.slaBadge}>SLA OVERDUE: 48h</Text>
              <Text style={styles.idBadge}>
                COMPLAINT ID: {complaintNumber}
              </Text>
            </View>
            <View style={styles.heroIcon}>
              <MaterialIcons name="construction" size={20} color="#264191" />
            </View>
          </View>
          <Text style={styles.statusText}>Status: {status}</Text>
          <Text style={styles.heroTitle}>{summary}</Text>
          <Text style={styles.heroSub}>Category: {category}</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.cardHead}>CITIZEN DETAILS</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Full Name</Text>
              <Text style={styles.infoValue}>Rajesh Kumar Sharma</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Mobile Number</Text>
              <Text style={styles.infoValue}>+91 98765 43210</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Ward Number</Text>
              <Text style={styles.infoValue}>West Zone - Ward 14</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Complaint Description</Text>
          <Text style={styles.description}>
            The main road leading to West Gate Colony has developed several deep
            potholes after monsoon showers. Side drainage is clogged and causing
            waterlogging.
          </Text>
          <View style={styles.photoRow}>
            <View style={styles.photoBox} />
            <View style={styles.photoBox} />
            <View style={styles.addPhotoBox}>
              <MaterialIcons name="add-a-photo" size={20} color="#757682" />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHead}>COMPLAINT HISTORY</Text>
          <View style={styles.timeline}>
            <TimelineItem
              title="Complaint Registered"
              subtitle="Via Mobile App | Token Generated"
              time="12 Oct, 10:30 AM"
            />
            <TimelineItem
              title="Assigned to West Zone Dept."
              subtitle="Automated Routing Successful"
              time="12 Oct, 11:15 AM"
            />
            <TimelineItem
              title="SLA Breached"
              subtitle="Resolution time exceeded 48 hours"
              time="14 Oct, 11:15 AM"
              tone="warn"
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Take Action</Text>
          <TouchableOpacity
            style={styles.actionGhost}
            onPress={() => handleStatusChange("acknowledged")}
          >
            <MaterialIcons name="done" size={18} color="#00236F" />
            <Text style={styles.actionGhostText}>Acknowledge</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionPrimary}
            onPress={() => handleStatusChange("in_progress")}
          >
            <MaterialIcons name="play-arrow" size={18} color="#FFFFFF" />
            <Text style={styles.actionPrimaryText}>Mark In Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionSecondary}
            onPress={() => handleStatusChange("resolved")}
          >
            <MaterialIcons name="done-all" size={18} color="#FFFFFF" />
            <Text style={styles.actionPrimaryText}>Mark Resolved</Text>
          </TouchableOpacity>
          <View style={styles.smallActions}>
            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() =>
                Alert.alert("Assign", "Assign junior is a placeholder.")
              }
            >
              <MaterialIcons name="person-add" size={18} color="#00236F" />
              <Text style={styles.smallBtnText}>Assign Junior</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => handleStatusChange("escalated")}
            >
              <MaterialIcons name="outbox" size={18} color="#BA1A1A" />
              <Text style={styles.smallBtnText}>Escalate</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.infoLabel}>
            Add internal notes or resolution summary
          </Text>
          <TextInput
            multiline
            placeholder="Explain the action taken..."
            placeholderTextColor="#757682"
            style={styles.notes}
          />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHead}>COMPLAINT METADATA</Text>
          <View style={styles.metaRow}>
            <MaterialIcons name="map" size={18} color="#264191" />
            <Text style={styles.metaText}>19.0760° N, 72.8777° E</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="group" size={18} color="#264191" />
            <Text style={styles.metaText}>Public Works - Team B</Text>
          </View>
          <View style={styles.metaRow}>
            <MaterialIcons name="priority-high" size={18} color="#BA1A1A" />
            <Text style={[styles.metaText, { color: "#BA1A1A" }]}>
              High (Urgent)
            </Text>
          </View>
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() =>
              Alert.alert(
                "Similar",
                "Similar complaints list is a placeholder.",
              )
            }
          >
            <Text style={styles.linkText}>View Similar Complaints</Text>
            <MaterialIcons name="chevron-right" size={18} color="#00236F" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/officer" as never)}
        >
          <MaterialIcons name="home" size={20} color="#444651" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            Alert.alert("Services", "Services view is a placeholder.")
          }
        >
          <MaterialIcons name="apps" size={20} color="#444651" />
          <Text style={styles.navText}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.navItem, styles.navActive]}
          onPress={() => router.push("/officer" as never)}
        >
          <MaterialIcons name="assignment" size={20} color="#00714D" />
          <Text style={styles.navActiveText}>Complaints</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() =>
            Alert.alert("Profile", "Profile view is a placeholder.")
          }
        >
          <MaterialIcons name="person" size={20} color="#444651" />
          <Text style={styles.navText}>Profile</Text>
        </TouchableOpacity>
      </View>
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
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 20, color: "#00236F", fontWeight: "700" },
  langBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 99 },
  langText: { color: "#00236F", fontSize: 14, fontWeight: "600" },
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  heroCard: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 14,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, flex: 1 },
  slaBadge: {
    backgroundColor: "#FFDAD6",
    color: "#93000A",
    fontSize: 11,
    fontWeight: "700",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  idBadge: {
    backgroundColor: "#6CF8BB",
    color: "#00714D",
    fontSize: 11,
    fontWeight: "700",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  heroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DCE1FF",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  statusText: {
    marginTop: 6,
    color: "#00236F",
    fontSize: 12,
    fontWeight: "700",
  },
  heroTitle: {
    marginTop: 12,
    color: "#121C28",
    fontSize: 22,
    fontWeight: "600",
    lineHeight: 30,
  },
  heroSub: { marginTop: 4, color: "#444651", fontSize: 14 },
  errorText: { color: "#BA1A1A", fontSize: 12, marginBottom: 6 },
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
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionTitle: { color: "#121C28", fontSize: 20, fontWeight: "600" },
  infoGrid: { gap: 8 },
  infoItem: { gap: 2 },
  infoLabel: { color: "#757682", fontSize: 11 },
  infoValue: { color: "#121C28", fontSize: 14, fontWeight: "600" },
  description: { color: "#121C28", fontSize: 15, lineHeight: 22 },
  photoRow: { flexDirection: "row", gap: 8 },
  photoBox: {
    width: 88,
    height: 88,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    backgroundColor: "#D9E3F4",
  },
  addPhotoBox: {
    width: 88,
    height: 88,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#757682",
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  timeline: { gap: 10 },
  timelineItem: { flexDirection: "row", gap: 8 },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  timelineHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  timelineTitle: { color: "#121C28", fontSize: 13, fontWeight: "700", flex: 1 },
  timelineSub: { color: "#444651", fontSize: 12 },
  timelineTime: { color: "#757682", fontSize: 11 },
  actionPrimary: {
    height: 46,
    borderRadius: 8,
    backgroundColor: "#00236F",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  actionSecondary: {
    height: 46,
    borderRadius: 8,
    backgroundColor: "#006C49",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  actionPrimaryText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  actionGhost: {
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  actionGhostText: { color: "#00236F", fontSize: 14, fontWeight: "700" },
  smallActions: { flexDirection: "row", gap: 8 },
  smallBtn: {
    flex: 1,
    height: 70,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    gap: 4,
  },
  smallBtnText: { color: "#121C28", fontSize: 12, fontWeight: "600" },
  notes: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 8,
    backgroundColor: "#EEF4FF",
    padding: 10,
    color: "#121C28",
    textAlignVertical: "top",
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { color: "#121C28", fontSize: 13, fontWeight: "600" },
  linkRow: {
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkText: { color: "#00236F", fontSize: 14, fontWeight: "600" },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  navActive: { backgroundColor: "#6CF8BB", borderRadius: 16 },
  navText: { color: "#444651", fontSize: 12, fontWeight: "500" },
  navActiveText: { color: "#00714D", fontSize: 12, fontWeight: "700" },
});
