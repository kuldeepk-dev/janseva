import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type BoothWorkerTab = "home" | "voters" | "posts" | "profile";

export function BoothWorkerBottomLayout({
  activeTab,
}: {
  activeTab: BoothWorkerTab;
}) {
  const router = useRouter();
  const [layoutWidth, setLayoutWidth] = useState(0);
  const tabIndex =
    activeTab === "home"
      ? 0
      : activeTab === "voters"
        ? 1
        : activeTab === "posts"
          ? 2
          : 3;
  const animatedIndex = useRef(new Animated.Value(tabIndex)).current;

  useEffect(() => {
    Animated.timing(animatedIndex, {
      toValue: tabIndex,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animatedIndex, tabIndex]);

  const segmentWidth = layoutWidth > 0 ? layoutWidth / 4 : 0;
  const indicatorWidth = segmentWidth > 0 ? Math.max(76, segmentWidth - 16) : 76;
  const translateX = animatedIndex.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [
      segmentWidth * 0 + (segmentWidth - indicatorWidth) / 2,
      segmentWidth * 1 + (segmentWidth - indicatorWidth) / 2,
      segmentWidth * 2 + (segmentWidth - indicatorWidth) / 2,
      segmentWidth * 3 + (segmentWidth - indicatorWidth) / 2,
    ],
  });

  return (
    <View
      style={styles.bottomNav}
      onLayout={event => setLayoutWidth(event.nativeEvent.layout.width)}
    >
      {layoutWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.activeIndicator,
            { width: indicatorWidth, transform: [{ translateX }] },
          ]}
        />
      ) : null}

      <TouchableOpacity
        style={styles.tab}
        onPress={() => {
          if (activeTab !== "home") {
            router.push("/booth-worker" as never);
          }
        }}
      >
        <MaterialIcons
          name="dashboard"
          size={20}
          color={activeTab === "home" ? "#00714D" : "#444651"}
        />
        <Text style={activeTab === "home" ? styles.activeText : styles.tabText}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => {
          if (activeTab !== "voters") {
            router.push("/booth-worker/voters" as never);
          }
        }}
      >
        <MaterialIcons
          name="groups"
          size={20}
          color={activeTab === "voters" ? "#00714D" : "#444651"}
        />
        <Text style={activeTab === "voters" ? styles.activeText : styles.tabText}>
          Voters
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => {
          if (activeTab !== "posts") {
            router.push("/booth-worker/posts" as never);
          }
        }}
      >
        <MaterialIcons
          name="campaign"
          size={20}
          color={activeTab === "posts" ? "#00714D" : "#444651"}
        />
        <Text style={activeTab === "posts" ? styles.activeText : styles.tabText}>
          Posts
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.tab}
        onPress={() => {
          if (activeTab !== "profile") {
            router.push("/booth-worker/profile" as never);
          }
        }}
      >
        <MaterialIcons
          name="person"
          size={20}
          color={activeTab === "profile" ? "#00714D" : "#444651"}
        />
        <Text style={activeTab === "profile" ? styles.activeText : styles.tabText}>
          Profile
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
    height: 66,
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  activeIndicator: {
    position: "absolute",
    height: 40,
    top: 13,
    left: 0,
    borderRadius: 14,
    backgroundColor: "#6CF8BB",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    zIndex: 2,
  },
  tabText: { fontSize: 12, color: "#444651", fontWeight: "500" },
  activeText: { fontSize: 12, color: "#00714D", fontWeight: "700" },
});
