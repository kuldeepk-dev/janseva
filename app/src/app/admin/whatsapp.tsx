import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { apiConfigError } from "../../lib/api";
import {
  getTemplates,
  updateTemplate,
} from "../../services/whatsappTemplateService";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const audience = ["All Voters", "By Ward", "By Booth", "By Interest"];

export default function AdminWhatsAppScreen() {
  const router = useRouter();
  const [selectedAudience, setSelectedAudience] = useState("All Voters");
  const [message, setMessage] = useState("");
  const [scheduled, setScheduled] = useState(false);
  const [templates, setTemplates] = useState<
    Array<{ id: string; title: string | null; body: string | null }>
  >([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const count = message.length;
  const preview = useMemo(
    () => (count ? message : "Preview will appear here..."),
    [count, message],
  );

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (apiConfigError) {
        setError(apiConfigError);
        return;
      }
      try {
        const data = await getTemplates();
        if (!isActive) {
          return;
        }
        setTemplates(data);
        if (data.length) {
          setSelectedTemplateId(data[0].id);
          setMessage(data[0].body ?? "");
        }
      } catch (err) {
        if (!isActive) {
          return;
        }
        const msg = err instanceof Error ? err.message : "Failed to load.";
        setError(msg);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const handleSaveTemplate = async () => {
    setError(null);
    if (apiConfigError) {
      setError(apiConfigError);
      Alert.alert("Template", "Template saved locally.");
      return;
    }
    if (!selectedTemplateId) {
      Alert.alert("Template", "No template selected.");
      return;
    }
    setIsSaving(true);
    try {
      await updateTemplate(selectedTemplateId, message);
      Alert.alert("Template", "Template saved successfully.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Save failed.";
      setError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/admin/settings" as never);
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={20} color="#00236F" />
          </TouchableOpacity>
          <View style={styles.seal} />
          <Text style={styles.brand}>Swaraj Portal</Text>
        </View>
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() =>
            Alert.alert("Language", "Language picker coming soon.")
          }
        >
          <MaterialIcons name="language" size={20} color="#444651" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <View style={styles.campaignIcon}>
              <MaterialIcons name="campaign" size={20} color="#00714D" />
            </View>
            <Text style={styles.title}>WhatsApp Broadcast</Text>
          </View>

          <Text style={styles.label}>Target Audience Segment</Text>
          <View style={styles.segmentRow}>
            {audience.map(item => {
              const active = item === selectedAudience;
              return (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.segmentChip,
                    active && styles.segmentChipActive,
                  ]}
                  onPress={() => setSelectedAudience(item)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      active && styles.segmentTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Message Template</Text>
          <View style={styles.selectBox}>
            <Text style={styles.selectText}>
              {templates.length
                ? (templates[0].title ?? "Default Template")
                : "Select a pre-approved template..."}
            </Text>
            <MaterialIcons
              name="keyboard-arrow-down"
              size={20}
              color="#444651"
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.label}>Broadcast Content</Text>
          <View style={styles.composerWrap}>
            <TextInput
              multiline
              value={message}
              onChangeText={setMessage}
              textAlignVertical="top"
              placeholder="Type your WhatsApp message here... (Use {name} for personalization)"
              placeholderTextColor="#757682"
              style={styles.composer}
            />
            <View style={styles.composeActions}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Emoji", "Emoji picker is a placeholder.")
                }
              >
                <MaterialIcons
                  name="sentiment-satisfied"
                  size={20}
                  color="#444651"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Attach", "Attachment is a placeholder.")
                }
              >
                <MaterialIcons name="attach-file" size={20} color="#444651" />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.counter}>Character count: {count}/1024</Text>

          <View
            style={[styles.scheduleBox, scheduled && styles.scheduleBoxActive]}
          >
            <View style={styles.scheduleLeft}>
              <MaterialIcons name="schedule" size={20} color="#444651" />
              <View>
                <Text style={styles.scheduleTitle}>Schedule for later</Text>
                <Text style={styles.scheduleSub}>
                  Choose a future date and time
                </Text>
              </View>
            </View>
            <Switch value={scheduled} onValueChange={setScheduled} />
          </View>

          <TouchableOpacity
            style={styles.sendBtn}
            onPress={() =>
              Alert.alert("Broadcast", "Broadcast scheduled/sent.")
            }
          >
            <MaterialIcons name="send" size={20} color="#FFFFFF" />
            <Text style={styles.sendText}>Send Broadcast Now</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSaveTemplate}
            disabled={isSaving}
          >
            <MaterialIcons name="save" size={20} color="#00236F" />
            <Text style={styles.saveText}>
              {isSaving ? "Saving..." : "Save Template"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <View style={styles.previewHeadLeft}>
              <MaterialIcons name="arrow-back" size={20} color="#FFFFFF" />
              <View style={styles.previewAvatar} />
              <View>
                <Text style={styles.previewChannel}>MLA Office Broadcast</Text>
                <Text style={styles.previewMeta}>Official Channel</Text>
              </View>
            </View>
            <MaterialIcons name="videocam" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.previewBody}>
            <View style={styles.bubble}>
              <Text
                style={[styles.bubbleText, !count && styles.bubblePlaceholder]}
              >
                {preview}
              </Text>
              <Text style={styles.bubbleTime}>12:00 PM</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.historyHead}>
            <Text style={styles.title}>Recent History</Text>
            <Text style={styles.viewAll}>View All</Text>
          </View>

          <View style={styles.historyItem}>
            <View style={styles.historyTop}>
              <Text style={styles.sentBadge}>Sent 2h ago</Text>
              <MaterialIcons name="more-vert" size={17} color="#757682" />
            </View>
            <Text style={styles.historyText}>
              Important Update: New Health Clinic opening in Ward 42 this
              Sunday. Everyone is invited for free checkup...
            </Text>
            <View style={styles.statsRow}>
              <View>
                <Text style={styles.statLabel}>Sent</Text>
                <Text style={styles.statPrimary}>12,450</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Read</Text>
                <Text style={styles.statSuccess}>98.2%</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Responses</Text>
                <Text style={styles.statDark}>342</Text>
              </View>
            </View>
          </View>

          <View style={styles.historyItem}>
            <View style={styles.historyTop}>
              <Text style={styles.scheduledBadge}>Scheduled (Oct 24)</Text>
              <MaterialIcons name="more-vert" size={17} color="#757682" />
            </View>
            <Text style={styles.historyText}>
              Reminder for Voter ID correction camp. Please bring your Aadhaar
              Card and Residence proof...
            </Text>
            <View style={styles.targetRow}>
              <MaterialIcons name="groups" size={16} color="#757682" />
              <Text style={styles.targetText}>Target: Booth #12, #14, #15</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 58,
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    backgroundColor: "#F8F9FF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  seal: { width: 38, height: 38, borderRadius: 19, backgroundColor: "#1E3A8A" },
  brand: { color: "#00236F", fontSize: 22, fontWeight: "700" },
  langBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 12, paddingBottom: 96 },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  campaignIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#6CF8BB",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: "#00236F", fontSize: 22, fontWeight: "700" },
  label: { color: "#444651", fontSize: 13, fontWeight: "600", marginTop: 2 },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  segmentRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  segmentChip: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  segmentChipActive: { borderColor: "#00236F", backgroundColor: "#DCE1FF66" },
  segmentText: { color: "#444651", fontSize: 12, fontWeight: "600" },
  segmentTextActive: { color: "#00236F" },
  selectBox: {
    height: 48,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 10,
    backgroundColor: "#F8F9FF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { color: "#444651", fontSize: 14 },
  composerWrap: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 10,
    backgroundColor: "#F8F9FF",
    overflow: "hidden",
  },
  composer: {
    minHeight: 130,
    padding: 12,
    paddingRight: 76,
    color: "#121C28",
    fontSize: 14,
  },
  composeActions: {
    position: "absolute",
    right: 8,
    bottom: 8,
    flexDirection: "row",
    gap: 8,
  },
  counter: { color: "#757682", fontSize: 11 },
  scheduleBox: {
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#E5EEFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  scheduleBoxActive: { borderWidth: 1, borderColor: "#00236F" },
  scheduleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    paddingRight: 10,
  },
  scheduleTitle: { color: "#121C28", fontSize: 14, fontWeight: "600" },
  scheduleSub: { color: "#444651", fontSize: 11 },
  sendBtn: {
    height: 54,
    borderRadius: 12,
    backgroundColor: "#00236F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
  },
  sendText: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  saveBtn: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00236F",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveText: { color: "#00236F", fontSize: 16, fontWeight: "700" },
  previewCard: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#E5DDD5",
  },
  previewHeader: {
    height: 58,
    backgroundColor: "#075E54",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewHeadLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  previewAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#D9E3F4",
  },
  previewChannel: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  previewMeta: { color: "#D1DBEC", fontSize: 10 },
  previewBody: { padding: 12, minHeight: 130 },
  bubble: {
    maxWidth: "88%",
    backgroundColor: "#FFFFFF",
    borderRadius: 9,
    padding: 10,
  },
  bubbleText: { color: "#121C28", fontSize: 13, lineHeight: 18 },
  bubblePlaceholder: { color: "#757682", fontStyle: "italic" },
  bubbleTime: {
    color: "#757682",
    fontSize: 10,
    marginTop: 4,
    textAlign: "right",
  },
  historyHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  viewAll: { color: "#00236F", fontSize: 13, fontWeight: "700" },
  historyItem: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sentBadge: {
    backgroundColor: "#6CF8BB",
    color: "#00714D",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  scheduledBadge: {
    backgroundColor: "#D9E3F4",
    color: "#444651",
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  historyText: { color: "#121C28", fontSize: 14, lineHeight: 20 },
  statsRow: {
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statLabel: { color: "#757682", fontSize: 11 },
  statPrimary: { color: "#00236F", fontSize: 13, fontWeight: "700" },
  statSuccess: { color: "#00714D", fontSize: 13, fontWeight: "700" },
  statDark: { color: "#121C28", fontSize: 13, fontWeight: "700" },
  targetRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  targetText: { color: "#757682", fontSize: 12 },
});
