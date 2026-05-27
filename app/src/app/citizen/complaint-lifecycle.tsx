import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { apiConfigError } from "../../lib/api";
import {
  getComplaintById,
  reopenComplaint,
} from "../../services/complaintService";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function TimelineStep({
  title,
  subtitle,
  metaLeft,
  metaRight,
  current,
  first,
}: {
  title: string;
  subtitle: string;
  metaLeft: string;
  metaRight: string;
  current?: boolean;
  first?: boolean;
}) {
  return (
    <View style={styles.stepWrap}>
      <View
        style={[
          styles.stepDot,
          current && styles.stepDotCurrent,
          first && styles.stepDotFirst,
        ]}
      >
        <MaterialIcons
          name={current ? "person" : first ? "description" : "check"}
          size={16}
          color={current ? "#00236F" : first ? "#002113" : "#444651"}
        />
      </View>
      <View style={[styles.stepCard, current && styles.stepCardCurrent]}>
        <Text style={[styles.stepTag, current && styles.stepTagCurrent]}>
          {title}
        </Text>
        <Text style={styles.stepTitle}>{subtitle}</Text>
        <View style={styles.stepMeta}>
          <Text style={styles.stepMetaText}>{metaLeft}</Text>
          <Text style={styles.stepMetaText}>{metaRight}</Text>
        </View>
      </View>
    </View>
  );
}

export default function ComplaintLifecycleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [status, setStatus] = useState<"In Progress" | "Resolved" | "Reopened">(
    "Resolved",
  );
  const [complaintNumber, setComplaintNumber] = useState("CMP-2025-00923");
  const [summary, setSummary] = useState(
    "Pothole reporting and street lighting maintenance.",
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const statusLabel = useMemo(
    () => (status === "Reopened" ? "REOPENED" : status.toUpperCase()),
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
      const isUuid = /^[0-9a-f-]{36}$/i.test(id);
      if (!isUuid) {
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await getComplaintById(id);
        if (!isActive || !data) {
          return;
        }
        setComplaintNumber(data.complaint_number ?? id);
        setSummary(data.description ?? "Complaint details");
        if (data.status === "resolved") {
          setStatus("Resolved");
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
    if (!id || apiConfigError) {
      setStatus("Reopened");
      return;
    }
    const isUuid = /^[0-9a-f-]{36}$/i.test(id);
    if (!isUuid) {
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
        <Text style={styles.breadcrumb}>Complaints › {complaintNumber}</Text>
        <Text style={styles.title}>Lifecycle Audit Trail</Text>
        <Text style={styles.sub}>{summary}</Text>

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

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Process Milestones</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressDone} />
          </View>
          <View style={styles.milestones}>
            {["SUBMITTED", "ROUTED", "ASSIGNED", "IN PROGRESS", "RESOLVED"].map(
              (m, i) => (
                <View key={m} style={styles.mileItem}>
                  <View
                    style={[
                      styles.mileDot,
                      i < 4 && styles.mileDotDone,
                      i === 3 && styles.mileDotActive,
                    ]}
                  />
                  <Text style={[styles.mileText, i < 4 && styles.mileTextDone]}>
                    {m}
                  </Text>
                </View>
              ),
            )}
          </View>
        </View>

        <View style={styles.citizenCard}>
          <Text style={styles.citizenLabel}>Citizen Info</Text>
          <Text style={styles.citizenName}>Rajesh Kumar</Text>
          <View style={styles.citizenRow}>
            <MaterialIcons name="location-on" size={16} color="#FFFFFF" />
            <Text style={styles.citizenLoc}>Sector 12, Urban Estate</Text>
          </View>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() =>
              Alert.alert("Contact", "Call/SMS options coming soon.")
            }
          >
            <MaterialIcons name="contact-phone" size={16} color="#00236F" />
            <Text style={styles.contactText}>Contact Citizen</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Step-by-Step Lifecycle Log</Text>
            <TouchableOpacity
              style={styles.exportBtn}
              onPress={() =>
                Alert.alert("Export", "Export audit trail is a placeholder.")
              }
            >
              <MaterialIcons name="download" size={16} color="#00236F" />
              <Text style={styles.exportText}>Export Audit</Text>
            </TouchableOpacity>
          </View>

          <TimelineStep
            title="Officer Action • Current Stage"
            subtitle="Verification & Patching Works Underway"
            metaLeft="Ward Officer S. Patil"
            metaRight="14 Oct 2025, 10:45 AM"
            current
          />
          <TimelineStep
            title="Acknowledgement"
            subtitle="Complaint Acknowledged & SLA Clock Started"
            metaLeft="Operator: Central Hub"
            metaRight="13 Oct 2025, 04:30 PM"
          />
          <TimelineStep
            title="Assignment"
            subtitle="Assigned to Ward No. 12 (Public Works)"
            metaLeft="System (Auto-Assign)"
            metaRight="13 Oct 2025, 02:15 PM"
          />
          <TimelineStep
            title="Auto-routing"
            subtitle="Categorized: Infrastructure Maintenance"
            metaLeft="System Engine"
            metaRight="13 Oct 2025, 02:12 PM"
          />
          <TimelineStep
            title="Submission"
            subtitle="Complaint Received via Web Portal"
            metaLeft="Citizen: Rajesh Kumar"
            metaRight="13 Oct 2025, 02:10 PM"
            first
          />
        </View>

        <View style={styles.infoGridCard}>
          <Text style={styles.gridTitle}>Citizen Attachments</Text>
          <View style={styles.attachRow}>
            <View style={styles.imgThumb} />
            <View style={styles.addThumb}>
              <MaterialIcons name="add-a-photo" size={18} color="#444651" />
              <Text style={styles.addThumbText}>Add Image</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoGridCard}>
          <Text style={styles.gridTitle}>Geospatial Context</Text>
          <View style={styles.mapBox}>
            <MaterialIcons name="map" size={18} color="#444651" />
            <Text style={styles.mapText}>Sector 12 Geofence Active</Text>
          </View>
        </View>

        <View style={styles.infoGridCard}>
          <Text style={styles.gridTitle}>Internal Notes</Text>
          <Text style={styles.noteText}>
            "Critical route for local ambulance service. High priority flag
            applied."
          </Text>
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
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  cardLabel: {
    color: "#444651",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: "700",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D9E3F4",
    overflow: "hidden",
  },
  progressDone: { width: "75%", height: "100%", backgroundColor: "#00236F" },
  milestones: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  mileItem: { width: "19%", alignItems: "center", gap: 4 },
  mileDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D9E3F4",
  },
  mileDotDone: { backgroundColor: "#00236F" },
  mileDotActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#90A8FF",
  },
  mileText: {
    color: "#757682",
    fontSize: 8,
    textAlign: "center",
    fontWeight: "700",
  },
  mileTextDone: { color: "#00236F" },
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
  contactBtn: {
    marginTop: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  contactText: { color: "#00236F", fontSize: 13, fontWeight: "700" },
  sectionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    color: "#121C28",
    fontSize: 19,
    fontWeight: "700",
    flex: 1,
    paddingRight: 8,
  },
  exportBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  exportText: { color: "#00236F", fontSize: 12, fontWeight: "700" },
  stepWrap: { paddingLeft: 46, position: "relative", marginTop: 2 },
  stepDot: {
    position: "absolute",
    left: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#D9E3F4",
    alignItems: "center",
    justifyContent: "center",
  },
  stepDotCurrent: {
    backgroundColor: "#DCE1FF",
    borderWidth: 1,
    borderColor: "#00236F",
  },
  stepDotFirst: { backgroundColor: "#6FFBBE" },
  stepCard: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    padding: 10,
    marginBottom: 10,
  },
  stepCardCurrent: {
    backgroundColor: "#DFE9FA",
    borderLeftWidth: 4,
    borderLeftColor: "#00236F",
  },
  stepTag: { color: "#444651", fontSize: 12, fontWeight: "700" },
  stepTagCurrent: { color: "#00236F" },
  stepTitle: {
    color: "#121C28",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 2,
  },
  stepMeta: { marginTop: 6, gap: 1 },
  stepMetaText: { color: "#757682", fontSize: 11 },
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
  attachRow: { flexDirection: "row", gap: 8 },
  imgThumb: {
    width: 76,
    height: 76,
    borderRadius: 8,
    backgroundColor: "#C5C5D3",
  },
  addThumb: {
    flex: 1,
    height: 76,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#757682",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "#FFFFFF66",
  },
  addThumbText: { color: "#444651", fontSize: 10, fontWeight: "700" },
  mapBox: {
    height: 76,
    borderRadius: 8,
    backgroundColor: "#D9E3F4",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  mapText: { color: "#444651", fontSize: 12 },
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
});
