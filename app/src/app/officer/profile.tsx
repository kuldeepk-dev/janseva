import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { logout as logoutApi } from "../../services/authService";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OfficerProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logoutApi();
    await logout();
    router.replace("/login" as never);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Officer Profile</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <MaterialIcons name="person" size={40} color="#FFFFFF" />
        </View>
        <Text style={styles.name}>Officer Vikram Singh</Text>
        <Text style={styles.meta}>officer@janseva.local</Text>
        <Text style={styles.meta}>Role: Officer</Text>

        <TouchableOpacity
          style={styles.logout}
          onPress={handleLogout}
        >
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
    justifyContent: "center",
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#D7DBE7",
    backgroundColor: "#FFFFFF",
  },
  title: { color: "#00236F", fontSize: 22, fontWeight: "700" },
  card: {
    margin: 16,
    borderWidth: 1,
    borderColor: "#D7DBE7",
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    padding: 20,
    alignItems: "center",
    gap: 8,
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
  logout: {
    marginTop: 12,
    width: "100%",
    height: 46,
    borderRadius: 10,
    backgroundColor: "#B3261E",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
