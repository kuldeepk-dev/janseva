import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type LeadershipTab = "dashboard" | "social" | "menu";

export function LeadershipBottomNav({
  activeTab = "dashboard",
}: {
  activeTab?: LeadershipTab;
}) {
  const router = useRouter();

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity
        style={[styles.navItem, activeTab === "dashboard" && styles.activeNav]}
        onPress={() => {
          if (activeTab !== "dashboard") {
            router.push("/leader" as never);
          }
        }}
      >
        <MaterialIcons
          name="dashboard"
          size={20}
          color={activeTab === "dashboard" ? "#002113" : "#444651"}
        />
        <Text
          style={
            activeTab === "dashboard" ? styles.activeNavText : styles.navText
          }
        >
          Dashboard
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === "social" && styles.activeNav]}
        onPress={() => {
          if (activeTab !== "social") {
            router.push("/feed" as never);
          }
        }}
      >
        <MaterialIcons
          name="share"
          size={20}
          color={activeTab === "social" ? "#002113" : "#444651"}
        />
        <Text
          style={activeTab === "social" ? styles.activeNavText : styles.navText}
        >
          Social
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.navItem, activeTab === "menu" && styles.activeNav]}
        onPress={() => {
          if (activeTab !== "menu") {
            router.push("/leadership/settings" as never);
          }
        }}
      >
        <MaterialIcons
          name="menu"
          size={20}
          color={activeTab === "menu" ? "#002113" : "#444651"}
        />
        <Text
          style={activeTab === "menu" ? styles.activeNavText : styles.navText}
        >
          Menu
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
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
    paddingVertical: 4,
    borderRadius: 16,
  },
  activeNav: { backgroundColor: "#6CF8BB" },
  navText: { color: "#444651", fontSize: 12, fontWeight: "500" },
  activeNavText: { color: "#002113", fontSize: 12, fontWeight: "700" },
});
