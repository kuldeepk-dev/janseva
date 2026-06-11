import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getOfficerQueue } from "../../services/officerService";
import type { Complaint } from "../../services/complaintService";

export default function OfficerQueueScreen() {
  const router = useRouter();
  const [queue, setQueue] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      try {
        const data = await getOfficerQueue();
        if (!isActive) return;
        setQueue(data);
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Failed to load queue.");
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
        <Text style={styles.title}>Complaint Queue</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isLoading ? <Text style={styles.muted}>Loading queue...</Text> : null}
        {!isLoading && !queue.length ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={28} color="#90A8FF" />
            <Text style={styles.emptyText}>No complaints currently assigned.</Text>
          </View>
        ) : null}
        {queue.map(item => {
          const priority = item.priority ?? "normal";
          const badgeStyle =
            priority === "critical"
              ? styles.critical
              : priority === "urgent"
                ? styles.high
                : styles.medium;
          const label =
            priority === "critical"
              ? "CRITICAL"
              : priority === "urgent"
                ? "URGENT"
                : "NORMAL";
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.row}
              onPress={() => router.push(`/officer/complaint/${item.id}` as never)}
            >
              <View style={styles.rowMain}>
                <Text style={styles.id}>#{item.complaint_number ?? item.id}</Text>
                <Text style={styles.cat}>{item.category ?? "Uncategorized"}</Text>
                <Text style={styles.meta}>{item.sub_category ?? "No sub-category"}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={badgeStyle}>{label}</Text>
                <Text style={styles.sla}>
                  {item.expected_resolution_at
                    ? `Due ${new Date(item.expected_resolution_at).toLocaleDateString()}`
                    : "No due date"}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 56,
    justifyContent: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#D7DBE7",
    backgroundColor: "#FFFFFF",
  },
  title: { color: "#00236F", fontSize: 22, fontWeight: "700" },
  content: { padding: 16, gap: 10, paddingBottom: 92 },
  row: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
  },
  rowMain: { flex: 1 },
  id: { color: "#121C28", fontSize: 15, fontWeight: "700" },
  cat: { color: "#5A6272", marginTop: 2, fontSize: 12 },
  meta: { color: "#757682", marginTop: 2, fontSize: 11 },
  rowRight: { alignItems: "flex-end", gap: 4 },
  medium: {
    backgroundColor: "#DBEAFE",
    color: "#1E40AF",
    fontSize: 10,
    fontWeight: "700",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  high: {
    backgroundColor: "#FEF3C7",
    color: "#92400E",
    fontSize: 10,
    fontWeight: "700",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  critical: {
    backgroundColor: "#BA1A1A",
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  sla: { color: "#444651", fontSize: 11 },
  muted: { color: "#444651", fontSize: 14 },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  emptyState: {
    padding: 18,
    alignItems: "center",
    gap: 8,
  },
  emptyText: { color: "#757682", fontSize: 12, fontStyle: "italic", textAlign: "center" },
});
