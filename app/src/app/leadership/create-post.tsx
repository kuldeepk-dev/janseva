import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as ImagePicker from "expo-image-picker";
import { apiConfigError } from "../../lib/api";
import {
  createDraft,
  getPendingPosts,
  getPublishedPosts,
  publishPost,
  type SocialPost,
} from "../../services/socialPostService";
import { uploadSocialPostImage } from "../../services/fileUploadService";
import { PostImageCarousel } from "../../components/PostImageCarousel";
import {
  ActivityIndicator,
  Alert,
  Image,
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

const MAX_POST_IMAGES = 5;

type DraftStatus = "draft" | "pending_approval" | "publish";
type HistoryStatus = "published" | "pending_approval";

type PostHistoryItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  locationText: string;
  imageUrls: string[];
  status: HistoryStatus;
  timestamp: string;
};

function formatRelativeTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Just now";
  }

  const diff = Date.now() - date.getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function normalizePost(post: SocialPost, status: HistoryStatus): PostHistoryItem {
  const imageUrls =
    post.image_urls?.filter(Boolean) ??
    (post.image_url ? [post.image_url] : []);

  return {
    id: post.id,
    title: post.title ?? post.category ?? "Untitled post",
    content: post.content ?? "",
    category: post.category ?? "Update",
    locationText: post.location_text ?? "",
    imageUrls,
    status,
    timestamp: post.published_at ?? post.updated_at ?? post.created_at,
  };
}

async function loadRecentPosts() {
  if (apiConfigError) {
    throw new Error(apiConfigError);
  }

  const [published, pending] = await Promise.all([
    getPublishedPosts(),
    getPendingPosts(),
  ]);

  return [...published.map(post => normalizePost(post, "published"))]
    .concat(pending.map(post => normalizePost(post, "pending_approval")))
    .sort((left, right) => {
      return new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime();
    })
    .slice(0, 6);
}

function PostPreviewCard({
  roleLabel,
  category,
  content,
  locationText,
  imageUrls,
  updatedLabel,
  statusLabel,
}: {
  roleLabel: string;
  category: string;
  content: string;
  locationText: string;
  imageUrls: string[];
  updatedLabel: string;
  statusLabel: string;
}) {
  const hasContent = content.trim().length > 0;
  const hasLocation = locationText.trim().length > 0;
  const visibleImages = imageUrls.slice(0, MAX_POST_IMAGES);

  return (
    <View style={styles.previewCard}>
      <View style={styles.previewHeader}>
        <View style={styles.previewHeadLeft}>
          <View style={styles.previewAvatar}>
            <Text style={styles.previewAvatarText}>
              {roleLabel
                .split(" ")
                .map(part => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.previewChannel}>{roleLabel}</Text>
            <Text style={styles.previewMeta}>
              {statusLabel} | {updatedLabel}
            </Text>
          </View>
        </View>
        <MaterialIcons name="more-vert" size={18} color="#FFFFFF" />
      </View>
      <View style={styles.previewBody}>
        <View style={styles.previewMetaRow}>
          <View style={styles.previewTag}>
            <Text style={styles.previewTagText}>{category}</Text>
          </View>
          <View style={styles.previewLocationChip}>
            <MaterialIcons name="location-on" size={14} color="#444651" />
            <Text style={styles.previewLocationText}>
              {hasLocation ? locationText : "Location not added"}
            </Text>
          </View>
        </View>

        <Text style={[styles.previewText, !hasContent && styles.previewPlaceholder]}>
          {hasContent
            ? content
            : "Start typing in the composer to see the live preview."}
        </Text>

        {visibleImages.length ? (
          <PostImageCarousel
            imageUrls={visibleImages}
            aspectRatio={1.4}
            style={styles.previewCarousel}
          />
        ) : null}

        <View style={styles.previewFooter}>
          <View style={styles.previewStatusPill}>
            <Text style={styles.previewStatusText}>
              {hasContent ? "Ready to publish" : "Draft"}
            </Text>
          </View>
          <Text style={styles.previewTime}>{updatedLabel}</Text>
        </View>
      </View>
    </View>
  );
}

export default function CreatePostScreen() {
  const router = useRouter();
  const { draft } = useLocalSearchParams<{ draft?: string }>();
  const isOperatorDraft = draft === "operator";
  const isBoothWorkerDraft = draft === "booth-worker";
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(categories[0]);
  const [content, setContent] = useState("");
  const [locationText, setLocationText] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [recentPosts, setRecentPosts] = useState<PostHistoryItem[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const backTarget = isOperatorDraft
    ? "/operator"
    : isBoothWorkerDraft
      ? "/booth-worker/posts"
      : "/leader";
  const roleLabel = isOperatorDraft
    ? "Operator Draft"
    : isBoothWorkerDraft
      ? "Booth Worker Draft"
      : "Leadership Draft";
  const contentLength = content.length;
  const updatedLabel = "Live preview";

  const refreshHistory = async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const items = await loadRecentPosts();
      setRecentPosts(items);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load posts.";
      setHistoryError(message);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    void refreshHistory();
    // Intentionally run once on mount to load the latest real posts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openHistoryPost = (item: PostHistoryItem) => {
    setSelectedPostId(item.id);
    setActiveCategory(item.category);
    setContent(item.content);
    setLocationText(item.locationText);
    setImageUrls(item.imageUrls);
    setPreviewOpen(true);
  };

  const handleImageUpload = async () => {
    setError(null);
    if (apiConfigError) {
      setError(apiConfigError);
      return;
    }

    if (imageUrls.length >= MAX_POST_IMAGES) {
      Alert.alert("Images", `You can attach a maximum of ${MAX_POST_IMAGES} images.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Photos", "Photo library permission is required to upload images.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: MAX_POST_IMAGES - imageUrls.length,
      quality: 0.85,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    setIsUploadingImage(true);
    try {
      const uploads = await Promise.all(
        result.assets.slice(0, MAX_POST_IMAGES - imageUrls.length).map(
          async picked =>
            uploadSocialPostImage({
              uri: picked.uri,
              name: picked.fileName ?? `social-post-${Date.now()}.jpg`,
              type: picked.mimeType ?? "image/jpeg",
            }),
        ),
      );
      setImageUrls(prev => [...prev, ...uploads].slice(0, MAX_POST_IMAGES));
      setSelectedPostId(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Image upload failed.";
      setError(message);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handlePublish = async (status: DraftStatus) => {
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
        image_url: imageUrls[0] ?? null,
        image_urls: imageUrls.length ? imageUrls : null,
        status: status === "publish" ? "draft" : status,
        audience: "public",
      });

      if (status === "publish") {
        await publishPost(draftPost.id);
        Alert.alert("Post", "Published successfully.");
        await refreshHistory();
        router.push((isBoothWorkerDraft ? backTarget : "/feed") as never);
        return;
      }

      Alert.alert(
        "Post",
        status === "pending_approval"
          ? "Submitted for approval."
          : "Saved as draft.",
      );
      await refreshHistory();
      router.push(backTarget as never);
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
          <Text style={styles.brand}>Jan Seva</Text>
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
                  onPress={() => {
                    setSelectedPostId(null);
                    setActiveCategory(item);
                  }}
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

          <Text style={styles.label}>Post Content</Text>
          <TextInput
            multiline
            placeholder="Write your message to the constituents here..."
            placeholderTextColor="#757682"
            style={styles.textarea}
            textAlignVertical="top"
            value={content}
            onChangeText={value => {
              setSelectedPostId(null);
              setContent(value);
            }}
          />
          <View style={styles.rowBetween}>
            <Text style={styles.small}>Live editor</Text>
            <Text style={styles.small}>{contentLength} / 2000 characters</Text>
          </View>

          <Text style={styles.label}>Media Attachments</Text>
          <View style={styles.mediaRow}>
            <TouchableOpacity
              style={[styles.mediaBox, imageUrls.length >= MAX_POST_IMAGES && styles.mediaBoxDisabled]}
              onPress={() => void handleImageUpload()}
              disabled={isUploadingImage || imageUrls.length >= MAX_POST_IMAGES}
            >
              <MaterialIcons
                name="add-photo-alternate"
                size={24}
                color={imageUrls.length >= MAX_POST_IMAGES ? "#A0A7B8" : "#757682"}
              />
              <Text style={styles.mediaText}>
                {isUploadingImage
                  ? "Uploading..."
                  : imageUrls.length >= MAX_POST_IMAGES
                    ? "Max 5 images"
                    : `Add Images (${imageUrls.length}/${MAX_POST_IMAGES})`}
              </Text>
            </TouchableOpacity>
          </View>
          {imageUrls.length ? (
            <View style={styles.selectedImageGrid}>
              {imageUrls.map((url, index) => (
                <View key={`${url}-${index}`} style={styles.selectedImageWrap}>
                  <Image source={{ uri: url }} style={styles.selectedImage} />
                  <TouchableOpacity
                    style={styles.selectedImageRemove}
                    onPress={() =>
                      setImageUrls(prev => prev.filter((_, i) => i !== index))
                    }
                    disabled={isUploadingImage}
                  >
                    <MaterialIcons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
          {imageUrls.length ? (
            <Text style={styles.selectedImageText}>
              {imageUrls.length} of {MAX_POST_IMAGES} images attached
            </Text>
          ) : null}

          <Text style={styles.label}>Location Tag</Text>
          <View style={styles.locationBox}>
            <MaterialIcons name="location-on" size={19} color="#757682" />
            <TextInput
              placeholder="e.g. Ward 12, Shivaji Nagar Municipal Office"
              placeholderTextColor="#757682"
              style={styles.locationInput}
              value={locationText}
              onChangeText={value => {
                setSelectedPostId(null);
                setLocationText(value);
              }}
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
          <Text style={styles.previewSectionTag}>LIVE PREVIEW</Text>
          <PostPreviewCard
            roleLabel={roleLabel}
            category={activeCategory}
            content={content}
            locationText={locationText}
            imageUrls={imageUrls}
            updatedLabel={updatedLabel}
            statusLabel={
              selectedPostId ? "Loaded from recent posts" : "Live draft"
            }
          />
        </View>

        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.historyTitle}>Recent Posts</Text>
              <Text style={styles.historySubtitle}>
                Published and pending posts available in this draft workspace.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={() => void refreshHistory()}
              disabled={historyLoading}
            >
              <MaterialIcons name="refresh" size={16} color="#00236F" />
              <Text style={styles.refreshText}>
                {historyLoading ? "Loading..." : "Refresh"}
              </Text>
            </TouchableOpacity>
          </View>

          {historyError ? <Text style={styles.errorText}>{historyError}</Text> : null}

          {historyLoading ? (
            <View style={styles.historyLoading}>
              <ActivityIndicator size="small" color="#00236F" />
            </View>
          ) : recentPosts.length ? (
            recentPosts.map(item => {
              const isActive = item.id === selectedPostId;
              const statusLabel =
                item.status === "published" ? "Published" : "Pending approval";
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.historyItem, isActive && styles.historyItemActive]}
                  onPress={() => openHistoryPost(item)}
                >
                  <View style={styles.historyTop}>
                    <View style={styles.historyStatusRow}>
                      <Text style={styles.historyStatus}>{statusLabel}</Text>
                      <Text style={styles.historyTime}>
                        {formatRelativeTime(item.timestamp)}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={18} color="#757682" />
                  </View>
                  <Text style={styles.historyItemTitle}>{item.title}</Text>
                  <Text style={styles.historyItemBody} numberOfLines={2}>
                    {item.content || "No content available."}
                  </Text>
                  <View style={styles.historyBottom}>
                    <Text style={styles.historyCategory}>{item.category}</Text>
                    <Text style={styles.historyAction}>Load into editor</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptyText}>
                Published and pending posts will appear here once they are created.
              </Text>
            </View>
          )}
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
            <View style={styles.previewModalHeader}>
              <Text style={styles.previewModalTitle}>Preview</Text>
              <TouchableOpacity onPress={() => setPreviewOpen(false)}>
                <MaterialIcons name="close" size={20} color="#444651" />
              </TouchableOpacity>
            </View>
            <PostPreviewCard
              roleLabel={roleLabel}
              category={activeCategory}
              content={content}
              locationText={locationText}
              imageUrls={imageUrls}
              updatedLabel={updatedLabel}
              statusLabel={
                selectedPostId ? "Loaded from recent posts" : "Live draft"
              }
            />
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
  content: { padding: 16, gap: 12, paddingBottom: 108 },
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
  mediaBoxDisabled: {
    opacity: 0.55,
  },
  mediaText: { color: "#757682", fontSize: 12, fontWeight: "600" },
  selectedImageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  selectedImageWrap: {
    width: "48%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7DFEF",
    backgroundColor: "#F8F9FF",
    overflow: "hidden",
    position: "relative",
  },
  selectedImage: {
    width: "100%",
    aspectRatio: 1.25,
    backgroundColor: "#E8EDF7",
  },
  selectedImageText: {
    color: "#444651",
    fontSize: 11,
    fontWeight: "600",
  },
  selectedImageRemove: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#BA1A1A",
    alignItems: "center",
    justifyContent: "center",
  },
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
  previewSectionTag: { color: "#444651", fontSize: 11, fontWeight: "700" },
  previewCard: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F8F9FF",
  },
  previewHeader: {
    minHeight: 56,
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
    alignItems: "center",
    justifyContent: "center",
  },
  previewAvatarText: { color: "#00236F", fontSize: 11, fontWeight: "700" },
  previewChannel: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  previewMeta: { color: "#D1DBEC", fontSize: 10 },
  previewBody: { padding: 12, gap: 10 },
  previewMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  previewTag: {
    borderRadius: 999,
    backgroundColor: "#DCE1FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewTagText: { color: "#00236F", fontSize: 11, fontWeight: "700" },
  previewLocationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    justifyContent: "flex-end",
  },
  previewLocationText: { color: "#444651", fontSize: 11, fontWeight: "600" },
  previewText: {
    color: "#121C28",
    fontSize: 13,
    lineHeight: 19,
  },
  previewPlaceholder: {
    color: "#757682",
    fontStyle: "italic",
  },
  previewCarousel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D7DFEF",
    backgroundColor: "#E8EDF7",
  },
  previewFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  previewStatusPill: {
    borderRadius: 999,
    backgroundColor: "#E5EEFF",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  previewStatusText: { color: "#264191", fontSize: 10, fontWeight: "700" },
  previewTime: { color: "#757682", fontSize: 10, fontWeight: "600" },
  historyCard: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 10,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 10,
  },
  historyTitle: { color: "#121C28", fontSize: 18, fontWeight: "700" },
  historySubtitle: { color: "#444651", fontSize: 12, lineHeight: 17 },
  refreshBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    backgroundColor: "#EEF4FF",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  refreshText: { color: "#00236F", fontSize: 12, fontWeight: "700" },
  historyLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
  },
  historyItem: {
    borderWidth: 1,
    borderColor: "#D7DFEF",
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  historyItemActive: {
    borderColor: "#00236F",
    backgroundColor: "#EEF4FF",
  },
  historyTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  historyStatus: {
    color: "#006C49",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  historyTime: { color: "#757682", fontSize: 11, fontWeight: "600" },
  historyItemTitle: { color: "#121C28", fontSize: 14, fontWeight: "700" },
  historyItemBody: { color: "#444651", fontSize: 13, lineHeight: 18 },
  historyBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyCategory: { color: "#00236F", fontSize: 11, fontWeight: "700" },
  historyAction: { color: "#757682", fontSize: 11, fontWeight: "600" },
  emptyState: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C5C5D3",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    gap: 4,
  },
  emptyTitle: { color: "#121C28", fontSize: 14, fontWeight: "700" },
  emptyText: {
    color: "#444651",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
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
  previewModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewModalTitle: { color: "#00236F", fontSize: 16, fontWeight: "700" },
  modalClose: { alignItems: "center", paddingVertical: 8 },
  modalCloseText: { color: "#00236F", fontSize: 14, fontWeight: "700" },
});
