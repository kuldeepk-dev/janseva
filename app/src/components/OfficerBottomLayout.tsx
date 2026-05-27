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

type OfficerTab = "home" | "queue" | "profile";

export function OfficerBottomLayout({ activeTab }: { activeTab: OfficerTab }) {
  const router = useRouter();
  const [layoutWidth, setLayoutWidth] = useState(0);
  const tabIndex = activeTab === "home" ? 0 : activeTab === "queue" ? 1 : 2;
  const animatedIndex = useRef(new Animated.Value(tabIndex)).current;

  useEffect(() => {
    Animated.timing(animatedIndex, {
      toValue: tabIndex,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animatedIndex, tabIndex]);

  const segmentWidth = layoutWidth > 0 ? layoutWidth / 3 : 0;
  const indicatorWidth = segmentWidth > 0 ? Math.max(92, segmentWidth - 20) : 92;
  const translateX = animatedIndex.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      segmentWidth * 0 + (segmentWidth - indicatorWidth) / 2,
      segmentWidth * 1 + (segmentWidth - indicatorWidth) / 2,
      segmentWidth * 2 + (segmentWidth - indicatorWidth) / 2,
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
        style={[styles.tab, activeTab === "home" && styles.activeTab]}
        onPress={() => {
          if (activeTab !== "home") {
            router.push("/officer" as never);
          }
        }}
      >
        <MaterialIcons
          name="home"
          size={20}
          color={activeTab === "home" ? "#00714D" : "#444651"}
        />
        <Text style={activeTab === "home" ? styles.activeText : styles.tabText}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "queue" && styles.activeTab]}
        onPress={() => {
          if (activeTab !== "queue") {
            router.push("/officer/queue" as never);
          }
        }}
      >
        <MaterialIcons
          name="assignment"
          size={20}
          color={activeTab === "queue" ? "#00714D" : "#444651"}
        />
        <Text style={activeTab === "queue" ? styles.activeText : styles.tabText}>
          Queue
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "profile" && styles.activeTab]}
        onPress={() => {
          if (activeTab !== "profile") {
            router.push("/officer/profile" as never);
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
    justifyContent: "space-around",
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
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    minWidth: 92,
    zIndex: 2,
  },
  activeTab: {
    backgroundColor: "transparent",
  },
  tabText: { fontSize: 12, color: "#444651", fontWeight: "500" },
  activeText: { fontSize: 12, color: "#00714D", fontWeight: "700" },
});
