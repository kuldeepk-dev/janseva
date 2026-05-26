import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
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

function MetricCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.metricCard}>
      <View>
        <Text style={styles.metricLabel}>{title}</Text>
        <Text style={[styles.metricValue, { color }]}>{value}</Text>
      </View>
      <View style={styles.metricIcon} />
    </View>
  );
}

function LogItem({
  title,
  time,
  desc,
  chip,
}: {
  title: string;
  time: string;
  desc: string;
  chip: string;
}) {
  return (
    <View style={styles.logItem}>
      <View style={styles.logIcon}>
        <MaterialIcons name="history" size={18} color="#006C49" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.logHead}>
          <Text style={styles.logTitle}>{title}</Text>
          <Text style={styles.logTime}>{time}</Text>
        </View>
        <Text style={styles.logDesc}>{desc}</Text>
        <View style={styles.logChip}>
          <Text style={styles.logChipText}>{chip}</Text>
        </View>
      </View>
    </View>
  );
}

export default function OperatorDashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();

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
          <View style={styles.avatar} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.alert}>
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
        </View>

        <Text style={styles.title}>Operator Dashboard</Text>
        <Text style={styles.subtitle}>
          Constituent Search & Record Management
        </Text>

        <View style={styles.search}>
          <MaterialIcons name="person-search" size={18} color="#757682" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search Voter Name, ID, or Phone..."
            placeholderTextColor="#757682"
            defaultValue="Rajesh Kumar"
          />
        </View>

        <View style={styles.actionCard}>
          <View style={styles.actionHead}>
            <View style={[styles.actionIcon, { backgroundColor: "#6CF8BB" }]}>
              <MaterialIcons name="person-add" size={24} color="#00714D" />
            </View>
            <Text style={styles.actionTitle}>Register New Voter</Text>
          </View>
          <Text style={styles.actionBody}>
            Initiate official enrollment for new constituents. Requires Aadhaar
            and Proof of Residence.
          </Text>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => router.push("/register" as never)}
          >
            <Text style={styles.primaryActionText}>New Enrollment</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionCard}>
          <View style={styles.actionHead}>
            <View style={[styles.actionIcon, { backgroundColor: "#DCE1FF" }]}>
              <MaterialIcons name="edit-note" size={24} color="#264191" />
            </View>
            <Text style={styles.actionTitle}>Log Walk-in Complaint</Text>
          </View>
          <Text style={styles.actionBody}>
            Create a grievance ticket for citizens visiting the office. Priority
            tags available.
          </Text>
          <TouchableOpacity
            style={styles.primaryAction}
            onPress={() => router.push("/complaints/new" as never)}
          >
            <Text style={styles.primaryActionText}>Open Ticket</Text>
            <MaterialIcons name="support-agent" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push("/operator/assign" as never)}
          >
            <MaterialIcons name="assignment" size={18} color="#00236F" />
            <Text style={styles.quickText}>Assign Complaint</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() =>
              router.push({
                pathname: "/leader/post/new",
                params: { draft: "operator" },
              } as never)
            }
          >
            <MaterialIcons name="campaign" size={18} color="#00236F" />
            <Text style={styles.quickText}>Create Social Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push("/complaints" as never)}
          >
            <MaterialIcons name="list-alt" size={18} color="#00236F" />
            <Text style={styles.quickText}>View Complaints</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => {
              logout();
              router.replace("/login" as never);
            }}
          >
            <MaterialIcons name="logout" size={18} color="#BA1A1A" />
            <Text style={styles.quickText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard title="REGISTERED TODAY" value="24" color="#00236F" />
          <MetricCard title="COMPLAINTS LOGGED" value="12" color="#006C49" />
          <MetricCard title="WALK-INS SERVED" value="45" color="#121C28" />
          <MetricCard title="PENDING TASKS" value="08" color="#BA1A1A" />
        </View>

        <View style={styles.logWrap}>
          <View style={styles.logHeader}>
            <Text style={styles.logHeaderTitle}>Recent Activity Log</Text>
            <TouchableOpacity
              onPress={() =>
                Alert.alert("Activity Log", "Full log view is a placeholder.")
              }
            >
              <Text style={styles.viewAll}>View All</Text>
            </TouchableOpacity>
          </View>
          <LogItem
            title="New Voter Registered: Anita Sharma"
            time="2 mins ago"
            desc="Form ID #V-90218 | Processed by Sandeep Patil (SID: 4829)"
            chip="Success"
          />
          <LogItem
            title="Duplicate Flag: Rahul Mehra"
            time="15 mins ago"
            desc="System identified matching mobile number in Ward 04."
            chip="Critical"
          />
          <LogItem
            title="Grievance Logged: Water Leakage"
            time="42 mins ago"
            desc="Ticket #GR-2024-88 | Complainant: Sunil G."
            chip="Pending"
          />
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
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DFE9FA",
  },
  content: { padding: 16, gap: 14, paddingBottom: 24 },
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
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 10,
  },
  actionHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { fontSize: 20, color: "#121C28", fontWeight: "600", flex: 1 },
  actionBody: { color: "#444651", fontSize: 13, lineHeight: 18 },
  primaryAction: {
    height: 46,
    borderRadius: 8,
    backgroundColor: "#00236F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryActionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  metricsGrid: { gap: 10 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  quickBtn: {
    width: "48.6%",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    gap: 6,
  },
  quickText: { color: "#121C28", fontSize: 12, fontWeight: "600" },
  metricCard: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 11,
    color: "#444651",
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  metricValue: { fontSize: 28, fontWeight: "700", marginTop: 2 },
  metricIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
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
});
