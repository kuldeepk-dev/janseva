import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCurrentProfile, logout as logoutApi, type Profile } from "../../services/authService";
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

function ActionCard({
  icon,
  iconColor,
  iconBg,
  title,
  body,
  ctaLabel,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  body: string;
  ctaLabel: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.actionCard}>
      <View style={[styles.actionIcon, { backgroundColor: iconBg }]}>
        <MaterialIcons name={icon} size={24} color={iconColor} />
      </View>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionBody}>{body}</Text>
      <TouchableOpacity style={styles.primaryAction} onPress={onPress}>
        <Text style={styles.primaryActionText}>{ctaLabel}</Text>
        <MaterialIcons name="arrow-forward" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}

function QuickTile({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickTile} onPress={onPress}>
      <View style={styles.quickIconWrap}>
        <MaterialIcons name={icon} size={20} color="#00236F" />
      </View>
      <Text style={styles.quickText}>{label}</Text>
      <MaterialIcons name="chevron-right" size={18} color="#8A8F9B" />
    </TouchableOpacity>
  );
}

export default function BoothWorkerDashboardScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const currentProfile = await getCurrentProfile();
        if (!isActive) {
          return;
        }
        setProfile(currentProfile);
      } catch {
        if (!isActive) {
          return;
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

  const handleLogout = async () => {
    await logoutApi();
    await logout();
  };

  const assignedBooth = profile?.assigned_booth_number || "12";
  const workerName = profile?.full_name || "Booth Worker";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.brand}>Jan Seva</Text>
          <Text style={styles.headerSub}>Booth Worker Console</Text>
        </View>
        <TouchableOpacity
          style={styles.profileBtn}
          onPress={() => router.push("/booth-worker/profile" as never)}
        >
          <MaterialIcons name="badge" size={20} color="#00236F" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroBadge}>
              <MaterialIcons name="how-to-reg" size={16} color="#00714D" />
              <Text style={styles.heroBadgeText}>Assigned booth</Text>
            </View>
            <Text style={styles.heroBooth}>Booth {assignedBooth}</Text>
          </View>
          <Text style={styles.heroTitle}>{workerName}</Text>
          <Text style={styles.heroBody}>
            Register voters, log walk-in complaints, create booth-level posts,
            and review the voter list for your assigned booth.
          </Text>
        </View>

        <View style={styles.quickGrid}>
          <QuickTile
            icon="groups"
            label="View Booth Voters"
            onPress={() => router.push("/booth-worker/voters" as never)}
          />
          <QuickTile
            icon="campaign"
            label="Create Post"
            onPress={() => router.push("/booth-worker/posts" as never)}
          />
          <QuickTile
            icon="person"
            label="Profile"
            onPress={() => router.push("/booth-worker/profile" as never)}
          />
          <QuickTile icon="logout" label="Logout" onPress={handleLogout} />
        </View>

        <ActionCard
          icon="person-add"
          iconColor="#00714D"
          iconBg="#DDF7EB"
          title="Register New Voter"
          body="Create a voter entry directly from the booth desk. The booth number is locked to your assigned booth."
          ctaLabel="Open Registration"
          onPress={() =>
            router.push(
              {
                pathname: "/register",
                params: { source: "booth-worker" },
              } as never,
            )
          }
        />

        <ActionCard
          icon="edit-note"
          iconColor="#264191"
          iconBg="#E7ECFF"
          title="Log Walk-in Complaint"
          body="Create a complaint on behalf of a voter visiting your booth."
          ctaLabel="Open Complaint Form"
          onPress={() => router.push("/operator/complaints/new" as never)}
        />

        <View style={styles.infoCard}>
          <View style={styles.infoHead}>
            <Text style={styles.infoTitle}>Booth Snapshot</Text>
            {loading ? <ActivityIndicator size="small" color="#00236F" /> : null}
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Role</Text>
            <Text style={styles.infoValue}>Booth Worker</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Booth</Text>
            <Text style={styles.infoValue}>{assignedBooth}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Post Maker</Text>
            <Text style={styles.infoValue}>Manual now, AI UI ready</Text>
          </View>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() =>
              Alert.alert(
                "Coming Soon",
                "Advanced booth analytics can be added here later.",
              )
            }
          >
            <Text style={styles.secondaryBtnText}>More Booth Tools</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 62,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#D7DBE7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { color: "#00236F", fontSize: 24, fontWeight: "700" },
  headerSub: { color: "#5A6272", fontSize: 12, fontWeight: "600" },
  profileBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#D7DBE7",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  content: { padding: 16, gap: 14, paddingBottom: 96 },
  heroCard: {
    borderRadius: 22,
    backgroundColor: "#0E2A6D",
    padding: 18,
    gap: 10,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  heroBadgeText: { color: "#00714D", fontSize: 11, fontWeight: "700" },
  heroBooth: { color: "#B7C8FF", fontSize: 13, fontWeight: "700" },
  heroTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "700" },
  heroBody: { color: "#D8E2FF", fontSize: 13, lineHeight: 19 },
  quickGrid: { gap: 10 },
  quickTile: {
    borderWidth: 1,
    borderColor: "#D7DFEF",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  quickText: { flex: 1, color: "#121C28", fontSize: 14, fontWeight: "700" },
  actionCard: {
    borderWidth: 1,
    borderColor: "#D7DFEF",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 12,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: { color: "#121C28", fontSize: 20, fontWeight: "700" },
  actionBody: { color: "#444651", fontSize: 13, lineHeight: 19 },
  primaryAction: {
    height: 48,
    borderRadius: 14,
    backgroundColor: "#00236F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryActionText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  infoCard: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 10,
  },
  infoHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  infoTitle: { color: "#121C28", fontSize: 18, fontWeight: "700" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  infoLabel: { color: "#5A6272", fontSize: 13 },
  infoValue: { color: "#00236F", fontSize: 13, fontWeight: "700" },
  secondaryBtn: {
    marginTop: 4,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { color: "#00236F", fontSize: 14, fontWeight: "700" },
});
