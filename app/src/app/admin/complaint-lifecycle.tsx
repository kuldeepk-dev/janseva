import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function TimelineItem({
  title,
  subtitle,
  actor,
  time,
  current,
}: {
  title: string;
  subtitle: string;
  actor: string;
  time: string;
  current?: boolean;
}) {
  return (
    <View style={styles.timelineItem}>
      <View style={[styles.dot, current && styles.dotActive]}>
        <MaterialIcons
          name={current ? "sync" : "check"}
          size={16}
          color={current ? "#00236F" : "#FFFFFF"}
        />
      </View>
      <View style={[styles.eventCard, current && styles.eventActive]}>
        <Text style={styles.eventTitle}>{title}</Text>
        <Text style={styles.eventSub}>{subtitle}</Text>
        <Text style={styles.eventMeta}>{actor} • {time}</Text>
      </View>
    </View>
  );
}

export default function AdminComplaintLifecycleScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.replace("/admin/settings" as never)}>
            <MaterialIcons name="menu" size={22} color="#00236F" />
          </TouchableOpacity>
          <Text style={styles.brand}>Jan Seva Portal</Text>
        </View>
        <TouchableOpacity style={styles.langBtn}>
          <Text style={styles.langText}>English</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.breadcrumb}>Complaints › CMP-2025-00923</Text>
        <Text style={styles.pageTitle}>Lifecycle Audit Trail</Text>
        <Text style={styles.pageSub}>Pothole reporting and street lighting maintenance.</Text>

        <View style={styles.statusRow}>
          <View style={styles.chipPrimary}>
            <MaterialIcons name="schedule" size={14} color="#90A8FF" />
            <Text style={styles.chipPrimaryText}>Active: 48h remaining</Text>
          </View>
          <View style={styles.chipSecondary}>
            <Text style={styles.chipSecondaryText}>IN PROGRESS</Text>
          </View>
        </View>

        <View style={styles.progressCard}>
          <Text style={styles.sectionLabel}>PROCESS MILESTONES</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
          <View style={styles.milestones}>
            <Text style={styles.milestoneDone}>Submitted</Text>
            <Text style={styles.milestoneDone}>Routed</Text>
            <Text style={styles.milestoneDone}>Assigned</Text>
            <Text style={styles.milestoneActive}>In Progress</Text>
            <Text style={styles.milestonePending}>Resolved</Text>
          </View>
        </View>

        <View style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Step-by-Step Lifecycle Log</Text>
          <TimelineItem
            current
            title="Verification & Patching Works Underway"
            subtitle="Current stage: officer action in progress."
            actor="Ward Officer S. Patil"
            time="14 Oct 2025, 10:45 AM"
          />
          <TimelineItem
            title="Complaint Acknowledged & SLA Clock Started"
            subtitle="Materials dispatched for road repair."
            actor="Operator: Central Hub"
            time="13 Oct 2025, 04:30 PM"
          />
          <TimelineItem
            title="Assigned to Ward No. 12 (Public Works)"
            subtitle="Auto-assigned by routing engine."
            actor="System"
            time="13 Oct 2025, 02:15 PM"
          />
          <TimelineItem
            title="Complaint Received via Web Portal"
            subtitle="Citizen submission created."
            actor="Rajesh Kumar"
            time="13 Oct 2025, 02:10 PM"
          />
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/leader" as never)}>
          <MaterialIcons name="dashboard" size={20} color="#444651" />
          <Text style={styles.navText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.navItem, styles.navActive]} onPress={() => router.push("/admin/complaint-lifecycle" as never)}>
          <MaterialIcons name="report-problem" size={20} color="#00714D" />
          <Text style={styles.navTextActive}>Complaints</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/feed" as never)}>
          <MaterialIcons name="rss-feed" size={20} color="#444651" />
          <Text style={styles.navText}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/admin/settings" as never)}>
          <MaterialIcons name="settings" size={20} color="#444651" />
          <Text style={styles.navText}>Admin</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 56,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { color: "#00236F", fontSize: 20, fontWeight: "700" },
  langBtn: { borderWidth: 1, borderColor: "#757682", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  langText: { color: "#444651", fontWeight: "600", fontSize: 12 },
  content: { padding: 16, gap: 10, paddingBottom: 96 },
  breadcrumb: { color: "#757682", fontSize: 11, fontWeight: "600" },
  pageTitle: { color: "#121C28", fontSize: 24, fontWeight: "700" },
  pageSub: { color: "#444651", fontSize: 13 },
  statusRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 4 },
  chipPrimary: { backgroundColor: "#1E3A8A", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, flexDirection: "row", alignItems: "center", gap: 4 },
  chipPrimaryText: { color: "#90A8FF", fontSize: 11, fontWeight: "700" },
  chipSecondary: { backgroundColor: "#6CF8BB", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  chipSecondaryText: { color: "#00714D", fontSize: 11, fontWeight: "700" },
  progressCard: { marginTop: 6, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#C5C5D3", borderRadius: 12, padding: 12, gap: 8 },
  sectionLabel: { color: "#444651", fontSize: 11, fontWeight: "700" },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: "#D9E3F4", overflow: "hidden" },
  progressFill: { width: "75%", height: "100%", backgroundColor: "#00236F" },
  milestones: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  milestoneDone: { color: "#00236F", fontSize: 10, fontWeight: "700" },
  milestoneActive: { color: "#00236F", fontSize: 10, fontWeight: "800" },
  milestonePending: { color: "#757682", fontSize: 10 },
  timelineCard: { marginTop: 6, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#C5C5D3", borderRadius: 12, padding: 12, gap: 10 },
  timelineTitle: { color: "#121C28", fontSize: 18, fontWeight: "700" },
  timelineItem: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  dot: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#006C49", alignItems: "center", justifyContent: "center", marginTop: 8 },
  dotActive: { backgroundColor: "#DCE1FF" },
  eventCard: { flex: 1, borderWidth: 1, borderColor: "#C5C5D3", borderRadius: 10, backgroundColor: "#FFFFFF", padding: 10 },
  eventActive: { borderColor: "#00236F", backgroundColor: "#EEF4FF" },
  eventTitle: { color: "#121C28", fontSize: 14, fontWeight: "700" },
  eventSub: { color: "#444651", fontSize: 12, marginTop: 2 },
  eventMeta: { color: "#757682", fontSize: 11, marginTop: 6 },
  bottomNav: {
    position: "absolute", left: 0, right: 0, bottom: 0, height: 70, borderTopWidth: 1, borderTopColor: "#C5C5D3", backgroundColor: "#FFFFFF",
    flexDirection: "row", justifyContent: "space-around", alignItems: "center", paddingHorizontal: 8,
  },
  navItem: { alignItems: "center", justifyContent: "center", paddingHorizontal: 8, paddingVertical: 3 },
  navActive: { backgroundColor: "#6CF8BB", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 4 },
  navText: { color: "#444651", fontSize: 12, fontWeight: "500" },
  navTextActive: { color: "#00714D", fontSize: 12, fontWeight: "700" },
});
