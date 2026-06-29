import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getShareTrackingReport,
  type SocialPostShareTrackingRow,
} from "../../services/socialPostService";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatUpdatedAt(value: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function ReportCard({ row }: { row: SocialPostShareTrackingRow }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.platformPill}>
          <Text style={styles.platformPillText}>{row.platform ?? "Unknown"}</Text>
        </View>
        <Text style={styles.countValue}>{row.share_count}</Text>
      </View>
      <Text style={styles.cardTitle}>{row.post_title}</Text>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Booth Worker</Text>
        <Text style={styles.infoValue}>{row.booth_worker_name}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Booth Area</Text>
        <Text style={styles.infoValue}>{row.booth_area}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Platform</Text>
        <Text style={styles.infoValue}>{row.platform ?? "Unknown"}</Text>
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>Share Count</Text>
        <Text style={styles.infoValue}>{row.share_count}</Text>
      </View>
      <Text style={styles.updatedText}>
        Last activity: {formatUpdatedAt(row.updated_at)}
      </Text>
    </View>
  );
}

export default function ShareTrackerScreen() {
  const router = useRouter();
  const { userRole } = useAuth();
  const [rows, setRows] = useState<SocialPostShareTrackingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getShareTrackingReport();
        if (isActive) {
          setRows(data);
        }
      } catch (err) {
        if (!isActive) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Failed to load share tracking report.";
        setError(message);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const totalShares = useMemo(
    () => rows.reduce((sum, row) => sum + (row.share_count || 0), 0),
    [rows],
  );

  const backTarget = "/leader";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace(backTarget as never);
            }
          }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#00236F" />
        </TouchableOpacity>
        <View style={styles.headerTextWrap}>
          <Text style={styles.title}>Post Share Tracker</Text>
          <Text style={styles.subtitle}>Leader tracking report</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={async () => {
            setLoading(true);
            setError(null);
            try {
              const data = await getShareTrackingReport();
              setRows(data);
            } catch (err) {
              const message =
                err instanceof Error ? err.message : "Failed to load share tracking report.";
              setError(message);
            } finally {
              setLoading(false);
            }
          }}
        >
          <MaterialIcons name="refresh" size={18} color="#00236F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>Distribution insights</Text>
          <Text style={styles.heroTitle}>{totalShares} tracked shares</Text>
          <Text style={styles.heroBody}>
            Counts stay separated by post, Booth Worker, and platform. Repeated shares are counted every time.
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#00236F" />
          </View>
        ) : rows.length ? (
          rows.map(row => <ReportCard key={row.id} row={row} />)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No tracked shares yet</Text>
            <Text style={styles.emptyText}>
              Once Booth Workers start sharing posts, their platform-wise counts will appear here.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() =>
            Alert.alert(
              "Tracker",
              "This report updates from Booth Worker share actions on the published feed.",
            )
          }
        >
          <Text style={styles.secondaryBtnText}>How It Works</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    minHeight: 64,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#D7DBE7",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTextWrap: { flex: 1 },
  title: { color: "#00236F", fontSize: 22, fontWeight: "700" },
  subtitle: { color: "#5A6272", fontSize: 12, fontWeight: "600" },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 12, paddingBottom: 100 },
  hero: {
    borderRadius: 20,
    backgroundColor: "#0E2A6D",
    padding: 16,
    gap: 8,
  },
  heroEyebrow: {
    color: "#C6D4FF",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  heroBody: { color: "#D8E2FF", fontSize: 13, lineHeight: 19 },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  card: {
    borderWidth: 1,
    borderColor: "#D7DFEF",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 10,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  platformPill: {
    borderRadius: 999,
    backgroundColor: "#E5EEFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  platformPillText: { color: "#264191", fontSize: 11, fontWeight: "700" },
  countValue: { color: "#00714D", fontSize: 24, fontWeight: "700" },
  cardTitle: { color: "#121C28", fontSize: 18, fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  infoLabel: { color: "#5A6272", fontSize: 13, fontWeight: "600" },
  infoValue: {
    flex: 1,
    textAlign: "right",
    color: "#121C28",
    fontSize: 13,
  },
  updatedText: { color: "#757682", fontSize: 11, fontWeight: "600" },
  emptyState: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C5C5D3",
    borderRadius: 16,
    padding: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    gap: 4,
  },
  emptyTitle: { color: "#121C28", fontSize: 14, fontWeight: "700" },
  emptyText: {
    color: "#5A6272",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
  },
  secondaryBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7DBE7",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    marginTop: 2,
  },
  secondaryBtnText: { color: "#00236F", fontSize: 14, fontWeight: "700" },
});
