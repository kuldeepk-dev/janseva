import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function SettingCard({
  icon,
  title,
  value,
  status,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  value: string;
  status?: "ok" | "warn";
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <View style={styles.cardIcon}>
          <MaterialIcons name={icon} size={18} color="#00236F" />
        </View>
        {status ? (
          <View
            style={[
              styles.badge,
              status === "ok" ? styles.badgeOk : styles.badgeWarn,
            ]}
          >
            <Text
              style={[
                styles.badgeText,
                status === "ok" ? styles.badgeOkText : styles.badgeWarnText,
              ]}
            >
              {status === "ok" ? "Healthy" : "Action Needed"}
            </Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.cardTitle}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

export default function LeadershipSettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.seal} />
          <Text style={styles.brand}>Swaraj Portal</Text>
        </View>
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() =>
            Alert.alert("Language", "Language picker coming soon.")
          }
        >
          <MaterialIcons name="language" size={17} color="#00236F" />
          <Text style={styles.langText}>English</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title}>Leadership Settings</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => router.back()}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={() =>
                Alert.alert("Settings", "Changes saved successfully.")
              }
            >
              <Text style={styles.saveText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.grid}>
          <SettingCard
            icon="credit-card"
            title="Credits & API Usage"
            value="2,430 / 5,000 monthly credits"
            status="ok"
          />
          <SettingCard
            icon="translate"
            title="Default Language"
            value="English (India)"
          />
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>Account Preferences</Text>
          <Text style={styles.panelSub}>
            Review leadership profile settings and localization defaults for
            the portal.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  seal: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#1E3A8A" },
  brand: { color: "#00236F", fontSize: 21, fontWeight: "700" },
  langBtn: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  langText: { color: "#00236F", fontSize: 13, fontWeight: "600" },
  content: { padding: 16, paddingBottom: 100, gap: 12 },
  titleRow: { gap: 10 },
  title: { color: "#121C28", fontSize: 29, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 8 },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#FFFFFF",
  },
  cancelText: { color: "#444651", fontSize: 13, fontWeight: "600" },
  saveBtn: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "#00236F",
  },
  saveText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  grid: { gap: 10 },
  card: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    gap: 6,
  },
  cardHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#DFE9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  badgeOk: { backgroundColor: "#DEFBE6" },
  badgeWarn: { backgroundColor: "#FFF1CC" },
  badgeText: { fontSize: 10, fontWeight: "700" },
  badgeOkText: { color: "#006C49" },
  badgeWarnText: { color: "#7A5900" },
  cardTitle: { color: "#444651", fontSize: 12 },
  cardValue: { color: "#121C28", fontSize: 16, fontWeight: "700" },
  panel: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 12,
    gap: 10,
  },
  panelTitle: { color: "#121C28", fontSize: 18, fontWeight: "600" },
  panelSub: { color: "#444651", fontSize: 12, lineHeight: 18 },
});
