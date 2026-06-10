import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { apiConfigError } from "../../lib/api";
import { createDraft, publishPost } from "../../services/socialPostService";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const categories = [
  "Announcement",
  "Development Update",
  "Public Event",
  "Grievance Resolved",
];

export default function CreatePostScreen() {
  const router = useRouter();
  const { draft } = useLocalSearchParams<{ draft?: string }>();
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [content, setContent] = useState("");
  const [locationText, setLocationText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const backTarget = draft === "operator" ? "/operator" : "/leader";

  const handlePublish = async (
    status: "draft" | "pending_approval" | "publish",
  ) => {
    setError(null);
    if (!content.trim()) {
      setError("Post content is required.");
      return;
    }
    if (apiConfigError) {
      setError(apiConfigError);
      router.push("/feed" as never);
      return;
    }
    setIsLoading(true);
    try {
      const draftPost = await createDraft({
        title: activeCategory,
        content: content.trim(),
        category: activeCategory,
        location_text: locationText.trim() || null,
        status: status === "publish" ? "draft" : status,
        audience: "public",
      });
      if (status === "publish") {
        await publishPost(draftPost.id);
        router.push("/feed" as never);
      } else {
        Alert.alert("Post", "Saved successfully.");
        router.push(backTarget as never);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Post save failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push(backTarget as never)}
          >
            <MaterialIcons name="arrow-back" size={22} color="#00236F" />
          </TouchableOpacity>
          <Text style={styles.brand}>जन सेवा</Text>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.lang}>English</Text>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>SP</Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Create Social Post</Text>
        <Text style={styles.subtitle}>
          Draft and publish updates for your constituency feed.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.card}>
          <Text style={styles.label}>Post Category</Text>
          <View style={styles.chipsWrap}>
            {categories.map(item => {
              const active = activeCategory === item;
              return (
                <TouchableOpacity
                  key={item}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setActiveCategory(item)}
                >
                  <Text
                    style={[styles.chipText, active && styles.chipTextActive]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Post Content (English/हिंदी/मराठी)</Text>
          <TextInput
            multiline
            placeholder="Write your message to the constituents here..."
            placeholderTextColor="#757682"
            style={styles.textarea}
            textAlignVertical="top"
            value={content}
            onChangeText={setContent}
          />
          <View style={styles.rowBetween}>
            <Text style={styles.small}>Multi-lingual input enabled</Text>
            <Text style={styles.small}>0 / 2000 characters</Text>
          </View>

          <Text style={styles.label}>Media Attachments</Text>
          <View style={styles.mediaRow}>
            <TouchableOpacity
              style={styles.mediaBox}
              onPress={() =>
                Alert.alert("Media", "Image upload is a placeholder.")
              }
            >
              <MaterialIcons
                name="add-photo-alternate"
                size={24}
                color="#757682"
              />
              <Text style={styles.mediaText}>Add Image</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mediaBox}
              onPress={() =>
                Alert.alert("Media", "Video upload is a placeholder.")
              }
            >
              <MaterialIcons name="videocam" size={24} color="#757682" />
              <Text style={styles.mediaText}>Add Video</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Location Tag</Text>
          <View style={styles.locationBox}>
            <MaterialIcons name="location-on" size={19} color="#757682" />
            <TextInput
              placeholder="e.g. Ward 12, Shivaji Nagar Municipal Office"
              placeholderTextColor="#757682"
              style={styles.locationInput}
              value={locationText}
              onChangeText={setLocationText}
            />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.optionsTitle}>PUBLISHING OPTIONS</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => handlePublish("publish")}
            disabled={isLoading}
          >
            <MaterialIcons name="send" size={18} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>
              {isLoading ? "Publishing..." : "Publish Now"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => handlePublish("pending_approval")}
            disabled={isLoading}
          >
            <MaterialIcons name="fact-check" size={18} color="#00714D" />
            <Text style={styles.secondaryBtnText}>Submit for Approval</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => handlePublish("draft")}
            disabled={isLoading}
          >
            <MaterialIcons name="drafts" size={18} color="#444651" />
            <Text style={styles.ghostBtnText}>Save Draft</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.previewBtn}
            onPress={() => setPreviewOpen(true)}
          >
            <MaterialIcons name="visibility" size={18} color="#00236F" />
            <Text style={styles.previewBtnText}>Preview</Text>
          </TouchableOpacity>
          <View style={styles.infoWrap}>
            <View style={styles.infoRow}>
              <MaterialIcons name="visibility" size={18} color="#444651" />
              <Text style={styles.infoText}>Visibility: Public</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialIcons name="schedule" size={18} color="#444651" />
              <Text style={styles.infoText}>Status: Draft</Text>
            </View>
          </View>
        </View>

        <View style={styles.previewWrap}>
          <Text style={styles.previewTag}>LIVE PREVIEW</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHead}>
              <View style={styles.previewAvatar}>
                <Text style={styles.avatarText}>SP</Text>
              </View>
              <View>
                <Text style={styles.previewName}>Sandeep Patil</Text>
                <Text style={styles.previewMeta}>Just now • Ward 12</Text>
              </View>
            </View>
            <View style={[styles.skeleton, { width: "72%" }]} />
            <View style={styles.skeleton} />
            <View style={styles.previewImage}>
              <MaterialIcons name="image" size={38} color="#C5C5D3" />
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={previewOpen}
        animationType="fade"
        onRequestClose={() => setPreviewOpen(false)}
      >
        <View style={styles.previewBackdrop}>
          <View style={styles.previewModal}>
            <Text style={styles.previewModalTitle}>Preview</Text>
            <View style={styles.previewCard}>
              <View style={styles.previewHead}>
                <View style={styles.previewAvatar}>
                  <Text style={styles.avatarText}>SP</Text>
                </View>
                <View>
                  <Text style={styles.previewName}>Sandeep Patil</Text>
                  <Text style={styles.previewMeta}>Just now • Ward 12</Text>
                </View>
              </View>
              <View style={[styles.skeleton, { width: "72%" }]} />
              <View style={styles.skeleton} />
            </View>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setPreviewOpen(false)}
            >
              <Text style={styles.modalCloseText}>Close Preview</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 56,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 4 },
  brand: { color: "#00236F", fontSize: 30, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  lang: { color: "#444651", fontSize: 13, fontWeight: "600" },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  content: { padding: 16, gap: 12, paddingBottom: 24 },
  title: { color: "#00236F", fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#444651", fontSize: 14, marginTop: -4 },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  card: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  label: { color: "#444651", fontSize: 13, fontWeight: "600" },
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: "#FFFFFF",
  },
  chipActive: { borderColor: "#00236F", backgroundColor: "#EEF4FF" },
  chipText: { color: "#444651", fontSize: 12, fontWeight: "600" },
  chipTextActive: { color: "#00236F" },
  textarea: {
    minHeight: 120,
    backgroundColor: "#F8F9FF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 10,
    padding: 12,
    color: "#121C28",
    fontSize: 14,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  small: { color: "#757682", fontSize: 11 },
  mediaRow: { flexDirection: "row", gap: 10 },
  mediaBox: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 2,
    borderColor: "#C5C5D3",
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  mediaText: { color: "#757682", fontSize: 12, fontWeight: "600" },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 10,
    backgroundColor: "#F8F9FF",
    paddingHorizontal: 10,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 10,
    color: "#121C28",
    fontSize: 14,
  },
  optionsTitle: {
    color: "#00236F",
    fontSize: 12,
    letterSpacing: 0.7,
    fontWeight: "700",
  },
  primaryBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: "#00236F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  secondaryBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: "#6CF8BB",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  secondaryBtnText: { color: "#00714D", fontSize: 14, fontWeight: "700" },
  ghostBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    backgroundColor: "#F8F9FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  ghostBtnText: { color: "#444651", fontSize: 14, fontWeight: "700" },
  previewBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#00236F",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  previewBtnText: { color: "#00236F", fontSize: 14, fontWeight: "700" },
  infoWrap: {
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
    paddingTop: 10,
    gap: 6,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoText: { color: "#444651", fontSize: 12 },
  previewWrap: {
    backgroundColor: "#DFE9FA",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  previewTag: { color: "#444651", fontSize: 11, fontWeight: "700" },
  previewCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 10,
    padding: 12,
    gap: 8,
  },
  previewHead: { flexDirection: "row", gap: 8, alignItems: "center" },
  previewAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
  },
  previewName: { color: "#121C28", fontSize: 13, fontWeight: "700" },
  previewMeta: { color: "#757682", fontSize: 10 },
  skeleton: { height: 12, borderRadius: 6, backgroundColor: "#D9E3F4" },
  previewImage: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: "#D9E3F4",
    alignItems: "center",
    justifyContent: "center",
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: "#00000055",
    justifyContent: "center",
    padding: 20,
  },
  previewModal: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  previewModalTitle: { color: "#00236F", fontSize: 16, fontWeight: "700" },
  modalClose: { alignItems: "center", paddingVertical: 8 },
  modalCloseText: { color: "#00236F", fontSize: 14, fontWeight: "700" },
});
