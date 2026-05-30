import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { apiConfigError } from "../../lib/api";
import {
  getAllComplaints,
  getMyComplaints,
} from "../../services/complaintService";
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

function StatusChip({
  label,
  tone,
}: {
  label: string;
  tone: "open" | "progress" | "resolved";
}) {
  const toneStyle =
    tone === "resolved"
      ? { bg: "#DCFCE7", text: "#166534" }
      : tone === "progress"
        ? { bg: "#DBEAFE", text: "#1D4ED8" }
        : { bg: "#FEE2E2", text: "#991B1B" };
  return (
    <View style={[styles.chip, { backgroundColor: toneStyle.bg }]}>
      <Text style={[styles.chipText, { color: toneStyle.text }]}>{label}</Text>
    </View>
  );
}

export default function TrackComplaintScreen() {
  const router = useRouter();
  const { userRole } = useAuth();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [complaints, setComplaints] = useState<
    Array<{
      id: string;
      complaint_number: string | null;
      category: string | null;
      status: string | null;
      created_at: string;
      expected_resolution_at: string | null;
    }>
  >([]);

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
        const data =
          userRole === "operator" || userRole === "leader"
            ? await getAllComplaints()
            : await getMyComplaints();
        if (!isActive) {
          return;
        }
        setComplaints(
          data.map(item => ({
            id: item.id,
            complaint_number: item.complaint_number,
            category: item.category,
            status: item.status,
            created_at: item.created_at,
            expected_resolution_at: item.expected_resolution_at,
          })),
        );
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
  }, [userRole]);

  const fallbackComplaints = useMemo(
    () => [],
    [],
  );

  const visibleComplaints = useMemo(() => {
    const list = complaints.length ? complaints : fallbackComplaints;
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return list;
    }
    return list.filter(item =>
      (item.complaint_number ?? "").toLowerCase().includes(trimmed),
    );
  }, [complaints, fallbackComplaints, query]);

  const handleTrack = () => {
    if (!visibleComplaints.length) {
      Alert.alert("Track", "No complaints match this ID.");
      return;
    }
    router.push(`/complaints/${visibleComplaints[0].id}` as never);
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
                router.replace("/dashboard" as never);
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#00236F" />
          </TouchableOpacity>
          <Text style={styles.brand}>जन सेवा</Text>
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
        <Text style={styles.title}>Track Complaint</Text>
        <Text style={styles.subtitle}>
          Search complaint ID and monitor status updates in real time.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="#757682" />
          <TextInput
            placeholder="Enter Complaint ID (e.g. JS-24031)"
            placeholderTextColor="#757682"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleTrack}>
          <MaterialIcons name="track-changes" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>
            {isLoading ? "Loading..." : "Track Status"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/complaints/new" as never)}
        >
          <MaterialIcons name="add" size={18} color="#00236F" />
          <Text style={styles.secondaryBtnText}>New Complaint</Text>
        </TouchableOpacity>

        {visibleComplaints.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => router.push(`/complaints/${item.id}` as never)}
          >
            <View style={styles.cardTop}>
              <View>
                <Text style={styles.id}>
                  Complaint ID: {item.complaint_number ?? item.id}
                </Text>
                <Text style={styles.subject}>
                  {item.category ?? "Complaint"}
                </Text>
              </View>
              <StatusChip
                label={
                  item.status === "resolved"
                    ? "Resolved"
                    : item.status === "closed"
                      ? "Closed"
                      : item.status === "in_progress"
                        ? "In Progress"
                        : item.status === "assigned"
                          ? "Assigned"
                          : "Open"
                }
                tone={
                  item.status === "resolved" || item.status === "closed"
                    ? "resolved"
                    : item.status === "in_progress"
                      ? "progress"
                      : "open"
                }
              />
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.meta}>
                Filed: {new Date(item.created_at).toLocaleDateString("en-GB")}
              </Text>
              <Text style={styles.meta}>
                SLA: {item.expected_resolution_at ? "Active" : "Pending"}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={styles.backHomeBtn}
          onPress={() => router.push("/dashboard" as never)}
        >
          <Text style={styles.backHomeText}>Back to Dashboard</Text>
        </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 6, borderRadius: 20 },
  brand: { fontSize: 20, color: "#00236F", fontWeight: "700" },
  langBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  langText: { fontSize: 14, color: "#00236F", fontWeight: "600" },
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  title: { fontSize: 24, color: "#121C28", fontWeight: "600" },
  subtitle: { fontSize: 14, color: "#444651", lineHeight: 20 },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  searchWrap: {
    marginTop: 6,
    height: 48,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: { flex: 1, color: "#121C28", fontSize: 15 },
  primaryBtn: {
    height: 46,
    borderRadius: 23,
    backgroundColor: "#00236F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
  secondaryBtn: {
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryBtnText: { color: "#00236F", fontSize: 14, fontWeight: "600" },
  card: {
    marginTop: 4,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  id: { fontSize: 12, color: "#00236F", fontWeight: "700" },
  subject: {
    marginTop: 2,
    fontSize: 14,
    color: "#121C28",
    fontWeight: "600",
    maxWidth: 220,
  },
  metaRow: { flexDirection: "row", justifyContent: "space-between" },
  meta: { fontSize: 12, color: "#6B7280" },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  chipText: { fontSize: 11, fontWeight: "700" },
  timeline: { marginTop: 4 },
  stepRow: { flexDirection: "row", gap: 10 },
  stepBody: { flex: 1, paddingBottom: 2 },
  stepTitle: { fontSize: 13, color: "#111827", fontWeight: "600" },
  stepTitlePending: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  stepTime: { fontSize: 11, color: "#6B7280", marginTop: 2 },
  stepLine: {
    height: 14,
    marginLeft: 7,
    width: 1,
    backgroundColor: "#D1D5DB",
    marginVertical: 2,
  },
  stepIconDone: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#16A34A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepIconLive: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepIconPending: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  backHomeBtn: { marginTop: 10, alignItems: "center" },
  backHomeText: { color: "#006C49", fontSize: 13, fontWeight: "700" },
});
