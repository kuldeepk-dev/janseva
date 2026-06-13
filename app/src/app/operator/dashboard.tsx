import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { logout as logoutApi } from "../../services/authService";
import {
  getOperatorStats,
  getActivityLogs,
  type OperatorStats,
  type ActivityLog,
} from "../../services/operatorService";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useEffect, useState } from "react";

function MetricCard({
  title,
  value,
  color,
  icon,
  accentBg,
}: {
  title: string;
  value: string;
  color: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  accentBg: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View style={styles.metricHead}>
        <View style={[styles.metricIconWrap, { backgroundColor: accentBg }]}>
          <MaterialIcons name={icon} size={20} color={color} />
        </View>
        <View style={styles.metricPulse} />
      </View>
      <View>
        <Text style={styles.metricLabel}>{title}</Text>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

function ActionCard({
  icon,
  iconColor,
  iconBg,
  title,
  body,
  ctaLabel,
  ctaIcon,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  ctaLabel: string;
  ctaIcon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
}) {
  return (
    <View style={styles.actionCard}>
      <View style={styles.actionHead}>
        <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
          <MaterialIcons name={icon} size={24} color={iconColor} />
        </View>
        <View style={styles.actionBadge}>
          <Text style={styles.actionBadgeText}>Core workflow</Text>
        </View>
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionBody}>{body}</Text>
      <TouchableOpacity style={styles.primaryAction} onPress={onPress}>
        <Text style={styles.primaryActionText}>{ctaLabel}</Text>
        <MaterialIcons name={ctaIcon} size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

function QuickActionTile({
  icon,
  label,
  tone,
  danger,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  tone: { bg: string; fg: string };
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickBtn, danger && styles.quickDanger]}
      onPress={onPress}
    >
      <View style={[styles.quickIconWrap, { backgroundColor: tone.bg }]}>
        <MaterialIcons name={icon} size={18} color={tone.fg} />
      </View>
      <Text style={[styles.quickText, danger && styles.quickTextDanger]}>
        {label}
      </Text>
      <MaterialIcons
        name="chevron-right"
        size={18}
        color={danger ? "#BA1A1A" : "#8A8F9B"}
      />
    </TouchableOpacity>
  );
}

function LogItem({ log }: { log: ActivityLog }) {
  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const getLogDisplay = (log: ActivityLog) => {
    const meta = log.metadata || {};
    switch (log.action) {
      case "register_voter":
        return {
          title: `New Voter Registered: ${meta.voter_name || "Unknown"}`,
          desc: `Form ID #${meta.voter_id || "N/A"} | Processed by ${meta.operator_name || "System"}`,
          chip: "Success",
        };
      case "assign_complaint":
        return {
          title: `Complaint Assigned: ${meta.complaint_number || "N/A"}`,
          desc: `Assigned to ${meta.department_name || "Department"} | Priority: ${meta.priority || "normal"}`,
          chip: "Assigned",
        };
      case "create_complaint":
        return {
          title: `Grievance Logged: ${meta.category || "General"}`,
          desc: `Ticket #${meta.complaint_number || "N/A"} | Complainant: ${meta.citizen_name || "Anonymous"}`,
          chip: "Pending",
        };
      case "duplicate_flag":
        return {
          title: `Duplicate Flag: ${meta.voter_name || "Unknown"}`,
          desc: `System identified matching ${meta.match_type || "data"} in ${meta.location || "system"}.`,
          chip: "Critical",
        };
      default:
        return {
          title: log.action.replace(/_/g, " ").toUpperCase(),
          desc: `Entity: ${log.entity_type || "N/A"} | ID: ${log.entity_id || "N/A"}`,
          chip: "Info",
        };
    }
  };

  const display = getLogDisplay(log);

  return (
    <View style={styles.logItem}>
      <View style={styles.logIcon}>
        <MaterialIcons name="history" size={18} color="#006C49" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.logHead}>
          <Text style={styles.logTitle}>{display.title}</Text>
          <Text style={styles.logTime}>{getTimeAgo(log.created_at)}</Text>
        </View>
        <Text style={styles.logDesc}>{display.desc}</Text>
        <View style={styles.logChip}>
          <Text style={styles.logChipText}>{display.chip}</Text>
        </View>
      </View>
    </View>
  );
}

export default function OperatorDashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [stats, setStats] = useState<OperatorStats | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, logsData] = await Promise.all([
        getOperatorStats(),
        getActivityLogs(3),
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch (error) {
      Alert.alert("Error", "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutApi();
    await logout();
  };

  const metricCards = [
    {
      title: "REGISTERED TODAY",
      value: String(stats?.registeredToday || 0),
      color: "#00236F",
      icon: "assignment-ind" as const,
      accentBg: "#DFE9FA",
    },
    {
      title: "COMPLAINTS LOGGED",
      value: String(stats?.complaintsLogged || 0),
      color: "#006C49",
      icon: "assignment-turned-in" as const,
      accentBg: "#DCF8EC",
    },
    {
      title: "WALK-INS SERVED",
      value: String(stats?.walkInsServed || 0),
      color: "#121C28",
      icon: "directions-walk" as const,
      accentBg: "#E8ECF5",
    },
    {
      title: "PENDING TASKS",
      value: String(stats?.pendingTasks || 0).padStart(2, "0"),
      color: "#BA1A1A",
      icon: "schedule" as const,
      accentBg: "#FFE5E5",
    },
  ];

  const quickActions = [
    {
      icon: "assignment" as const,
      label: "Manage Complaints",
      tone: { bg: "#DFE9FA", fg: "#00236F" },
      onPress: () => router.push("/operator/assign" as never),
    },
    {
      icon: "campaign" as const,
      label: "Create Social Draft",
      tone: { bg: "#E6F3EC", fg: "#006C49" },
      onPress: () =>
        router.push(
          {
            pathname: "/leader/post/new",
            params: { draft: "operator" },
          } as never,
        ),
    },
    {
      icon: "list-alt" as const,
      label: "View Complaints",
      tone: { bg: "#EEF4FF", fg: "#264191" },
      onPress: () => router.push("/operator/complaints" as never),
    },
    {
      icon: "logout" as const,
      label: "Logout",
      tone: { bg: "#FFDAD6", fg: "#BA1A1A" },
      danger: true,
      onPress: handleLogout,
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.brandWrap}>
          <View style={styles.brandDot}>
            <MaterialIcons name="account-balance" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.brand}>जन सेवा</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() =>
              Alert.alert("Language", "Language picker coming soon.")
            }
          >
            <MaterialIcons name="translate" size={16} color="#444651" />
            <Text style={styles.langText}>English</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconPill}
            onPress={() => router.push("/operator/profile" as never)}
          >
            <MaterialIcons name="person" size={18} color="#00236F" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Demo-only duplicate detection section: the warning banner, sample search term, and merge/dismiss actions are hardcoded placeholders until live duplicate lookup is wired in. */}
        {/* <View style={styles.alert}>
          <MaterialIcons name="warning" size={18} color="#93000A" />
          <View style={{ flex: 1 }}>
            <Text style={styles.alertTitle}>Duplicate Detection Alert</Text>
            <Text style={styles.alertBody}>
              Search for "Rajesh Kumar" returned exact and partial matches.
              Verify ID before new registration.
            </Text>
            <View style={styles.alertBtns}>
              <TouchableOpacity
                style={styles.mergeBtn}
                onPress={() =>
                  Alert.alert("Merge", "Merge flow is a placeholder.")
                }
              >
                <Text style={styles.mergeText}>Merge Entries</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissBtn}
                onPress={() => Alert.alert("Dismiss", "Alert dismissed.")}
              >
                <Text style={styles.dismissText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View> */}

        <Text style={styles.title}>Operator Dashboard</Text>
        <Text style={styles.subtitle}>
          Constituent Search & Record Management
        </Text>

        {/* <View style={styles.search}>
          <MaterialIcons name="person-search" size={18} color="#757682" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Voter Name, ID, or Phone..."
            placeholderTextColor="#757682"
            defaultValue="Rajesh Kumar"
          />
        </View> */}

        

        <View style={styles.quickActions}>
          {quickActions.map(action => (
            <QuickActionTile
              key={action.label}
              icon={action.icon}
              label={action.label}
              tone={action.tone}
              danger={action.danger}
              onPress={action.onPress}
            />
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#00236F" />
          </View>
        ) : (
          <View style={styles.metricsGrid}>
            {metricCards.map(metric => (
              <MetricCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                color={metric.color}
                icon={metric.icon}
                accentBg={metric.accentBg}
              />
            ))}
          </View>
        )}
<ActionCard
          icon="person-add"
          iconColor="#00714D"
          iconBg="#6CF8BB"
          title="Register New Voter"
          body="Initiate official enrollment for new constituents. Requires Aadhaar and Proof of Residence."
          ctaLabel="New Enrollment"
          ctaIcon="arrow-forward"
          onPress={() => router.push("/register" as never)}
        />

        <ActionCard
          icon="edit-note"
          iconColor="#264191"
          iconBg="#DCE1FF"
          title="Log Walk-in Complaint"
          body="Create a grievance ticket for citizens visiting the office. Priority tags available."
          ctaLabel="Open Ticket"
          ctaIcon="support-agent"
          onPress={() => router.push("/operator/complaints/new" as never)}
        />

        
        <View style={styles.logWrap}>
          <View style={styles.logHeader}>
            <Text style={styles.logHeaderTitle}>Recent Activity Log</Text>
            <TouchableOpacity onPress={loadData}>
              <Text style={styles.viewAll}>Refresh</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.logLoading}>
              <ActivityIndicator size="small" color="#00236F" />
            </View>
          ) : logs.length === 0 ? (
            <View style={styles.logEmpty}>
              <Text style={styles.logEmptyText}>No recent activity</Text>
            </View>
          ) : (
            logs.map(log => <LogItem key={log.id} log={log} />)
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#00236F", fontSize: 20, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  langBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langText: { color: "#444651", fontSize: 14, fontWeight: "600" },
  iconPill: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#D7DBE7",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 14, paddingBottom: 100 },
  alert: {
    borderWidth: 1,
    borderColor: "#BA1A1A",
    backgroundColor: "#FFDAD6",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
  },
  alertTitle: { color: "#93000A", fontSize: 16, fontWeight: "700" },
  alertBody: { marginTop: 2, color: "#93000A", fontSize: 13, lineHeight: 18 },
  alertBtns: { flexDirection: "row", gap: 8, marginTop: 8 },
  mergeBtn: {
    backgroundColor: "#BA1A1A",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  mergeText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  dismissBtn: {
    borderWidth: 1,
    borderColor: "#BA1A1A",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  dismissText: { color: "#BA1A1A", fontSize: 12, fontWeight: "700" },
  title: { fontSize: 30, color: "#00236F", fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#444651" },
  search: {
    height: 50,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: { flex: 1, color: "#121C28", fontSize: 14 },
  actionCard: {
    borderWidth: 1,
    borderColor: "#D7DFEF",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 12,
    shadowColor: "#00236F",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  actionHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#EEF4FF",
  },
  actionBadgeText: {
    color: "#00236F",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
  },
  actionTitle: {
    fontSize: 20,
    color: "#121C28",
    fontWeight: "700",
    lineHeight: 24,
  },
  actionBody: { color: "#444651", fontSize: 13, lineHeight: 19 },
  primaryAction: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#00236F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 2,
  },
  primaryActionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickBtn: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#D7DFEF",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 14,
    minHeight: 108,
    justifyContent: "space-between",
    gap: 8,
    shadowColor: "#00236F",
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  quickDanger: { backgroundColor: "#FFF7F6", borderColor: "#FFD6D0" },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  quickText: {
    color: "#121C28",
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 17,
    flex: 1,
  },
  quickTextDanger: { color: "#BA1A1A" },
  metricCard: {
    borderWidth: 1,
    borderColor: "#D7DFEF",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 14,
    width: "48%",
    minHeight: 132,
    gap: 12,
    shadowColor: "#00236F",
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3,
  },
  metricLabel: {
    fontSize: 11,
    color: "#444651",
    fontWeight: "800",
    letterSpacing: 0.7,
  },
  metricValue: { fontSize: 32, fontWeight: "700", marginTop: 6, lineHeight: 34 },
  metricHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  metricPulse: {
    width: 18,
    height: 8,
    borderRadius: 999,
    backgroundColor: "#DFE9FA",
  },
  logWrap: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  logHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: "#EEF4FF",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logHeaderTitle: { fontSize: 18, color: "#121C28", fontWeight: "600" },
  viewAll: { color: "#00236F", fontSize: 13, fontWeight: "600" },
  logItem: {
    flexDirection: "row",
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  logIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  logHead: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  logTitle: { flex: 1, color: "#121C28", fontSize: 13, fontWeight: "700" },
  logTime: { color: "#757682", fontSize: 11 },
  logDesc: { marginTop: 3, color: "#444651", fontSize: 12, lineHeight: 17 },
  logChip: {
    marginTop: 6,
    alignSelf: "flex-start",
    borderRadius: 99,
    backgroundColor: "#E5EEFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  logChipText: {
    color: "#264191",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  logLoading: {
    padding: 20,
    alignItems: "center",
  },
  logEmpty: {
    padding: 20,
    alignItems: "center",
  },
  logEmptyText: {
    color: "#757682",
    fontSize: 14,
  },
});
