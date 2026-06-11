import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOfficerQueue, getOfficerStats } from "../../services/officerService";
import type { Complaint } from "../../services/complaintService";
import { useAuth } from "../../context/AuthContext";

function StatCard({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
  valueColor: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHead}>
        <View style={styles.statIconWrap}>
          <MaterialIcons name={icon} size={20} color="#00236F" />
        </View>
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

function QueueCard({ item, onPress }: { item: Complaint; onPress: () => void }) {
  const priority = item.priority ?? "normal";
  const priorityLabel =
    priority === "critical" ? "Critical" : priority === "urgent" ? "Urgent" : "Normal";
  const badgeStyle =
    priority === "critical"
      ? styles.queueBadgeCritical
      : priority === "urgent"
        ? styles.queueBadgeHigh
        : styles.queueBadgeMedium;
  return (
    <TouchableOpacity style={styles.queueRow} onPress={onPress}>
      <View style={styles.queueColMain}>
        <Text style={styles.queueId}>{item.complaint_number ?? item.id}</Text>
        <Text style={styles.queueCat}>{item.category ?? "Uncategorized"}</Text>
        <Text style={styles.queueMeta}>
          {item.sub_category ?? "No sub-category"} · {item.status ?? "unassigned"}
        </Text>
      </View>
      <View style={styles.queueColRight}>
        <Text style={badgeStyle}>{priorityLabel.toUpperCase()}</Text>
        <Text style={styles.queueSla}>
          {item.expected_resolution_at
            ? `Due ${new Date(item.expected_resolution_at).toLocaleDateString()}`
            : "No due date"}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function OfficerDashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [stats, setStats] = useState<{ assigned: number; dueToday: number; resolvedMonth: number } | null>(null);
  const [queue, setQueue] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        const [statsData, queueData] = await Promise.all([getOfficerStats(), getOfficerQueue()]);
        if (!isActive) return;
        setStats(statsData);
        setQueue(queueData);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
      } finally {
        if (isActive) setIsLoading(false);
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
          <TouchableOpacity onPress={() => Alert.alert("Menu", "Menu options coming soon.")}>
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

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>Officer Workspace</Text>
              <Text style={styles.officerName}>Live complaint control center</Text>
              <Text style={styles.officerMeta}>
                Review active complaints, due work, and department load in one place.
              </Text>
            </View>
            <View style={styles.heroBadge}>
              <MaterialIcons name="verified" size={18} color="#00714D" />
              <Text style={styles.heroBadgeText}>Online</Text>
            </View>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isLoading ? <Text style={styles.muted}>Loading dashboard...</Text> : null}

        <View style={styles.statsGrid}>
          <StatCard icon="assignment-ind" label="Assigned to me" value={String(stats?.assigned ?? 0)} valueColor="#00236F" />
          <StatCard icon="warning" label="Due today" value={String(stats?.dueToday ?? 0)} valueColor="#BA1A1A" />
          <StatCard icon="check-circle" label="Resolved this month" value={String(stats?.resolvedMonth ?? 0)} valueColor="#121C28" />
          <StatCard icon="speed" label="Open queue" value={String(queue.filter(item => item.status !== "resolved" && item.status !== "closed").length)} valueColor="#121C28" />
        </View>

        <View style={styles.queueCard}>
          <View style={styles.queueHead}>
            <View>
              <Text style={styles.queueTitle}>My Queue</Text>
              <Text style={styles.queueSubtitle}>
                Complaints currently assigned to your account or department.
              </Text>
            </View>
            <View style={styles.queueCountPill}>
              <Text style={styles.queueCountPillText}>{queue.length}</Text>
            </View>
          </View>

          {queue.length ? (
            queue.map(item => (
              <QueueCard
                key={item.id}
                item={item}
                onPress={() => router.push(`/officer/complaint/${item.id}` as never)}
              />
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialIcons name="inbox" size={28} color="#90A8FF" />
              <Text style={styles.emptyText}>No assigned complaints found.</Text>
              <Text style={styles.emptySubtext}>
                Once complaints are routed to you or your department, they will appear here.
              </Text>
            </View>
          )}
        </View>
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
  hero: {
    borderRadius: 18,
    backgroundColor: "#EAF0FF",
    borderWidth: 1,
    borderColor: "#C9D6FF",
    padding: 16,
  },
  heroTopRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  heroCopy: { flex: 1 },
  kicker: {
    color: "#264191",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  officerName: { color: "#121C28", fontSize: 20, fontWeight: "600" },
  officerMeta: { color: "#444651", fontSize: 14, marginTop: 4, lineHeight: 20 },
  heroBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D9F7E8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  heroBadgeText: { color: "#00714D", fontSize: 11, fontWeight: "700" },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  muted: { color: "#444651", fontSize: 14 },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
  },
  statCard: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 14,
    minHeight: 126,
    justifyContent: "space-between",
  },
  statHead: {
    flexDirection: "row",
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
  statLabel: { color: "#444651", fontSize: 12, marginTop: 6, minHeight: 30, lineHeight: 16 },
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
  queueTitle: { fontSize: 19, color: "#121C28", fontWeight: "700" },
  queueSubtitle: { color: "#444651", fontSize: 12, marginTop: 2 },
  queueCountPill: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  queueCountPillText: { color: "#00236F", fontSize: 13, fontWeight: "800" },
  queueRow: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  queueColMain: { flex: 1 },
  queueId: { color: "#121C28", fontSize: 14, fontWeight: "700" },
  queueCat: { color: "#444651", fontSize: 12, marginTop: 2 },
  queueMeta: { color: "#757682", fontSize: 11, marginTop: 2 },
  queueColRight: { alignItems: "flex-end", gap: 4 },
  queueBadgeMedium: {
    backgroundColor: "#DBEAFE",
    color: "#1E40AF",
    fontSize: 10,
    fontWeight: "700",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
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
  queueSla: { color: "#444651", fontSize: 11 },
  emptyState: {
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { color: "#757682", fontSize: 12, fontStyle: "italic", textAlign: "center" },
  emptySubtext: {
    color: "#8C8E99",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
});
