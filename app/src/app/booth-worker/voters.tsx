import { MaterialIcons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import { getCurrentProfile, type Profile } from "../../services/authService";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type MockVoter = {
  id: string;
  name: string;
  gender: string;
  age: number;
  address: string;
  booth_number: string;
};

const MOCK_VOTERS: MockVoter[] = [
  {
    id: "bw-voter-1",
    name: "Asha Devi",
    gender: "Female",
    age: 42,
    address: "Ward 4, House 18, Shastri Nagar",
    booth_number: "12",
  },
  {
    id: "bw-voter-2",
    name: "Ramesh Kumar",
    gender: "Male",
    age: 36,
    address: "Ward 4, Near Primary School, Shastri Nagar",
    booth_number: "12",
  },
  {
    id: "bw-voter-3",
    name: "Sunita Kumari",
    gender: "Female",
    age: 29,
    address: "Lane 2, Patel Chowk, Shastri Nagar",
    booth_number: "12",
  },
  {
    id: "bw-voter-4",
    name: "Irfan Ali",
    gender: "Male",
    age: 51,
    address: "Ward 7, Market Road, Civil Lines",
    booth_number: "17",
  },
];

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function BoothWorkerVotersScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const currentProfile = await getCurrentProfile();
        if (isActive) {
          setProfile(currentProfile);
        }
      } catch {
        if (isActive) {
          setProfile(null);
        }
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

  const assignedBooth = profile?.assigned_booth_number || "12";
  const visibleVoters = useMemo(
    () => MOCK_VOTERS.filter(voter => voter.booth_number === assignedBooth),
    [assignedBooth],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Booth Voter List</Text>
          <Text style={styles.subtitle}>Mock data for Booth {assignedBooth}</Text>
        </View>
        {loading ? <ActivityIndicator size="small" color="#00236F" /> : null}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <MaterialIcons name="filter-alt" size={14} color="#00714D" />
            <Text style={styles.badgeText}>Filtered to assigned booth only</Text>
          </View>
          <View style={styles.badgeMuted}>
            <Text style={styles.badgeMutedText}>{visibleVoters.length} voters</Text>
          </View>
        </View>

        {visibleVoters.map(voter => (
          <View key={voter.id} style={styles.card}>
            <Text style={styles.cardTitle}>{voter.name}</Text>
            <InfoRow label="Gender" value={voter.gender} />
            <InfoRow label="Age" value={String(voter.age)} />
            <InfoRow label="Address" value={voter.address} />
          </View>
        ))}

        {!visibleVoters.length ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No voters in this mock booth list</Text>
            <Text style={styles.emptyText}>
              Add or replace the mock entries later once real booth data is connected.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#D7DBE7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { color: "#00236F", fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#5A6272", fontSize: 13, fontWeight: "600" },
  content: { padding: 16, gap: 12, paddingBottom: 96 },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    backgroundColor: "#DDF7EB",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeText: { color: "#00714D", fontSize: 12, fontWeight: "700" },
  badgeMuted: {
    borderRadius: 999,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  badgeMutedText: { color: "#264191", fontSize: 12, fontWeight: "700" },
  card: {
    borderWidth: 1,
    borderColor: "#D7DFEF",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 10,
  },
  cardTitle: { color: "#121C28", fontSize: 18, fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  infoLabel: { color: "#5A6272", fontSize: 13, fontWeight: "600" },
  infoValue: {
    flex: 1,
    textAlign: "right",
    color: "#121C28",
    fontSize: 13,
  },
  emptyState: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C5C5D3",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFF",
  },
  emptyTitle: { color: "#121C28", fontSize: 14, fontWeight: "700" },
  emptyText: { color: "#5A6272", fontSize: 12, lineHeight: 18, textAlign: "center" },
});
