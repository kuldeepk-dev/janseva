import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCurrentProfile, logout as logoutApi, type Profile } from "../../services/authService";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BoothWorkerProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
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

  const handleLogout = async () => {
    await logoutApi();
    await logout();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/booth-worker" as never);
            }
          }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#00236F" />
        </TouchableOpacity>
        <Text style={styles.title}>Booth Worker Profile</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <MaterialIcons name="badge" size={44} color="#FFFFFF" />
        </View>
        {loading ? (
          <ActivityIndicator size="small" color="#00236F" />
        ) : (
          <>
            <Text style={styles.name}>{profile?.full_name || "Demo Booth Worker"}</Text>
            <Text style={styles.meta}>{profile?.email || "boothworker@janseva.local"}</Text>
            <Text style={styles.meta}>Role: Booth Worker</Text>
            <Text style={styles.meta}>
              Assigned Booth: {profile?.assigned_booth_number || "12"}
            </Text>
          </>
        )}

        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={() => router.push("/booth-worker/voters" as never)}
        >
          <MaterialIcons name="groups" size={18} color="#00236F" />
          <Text style={styles.secondaryBtnText}>View Booth Voter List</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={18} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#D7DBE7",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: { padding: 4, borderRadius: 16 },
  title: { fontSize: 22, fontWeight: "700", color: "#00236F" },
  card: {
    margin: 16,
    borderWidth: 1,
    borderColor: "#D7DBE7",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
    gap: 10,
    marginBottom: 96,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  name: { fontSize: 20, fontWeight: "700", color: "#121C28" },
  meta: { fontSize: 13, color: "#5A6272" },
  secondaryBtn: {
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
    marginTop: 10,
  },
  secondaryBtnText: { color: "#00236F", fontSize: 14, fontWeight: "600" },
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
});
