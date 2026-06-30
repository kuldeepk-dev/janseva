import { MaterialIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { apiConfigError } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import {
  getPublishedPosts,
  trackPostShare,
} from "../../services/socialPostService";
import { PostImageCarousel } from "../../components/PostImageCarousel";
import {
  Alert,
  Image,
  Platform,
  ScrollView,
  Share,
  type ShareContent,
  type View as RNView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { captureRef, releaseCapture } from "react-native-view-shot";

type FeedPost = {
  id: string;
  title: string;
  desc: string;
  tag: string;
  imageUrls: string[];
  tagTone: "green" | "blue";
  time: string;
};

type SharePreviewPost = {
  title: string;
  desc: string;
  tag: string;
  tagTone: "green" | "blue";
  time: string;
  imageUrl: string | null;
  shareUrl: string;
};

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
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [sharePreviewPost, setSharePreviewPost] =
    useState<SharePreviewPost | null>(null);
  const [sharePreviewReady, setSharePreviewReady] = useState(false);
  const sharePreviewRef = useRef<RNView | null>(null);
  const sharePreviewPromiseRef = useRef<{
    resolve: (uri: string) => void;
    reject: (error: Error) => void;
  } | null>(null);
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

  useEffect(() => {
    if (!sharePreviewPost || !sharePreviewReady) {
      return;
    }

    let cancelled = false;
    const timer = setTimeout(() => {
      if (!sharePreviewRef.current) {
        const pending = sharePreviewPromiseRef.current;
        sharePreviewPromiseRef.current = null;
        setSharePreviewPost(null);
        setSharePreviewReady(false);
        pending?.reject(new Error("Share preview is not ready yet."));
        return;
      }

      void captureRef(sharePreviewRef, {
        format: "jpg",
        quality: 0.92,
        result: "tmpfile",
        fileName: "jan-seva-post-share",
      })
        .then(uri => {
          if (cancelled) {
            releaseCapture(uri);
            return;
          }
          const pending = sharePreviewPromiseRef.current;
          sharePreviewPromiseRef.current = null;
          setSharePreviewPost(null);
          setSharePreviewReady(false);
          pending?.resolve(uri);
        })
        .catch(error => {
          if (cancelled) {
            return;
          }
          const pending = sharePreviewPromiseRef.current;
          sharePreviewPromiseRef.current = null;
          setSharePreviewPost(null);
          setSharePreviewReady(false);
          pending?.reject(
            error instanceof Error
              ? error
              : new Error("Failed to capture the share preview."),
          );
        });
    }, 150);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sharePreviewPost, sharePreviewReady]);

  const buildSharePreviewImage = (post: SharePreviewPost) =>
    new Promise<string>((resolve, reject) => {
      sharePreviewPromiseRef.current = { resolve, reject };
      setSharePreviewReady(!post.imageUrl);
      setSharePreviewPost(post);
    });

  const performTextShare = async ({
    title,
    desc,
    shareUrl,
  }: {
    title: string;
    desc: string;
    shareUrl: string;
  }) => {
    const baseContent = {
      title: title || "Jan Seva Portal",
      message: title
        ? [title, desc || null, `Open this post in Jan Seva:\n${shareUrl}`]
            .filter(Boolean)
            .join("\n\n")
        : desc
          ? `${desc}\n\nOpen this post in Jan Seva:\n${shareUrl}`
          : `Open this post in Jan Seva:\n${shareUrl}`,
    };
    const shareOptions =
      Platform.OS === "android"
        ? { dialogTitle: title || "Share Post" }
        : undefined;
    const shareWith = async (content: ShareContent) => {
      const result = await Share.share(content, shareOptions);
      return result.action !== Share.dismissedAction;
    };

    try {
      return await shareWith({
        ...baseContent,
        url: shareUrl,
      });
    } catch {
      Alert.alert("Share", "Sharing is not available on this device.");
      return false;
    }
  };

  const performNativeShare = async ({
    title,
    desc,
    tag,
    tagTone,
    time,
    shareUrl,
    imageUrl,
  }: {
    title: string;
    desc: string;
    tag: string;
    tagTone: "green" | "blue";
    time: string;
    shareUrl: string;
    imageUrl: string | null;
  }) => {
    const trimmedTitle = title.trim();
    const trimmedDesc = desc.trim();

    try {
      const sharingAvailable = await Sharing.isAvailableAsync();
      if (sharingAvailable) {
        const previewUri = await buildSharePreviewImage({
          title: trimmedTitle || "Jan Seva Portal",
          desc: trimmedDesc,
          tag,
          tagTone,
          time,
          imageUrl,
          shareUrl,
        });
        try {
          await Sharing.shareAsync(previewUri, {
            dialogTitle: trimmedTitle || "Share Post",
            mimeType: "image/jpeg",
            UTI: "public.jpeg",
          });
          return true;
        } finally {
          releaseCapture(previewUri);
        }
      }
    } catch {
      // Fall back to a text share if image-based sharing is unavailable.
    }

    return await performTextShare({
      title: trimmedTitle,
      desc: trimmedDesc,
      shareUrl,
    });
  };

  const handleShare = async ({
    postId,
    title,
    desc,
    tag,
    tagTone,
    time,
    imageUrls,
  }: {
    postId: string;
    title: string;
    desc: string;
    tag: string;
    tagTone: "green" | "blue";
    time: string;
    imageUrls: string[];
  }) => {
    const didOpenShare = await performNativeShare({
      title,
      desc,
      tag,
      tagTone,
      time,
      shareUrl: buildPostShareUrl(postId),
      imageUrl: imageUrls.map(url => url.trim()).find(Boolean) ?? null,
    });
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
            onShare={() =>
              void handleShare({
                postId: post.id,
                title: post.title,
                desc: post.desc,
                tag: post.tag.toUpperCase(),
                tagTone: post.tagTone,
                time: post.time,
                imageUrls: post.imageUrls,
              })
            }
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

      {sharePreviewPost ? (
        <View pointerEvents="none" style={styles.sharePreviewStage}>
          <View
            ref={sharePreviewRef}
            collapsable={false}
            style={styles.sharePreviewCard}
          >
            {sharePreviewPost.imageUrl ? (
              <Image
                source={{ uri: sharePreviewPost.imageUrl }}
                style={styles.sharePreviewImage}
                resizeMode="cover"
                onLoadEnd={() => setSharePreviewReady(true)}
                onError={() => setSharePreviewReady(true)}
              />
            ) : (
              <View style={styles.sharePreviewImageFallback}>
                <Text style={styles.sharePreviewImageFallbackText}>
                  Jan Seva
                </Text>
              </View>
            )}

            <View style={styles.sharePreviewBody}>
              <View style={styles.sharePreviewMeta}>
                <View
                  style={[
                    styles.sharePreviewTag,
                    sharePreviewPost.tagTone === "blue" &&
                      styles.sharePreviewTagBlue,
                  ]}
                >
                  <Text style={styles.sharePreviewTagText}>
                    {sharePreviewPost.tag}
                  </Text>
                </View>
                <Text style={styles.sharePreviewTime}>
                  {sharePreviewPost.time}
                </Text>
              </View>

              <Text style={styles.sharePreviewBrand}>Jan Seva Portal</Text>
              <Text style={styles.sharePreviewTitle}>
                {sharePreviewPost.title}
              </Text>
              {sharePreviewPost.desc ? (
                <Text style={styles.sharePreviewDesc}>
                  {sharePreviewPost.desc}
                </Text>
              ) : null}
              <Text style={styles.sharePreviewLinkLabel}>
                Open this post in Jan Seva
              </Text>
              <Text style={styles.sharePreviewLink}>
                {sharePreviewPost.shareUrl}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
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
  sharePreviewStage: {
    position: "absolute",
    left: -9999,
    top: 0,
    width: 360,
  },
  sharePreviewCard: {
    width: 340,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#C5C5D3",
  },
  sharePreviewImage: {
    width: "100%",
    height: 220,
    backgroundColor: "#CBD9E9",
  },
  sharePreviewImageFallback: {
    width: "100%",
    height: 180,
    backgroundColor: "#DCE7F8",
    alignItems: "center",
    justifyContent: "center",
  },
  sharePreviewImageFallbackText: {
    color: "#00236F",
    fontSize: 28,
    fontWeight: "800",
  },
  sharePreviewBody: {
    padding: 16,
    gap: 8,
  },
  sharePreviewMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sharePreviewTag: {
    backgroundColor: "#006C49",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  sharePreviewTagBlue: {
    backgroundColor: "#00236F",
  },
  sharePreviewTagText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  sharePreviewTime: {
    color: "#757682",
    fontSize: 11,
    fontWeight: "600",
  },
  sharePreviewBrand: {
    color: "#00236F",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  sharePreviewTitle: {
    color: "#121C28",
    fontSize: 22,
    fontWeight: "800",
    lineHeight: 28,
  },
  sharePreviewDesc: {
    color: "#444651",
    fontSize: 15,
    lineHeight: 22,
  },
  sharePreviewLinkLabel: {
    marginTop: 4,
    color: "#00236F",
    fontSize: 12,
    fontWeight: "700",
  },
  sharePreviewLink: {
    color: "#3559A7",
    fontSize: 12,
    lineHeight: 18,
  },
});
