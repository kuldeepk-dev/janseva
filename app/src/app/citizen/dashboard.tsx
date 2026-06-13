import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { apiConfigError } from "../../lib/api";
import { getMyComplaints } from "../../services/complaintService";
import { getMyVoter } from "../../services/voterService";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ComplaintSummary = {
  id: string;
  complaint_number: string | null;
  category: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  operator_note: string | null;
};

function countStatus(list: ComplaintSummary[]) {
  const counts = { open: 0, resolved: 0, pending: 0 };
  for (const item of list) {
    const status = item.status;
    if (status === "resolved" || status === "closed") {
      counts.resolved += 1;
    } else if (status === "unassigned" || status === "assigned") {
      counts.pending += 1;
    } else {
      counts.open += 1;
    }
  }
  return counts;
}

export default function CitizenDashboardScreen() {
  const router = useRouter();
  const [voterName, setVoterName] = useState<string | null>(null);
  const [hasVoterProfile, setHasVoterProfile] = useState(false);
  const [complaints, setComplaints] = useState<ComplaintSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setError(null);
      if (apiConfigError) {
        setError(apiConfigError);
        return;
      }

      setIsLoading(true);
      try {
        const [voter, complaintData] = await Promise.all([
          getMyVoter(),
          getMyComplaints(),
        ]);

        if (!isActive) {
          return;
        }

        setVoterName(voter?.full_name?.trim() || null);
        setHasVoterProfile(!!voter);
        setComplaints(
          complaintData.map(item => ({
            id: item.id,
            complaint_number: item.complaint_number,
            category: item.category,
            status: item.status,
            created_at: item.created_at,
            updated_at: item.updated_at,
            operator_note: item.operator_note,
          })),
        );
      } catch (err) {
        if (!isActive) {
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load dashboard.");
        setComplaints([]);
        setVoterName(null);
        setHasVoterProfile(false);
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

  const summary = useMemo(() => countStatus(complaints), [complaints]);
  const recentComplaints = useMemo(
    () => [...complaints].sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at)).slice(0, 4),
    [complaints],
  );

  const welcomeText = useMemo(() => {
    if (!voterName) {
      return "Welcome back";
    }
    return `Namaste, ${voterName}`;
  }, [voterName]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoMark}>
            <MaterialIcons name="apartment" size={18} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brand}>Jan Seva</Text>
            <Text style={styles.brandSub}>Citizen Dashboard</Text>
          </View>
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
          <View style={styles.heroText}>
            <Text style={styles.heroKicker}>{welcomeText}</Text>
            <Text style={styles.heroTitle}>Track every complaint in one place.</Text>
            <Text style={styles.heroSub}>
              See live status, operator notes, and the latest updates from the
              complaint desk.
            </Text>
          </View>
          <View style={styles.heroBadge}>
            <MaterialIcons name="assignment" size={18} color="#00236F" />
            <Text style={styles.heroBadgeText}>
              {isLoading ? "Loading" : `${complaints.length} complaints`}
            </Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {!hasVoterProfile ? (
          <View style={styles.noticeCard}>
            <MaterialIcons name="warning-amber" size={20} color="#7A4C00" />
            <View style={styles.noticeBody}>
              <Text style={styles.noticeTitle}>Complete your voter profile</Text>
              <Text style={styles.noticeText}>
                Registering your profile helps the system link complaints to your
                record and improve support.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.noticeBtn}
              onPress={() => router.push("/register" as never)}
            >
              <Text style={styles.noticeBtnText}>Register</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="error-outline" size={22} color="#93000A" />
            <Text style={styles.statValue}>{String(summary.open).padStart(2, "0")}</Text>
            <Text style={styles.statLabel}>Open</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="pending-actions" size={22} color="#1D4ED8" />
            <Text style={styles.statValue}>{String(summary.pending).padStart(2, "0")}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialIcons name="check-circle-outline" size={22} color="#00714D" />
            <Text style={styles.statValue}>{String(summary.resolved).padStart(2, "0")}</Text>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/complaints/new" as never)}
          >
            <MaterialIcons name="add-circle" size={22} color="#00236F" />
            <Text style={styles.actionTitle}>New Complaint</Text>
            <Text style={styles.actionSub}>File a fresh complaint</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/complaints" as never)}
          >
            <MaterialIcons name="track-changes" size={22} color="#00236F" />
            <Text style={styles.actionTitle}>Track Status</Text>
            <Text style={styles.actionSub}>Open your complaint timeline</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Complaints</Text>
          <TouchableOpacity onPress={() => router.push("/complaints" as never)}>
            <Text style={styles.sectionLink}>View all</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {recentComplaints.length ? (
            recentComplaints.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.complaintCard}
                onPress={() => router.push(`/complaints/${item.id}` as never)}
              >
                <View style={styles.cardTop}>
                  <View style={styles.cardText}>
                    <Text style={styles.cardId}>
                      {item.complaint_number ?? item.id}
                    </Text>
                    <Text style={styles.cardTitle}>
                      {item.category ?? "Complaint"}
                    </Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>
                      {(item.status ?? "open").replace(/_/g, " ")}
                    </Text>
                  </View>
                </View>

                {item.operator_note ? (
                  <Text style={styles.notePreview} numberOfLines={2}>
                    Latest operator note: {item.operator_note}
                  </Text>
                ) : (
                  <Text style={styles.notePreview} numberOfLines={2}>
                    No operator note yet.
                  </Text>
                )}

                <Text style={styles.cardMeta}>
                  Updated {new Date(item.updated_at).toLocaleDateString("en-GB")}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyCard}>
              <MaterialIcons name="inbox" size={24} color="#757682" />
              <Text style={styles.emptyTitle}>No complaints yet</Text>
              <Text style={styles.emptyText}>
                Your filed complaints will appear here once they are created.
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
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoMark: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#00236F",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#00236F", fontSize: 18, fontWeight: "700" },
  brandSub: { color: "#5A6272", fontSize: 11 },
  langBtn: {
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langText: { color: "#00236F", fontSize: 13, fontWeight: "600" },
  content: { padding: 16, paddingBottom: 120, gap: 14 },
  heroCard: {
    backgroundColor: "#00236F",
    borderRadius: 20,
    padding: 18,
    gap: 16,
  },
  heroText: { gap: 8 },
  heroKicker: { color: "#D6E3FF", fontSize: 13, fontWeight: "600" },
  heroTitle: { color: "#FFFFFF", fontSize: 28, lineHeight: 34, fontWeight: "700" },
  heroSub: { color: "#D6E3FF", fontSize: 14, lineHeight: 20 },
  heroBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroBadgeText: { color: "#00236F", fontSize: 12, fontWeight: "700" },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  noticeCard: {
    backgroundColor: "#FFF8E8",
    borderWidth: 1,
    borderColor: "#F5C26B",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  noticeBody: { flex: 1, gap: 3 },
  noticeTitle: { color: "#7A4C00", fontSize: 14, fontWeight: "700" },
  noticeText: { color: "#7A4C00", fontSize: 12, lineHeight: 18 },
  noticeBtn: {
    backgroundColor: "#00236F",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  noticeBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  statsGrid: { flexDirection: "row", gap: 10 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 16,
    padding: 14,
    gap: 6,
    alignItems: "flex-start",
  },
  statValue: { color: "#00236F", fontSize: 24, fontWeight: "700" },
  statLabel: { color: "#5A6272", fontSize: 12, fontWeight: "600" },
  actionGrid: { flexDirection: "row", gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 18,
    padding: 14,
    minHeight: 92,
    gap: 6,
  },
  actionTitle: { color: "#00236F", fontSize: 15, fontWeight: "700" },
  actionSub: { color: "#5A6272", fontSize: 12, lineHeight: 18 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  sectionTitle: { color: "#00236F", fontSize: 20, fontWeight: "700" },
  sectionLink: { color: "#006C49", fontSize: 13, fontWeight: "700" },
  list: { gap: 12 },
  complaintCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  cardText: { flex: 1, gap: 2 },
  cardId: { color: "#00236F", fontSize: 12, fontWeight: "700" },
  cardTitle: { color: "#121C28", fontSize: 16, fontWeight: "700" },
  statusPill: {
    backgroundColor: "#DFE9FA",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusPillText: { color: "#00236F", fontSize: 11, fontWeight: "700" },
  notePreview: { color: "#444651", fontSize: 13, lineHeight: 19 },
  cardMeta: { color: "#757682", fontSize: 11 },
  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: { color: "#121C28", fontSize: 16, fontWeight: "700" },
  emptyText: { color: "#5A6272", fontSize: 12, textAlign: "center", lineHeight: 18 },
});
