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

type AdminTab = "settings" | "complaints";

export function AdminBottomLayout({ activeTab }: { activeTab: AdminTab }) {
  const router = useRouter();
  const [layoutWidth, setLayoutWidth] = useState(0);
  const tabIndex = activeTab === "settings" ? 0 : 1;
  const animatedIndex = useRef(new Animated.Value(tabIndex)).current;
  const iconScales = useRef({
    settings: new Animated.Value(activeTab === "settings" ? 1.1 : 1),
    complaints: new Animated.Value(activeTab === "complaints" ? 1.1 : 1),
  }).current;

  useEffect(() => {
    Animated.timing(animatedIndex, {
      toValue: tabIndex,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [animatedIndex, tabIndex]);

  useEffect(() => {
    const runBounce = (value: Animated.Value, isActive: boolean) =>
      isActive
        ? Animated.sequence([
            Animated.timing(value, {
              toValue: 1.2,
              duration: 140,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.spring(value, {
              toValue: 1,
              friction: 6,
              tension: 140,
              useNativeDriver: true,
            }),
          ])
        : Animated.timing(value, {
            toValue: 1,
            duration: 120,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          });

    Animated.parallel([
      runBounce(iconScales.settings, activeTab === "settings"),
      runBounce(iconScales.complaints, activeTab === "complaints"),
    ]).start();
  }, [activeTab, iconScales]);

  const segmentWidth = layoutWidth > 0 ? layoutWidth / 2 : 0;
  const indicatorWidth =
    segmentWidth > 0 ? Math.max(92, segmentWidth - 20) : 92;
  const translateX = animatedIndex.interpolate({
    inputRange: [0, 1],
    outputRange: [
      segmentWidth * 0 + (segmentWidth - indicatorWidth) / 2,
      segmentWidth * 1 + (segmentWidth - indicatorWidth) / 2,
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
        style={[styles.tab, activeTab === "settings" && styles.activeTab]}
        onPress={() => {
          if (activeTab !== "settings") {
            router.push("/admin/settings" as never);
          }
        }}
      >
        <Animated.View style={{ transform: [{ scale: iconScales.settings }] }}>
          <MaterialIcons
            name="settings"
            size={20}
            color={activeTab === "settings" ? "#00714D" : "#444651"}
          />
        </Animated.View>
        <Text
          style={activeTab === "settings" ? styles.activeText : styles.tabText}
        >
          Settings
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "complaints" && styles.activeTab]}
        onPress={() => {
          if (activeTab !== "complaints") {
            router.push("/admin/complaint-lifecycle" as never);
          }
        }}
      >
        <Animated.View
          style={{ transform: [{ scale: iconScales.complaints }] }}
        >
          <MaterialIcons
            name="report-problem"
            size={20}
            color={activeTab === "complaints" ? "#00714D" : "#444651"}
          />
        </Animated.View>
        <Text
          style={
            activeTab === "complaints" ? styles.activeText : styles.tabText
          }
        >
          Complaints
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
