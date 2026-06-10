import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function ConfigCard({
  icon,
  title,
  desc,
  action,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  desc: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.configCard}
      activeOpacity={0.9}
      onPress={onPress}
    >
      <View style={styles.configIcon}>
        <MaterialIcons name={icon} size={24} color="#00236F" />
      </View>
      <Text style={styles.configTitle}>{title}</Text>
      <Text style={styles.configDesc}>{desc}</Text>
      <View style={styles.configActionRow}>
        <Text style={styles.configAction}>{action}</Text>
        <MaterialIcons name="arrow-forward" size={17} color="#00236F" />
      </View>
    </TouchableOpacity>
  );
}

export default function AdminSettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: () => void logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandIcon}>
            <MaterialIcons name="account-balance" size={20} color="#FFFFFF" />
          </View>
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
        <View style={styles.hero}>
          <Text style={styles.pageTitle}>Admin Configuration</Text>
          <Text style={styles.pageSub}>
            Manage core parameters, user access, and notification protocols for
            the constituency portal.
          </Text>
        </View>

        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileAvatar}>
              <MaterialIcons name="person" size={20} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.profileName}>Admin User</Text>
              <Text style={styles.profileRole}>System Administrator</Text>
            </View>
          </View>
          <View style={styles.profileActions}>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <MaterialIcons name="logout" size={18} color="#B3261E" />
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.grid}>
          <ConfigCard
            icon="group"
            title="Manage Users/Roles"
            desc="Assign administrative privileges, define ward responsibilities, and monitor staff activity logs."
            action="Configure Access"
            onPress={() =>
              Alert.alert("Users", "User management is a placeholder.")
            }
          />
          <ConfigCard
            icon="alt-route"
            title="Complaint Routing Matrix"
            desc="Set automated logic for grievance escalation based on department, urgency, and geography."
            action="Define Workflows"
            onPress={() => router.push("/admin/routing" as never)}
          />
          <ConfigCard
            icon="translate"
            title="Language Management"
            desc="Update translations for Hindi, Marathi, and English. Manage localized content across the portal."
            action="Manage Scripts"
            onPress={() =>
              Alert.alert("Language", "Language management is a placeholder.")
            }
          />
          <ConfigCard
            icon="chat"
            title="WhatsApp Settings"
            desc="Configure automated updates, citizen registration via WhatsApp, and API integrations."
            action="API Console"
            onPress={() => router.push("/admin/whatsapp" as never)}
          />
          <ConfigCard
            icon="gavel"
            title="Moderation"
            desc="Set keyword filters for the feed, manage flagged reports, and review constituent feedback."
            action="Content Safety"
            onPress={() =>
              Alert.alert("Moderation", "Moderation tools are a placeholder.")
            }
          />
          <View style={styles.pulseCard}>
            <View style={styles.pulseHead}>
              <Text style={styles.pulseTitle}>System Pulse</Text>
              <View style={styles.pulseDot} />
            </View>
            <View style={styles.pulseLines}>
              <View style={[styles.pulseLine, { width: "75%" }]} />
              <View style={[styles.pulseLine, { width: "52%" }]} />
              <View style={[styles.pulseLine, { width: "82%" }]} />
            </View>
            <Text style={styles.pulseSub}>
              All systems operational. Last sync 2m ago.
            </Text>
          </View>
        </View>

        <View style={styles.intelCard}>
          <Text style={styles.intelTitle}>Platform Intelligence</Text>
          <Text style={styles.intelText}>
            Our automated routing matrix has improved grievance resolution times
            by 34% this quarter. Ensure your department hubs are synchronized
            with the latest ward data for optimal performance.
          </Text>
          <TouchableOpacity
            style={styles.reportBtn}
            onPress={() =>
              Alert.alert("Report", "Report download is a placeholder.")
            }
          >
            <Text style={styles.reportText}>Download Quarterly Report</Text>
          </TouchableOpacity>
          <View style={styles.imageMock}>
            <MaterialIcons name="insights" size={40} color="#90A8FF" />
          </View>
        </View>
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
    paddingHorizontal: 14,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#00236F", fontSize: 22, fontWeight: "700" },
  langBtn: {
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langText: { color: "#00236F", fontSize: 13, fontWeight: "600" },
  content: { padding: 16, paddingBottom: 92, gap: 14 },
  hero: { gap: 6 },
  pageTitle: { color: "#121C28", fontSize: 24, fontWeight: "700" },
  pageSub: { color: "#444651", fontSize: 14, lineHeight: 20 },
  grid: { gap: 10 },
  profileCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  profileHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#00236F",
    alignItems: "center",
    justifyContent: "center",
  },
  profileName: { color: "#121C28", fontSize: 16, fontWeight: "700" },
  profileRole: { color: "#444651", fontSize: 12, marginTop: 2 },
  profileActions: { flexDirection: "row", justifyContent: "flex-end" },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#F4C7C3",
    backgroundColor: "#FFF1F1",
  },
  logoutText: { color: "#B3261E", fontSize: 12, fontWeight: "700" },
  configCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    padding: 14,
    minHeight: 170,
  },
  configIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#DFE9FA",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  configTitle: {
    color: "#121C28",
    fontSize: 19,
    fontWeight: "600",
    marginBottom: 6,
  },
  configDesc: { color: "#444651", fontSize: 13, lineHeight: 19 },
  configActionRow: {
    marginTop: "auto",
    flexDirection: "row",
    alignItems: "center",
  },
  configAction: {
    color: "#00236F",
    fontSize: 14,
    fontWeight: "700",
    marginRight: 6,
  },
  pulseCard: {
    backgroundColor: "#E5EEFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    padding: 14,
    minHeight: 170,
  },
  pulseHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  pulseTitle: {
    color: "#444651",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  pulseDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#006C49",
  },
  pulseLines: { gap: 10, marginBottom: 16 },
  pulseLine: { height: 8, borderRadius: 4, backgroundColor: "#C5C5D3" },
  pulseSub: { color: "#444651", fontSize: 12, fontStyle: "italic" },
  intelCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  intelTitle: { color: "#121C28", fontSize: 24, fontWeight: "700" },
  intelText: { color: "#444651", fontSize: 14, lineHeight: 21 },
  reportBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#00236F",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  reportText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  imageMock: {
    height: 160,
    borderRadius: 12,
    backgroundColor: "#DFE9FA",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  navText: { color: "#444651", fontSize: 12, fontWeight: "500" },
  activeNav: {
    backgroundColor: "#6CF8BB",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  activeNavText: { color: "#00714D", fontSize: 12, fontWeight: "700" },
});
