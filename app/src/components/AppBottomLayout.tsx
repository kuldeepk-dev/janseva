import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type TabKey = "home" | "grievance" | "feed" | "profile";

export function AppBottomLayout({
  activeTab = "home",
  onAiPress,
}: {
  activeTab?: TabKey;
  onAiPress?: () => void;
}) {
  const router = useRouter();
  const handleAiPress =
    onAiPress ??
    (() => Alert.alert("AI Help", "Shortcuts are available on the dashboard."));

  return (
    <>
      <View style={styles.aiWrap}>
        <TouchableOpacity style={styles.aiBtn} onPress={handleAiPress}>
          <MaterialIcons name="smart-toy" size={28} color="#90A8FF" />
        </TouchableOpacity>
      </View>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "home" && styles.activeTab]}
          onPress={() => router.push("/dashboard" as never)}
        >
          <MaterialIcons
            name="dashboard"
            size={20}
            color={activeTab === "home" ? "#00714D" : "#444651"}
          />
          <Text
            style={activeTab === "home" ? styles.activeTabText : styles.tabText}
          >
            Home
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "grievance" && styles.activeTab]}
          onPress={() => router.push("/complaints" as never)}
        >
          <MaterialIcons
            name="description"
            size={20}
            color={activeTab === "grievance" ? "#00714D" : "#444651"}
          />
          <Text
            style={
              activeTab === "grievance" ? styles.activeTabText : styles.tabText
            }
          >
            Grievance
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "feed" && styles.activeTab]}
          onPress={() => router.push("/feed" as never)}
        >
          <MaterialIcons
            name="rss-feed"
            size={20}
            color={activeTab === "feed" ? "#00714D" : "#444651"}
          />
          <Text
            style={activeTab === "feed" ? styles.activeTabText : styles.tabText}
          >
            Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "profile" && styles.activeTab]}
          onPress={() => router.push("/citizen/profile" as never)}
        >
          <MaterialIcons
            name="person"
            size={20}
            color={activeTab === "profile" ? "#00714D" : "#444651"}
          />
          <Text
            style={
              activeTab === "profile" ? styles.activeTabText : styles.tabText
            }
          >
            Profile
          </Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  aiWrap: { position: "absolute", right: 16, bottom: 80, zIndex: 60 },
  aiBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#1E3A8A",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 64,
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  tab: { alignItems: "center", justifyContent: "center" },
  activeTab: {
    backgroundColor: "#6CF8BB",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  tabText: { fontSize: 12, color: "#444651", fontWeight: "500" },
  activeTabText: { fontSize: 12, color: "#00714D", fontWeight: "600" },
});
