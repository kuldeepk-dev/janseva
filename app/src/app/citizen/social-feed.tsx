import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { apiConfigError } from "../../lib/api";
import { getPublishedPosts } from "../../services/socialPostService";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function FeedCard({
  title,
  desc,
  tag,
  tagTone = "green",
  time,
  onShare,
}: {
  title: string;
  desc: string;
  tag: string;
  tagTone?: "green" | "blue";
  time: string;
  onShare: () => void;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.image}>
        <View style={[styles.tag, tagTone === "blue" && styles.tagBlue]}>
          <Text style={styles.tagText}>{tag}</Text>
        </View>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
        <View style={styles.cardFoot}>
          <Text style={styles.metrics}>12 comments • 48 reactions</Text>
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
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [activeFilter, setActiveFilter] = useState("All");
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<
    Array<{
      id: string;
      title: string;
      desc: string;
      tag: string;
      tagTone: "green" | "blue";
      time: string;
    }>
  >([]);
  const backTarget = role === "public" ? "/login" : "/dashboard";

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
          tagTone: item.category === "Health" ? "blue" : "green",
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

  const fallbackPosts = useMemo(
    () => [
      {
        id: "1",
        title: "Ward 12 Road Repair Completion",
        desc: "The main artery road for Ward 12 has been successfully resurfaced, benefiting over 500 households.",
        tag: "Infrastructure",
        tagTone: "green" as const,
        time: "2 hours ago",
      },
      {
        id: "2",
        title: "Free Health Camp: Sunday",
        desc: "Join us this Sunday at the Community Center for a free general checkup and vaccination drive.",
        tag: "Health",
        tagTone: "blue" as const,
        time: "5 hours ago",
      },
    ],
    [],
  );
  const sourcePosts = posts.length ? posts : fallbackPosts;
  const visiblePosts = sourcePosts.filter(
    post => activeFilter === "All" || post.tag === activeFilter,
  );

  const handleShare = async (title: string) => {
    try {
      await Share.share({ message: `${title} - Jan Seva Portal` });
    } catch {
      Alert.alert("Share", "Sharing is not available on this device.");
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
          <FeedCard
            key={post.id}
            title={post.title}
            desc={post.desc}
            tag={post.tag.toUpperCase()}
            tagTone={post.tagTone}
            time={post.time}
            onShare={() => handleShare(post.title)}
          />
        ))}
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
  content: { padding: 16, gap: 12, paddingBottom: 24 },
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
  card: {
    marginTop: 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    overflow: "hidden",
  },
  image: {
    height: 150,
    backgroundColor: "#CBD9E9",
    alignItems: "flex-end",
    padding: 8,
  },
  tag: {
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
  metrics: { fontSize: 11, color: "#757682" },
  time: { fontSize: 11, color: "#757682", fontWeight: "600" },
});
