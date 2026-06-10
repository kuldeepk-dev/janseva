import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { logout as logoutApi } from "../../services/authService";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function CitizenProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();

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
              router.replace("/dashboard" as never);
            }
          }}
        >
          <MaterialIcons name="arrow-back" size={22} color="#00236F" />
        </TouchableOpacity>
        <Text style={styles.title}>Citizen Profile</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={48} color="#FFFFFF" />
        </View>
        <Text style={styles.name}>Citizen User</Text>
        <Text style={styles.meta}>Role: Citizen</Text>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => Alert.alert("Soon", "Edit profile will be added soon.")}
        >
          <MaterialIcons name="edit" size={18} color="#00236F" />
          <Text style={styles.actionText}>Edit Profile</Text>
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
  card: {
    margin: 16,
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
  },
  name: { fontSize: 20, fontWeight: "700", color: "#121C28" },
  meta: { fontSize: 13, color: "#5A6272", marginBottom: 12 },
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
});
