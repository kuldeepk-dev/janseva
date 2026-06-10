import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Layer = "voters" | "complaints" | "campaigns";

const layerTheme: Record<
  Layer,
  { tab: string; palette: string[]; marker: string }
> = {
  voters: {
    tab: "#006C49",
    marker: "#006C49",
    palette: ["#006C49", "#00714D", "#4EDEA3", "#6CF8BB", "#6FFBBE"],
  },
  complaints: {
    tab: "#BA1A1A",
    marker: "#BA1A1A",
    palette: ["#BA1A1A", "#93000A", "#FFDAD6", "#FFB4AB", "#E57373"],
  },
  campaigns: {
    tab: "#00236F",
    marker: "#00236F",
    palette: ["#00236F", "#1E3A8A", "#4059AA", "#90A8FF", "#B6C4FF"],
  },
};

export default function HeatmapScreen() {
  const router = useRouter();
  const [layer, setLayer] = useState<Layer>("voters");
  const blocks = useMemo(() => {
    const colors = layerTheme[layer].palette;
    return Array.from({ length: 46 }, (_, i) => colors[i % colors.length]);
  }, [layer]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Constituency Analytics</Text>
          <View style={styles.headerSubRow}>
            <MaterialIcons name="location-on" size={12} color="#757682" />
            <Text style={styles.headerSub}>India › Madhya Pradesh</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => Alert.alert("Menu", "More options coming soon.")}
        >
          <MaterialIcons name="more-vert" size={22} color="#757682" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapWrap}>
        <View style={styles.tabs}>
          {(["voters", "complaints", "campaigns"] as Layer[]).map(t => {
            const active = layer === t;
            return (
              <TouchableOpacity
                key={t}
                style={[
                  styles.tabBtn,
                  active && { backgroundColor: layerTheme[t].tab },
                ]}
                onPress={() => setLayer(t)}
              >
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.mapCard}>
          <View
            style={[
              styles.marker,
              {
                top: "44%",
                left: "49%",
                backgroundColor: layerTheme[layer].marker,
              },
            ]}
          >
            <Text style={styles.markerText}>MP</Text>
          </View>
          <View
            style={[
              styles.smallMarker,
              {
                top: "33%",
                left: "35%",
                backgroundColor: layerTheme[layer].marker,
              },
            ]}
          />
          <View
            style={[
              styles.smallMarker,
              {
                top: "30%",
                left: "62%",
                backgroundColor: layerTheme[layer].marker,
              },
            ]}
          />
          <View
            style={[
              styles.smallMarker,
              {
                top: "58%",
                left: "43%",
                backgroundColor: layerTheme[layer].marker,
              },
            ]}
          />
          <View
            style={[
              styles.smallMarker,
              {
                top: "48%",
                left: "26%",
                backgroundColor: layerTheme[layer].marker,
              },
            ]}
          />
        </View>

        <View style={styles.mapFooter}>
          <Text style={styles.drill}>TAP TO DRILL DOWN</Text>
          <View style={styles.legend}>
            <View style={[styles.dot, { backgroundColor: "#6CF8BB" }]} />
            <Text style={styles.legendText}>Low</Text>
            <View style={[styles.dot, { backgroundColor: "#006C49" }]} />
            <Text style={styles.legendText}>Med</Text>
            <View style={[styles.dot, { backgroundColor: "#002113" }]} />
            <Text style={styles.legendText}>High</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.panel}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.handle} />
        <View style={styles.summaryHead}>
          <View>
            <Text style={styles.stateTitle}>Madhya Pradesh</Text>
            <Text style={styles.live}>State-level Overview • Live Data</Text>
          </View>
          <TouchableOpacity
            style={styles.plusBtn}
            onPress={() => Alert.alert("Add", "Add action is a placeholder.")}
          >
            <MaterialIcons name="add" size={20} color="#90A8FF" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.stat}>
            <Text style={styles.statK}>Total Voters</Text>
            <Text style={styles.statV}>9.7 Cr</Text>
            <Text style={styles.pos}>↑ 2.4%</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statK}>Total Complaints</Text>
            <Text style={styles.statV}>48,291</Text>
            <Text style={styles.neg}>12,847 pending</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statK}>Campaigns</Text>
            <Text style={styles.statV}>247</Text>
            <Text style={styles.badge}>ACTIVE NOW</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statK}>Resolution Rate</Text>
            <Text style={styles.statV}>61%</Text>
            <View style={styles.rateTrack}>
              <View style={styles.rateFill} />
            </View>
          </View>
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>District Coverage</Text>
          <Text style={styles.count}>46 DISTRICTS</Text>
        </View>
        <View style={styles.blocksGrid}>
          {blocks.map((c, i) => (
            <View
              key={`b-${i}`}
              style={[styles.block, { backgroundColor: c }]}
            />
          ))}
        </View>

        <Text style={styles.sectionTitle}>Top Engagement Districts</Text>
        {[
          { name: "Indore", value: 82 },
          { name: "Bhopal", value: 76 },
          { name: "Gwalior", value: 64 },
        ].map(d => (
          <View key={d.name} style={styles.rankRow}>
            <Text style={styles.rankName}>{d.name}</Text>
            <View style={styles.rankTrack}>
              <View style={[styles.rankFill, { width: `${d.value}%` }]} />
            </View>
            <Text style={styles.rankValue}>{d.value}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/leader" as never)}
        >
          <MaterialIcons name="home" size={20} color="#00236F" />
          <Text style={styles.navActive}>HOME</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => Alert.alert("Stats", "Stats view coming soon.")}
        >
          <MaterialIcons name="bar-chart" size={20} color="#757682" />
          <Text style={styles.navText}>STATS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => Alert.alert("Voters", "Voters view coming soon.")}
        >
          <MaterialIcons name="groups" size={20} color="#757682" />
          <Text style={styles.navText}>VOTERS</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => router.push("/leader" as never)}
        >
          <MaterialIcons name="settings" size={20} color="#757682" />
          <Text style={styles.navText}>SETTINGS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "#00236F", fontSize: 19, fontWeight: "700" },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 2,
  },
  headerSub: { color: "#757682", fontSize: 10, fontWeight: "700" },
  mapWrap: {
    height: "44%",
    backgroundColor: "#EEF4FF",
    paddingTop: 10,
    paddingHorizontal: 12,
  },
  tabs: {
    backgroundColor: "#FFFFFFEE",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    flexDirection: "row",
    padding: 4,
    marginHorizontal: 10,
  },
  tabBtn: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: "center",
  },
  tabText: { color: "#444651", fontSize: 12, fontWeight: "700" },
  tabTextActive: { color: "#FFFFFF" },
  mapCard: {
    flex: 1,
    marginTop: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    backgroundColor: "#DCE1FF55",
  },
  marker: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  markerText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  smallMarker: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  mapFooter: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  drill: {
    fontSize: 10,
    fontWeight: "700",
    color: "#00236F",
    backgroundColor: "#FFFFFFCC",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  legend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FFFFFFCC",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: "#444651", fontSize: 10, fontWeight: "700" },
  panel: {
    backgroundColor: "#FFFFFF",
    marginTop: -16,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  handle: {
    alignSelf: "center",
    width: 40,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#D9E3F4",
    marginTop: 8,
    marginBottom: 12,
  },
  summaryHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  stateTitle: { color: "#121C28", fontSize: 29, fontWeight: "700" },
  live: { color: "#757682", fontSize: 11, fontWeight: "600" },
  plusBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16,
  },
  stat: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    backgroundColor: "#EEF4FF",
    borderRadius: 14,
    padding: 10,
    minHeight: 95,
  },
  statK: {
    color: "#757682",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  statV: { color: "#121C28", fontSize: 24, fontWeight: "700", marginTop: 3 },
  pos: { color: "#006C49", fontSize: 10, fontWeight: "700", marginTop: 5 },
  neg: { color: "#BA1A1A", fontSize: 10, fontWeight: "700", marginTop: 5 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 7,
    backgroundColor: "#DCE1FF",
    color: "#00236F",
    fontSize: 9,
    fontWeight: "700",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  rateTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#C5C5D3",
    marginTop: 7,
    overflow: "hidden",
  },
  rateFill: { width: "61%", height: "100%", backgroundColor: "#006C49" },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionTitle: {
    color: "#121C28",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 8,
  },
  count: {
    color: "#444651",
    backgroundColor: "#E5EEFF",
    fontSize: 10,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  blocksGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 18,
  },
  block: { width: "11.3%", height: 28, borderRadius: 6 },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  rankName: { width: 70, color: "#121C28", fontSize: 14, fontWeight: "700" },
  rankTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E5EEFF",
    overflow: "hidden",
  },
  rankFill: { height: "100%", backgroundColor: "#00236F" },
  rankValue: {
    width: 26,
    textAlign: "right",
    color: "#00236F",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  navItem: { alignItems: "center", gap: 2 },
  navText: { color: "#757682", fontSize: 10, fontWeight: "700" },
  navActive: { color: "#00236F", fontSize: 10, fontWeight: "700" },
});
