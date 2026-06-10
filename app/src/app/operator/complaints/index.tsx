import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { apiConfigError } from "../../../lib/api";
import { getAllComplaints } from "../../../services/complaintService";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ComplaintItem = {
  id: string;
  complaint_number: string | null;
  category: string | null;
  status: string | null;
  created_at: string;
};

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

export default function OperatorComplaintListScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [complaints, setComplaints] = useState<ComplaintItem[]>([]);

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
        const data = await getAllComplaints();
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
  }, []);

  const visibleComplaints = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
      return complaints;
    }
    return complaints.filter(item => {
      const idMatch = (item.complaint_number ?? item.id).toLowerCase();
      const categoryMatch = (item.category ?? "").toLowerCase();
      return idMatch.includes(trimmed) || categoryMatch.includes(trimmed);
    });
  }, [complaints, query]);

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
                router.replace("/operator" as never);
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#00236F" />
          </TouchableOpacity>
          <Text style={styles.brand}>Jan Seva Portal</Text>
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
        <Text style={styles.title}>Complaints</Text>
        <Text style={styles.subtitle}>
          Select a complaint to review details and assign.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color="#757682" />
          <TextInput
            placeholder="Search by ID or category"
            placeholderTextColor="#757682"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {isLoading ? (
          <Text style={styles.muted}>Loading complaints...</Text>
        ) : null}

        {visibleComplaints.map(item => {
          const statusLabel =
            item.status === "resolved"
              ? "Resolved"
              : item.status === "closed"
                ? "Closed"
                : item.status === "in_progress"
                  ? "In Progress"
                  : item.status === "assigned"
                    ? "Assigned"
                    : item.status === "unassigned"
                      ? "Unassigned"
                      : "Open";
          const statusTone =
            item.status === "resolved" || item.status === "closed"
              ? "resolved"
              : item.status === "in_progress" || item.status === "assigned"
                ? "progress"
                : "open";

          return (
            <TouchableOpacity
              key={item.id}
              style={styles.card}
              onPress={() =>
                router.push(`/operator/complaints/${item.id}` as never)
              }
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
                <StatusChip label={statusLabel} tone={statusTone} />
              </View>
              <Text style={styles.meta}>
                Filed: {new Date(item.created_at).toLocaleDateString("en-GB")}
              </Text>
            </TouchableOpacity>
          );
        })}

        {!isLoading && !visibleComplaints.length ? (
          <Text style={styles.muted}>No complaints found.</Text>
        ) : null}
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
  meta: { fontSize: 12, color: "#6B7280" },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
  },
  chipText: { fontSize: 11, fontWeight: "700" },
  muted: { color: "#6B7280", fontSize: 12 },
});
