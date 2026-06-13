import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Layer = "voters" | "complaints" | "campaigns";

const DISTRICT_COUNT = 46;

export default function LeadershipDashboardScreen() {
  const router = useRouter();
  const [activeLayer, setActiveLayer] = useState<Layer>("voters");

  const palette = useMemo(() => {
    if (activeLayer === "complaints") {
      return ["#BA1A1A", "#93000A", "#FFB4AB", "#FFDAD6"];
    }
    if (activeLayer === "campaigns") {
      return ["#00236F", "#1E3A8A", "#4059AA", "#B6C4FF"];
    }
    return ["#006C49", "#00714D", "#4EDEA3", "#6CF8BB"];
  }, [activeLayer]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Constituency Analytics</Text>
          <View style={styles.breadcrumb}>
            <MaterialIcons name="place" size={12} color="#444651" />
            <Text style={styles.breadcrumbText}>India</Text>
            <MaterialIcons name="chevron-right" size={12} color="#444651" />
            <Text style={styles.breadcrumbActive}>Madhya Pradesh</Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.replace("/leadership/settings" as never)}
        >
          <MaterialIcons name="more-vert" size={22} color="#757682" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mapSection}>
          <View style={styles.layerTabs}>
            <LayerTab label="Voters" value="voters" active={activeLayer} onPress={setActiveLayer} />
            <LayerTab label="Complaints" value="complaints" active={activeLayer} onPress={setActiveLayer} />
            <LayerTab label="Campaigns" value="campaigns" active={activeLayer} onPress={setActiveLayer} />
          </View>

          <View style={styles.mapCanvas}>
            <View style={styles.indiaShape}>
              <View style={[styles.markerMain, { backgroundColor: palette[0] }]}>
                <Text style={styles.markerText}>MP</Text>
              </View>
              <View style={[styles.markerSmall, styles.mk1, { backgroundColor: palette[1] }]} />
              <View style={[styles.markerSmall, styles.mk2, { backgroundColor: palette[2] }]} />
              <View style={[styles.markerSmall, styles.mk3, { backgroundColor: palette[3] }]} />
              <View style={[styles.markerSmall, styles.mk4, { backgroundColor: palette[1] }]} />
            </View>
            <View style={styles.mapHint}>
              <Text style={styles.mapHintText}>TAP TO DRILL DOWN</Text>
            </View>
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <View>
              <Text style={styles.panelTitle}>Madhya Pradesh</Text>
              <Text style={styles.panelSub}>State-level Overview • Live Data</Text>
            </View>
            <TouchableOpacity style={styles.addBtn}>
              <MaterialIcons name="add" size={20} color="#90A8FF" />
            </TouchableOpacity>
          </View>

          <View style={styles.statsGrid}>
            <StatCard title="TOTAL VOTERS" value="9.7 Cr" note="↑ 2.4% vs last period" />
            <StatCard title="TOTAL COMPLAINTS" value="48,291" note="12,847 pending" alert />
            <StatCard title="CAMPAIGNS" value="247" note="ACTIVE NOW" />
            <StatCard title="RESOLUTION RATE" value="61%" note="Progress" />
          </View>

          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>District Coverage</Text>
              <Text style={styles.badge}>46 DISTRICTS</Text>
            </View>
            <View style={styles.blockGrid}>
              {Array.from({ length: DISTRICT_COUNT }).map((_, i) => (
                <View
                  key={i}
                  style={[styles.block, { backgroundColor: palette[i % palette.length] }]}
                />
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Engagement Districts</Text>
            <RankRow name="Indore" score={82} />
            <RankRow name="Bhopal" score={76} />
            <RankRow name="Gwalior" score={64} />
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}

function LayerTab({
  label,
  value,
  active,
  onPress,
}: {
  label: string;
  value: Layer;
  active: Layer;
  onPress: (layer: Layer) => void;
}) {
  const isActive = active === value;
  return (
    <TouchableOpacity
      style={[styles.layerTab, isActive && styles.layerTabActive]}
      onPress={() => onPress(value)}
    >
      <Text style={[styles.layerTabText, isActive && styles.layerTabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function StatCard({
  title,
  value,
  note,
  alert,
}: {
  title: string;
  value: string;
  note: string;
  alert?: boolean;
}) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={[styles.statNote, alert && { color: "#BA1A1A" }]}>{note}</Text>
    </View>
  );
}

function RankRow({ name, score }: { name: string; score: number }) {
  return (
    <View style={styles.rankRow}>
      <Text style={styles.rankName}>{name}</Text>
      <View style={styles.rankBarTrack}>
        <View style={[styles.rankBarFill, { width: `${score}%` }]} />
      </View>
      <Text style={styles.rankScore}>{score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: { color: "#00236F", fontSize: 18, fontWeight: "700" },
  breadcrumb: { marginTop: 3, flexDirection: "row", alignItems: "center", gap: 2 },
  breadcrumbText: { color: "#444651", fontSize: 10, fontWeight: "600" },
  breadcrumbActive: { color: "#00236F", fontSize: 10, fontWeight: "700" },
  iconBtn: { width: 34, height: 34, alignItems: "center", justifyContent: "center" },
  content: { paddingBottom: 92 },
  mapSection: { height: 340, backgroundColor: "#EEF4FF", paddingTop: 12 },
  layerTabs: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    flexDirection: "row",
    padding: 4,
  },
  layerTab: { flex: 1, paddingVertical: 8, borderRadius: 999, alignItems: "center" },
  layerTabActive: { backgroundColor: "#006C49" },
  layerTabText: { fontSize: 11, fontWeight: "700", color: "#444651" },
  layerTabTextActive: { color: "#FFFFFF" },
  mapCanvas: { flex: 1, marginTop: 12, paddingHorizontal: 16, justifyContent: "center" },
  indiaShape: {
    height: 210,
    borderRadius: 18,
    backgroundColor: "#DCE1FF",
    borderWidth: 1,
    borderColor: "#757682",
    alignItems: "center",
    justifyContent: "center",
  },
  markerMain: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  markerText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
  markerSmall: { position: "absolute", width: 22, height: 22, borderRadius: 11 },
  mk1: { top: 40, left: 70 },
  mk2: { top: 60, right: 70 },
  mk3: { bottom: 50, left: 85 },
  mk4: { bottom: 40, right: 95 },
  mapHint: { position: "absolute", bottom: 8, left: 20, backgroundColor: "#FFFFFF", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  mapHintText: { color: "#00236F", fontSize: 10, fontWeight: "800" },
  panel: {
    backgroundColor: "#FFFFFF",
    marginTop: -22,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 18,
  },
  panelHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  panelTitle: { fontSize: 30, color: "#121C28", fontWeight: "700" },
  panelSub: { color: "#444651", fontSize: 12 },
  addBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#1E3A8A", alignItems: "center", justifyContent: "center" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statCard: {
    width: "48.5%",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 16,
    backgroundColor: "#EEF4FF",
    padding: 12,
    gap: 6,
  },
  statTitle: { color: "#444651", fontSize: 10, fontWeight: "800" },
  statValue: { color: "#121C28", fontSize: 28, fontWeight: "700" },
  statNote: { color: "#006C49", fontSize: 10, fontWeight: "700" },
  section: { gap: 10, paddingBottom: 8 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { color: "#121C28", fontSize: 17, fontWeight: "700" },
  badge: { color: "#444651", fontSize: 10, fontWeight: "700", backgroundColor: "#E5EEFF", paddingHorizontal: 8, paddingVertical: 5, borderRadius: 7 },
  blockGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  block: { width: "11.9%", height: 26, borderRadius: 6 },
  rankRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rankName: { width: 64, color: "#121C28", fontSize: 13, fontWeight: "700" },
  rankBarTrack: { flex: 1, height: 10, borderRadius: 6, backgroundColor: "#E5EEFF", overflow: "hidden" },
  rankBarFill: { height: "100%", borderRadius: 6, backgroundColor: "#00236F" },
  rankScore: { width: 28, textAlign: "right", color: "#00236F", fontSize: 13, fontWeight: "700" },
});
