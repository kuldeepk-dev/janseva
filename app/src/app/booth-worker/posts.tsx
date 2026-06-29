import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { getCurrentProfile, type Profile } from "../../services/authService";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function ToolCard({
  icon,
  title,
  body,
  cta,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.toolCard}>
      <View style={styles.toolIconWrap}>
        <MaterialIcons name={icon} size={24} color="#00236F" />
      </View>
      <Text style={styles.toolTitle}>{title}</Text>
      <Text style={styles.toolBody}>{body}</Text>
      <TouchableOpacity style={styles.toolBtn} onPress={onPress}>
        <Text style={styles.toolBtnText}>{cta}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function BoothWorkerPostsScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      try {
        const currentProfile = await getCurrentProfile();
        if (isActive) {
          setProfile(currentProfile);
        }
      } catch {
        if (isActive) {
          setProfile(null);
        }
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const assignedBooth = profile?.assigned_booth_number || "12";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>Create Post</Text>
        <Text style={styles.subtitle}>Booth {assignedBooth}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.banner}>
          <Text style={styles.bannerEyebrow}>Booth communication</Text>
          <Text style={styles.bannerTitle}>Share booth-level updates fast.</Text>
          <Text style={styles.bannerBody}>
            Use manual post creation today. The AI post maker entry point is ready
            for future wiring.
          </Text>
        </View>

        <ToolCard
          icon="rss-feed"
          title="Published Feed"
          body="Open the live public post feed and use the tracked share button for WhatsApp, Facebook, Instagram, and more."
          cta="Open Feed"
          onPress={() =>
            router.push(
              {
                pathname: "/feed",
                params: { role: "booth-worker" },
              } as never,
            )
          }
        />

        <ToolCard
          icon="edit-square"
          title="Manual Post Creation"
          body="Compose and publish a post for constituents using the existing post editor."
          cta="Open Composer"
          onPress={() =>
            router.push(
              {
                pathname: "/leader/post/new",
                params: { draft: "booth-worker" },
              } as never,
            )
          }
        />

        <ToolCard
          icon="auto-awesome"
          title="AI Post Maker"
          body="UI entry point for AI-assisted caption and content generation. Functional wiring can be added later."
          cta="Coming Soon"
          onPress={() =>
            Alert.alert(
              "AI Post Maker",
              "The Booth Worker AI post maker UI is ready. AI generation can be connected later.",
            )
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#D7DBE7",
  },
  title: { color: "#00236F", fontSize: 24, fontWeight: "700" },
  subtitle: { color: "#5A6272", fontSize: 13, fontWeight: "600" },
  content: { padding: 16, gap: 14, paddingBottom: 96 },
  banner: {
    borderRadius: 20,
    backgroundColor: "#EEF4FF",
    padding: 16,
    gap: 8,
  },
  bannerEyebrow: {
    color: "#264191",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  bannerTitle: { color: "#121C28", fontSize: 22, fontWeight: "700" },
  bannerBody: { color: "#444651", fontSize: 13, lineHeight: 19 },
  toolCard: {
    borderWidth: 1,
    borderColor: "#D7DFEF",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    padding: 16,
    gap: 12,
  },
  toolIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#DFE9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  toolTitle: { color: "#121C28", fontSize: 20, fontWeight: "700" },
  toolBody: { color: "#444651", fontSize: 13, lineHeight: 19 },
  toolBtn: {
    height: 46,
    borderRadius: 12,
    backgroundColor: "#00236F",
    alignItems: "center",
    justifyContent: "center",
  },
  toolBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
