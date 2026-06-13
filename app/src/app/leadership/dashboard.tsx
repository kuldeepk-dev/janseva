import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiConfigError } from "../../lib/api";
import {
  getActivityLogs,
  getOperatorStats,
  type ActivityLog,
  type OperatorStats,
} from "../../services/operatorService";
import {
  getAllComplaints,
  getDepartments,
  type Department,
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
  fullWidth,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  value: string;
  subtitle?: string;
  trend?: string;
  critical?: boolean;
  fullWidth?: boolean;
}) {
  return (
    <View
      style={[
        styles.metricCard,
        fullWidth && styles.metricCardFull,
        critical && styles.metricCritical,
      ]}
    >
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
            Alert.alert("Approve", "Approval workflow coming soon.")
          }
        >
        <Text style={styles.approveText}>Approve Action</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function OperatorLogItem({ log }: { log: ActivityLog }) {
  const meta = log.metadata || {};
  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins} mins ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} hours ago`;
    return `${Math.floor(hours / 24)} days ago`;
  };

  const display =
    log.action === "register_voter"
      ? {
          title: `Registered ${meta.voter_name || "new voter"}`,
          desc: `Processed by ${meta.operator_name || "System"}`,
        }
      : log.action === "assign_complaint"
        ? {
            title: `Assigned complaint ${meta.complaint_number || "N/A"}`,
            desc: `Department: ${meta.department_name || "N/A"} | Priority: ${meta.priority || "normal"}`,
          }
        : log.action === "create_complaint"
          ? {
              title: `Logged grievance ${meta.category || "General"}`,
              desc: `Ticket #${meta.complaint_number || "N/A"}`,
            }
          : {
              title: log.action.replace(/_/g, " "),
              desc: `Entity: ${log.entity_type || "N/A"}`,
            };

  return (
    <View style={styles.operatorLogItem}>
      <View style={styles.operatorLogIcon}>
        <MaterialIcons name="history" size={18} color="#006C49" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.operatorLogHead}>
          <Text style={styles.operatorLogTitle}>{display.title}</Text>
          <Text style={styles.operatorLogTime}>{getTimeAgo(log.created_at)}</Text>
        </View>
        <Text style={styles.operatorLogDesc}>{display.desc}</Text>
      </View>
    </View>
  );
}

function isResolvedStatus(status: Complaint["status"]) {
  return status === "resolved" || status === "closed";
}

function startOfDay(date: Date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDayLabel(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
}

export default function LeadershipDashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [operatorStats, setOperatorStats] = useState<OperatorStats | null>(null);
  const [operatorLogs, setOperatorLogs] = useState<ActivityLog[]>([]);
  const [criticalQueue, setCriticalQueue] = useState<Complaint[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [operatorError, setOperatorError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setError(null);
      if (apiConfigError) {
        setError(apiConfigError);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const [complaintData, departmentData] = await Promise.all([
          getAllComplaints(),
          getDepartments(),
        ]);
        if (!isActive) {
          return;
        }
        setComplaints(complaintData);
        setDepartments(departmentData);
        const escalated = complaintData.filter(
          item => item.status === "escalated",
        );
        setCriticalQueue(escalated.slice(0, 3));

        try {
          const [statsData, logsData] = await Promise.all([
            getOperatorStats(),
            getActivityLogs(5),
          ]);
          if (!isActive) {
            return;
          }
          setOperatorStats(statsData);
          setOperatorLogs(logsData);
          setOperatorError(null);
        } catch (operatorErr) {
          if (!isActive) {
            return;
          }
          const message =
            operatorErr instanceof Error
              ? operatorErr.message
              : "Operator data unavailable.";
          setOperatorError(message);
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
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const total = complaints.length;
    const resolved = complaints.filter(item => isResolvedStatus(item.status)).length;
    const overdue = complaints.filter(item => {
      if (isResolvedStatus(item.status)) {
        return false;
      }
      if (!item.expected_resolution_at) {
        return false;
      }
      return new Date(item.expected_resolution_at) < now;
    }).length;
    const escalated = complaints.filter(item => item.status === "escalated").length;
    const open = Math.max(total - resolved, 0);
    const activeDepartments = new Set(
      complaints
        .map(item => item.assigned_department_id)
        .filter((id): id is string => !!id),
    ).size;

    return {
      total,
      resolved,
      overdue,
      escalated,
      open,
      activeDepartments,
      resolutionRate: total ? Math.round((resolved / total) * 100) : 0,
    };
  }, [complaints]);

  const totalTrend = useMemo(() => {
    const today = startOfDay(new Date());
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const fourteenDaysAgo = new Date(today);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const recent = complaints.filter(item => {
      const createdAt = new Date(item.created_at);
      return createdAt >= sevenDaysAgo && createdAt < today;
    }).length;
    const previous = complaints.filter(item => {
      const createdAt = new Date(item.created_at);
      return createdAt >= fourteenDaysAgo && createdAt < sevenDaysAgo;
    }).length;

    if (!previous) {
      return recent ? "+100%" : "0%";
    }

    const delta = Math.round(((recent - previous) / previous) * 100);
    return `${delta >= 0 ? "+" : ""}${delta}%`;
  }, [complaints]);

  const trendData = useMemo(() => {
    const today = startOfDay(new Date());
    const buckets = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(today);
      day.setDate(today.getDate() - (6 - index));
      return {
        key: day.toISOString().slice(0, 10),
        label: formatDayLabel(day),
        submitted: 0,
        resolved: 0,
      };
    });

    complaints.forEach(item => {
      const createdAt = startOfDay(new Date(item.created_at)).toISOString().slice(0, 10);
      const createdIndex = buckets.findIndex(bucket => bucket.key === createdAt);
      if (createdIndex >= 0) {
        buckets[createdIndex].submitted += 1;
      }

      if (item.resolved_at) {
        const resolvedAt = startOfDay(new Date(item.resolved_at)).toISOString().slice(0, 10);
        const resolvedIndex = buckets.findIndex(bucket => bucket.key === resolvedAt);
        if (resolvedIndex >= 0) {
          buckets[resolvedIndex].resolved += 1;
        }
      }
    });

    return buckets;
  }, [complaints]);

  const maxTrendCount = Math.max(
    1,
    ...trendData.map(item => item.submitted),
    ...trendData.map(item => item.resolved),
  );

  const departmentStats = useMemo(() => {
    const byId = new Map<
      string,
      {
        name: string;
        total: number;
        resolved: number;
        overdue: number;
      }
    >();

    const getDepartmentName = (departmentId: string | null) => {
      if (!departmentId) {
        return "Unassigned";
      }
      return departments.find(item => item.id === departmentId)?.name ?? "Unknown";
    };

    complaints.forEach(item => {
      const key = item.assigned_department_id ?? "__unassigned__";
      const current = byId.get(key) ?? {
        name: getDepartmentName(item.assigned_department_id),
        total: 0,
        resolved: 0,
        overdue: 0,
      };

      current.total += 1;
      if (isResolvedStatus(item.status)) {
        current.resolved += 1;
      } else if (
        item.expected_resolution_at &&
        new Date(item.expected_resolution_at) < new Date()
      ) {
        current.overdue += 1;
      }

      byId.set(key, current);
    });

    return [...byId.values()]
      .map(item => {
        const resolvedShare = item.total
          ? Math.round((item.resolved / item.total) * 100)
          : 0;
        const overdueShare = item.total
          ? Math.round((item.overdue / item.total) * 100)
          : 0;
        const activeShare = item.total
          ? Math.max(0, 100 - resolvedShare - overdueShare)
          : 0;

        return {
          ...item,
          active: Math.max(item.total - item.resolved - item.overdue, 0),
          resolvedShare,
          overdueShare,
          activeShare,
          totalShare: complaints.length
            ? Math.round((item.total / complaints.length) * 100)
            : 0,
        };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 2);
  }, [complaints, departments]);

  const operatorCompletedCases = useMemo(
    () =>
      complaints.filter(
        item =>
          item.created_by_role === "operator" &&
          isResolvedStatus(item.status),
      ).length,
    [complaints],
  );

  const operatorInProgressCases = useMemo(
    () =>
      complaints.filter(
        item =>
          item.created_by_role === "operator" &&
          !isResolvedStatus(item.status),
      ).length,
    [complaints],
  );

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
          <Text style={styles.locText}>Live complaint monitoring</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isLoading ? (
          <Text style={styles.loadingText}>Loading live dashboard data...</Text>
        ) : null}

        <View style={styles.metricsGrid}>
          <MetricCard
            icon="description"
            title="Total Complaints"
            value={stats.total.toString()}
            trend={`7d ${totalTrend}`}
          />
          <MetricCard
            icon="check-circle"
            title="Resolved"
            value={stats.resolved.toString()}
            subtitle={`${stats.resolutionRate}% Completion Rate`}
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
            icon="folder-open"
            title="Open Cases"
            value={stats.open.toString()}
            subtitle={`${stats.activeDepartments} departments involved`}
            fullWidth
          />
        </View>

        <TouchableOpacity
          style={styles.exportBtn}
          onPress={() =>
            Alert.alert("Export", "Live report export will be available soon.")
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
          <View style={styles.trendList}>
            {trendData.map(day => (
              <View key={day.key} style={styles.trendRow}>
                <Text style={styles.trendDay}>{day.label}</Text>
                <View style={styles.trendBars}>
                  <View style={styles.trendBarGroup}>
                    <View style={styles.trendBarLabelRow}>
                      <Text style={styles.trendBarLabel}>Submitted</Text>
                      <Text style={styles.trendBarValue}>{day.submitted}</Text>
                    </View>
                    <View style={styles.trendTrack}>
                      <View
                        style={[
                          styles.trendFillSubmitted,
                          {
                            width: `${Math.max(
                              10,
                              (day.submitted / maxTrendCount) * 100,
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.trendBarGroup}>
                    <View style={styles.trendBarLabelRow}>
                      <Text style={styles.trendBarLabel}>Resolved</Text>
                      <Text style={styles.trendBarValue}>{day.resolved}</Text>
                    </View>
                    <View style={styles.trendTrack}>
                      <View
                        style={[
                          styles.trendFillResolved,
                          {
                            width: `${Math.max(
                              10,
                              (day.resolved / maxTrendCount) * 100,
                            )}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.sectionTitle}>Department Efficiency</Text>
          <View style={styles.depRow}>
            <Text style={styles.depName}>
              {departmentStats[0]?.name ?? "Unassigned"}
            </Text>
            <Text style={styles.depRate}>
              {departmentStats[0]?.resolvedShare ?? 0}% resolved
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barPrimary,
                {
                  width: `${departmentStats[0]?.resolvedShare ?? 0}%`,
                },
              ]}
            />
            <View
              style={[
                styles.barSecondary,
                {
                  width: `${departmentStats[0]?.activeShare ?? 0}%`,
                },
              ]}
            />
            <View
              style={[
                styles.barError,
                {
                  width: `${departmentStats[0]?.overdueShare ?? 0}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.depSub}>
            {departmentStats[0]?.totalShare ?? 0}% of total -{" "}
            {departmentStats[0]?.active ?? 0} active cases
          </Text>

          <View style={styles.depRow}>
            <Text style={styles.depName}>
              {departmentStats[1]?.name ?? "No second department"}
            </Text>
            <Text style={styles.depRate}>
              {departmentStats[1]?.resolvedShare ?? 0}% resolved
            </Text>
          </View>
          <View style={styles.barTrack}>
            <View
              style={[
                styles.barPrimary,
                {
                  width: `${departmentStats[1]?.resolvedShare ?? 0}%`,
                },
              ]}
            />
            <View
              style={[
                styles.barSecondary,
                {
                  width: `${departmentStats[1]?.activeShare ?? 0}%`,
                },
              ]}
            />
            <View
              style={[
                styles.barError,
                {
                  width: `${departmentStats[1]?.overdueShare ?? 0}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.depSub}>
            {departmentStats[1]?.totalShare ?? 0}% of total -{" "}
            {departmentStats[1]?.active ?? 0} active cases
          </Text>
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

        <View style={styles.operatorCard}>
          <View style={styles.operatorHead}>
            <View>
              <Text style={styles.sectionTitle}>Operator Oversight</Text>
              <Text style={styles.operatorSub}>
                Live workload and completion activity across operator desks
              </Text>
            </View>
            <View style={styles.operatorBadge}>
              <Text style={styles.operatorBadgeText}>Leader View</Text>
            </View>
          </View>

          {operatorError ? (
            <Text style={styles.operatorErrorText}>{operatorError}</Text>
          ) : null}

          <View style={styles.operatorGrid}>
            <MetricCard
              icon="assignment-ind"
              title="Registered Today"
              value={String(operatorStats?.registeredToday ?? 0)}
            />
            <MetricCard
              icon="assignment"
              title="Complaints Logged"
              value={String(operatorStats?.complaintsLogged ?? 0)}
            />
            <MetricCard
              icon="directions-walk"
              title="Walk-ins Served"
              value={String(operatorStats?.walkInsServed ?? 0)}
            />
            <MetricCard
              icon="schedule"
              title="Pending Tasks"
              value={String(operatorStats?.pendingTasks ?? 0)}
              critical
            />
          </View>

          <View style={styles.operatorSummaryRow}>
            <View style={styles.operatorSummaryChip}>
              <Text style={styles.operatorSummaryValue}>
                {operatorCompletedCases}
              </Text>
              <Text style={styles.operatorSummaryLabel}>
                Completed operator cases
              </Text>
            </View>
            <View style={styles.operatorSummaryChip}>
              <Text style={styles.operatorSummaryValue}>
                {operatorInProgressCases}
              </Text>
              <Text style={styles.operatorSummaryLabel}>
                In-progress operator cases
              </Text>
            </View>
          </View>

          <View style={styles.operatorLogWrap}>
            <Text style={styles.operatorLogTitleText}>Recent Operator Activity</Text>
            {operatorLogs.length ? (
              operatorLogs.map(log => <OperatorLogItem key={log.id} log={log} />)
            ) : (
              <Text style={styles.operatorEmptyText}>
                No recent operator activity available.
              </Text>
            )}
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/leader/post/new" as never)}
      >
        <MaterialIcons name="add" size={26} color="#FFFFFF" />
      </TouchableOpacity>
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
  loadingText: { color: "#006C49", fontSize: 12, fontWeight: "600" },
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
    width: "48%",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    minHeight: 132,
    gap: 6,
  },
  metricCardFull: {
    width: "100%",
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
  trendList: { gap: 10 },
  trendRow: { gap: 6 },
  trendDay: { color: "#121C28", fontSize: 12, fontWeight: "700" },
  trendBars: { gap: 8 },
  trendBarGroup: { gap: 4 },
  trendBarLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendBarLabel: { color: "#444651", fontSize: 11, fontWeight: "600" },
  trendBarValue: { color: "#121C28", fontSize: 11, fontWeight: "700" },
  trendTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DFE9FA",
    overflow: "hidden",
  },
  trendFillSubmitted: {
    height: "100%",
    backgroundColor: "#00236F",
    borderRadius: 4,
  },
  trendFillResolved: {
    height: "100%",
    backgroundColor: "#006C49",
    borderRadius: 4,
  },
  depRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  departmentBlock: { gap: 8 },
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
  operatorCard: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 12,
  },
  operatorHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  operatorSub: { color: "#444651", fontSize: 12, marginTop: 2 },
  operatorBadge: {
    backgroundColor: "#DFE9FA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  operatorBadgeText: { color: "#00236F", fontSize: 10, fontWeight: "700" },
  operatorErrorText: { color: "#BA1A1A", fontSize: 12 },
  operatorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  operatorSummaryRow: { flexDirection: "row", gap: 10 },
  operatorSummaryChip: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: "#F8F9FF",
    borderWidth: 1,
    borderColor: "#D7DFEF",
    padding: 12,
    gap: 4,
  },
  operatorSummaryValue: { color: "#121C28", fontSize: 26, fontWeight: "700" },
  operatorSummaryLabel: { color: "#444651", fontSize: 11, fontWeight: "600" },
  operatorLogWrap: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
    gap: 10,
  },
  operatorLogTitleText: {
    color: "#121C28",
    fontSize: 16,
    fontWeight: "700",
  },
  operatorLogItem: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 4,
  },
  operatorLogIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  operatorLogHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
  },
  operatorLogTitle: {
    flex: 1,
    color: "#121C28",
    fontSize: 13,
    fontWeight: "700",
  },
  operatorLogTime: { color: "#757682", fontSize: 11 },
  operatorLogDesc: { color: "#444651", fontSize: 12, marginTop: 2 },
  operatorEmptyText: { color: "#757682", fontSize: 12 },
});
