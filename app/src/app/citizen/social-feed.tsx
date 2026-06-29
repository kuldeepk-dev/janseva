import { MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { apiConfigError } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import {
  getPublishedPosts,
  trackPostShare,
} from "../../services/socialPostService";
import { PostImageCarousel } from "../../components/PostImageCarousel";
import {
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function FeedCard({
  title,
  desc,
  tag,
  imageUrls,
  tagTone = "green",
  time,
  onShare,
}: {
  title: string;
  desc: string;
  tag: string;
  imageUrls: string[];
  tagTone?: "green" | "blue";
  time: string;
  onShare: () => void;
}) {
  const visibleImages = imageUrls.slice(0, 4);
  return (
    <View style={styles.card}>
      <View style={styles.image}>
        {visibleImages.length ? (
          <PostImageCarousel imageUrls={visibleImages} aspectRatio={1.65} />
        ) : null}
        <View style={[styles.tag, tagTone === "blue" && styles.tagBlue]}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
        <View style={styles.cardFoot}>
          <TouchableOpacity style={styles.shareBtn} onPress={onShare}>
            <MaterialIcons name="share" size={16} color="#00236F" />
            <Text style={styles.shareText}>Share</Text>
          </TouchableOpacity>
          <Text style={styles.time}>{time}</Text>
        </View>
      </View>
    </View>
  );
}

export default function SocialFeedScreen() {
  const router = useRouter();
  const { role, postId } = useLocalSearchParams<{
    role?: string;
    postId?: string;
  }>();
  const { userRole } = useAuth();
  const [activeFilter, setActiveFilter] = useState("All");
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<
    Array<{
      id: string;
      title: string;
      desc: string;
      tag: string;
      imageUrls: string[];
      tagTone: "green" | "blue";
      time: string;
    }>
  >([]);
  const isPublicFeed = role === "public";
  const isBoothWorker = userRole === "booth_worker";
  const backTarget = useMemo(() => {
    if (isPublicFeed) {
      return "/login";
    }
    if (userRole === "booth_worker") {
      return "/booth-worker";
    }
    if (userRole === "leader") {
      return "/leader";
    }
    if (userRole === "admin") {
      return "/admin/settings";
    }
    if (userRole === "operator") {
      return "/operator";
    }
    return "/dashboard";
  }, [isPublicFeed, userRole]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (apiConfigError) {
        setError(apiConfigError);
        return;
      }
      try {
        const data = await getPublishedPosts();
        if (!isActive) {
          return;
        }
        const mapped = data.map(item => ({
          id: item.id,
          title: item.title ?? "Update",
          desc: item.content ?? "",
          tag: item.category ?? "Update",
          imageUrls:
            item.image_urls?.filter(Boolean) ??
            (item.image_url ? [item.image_url] : []),
          tagTone: (item.category === "Health" ? "blue" : "green") as
            | "green"
            | "blue",
          time: item.published_at
            ? new Date(item.published_at).toLocaleDateString()
            : "Just now",
        }));
        setPosts(mapped);
      } catch (err) {
        if (!isActive) {
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to load.";
        setError(message);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const visiblePosts = useMemo(() => {
    const filtered = posts.filter(
      post => activeFilter === "All" || post.tag === activeFilter,
    );

    if (!postId) {
      return filtered;
    }

    return [...filtered].sort((left, right) => {
      if (left.id === postId) return -1;
      if (right.id === postId) return 1;
      return 0;
    });
  }, [activeFilter, postId, posts]);

  const buildPostShareUrl = (id: string) =>
    Linking.createURL("/feed", {
      queryParams: { postId: id },
    });

  const performNativeShare = async (postId: string, title: string) => {
    const trimmedTitle = title.trim();
    const shareUrl = buildPostShareUrl(postId);
    const message = trimmedTitle
      ? `${trimmedTitle}\n\nOpen this post in Jan Seva:\n${shareUrl}`
      : `Open this post in Jan Seva:\n${shareUrl}`;

    try {
      await Share.share(
        {
          title: trimmedTitle || "Jan Seva Portal",
          message,
          url: shareUrl,
        },
        Platform.OS === "android"
          ? { dialogTitle: trimmedTitle || "Share Post" }
          : undefined,
      );
      return true;
    } catch {
      Alert.alert("Share", "Sharing is not available on this device.");
      return false;
    }
  };

  const handleShare = async (postId: string, title: string) => {
    const didOpenShare = await performNativeShare(postId, title);
    if (!didOpenShare) {
      return;
    }

    if (isBoothWorker) {
      try {
        await trackPostShare(postId, "Direct Share");
      } catch {
        // Do not block the real device share flow if tracking fails.
      }
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace(backTarget as never);
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#00236F" />
          </TouchableOpacity>
          <Text style={styles.brand}>जन सेवा</Text>
        </View>
        <TouchableOpacity
          style={styles.langBtn}
          onPress={() =>
            Alert.alert("Language", "Language picker coming soon.")
          }
        >
          <Text style={styles.langText}>English</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Social Work Feed</Text>
        <Text style={styles.subtitle}>
          Community updates, development work, and upcoming public events.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.filterRow}>
          {(["All", "Infrastructure", "Health", "Education"] as const).map(
            filter => {
              const active = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[styles.filter, active && styles.filterActive]}
                  onPress={() => setActiveFilter(filter)}
                >
                  <Text
                    style={active ? styles.filterActiveText : styles.filterText}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            },
          )}
        </View>

        {visiblePosts.map(post => (
          <View
            key={post.id}
            style={[
              styles.postWrap,
              postId === post.id && styles.postWrapHighlighted,
            ]}
          >
            {postId === post.id ? (
              <View style={styles.linkedPostBadge}>
                <Text style={styles.linkedPostBadgeText}>Shared Post</Text>
              </View>
            ) : null}
            <FeedCard
              title={post.title}
              desc={post.desc}
              tag={post.tag.toUpperCase()}
              imageUrls={post.imageUrls}
              tagTone={post.tagTone}
              time={post.time}
              onShare={() => void handleShare(post.id, post.title)}
            />
          </View>
        ))}

        {!visiblePosts.length ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>
              Published posts will appear here once staff share them.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 6, borderRadius: 20 },
  brand: { fontSize: 20, color: "#00236F", fontWeight: "700" },
  langBtn: {
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langText: { fontSize: 14, color: "#00236F", fontWeight: "600" },
  content: { padding: 16, gap: 12, paddingBottom: 110 },
  title: { fontSize: 24, color: "#00236F", fontWeight: "700" },
  subtitle: { fontSize: 14, color: "#444651", lineHeight: 20 },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginTop: 2 },
  filter: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  filterActive: { backgroundColor: "#00236F", borderColor: "#00236F" },
  filterText: { color: "#444651", fontSize: 12, fontWeight: "600" },
  filterActiveText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  postWrap: { gap: 6 },
  postWrapHighlighted: {
    borderRadius: 16,
    backgroundColor: "#EEF4FF",
    padding: 6,
  },
  linkedPostBadge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#00236F",
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 4,
  },
  linkedPostBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  card: {
    marginTop: 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    position: "relative",
    backgroundColor: "#CBD9E9",
  },
  tag: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#006C49",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagBlue: { backgroundColor: "#00236F" },
  tagText: { color: "#FFFFFF", fontSize: 10, fontWeight: "700" },
  cardBody: { padding: 12, gap: 6 },
  cardTitle: { fontSize: 16, color: "#121C28", fontWeight: "700" },
  cardDesc: { fontSize: 14, color: "#444651", lineHeight: 20 },
  cardFoot: {
    marginTop: 2,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginRight: "auto",
    marginLeft: 10,
  },
  shareText: { color: "#00236F", fontSize: 11, fontWeight: "700" },
  time: { fontSize: 11, color: "#757682", fontWeight: "600" },
  emptyState: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 18,
    alignItems: "center",
    gap: 4,
  },
  emptyTitle: { color: "#121C28", fontSize: 14, fontWeight: "700" },
  emptyText: { color: "#444651", fontSize: 12, lineHeight: 18, textAlign: "center" },
});
