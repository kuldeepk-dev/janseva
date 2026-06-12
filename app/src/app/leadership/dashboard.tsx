import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiConfigError } from "../../lib/api";
import {
  getAllComplaints,
  type Complaint,
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

function MetricCard({
  icon,
  title,
  value,
  subtitle,
  trend,
  critical,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  critical?: boolean;
}) {
  return (
    <View style={[styles.metricCard, critical && styles.metricCritical]}>
      <View style={styles.metricHead}>
        <View
          style={[
            styles.metricIconWrap,
            critical && { backgroundColor: "#FFDAD6" },
          ]}
        >
          <MaterialIcons
            name={icon}
            size={20}
            color={critical ? "#BA1A1A" : "#00236F"}
          />
        </View>
        {trend ? (
          <Text style={[styles.metricTrend, critical && { color: "#BA1A1A" }]}>
            {trend}
          </Text>
        ) : null}
      </View>
      <Text style={styles.metricLabel}>{title}</Text>
      <Text style={[styles.metricValue, critical && { color: "#BA1A1A" }]}>
        {value}
      </Text>
      {subtitle ? <Text style={styles.metricSub}>{subtitle}</Text> : null}
    </View>
  );
}

function QueueItem({
  badge,
  title,
  desc,
  onPress,
}: {
  badge: string;
  title: string;
  desc: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.queueItem} onPress={onPress}>
      <View style={styles.queueIcon}>
        <MaterialIcons name="priority-high" size={20} color="#BA1A1A" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.queueBadge}>
          <Text style={styles.queueBadgeText}>{badge}</Text>
        </View>
        <Text style={styles.queueTitle}>{title}</Text>
        <Text style={styles.queueDesc}>{desc}</Text>
      </View>
      <TouchableOpacity
        style={styles.approveBtn}
        onPress={() =>
          Alert.alert("Approve", "Approval workflow is a placeholder.")
        }
      >
        <Text style={styles.approveText}>Approve Action</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function LeadershipDashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [stats, setStats] = useState({
    total: 0,
    resolved: 0,
    overdue: 0,
    escalated: 0,
  });
  const [criticalQueue, setCriticalQueue] = useState<Complaint[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (apiConfigError) {
        setError(apiConfigError);
        return;
      }
      try {
        const complaints = await getAllComplaints();
        if (!isActive) {
          return;
        }
        const total = complaints.length;
        const resolved = complaints.filter(
          item => item.status === "resolved",
        ).length;
        const overdue = complaints.filter(item => {
          if (!item.expected_resolution_at) {
            return false;
          }
          return new Date(item.expected_resolution_at) < new Date();
        }).length;
        const escalated = complaints.filter(
          item => item.status === "escalated",
        );
        setStats({ total, resolved, overdue, escalated: escalated.length });
        setCriticalQueue(escalated.slice(0, 3));
      } catch (err) {
        if (!isActive) {
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to load.";
        setError(message);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.seal} />
          <Text style={styles.brand}>Swaraj Portal</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() =>
              Alert.alert("Language", "Language picker coming soon.")
            }
          >
            <MaterialIcons name="language" size={18} color="#00236F" />
            <Text style={styles.langText}>English</Text>
          </TouchableOpacity>
          <View style={styles.adminAvatar}>
            <MaterialIcons name="badge" size={18} color="#444651" />
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
        <Text style={styles.title}>Leadership Command Center</Text>
        <View style={styles.locRow}>
          <MaterialIcons name="location-on" size={16} color="#444651" />
          <Text style={styles.locText}>
            Constituency 042 • Real-time Monitoring
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.metricsGrid}>
          <MetricCard
            icon="description"
            title="Total Complaints"
            value={stats.total.toString()}
            trend="+12%"
          />
          <MetricCard
            icon="check-circle"
            title="Resolved"
            value={stats.resolved.toString()}
            subtitle="76% Completion Rate"
          />
          <MetricCard
            icon="priority-high"
            title="Overdue Items"
            value={stats.overdue.toString()}
            subtitle="Needs immediate attention"
            critical
          />
          <MetricCard
            icon="campaign"
            title="Escalated"
            value={stats.escalated.toString()}
            subtitle="Leadership review queue"
          />
          <MetricCard
            icon="person-add"
            title="Voters Registered"
            value="124.5k"
            subtitle="Growth: 2.1k this month"
          />
        </View>

        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() =>
            Alert.alert("Export", "Report export is a placeholder.")
          }
        >
          <MaterialIcons name="download" size={18} color="#FFFFFF" />
          <Text style={styles.exportText}>Export Report</Text>
        </TouchableOpacity>

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>30-Day Complaint Trends</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#00236F" }]}
              />
              <Text style={styles.legendText}>Submitted</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: "#006C49" }]}
              />
              <Text style={styles.legendText}>Resolved</Text>
            </View>
          </View>
          <View style={styles.chartPlaceholder}>
            <View style={styles.waveBlue} />
            <View style={styles.waveGreen} />
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Department Efficiency</Text>
          <View style={styles.depRow}>
            <Text style={styles.depName}>Public Works</Text>
            <Text style={styles.depRate}>92% rate</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barPrimary, { width: "45%" }]} />
            <View style={[styles.barSecondary, { width: "47%" }]} />
          </View>
          <Text style={styles.depSub}>45% Volume • 320 Active cases</Text>

          <View style={styles.depRow}>
            <Text style={styles.depName}>Sanitation</Text>
            <Text style={styles.depRate}>64% rate</Text>
          </View>
          <View style={styles.barTrack}>
            <View style={[styles.barPrimary, { width: "30%" }]} />
            <View style={[styles.barSecondary, { width: "19%" }]} />
            <View style={[styles.barError, { width: "51%" }]} />
          </View>
          <Text style={styles.depSub}>30% Volume • 110 Overdue</Text>
        </View>

        <View style={styles.queueCard}>
          <View style={styles.queueHead}>
            <View>
              <Text style={styles.queueHeadTitle}>
                Critical Attention Queue
              </Text>
              <Text style={styles.queueHeadSub}>
                Operator-escalated complaints awaiting leadership review
              </Text>
            </View>
            <Text style={styles.viewAll}>View All Queue</Text>
          </View>
          {criticalQueue.length ? (
            criticalQueue.map(item => (
              <QueueItem
                key={item.id}
                badge="Escalated"
                title={item.category ?? "Complaint"}
                desc={
                  item.description ??
                  "Operator escalated this complaint for leadership review."
                }
                onPress={() => router.push(`/complaints/${item.id}` as never)}
              />
            ))
          ) : (
            <View style={styles.emptyQueue}>
              <Text style={styles.queueDesc}>
                No escalated complaints are waiting for leadership review.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/leader/post/new" as never)}
      >
        <MaterialIcons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, styles.navActive]}
          onPress={() => router.push("/leader" as never)}
        >
          <MaterialIcons name="dashboard" size={20} color="#002113" />
          <Text style={styles.navActiveText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/admin/whatsapp" as never)}
        >
          <MaterialIcons name="campaign" size={20} color="#444651" />
          <Text style={styles.navText}>Broadcast</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/feed" as never)}
        >
          <MaterialIcons name="share" size={20} color="#444651" />
          <Text style={styles.navText}>Social</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.replace("/admin/whatsapp" as never)}
        >
          <MaterialIcons name="menu" size={20} color="#444651" />
          <Text style={styles.navText}>Menu</Text>
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  seal: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#1E3A8A" },
  brand: { color: "#00236F", fontSize: 22, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  langBtn: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  langText: { color: "#00236F", fontSize: 13, fontWeight: "600" },
  adminAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DFE9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 12, paddingBottom: 108 },
  title: { color: "#121C28", fontSize: 30, fontWeight: "700" },
  locRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  locText: { color: "#444651", fontSize: 13 },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  exportBtn: {
    marginTop: 4,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#00236F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  exportText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  metricCard: {
    width: "48.6%",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    minHeight: 132,
    gap: 6,
  },
  metricCritical: { backgroundColor: "#FFF1F1", borderColor: "#FFDAD6" },
  metricHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCE1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  metricTrend: { color: "#006C49", fontSize: 11, fontWeight: "700" },
  metricLabel: { color: "#444651", fontSize: 12 },
  metricValue: {
    color: "#121C28",
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 34,
  },
  metricSub: { color: "#444651", fontSize: 11 },
  chartCard: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 10,
  },
  sectionTitle: { color: "#121C28", fontSize: 20, fontWeight: "600" },
  legendRow: { flexDirection: "row", gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: "#444651", fontSize: 12 },
  chartPlaceholder: {
    height: 180,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    overflow: "hidden",
    justifyContent: "flex-end",
    padding: 10,
  },
  waveBlue: {
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00236F",
    opacity: 0.25,
    marginBottom: 8,
  },
  waveGreen: {
    height: 24,
    borderRadius: 12,
    backgroundColor: "#006C49",
    opacity: 0.3,
  },
  depRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  depName: { color: "#121C28", fontSize: 13, fontWeight: "700" },
  depRate: { color: "#444651", fontSize: 12 },
  barTrack: {
    flexDirection: "row",
    gap: 1,
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: "#DFE9FA",
    marginTop: 5,
  },
  barPrimary: { backgroundColor: "#00236F", height: "100%" },
  barSecondary: { backgroundColor: "#006C49", height: "100%" },
  barError: { backgroundColor: "#BA1A1A", height: "100%" },
  depSub: { color: "#444651", fontSize: 10, marginTop: 3 },
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
    backgroundColor: "#F8F9FF",
    gap: 4,
  },
  queueHeadTitle: { color: "#121C28", fontSize: 18, fontWeight: "600" },
  queueHeadSub: { color: "#444651", fontSize: 12 },
  viewAll: { color: "#00236F", fontSize: 12, fontWeight: "700", marginTop: 2 },
  queueItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  queueIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#FFDAD6",
    alignItems: "center",
    justifyContent: "center",
  },
  queueBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFE5E5",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
  },
  queueBadgeText: {
    color: "#BA1A1A",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  queueTitle: { color: "#121C28", fontSize: 14, fontWeight: "700" },
  queueDesc: { color: "#444651", fontSize: 12, marginTop: 2 },
  emptyQueue: { padding: 12 },
  approveBtn: {
    backgroundColor: "#00236F",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  approveText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  fab: {
    position: "absolute",
    right: 18,
    bottom: 90,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#00236F",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
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
  navActiveText: { color: "#002113", fontSize: 12, fontWeight: "700" },
});
