import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { apiConfigError } from "../../lib/api";
import { getCurrentProfile, type Profile } from "../../services/authService";
import { logout as logoutApi } from "../../services/authService";
import { getMyVoter, type Voter } from "../../services/voterService";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CitizenProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const [voter, setVoter] = useState<Voter | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (apiConfigError) {
        return;
      }
      try {
        const [nextVoter, nextProfile] = await Promise.all([
          getMyVoter(),
          getCurrentProfile(),
        ]);
        if (!isActive) {
          return;
        }
        setVoter(nextVoter);
        setProfile(nextProfile);
      } catch {
        if (!isActive) {
          return;
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

  const displayName = voter?.full_name?.trim() || profile?.full_name?.trim() || "Citizen User";
  const displayMeta = [
    voter?.voter_id ? `Voter ID: ${voter.voter_id}` : null,
    voter?.booth_number ? `Booth: ${voter.booth_number}` : null,
    voter?.village ? voter.village : null,
  ].filter(Boolean);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
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
        <Text style={styles.title}>Citizen Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.avatar}>
            {voter?.photo_url ? (
              <Image source={{ uri: voter.photo_url }} style={styles.avatarImage} />
            ) : (
              <MaterialIcons name="person" size={48} color="#FFFFFF" />
            )}
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.meta}>{displayMeta.join(" • ") || "Role: Citizen"}</Text>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/register?mode=edit" as never)}
          >
            <MaterialIcons name="edit" size={18} color="#00236F" />
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <MaterialIcons name="logout" size={18} color="#FFFFFF" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Saved Details</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Father / Husband</Text>
            <Text style={styles.infoValue}>{voter?.father_name || "Not added"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Occupation</Text>
            <Text style={styles.infoValue}>{voter?.occupation || "Not added"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Panchayat</Text>
            <Text style={styles.infoValue}>{voter?.panchayat || "Not added"}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Mobile</Text>
            <Text style={styles.infoValue}>{voter?.mobile || profile?.mobile || "Not added"}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#D7DBE7",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: { padding: 4, borderRadius: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#00236F" },
  content: { padding: 16, gap: 14 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D7DBE7",
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  name: { fontSize: 20, fontWeight: "700", color: "#121C28" },
  meta: { fontSize: 13, color: "#5A6272", marginBottom: 12, textAlign: "center" },
  actionBtn: {
    width: "100%",
    height: 46,
    borderWidth: 1,
    borderColor: "#B8C2D8",
    borderRadius: 10,
    backgroundColor: "#EDF3FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  actionText: { color: "#00236F", fontSize: 14, fontWeight: "600" },
  logoutBtn: {
    width: "100%",
    height: 46,
    borderRadius: 10,
    backgroundColor: "#B3261E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  logoutText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  infoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D7DBE7",
    backgroundColor: "#FFFFFF",
    padding: 18,
    gap: 14,
  },
  infoTitle: { fontSize: 16, fontWeight: "700", color: "#00236F" },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  infoLabel: { color: "#5A6272", fontSize: 13, flex: 1 },
  infoValue: {
    color: "#121C28",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
});
