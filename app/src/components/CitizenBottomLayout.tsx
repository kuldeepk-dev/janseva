import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useRef } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type CitizenTab = "home" | "grievance" | "feed" | "profile";

export function CitizenBottomLayout({
  activeTab = "home",
  onAiPress,
}: {
  activeTab?: CitizenTab;
  onAiPress?: () => void;
}) {
  const router = useRouter();
  const tabs = useMemo<CitizenTab[]>(
    () => ["home", "grievance", "feed", "profile"],
    [],
  );
  const screenWidth = Dimensions.get("window").width;
  const tabWidth = (screenWidth - 16) / tabs.length;
  const activeIndex = Math.max(0, tabs.indexOf(activeTab));
  const indicatorX = useRef(new Animated.Value(activeIndex * tabWidth)).current;
  const iconAnim = useRef({
    home: new Animated.Value(activeTab === "home" ? 1 : 0),
    grievance: new Animated.Value(activeTab === "grievance" ? 1 : 0),
    feed: new Animated.Value(activeTab === "feed" ? 1 : 0),
    profile: new Animated.Value(activeTab === "profile" ? 1 : 0),
  }).current;

  useEffect(() => {
    Animated.spring(indicatorX, {
      toValue: activeIndex * tabWidth,
      useNativeDriver: true,
      damping: 18,
      stiffness: 220,
      mass: 0.7,
    }).start();
    tabs.forEach(tab => {
      Animated.timing(iconAnim[tab], {
        toValue: tab === activeTab ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    });
  }, [activeIndex, activeTab, iconAnim, indicatorX, tabWidth, tabs]);

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
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activePill,
            {
              width: tabWidth - 8,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />
        <TouchableOpacity
          style={styles.tab}
          onPress={() => {
            if (activeTab !== "home") {
              router.replace("/dashboard" as never);
            }
          }}
        >
          <Animated.View
            style={{
              alignItems: "center",
              transform: [
                {
                  scale: iconAnim.home.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                },
                {
                  translateY: iconAnim.home.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -1],
                  }),
                },
              ],
            }}
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
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => {
            if (activeTab !== "grievance") {
              router.replace("/complaints" as never);
            }
          }}
        >
          <Animated.View
            style={{
              alignItems: "center",
              transform: [
                {
                  scale: iconAnim.grievance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                },
                {
                  translateY: iconAnim.grievance.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -1],
                  }),
                },
              ],
            }}
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
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => {
            if (activeTab !== "feed") {
              router.replace("/feed" as never);
            }
          }}
        >
          <Animated.View
            style={{
              alignItems: "center",
              transform: [
                {
                  scale: iconAnim.feed.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                },
                {
                  translateY: iconAnim.feed.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -1],
                  }),
                },
              ],
            }}
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
          </Animated.View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => {
            if (activeTab !== "profile") {
              router.replace("/citizen/profile" as never);
            }
          }}
        >
          <Animated.View
            style={{
              alignItems: "center",
              transform: [
                {
                  scale: iconAnim.profile.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.08],
                  }),
                },
                {
                  translateY: iconAnim.profile.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -1],
                  }),
                },
              ],
            }}
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
          </Animated.View>
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
    left: 8,
    right: 8,
    bottom: 0,
    height: 64,
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 4,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: "hidden",
  },
  activePill: {
    position: "absolute",
    left: 4,
    top: 8,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#6CF8BB",
  },
  tab: {
    flex: 1,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  tabText: { fontSize: 12, color: "#444651", fontWeight: "500" },
  activeTabText: { fontSize: 12, color: "#00714D", fontWeight: "600" },
});
