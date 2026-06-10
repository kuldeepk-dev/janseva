import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function HistoryItem({
  icon,
  title,
  subtitle,
  extra,
  tone = "default",
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  extra?: string;
  tone?: "default" | "green";
}) {
  const bg = tone === "green" ? "#6FFBBE" : "#D9E3F4";
  const color = tone === "green" ? "#005236" : "#444651";
  return (
    <View style={styles.historyItem}>
      <View style={[styles.historyIcon, { backgroundColor: bg }]}>
        <MaterialIcons name={icon} size={16} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.historyTitle}>{title}</Text>
        <Text style={styles.historySubtitle}>{subtitle}</Text>
        {extra ? <Text style={styles.historyExtra}>{extra}</Text> : null}
      </View>
    </View>
  );
}

export default function OfficerComplaintViewRefinedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/officer/queue" as never);
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#00236F" />
          </TouchableOpacity>
          <Text style={styles.idTitle}>Complaint #INC-2023-8842</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.heroBadges}>
              <View style={styles.badgeUrgent}>
                <Text style={styles.badgeUrgentText}>URGENT</Text>
              </View>
              <View style={styles.badgeReview}>
                <Text style={styles.badgeReviewText}>In Review</Text>
              </View>
            </View>
            <View style={styles.locationRow}>
              <MaterialIcons name="location-on" size={18} color="#00236F" />
              <Text style={styles.locationText}>
                Ward 14, Sector 7, Near Central Market, Pune
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.slaCard}>
          <View style={styles.slaIcon}>
            <MaterialIcons name="timer" size={22} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.slaTitle}>SLA Overdue</Text>
            <Text style={styles.slaTime}>- 04:22:15</Text>
            <Text style={styles.slaSub}>Resolved by: 24 Oct, 05:00 PM</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHead}>CITIZEN DETAILS</Text>
          <View style={styles.citizenRow}>
            <View style={styles.initials}>
              <Text style={styles.initialsText}>RS</Text>
            </View>
            <View>
              <Text style={styles.citizenName}>Rajesh Sharma</Text>
              <Text style={styles.citizenPhone}>+91 98765 43210</Text>
            </View>
          </View>
          <View style={styles.metaGrid}>
            <View>
              <Text style={styles.metaLabel}>Ward / Zone</Text>
              <Text style={styles.metaValue}>Zone 4 (East)</Text>
            </View>
            <View>
              <Text style={styles.metaLabel}>Reg. Date</Text>
              <Text style={styles.metaValue}>22 Oct, 10:15 AM</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHead}>COMPLAINT DESCRIPTION</Text>
          <Text style={styles.description}>
            "Large pothole formed in the middle of the main road near Central
            Market. It's causing heavy congestion and is dangerous for
            two-wheelers at night."
          </Text>
          <Text style={styles.attachHead}>ATTACHED PHOTOS (3)</Text>
          <View style={styles.photoRow}>
            <View style={styles.photo} />
            <View style={styles.photo} />
            <View style={styles.addPhoto}>
              <MaterialIcons name="add-a-photo" size={20} color="#757682" />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHead}>INTERNAL AUDIT NOTES</Text>
          <View style={styles.note}>
            <Text style={styles.noteText}>
              "Initial site inspection suggests possible pipeline leak below
              road. Coordinating with Water Dept before road work."
            </Text>
            <Text style={styles.noteMeta}>
              — Sunil Deshmukh (Junior Engineer) • 23 Oct, 02:30 PM
            </Text>
          </View>
          <TextInput
            multiline
            placeholder="Add a note for the audit trail..."
            placeholderTextColor="#757682"
            style={styles.noteInput}
          />
          <TouchableOpacity
            style={styles.saveNoteBtn}
            onPress={() => Alert.alert("Notes", "Note saved.")}
          >
            <Text style={styles.saveNoteText}>Save Note</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.takeAction}>Take Action</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => Alert.alert("Status", "Marked In Progress.")}
          >
            <MaterialIcons name="play-arrow" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Mark In Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => Alert.alert("Status", "Marked Resolved.")}
          >
            <MaterialIcons name="task-alt" size={18} color="#00714D" />
            <Text style={styles.secondaryBtnText}>Mark Resolved</Text>
          </TouchableOpacity>
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.smallAction}
              onPress={() =>
                Alert.alert("Assign", "Assign junior is a placeholder.")
              }
            >
              <MaterialIcons name="person-add" size={18} color="#121C28" />
              <Text style={styles.smallActionText}>Assign Junior</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallAction}
              onPress={() => Alert.alert("Escalate", "Escalation logged.")}
            >
              <MaterialIcons name="priority-high" size={18} color="#BA1A1A" />
              <Text style={styles.smallActionText}>Escalate</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.slaRules}>
            <Text style={styles.rulesHead}>SLA Rules</Text>
            <Text style={styles.rule}>Critical: 24h</Text>
            <Text
              style={[styles.rule, { color: "#00236F", fontWeight: "700" }]}
            >
              Urgent: 3 Days
            </Text>
            <Text style={styles.rule}>Normal: 7 Days</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardHead}>COMPLAINT HISTORY</Text>
          <HistoryItem
            icon="person-search"
            tone="green"
            title="Assigned to Officer"
            subtitle="By Admin Panel • Today, 09:00 AM"
            extra="Automatic workload distribution"
          />
          <HistoryItem
            icon="visibility"
            title="Status changed to 'In Review'"
            subtitle="Officer Rajesh K. • 23 Oct, 11:20 AM"
          />
          <HistoryItem
            icon="how-to-reg"
            title="Complaint Registered"
            subtitle="Citizen: Rajesh Sharma • 22 Oct, 10:15 AM"
            extra="Ref ID: APP-992-K"
          />
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
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DCE1FF",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 12, paddingBottom: 108 },
  breadcrumb: { color: "#757682", fontSize: 12 },
  heroRow: { gap: 8 },
  heroBadges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    alignItems: "center",
  },
  idTitle: {
    color: "#00236F",
    fontSize: 18,
    fontWeight: "700",
    marginRight: 6,
  },
  badgeUrgent: {
    backgroundColor: "#1E3A8A",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeUrgentText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  badgeReview: {
    backgroundColor: "#EEF4FF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeReviewText: { color: "#444651", fontSize: 11, fontWeight: "700" },
  locationRow: {
    marginTop: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locationText: { color: "#444651", fontSize: 14, flex: 1 },
  slaCard: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderColor: "#F5B4B4",
    borderRadius: 12,
    backgroundColor: "#FFF1F1",
    padding: 12,
  },
  slaIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#BA1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
  slaTitle: {
    color: "#BA1A1A",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  slaTime: {
    color: "#BA1A1A",
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 28,
  },
  slaSub: { color: "#444651", fontSize: 12 },
  card: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 10,
  },
  cardHead: {
    color: "#444651",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  citizenRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  initials: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  initialsText: { color: "#00236F", fontSize: 18, fontWeight: "700" },
  citizenName: { color: "#00236F", fontSize: 18, fontWeight: "700" },
  citizenPhone: { color: "#444651", fontSize: 14 },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
    paddingTop: 10,
  },
  metaLabel: { color: "#757682", fontSize: 11 },
  metaValue: { color: "#121C28", fontSize: 13, fontWeight: "600" },
  description: { color: "#121C28", fontSize: 17, lineHeight: 25 },
  attachHead: {
    color: "#444651",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  photoRow: { flexDirection: "row", gap: 8 },
  photo: {
    width: 92,
    height: 92,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    backgroundColor: "#D9E3F4",
  },
  addPhoto: {
    width: 92,
    height: 92,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#757682",
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  note: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 8,
    backgroundColor: "#F8F9FF",
    padding: 10,
    gap: 6,
  },
  noteText: { color: "#121C28", fontSize: 13, fontStyle: "italic" },
  noteMeta: { color: "#757682", fontSize: 11 },
  noteInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    padding: 10,
    color: "#121C28",
    textAlignVertical: "top",
  },
  saveNoteBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#00236F",
    borderRadius: 99,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveNoteText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  takeAction: { color: "#00236F", fontSize: 20, fontWeight: "700" },
  primaryBtn: {
    height: 48,
    borderRadius: 12,
    backgroundColor: "#00236F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  secondaryBtn: {
    height: 48,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#006C49",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  secondaryBtnText: { color: "#00714D", fontSize: 14, fontWeight: "700" },
  actionRow: { flexDirection: "row", gap: 8 },
  smallAction: {
    flex: 1,
    height: 70,
    borderRadius: 10,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  smallActionText: { color: "#121C28", fontSize: 12, fontWeight: "600" },
  slaRules: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 8,
    backgroundColor: "#EEF4FF",
    padding: 10,
    gap: 4,
  },
  rulesHead: {
    color: "#444651",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  rule: { color: "#121C28", fontSize: 12 },
  historyItem: { flexDirection: "row", gap: 10, paddingBottom: 8 },
  historyIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  historyTitle: { color: "#121C28", fontSize: 13, fontWeight: "700" },
  historySubtitle: { color: "#444651", fontSize: 12 },
  historyExtra: { color: "#757682", fontSize: 11, marginTop: 1 },
});
