import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function StatCard({
  icon,
  label,
  value,
  valueColor,
  urgent,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  valueColor: string;
  urgent?: boolean;
}) {
  return (
    <View style={[styles.statCard, urgent && styles.statCardUrgent]}>
      <View style={styles.statHead}>
        <View style={[styles.statIconWrap, urgent && styles.statIconUrgent]}>
          <MaterialIcons
            name={icon}
            size={20}
            color={urgent ? "#BA1A1A" : "#00236F"}
          />
        </View>
        {urgent ? <Text style={styles.urgentTag}>URGENT</Text> : null}
      </View>
      <Text style={[styles.statLabel, urgent && { color: "#93000A" }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function ActivityItem({
  icon,
  title,
  desc,
  time,
  tone = "default",
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  desc: string;
  time: string;
  tone?: "default" | "good" | "warn";
}) {
  const toneColor =
    tone === "good" ? "#6CF8BB" : tone === "warn" ? "#FFDAD6" : "#DCE1FF";
  const iconColor =
    tone === "good" ? "#00714D" : tone === "warn" ? "#BA1A1A" : "#00236F";
  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIconWrap, { backgroundColor: toneColor }]}>
        <MaterialIcons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityDesc}>{desc}</Text>
        <Text style={styles.activityTime}>{time}</Text>
      </View>
    </View>
  );
}

export default function OfficerDashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => Alert.alert("Menu", "Menu options coming soon.")}
          >
            <MaterialIcons name="menu" size={22} color="#00236F" />
          </TouchableOpacity>
          <Text style={styles.brand}>Jan Seva Portal</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.lang}>English</Text>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={20} color="#FFFFFF" />
          </View>
          <TouchableOpacity
            onPress={() => {
              logout();
              router.replace("/login" as never);
            }}
          >
            <MaterialIcons name="logout" size={20} color="#BA1A1A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.welcome}>
          <Text style={styles.officerName}>Officer Vikram Singh</Text>
          <Text style={styles.officerMeta}>Department Officer • West Zone</Text>
        </View>

        <View style={styles.statsGrid}>
          <StatCard
            icon="assignment-ind"
            label="Assigned to me"
            value="24"
            valueColor="#00236F"
          />
          <StatCard
            icon="warning"
            label="Due today"
            value="08"
            valueColor="#BA1A1A"
            urgent
          />
          <StatCard
            icon="check-circle"
            label="Resolved this month"
            value="142"
            valueColor="#121C28"
          />
          <StatCard
            icon="speed"
            label="Avg resolution time"
            value="4.2h"
            valueColor="#121C28"
          />
        </View>

        <View style={styles.queueCard}>
          <View style={styles.queueHead}>
            <Text style={styles.queueTitle}>Complaint Queue</Text>
            <TouchableOpacity
              style={styles.filterBtn}
              onPress={() => Alert.alert("Filter", "Filtering coming soon.")}
            >
              <MaterialIcons name="filter-list" size={16} color="#00236F" />
              <Text style={styles.filterText}>Filter</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.queueRow, styles.queueOverdue]}
            onPress={() => router.push("/officer/complaint/JSP-9821" as never)}
          >
            <View style={styles.queueColMain}>
              <Text style={styles.queueId}>#JSP-9821</Text>
              <Text style={styles.queueCat}>Sanitation & Drainage</Text>
            </View>
            <View style={styles.queueColRight}>
              <Text style={styles.queueBadgeCritical}>CRITICAL</Text>
              <Text style={styles.queueSlaBad}>Overdue • 14h Exceeded</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.queueRow}
            onPress={() => router.push("/officer/complaint/JSP-9844" as never)}
          >
            <View style={styles.queueColMain}>
              <Text style={styles.queueId}>#JSP-9844</Text>
              <Text style={styles.queueCat}>Street Lighting</Text>
            </View>
            <View style={styles.queueColRight}>
              <Text style={styles.queueBadgeHigh}>HIGH</Text>
              <Text style={styles.queueSla}>3h 20m left</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.queueRow}
            onPress={() => router.push("/officer/complaint/JSP-9902" as never)}
          >
            <View style={styles.queueColMain}>
              <Text style={styles.queueId}>#JSP-9902</Text>
              <Text style={styles.queueCat}>Water Supply Issue</Text>
            </View>
            <View style={styles.queueColRight}>
              <Text style={styles.queueBadgeMedium}>MEDIUM</Text>
              <Text style={styles.queueSla}>22h 15m left</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewAllBtn}
            onPress={() => Alert.alert("Queue", "Full queue list coming soon.")}
          >
            <Text style={styles.viewAllText}>View All 24 Complaints</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.activitySection}>
          <Text style={styles.activityHeader}>Recent Actions</Text>
          <ActivityItem
            icon="task-alt"
            tone="good"
            title="Resolved Complaint #JSP-9755"
            desc="Pothole repair verified at Station Road. Documentation uploaded."
            time="15 mins ago"
          />
          <ActivityItem
            icon="chat"
            title="Added Internal Note to #JSP-9844"
            desc="Requesting field team to visit site for luminaire assessment."
            time="2 hours ago"
          />
          <ActivityItem
            icon="priority-high"
            tone="warn"
            title="Escalated Complaint #JSP-9821"
            desc="Reason: Delayed departmental approval for equipment rental."
            time="5 hours ago"
          />
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, styles.navActive]}
          onPress={() => router.push("/officer" as never)}
        >
          <MaterialIcons name="home" size={20} color="#00714D" />
          <Text style={styles.navActiveText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => Alert.alert("Queue", "Queue view coming soon.")}
        >
          <MaterialIcons name="assignment" size={20} color="#444651" />
          <Text style={styles.navText}>Queue</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => Alert.alert("Stats", "Stats view coming soon.")}
        >
          <MaterialIcons name="analytics" size={20} color="#444651" />
          <Text style={styles.navText}>Stats</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => Alert.alert("Profile", "Profile view coming soon.")}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  brand: { color: "#00236F", fontSize: 22, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  lang: { color: "#00236F", fontSize: 14, fontWeight: "600" },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 14, paddingBottom: 110 },
  welcome: { marginBottom: 2 },
  officerName: { color: "#121C28", fontSize: 20, fontWeight: "600" },
  officerMeta: { color: "#444651", fontSize: 14 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "48.6%",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    minHeight: 132,
    justifyContent: "space-between",
  },
  statCardUrgent: { backgroundColor: "#FFDAD6", borderColor: "#BA1A1A" },
  statHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DCE1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  statIconUrgent: { backgroundColor: "#FFFFFF" },
  urgentTag: {
    backgroundColor: "#BA1A1A",
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 99,
  },
  statLabel: { color: "#444651", fontSize: 12, marginTop: 6 },
  statValue: { fontSize: 34, fontWeight: "700", marginTop: 2 },
  queueCard: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  queueHead: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    backgroundColor: "#EEF4FF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  queueTitle: { fontSize: 19, color: "#121C28", fontWeight: "600" },
  filterBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  filterText: { color: "#00236F", fontSize: 13, fontWeight: "600" },
  queueRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  queueOverdue: { backgroundColor: "#FFECEC" },
  queueColMain: { flex: 1 },
  queueId: { color: "#121C28", fontSize: 14, fontWeight: "700" },
  queueCat: { color: "#444651", fontSize: 12, marginTop: 2 },
  queueColRight: { alignItems: "flex-end", gap: 4 },
  queueBadgeCritical: {
    backgroundColor: "#BA1A1A",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  queueBadgeHigh: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    fontSize: 10,
    fontWeight: "700",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  queueBadgeMedium: {
    backgroundColor: "#DBEAFE",
    color: "#1E40AF",
    fontSize: 10,
    fontWeight: "700",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  queueSlaBad: { color: "#BA1A1A", fontSize: 11, fontWeight: "700" },
  queueSla: { color: "#444651", fontSize: 11 },
  viewAllBtn: { padding: 12, backgroundColor: "#EEF4FF", alignItems: "center" },
  viewAllText: {
    color: "#00236F",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  activitySection: { gap: 10 },
  activityHeader: { color: "#121C28", fontSize: 20, fontWeight: "600" },
  activityItem: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    flexDirection: "row",
    gap: 10,
  },
  activityIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  activityTitle: { color: "#121C28", fontSize: 14, fontWeight: "600" },
  activityDesc: {
    color: "#444651",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 2,
  },
  activityTime: { color: "#757682", fontSize: 11, marginTop: 4 },
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
