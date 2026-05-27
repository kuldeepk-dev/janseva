import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function CitizenDashboardScreen() {
  const router = useRouter();
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.logoWrap}>
            <Image
              source={{
                uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBDfoqKvJefZCMQ4yXasM7rKchn6zE2oNQf0xkFiM8jkX-MXNln83ALmYponYJtiwBcwVpOO1o0bZUh-Up-SH-0Pe8dqWHrXCUf_YGCGizNllt1aU9IORbWI-mzQlmIknVlf7_MNqGem1d2l6WFYcYuIq1z_Fi64TXzwrkaWuFtjsAzUeFJJ85gGJc6Og5l4JUOcu8ek15H5WxdBdo0GsjXSSIpRA2G7RAxpmn2kv8-3jUaFH6rRIh1C40NTevAx4kAVJFW1fVz_aU",
              }}
              style={styles.logo}
            />
          </View>
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
        <View style={styles.welcomeSection}>
          <View>
            <Text style={styles.welcomeText}>Namaste, Sandeep</Text>
            <Text style={styles.title}>Your Dashboard</Text>
          </View>
          <View style={styles.wardBadge}>
            <MaterialIcons name="location-on" size={16} color="#444651" />
            <Text style={styles.wardText}>Ward 12</Text>
          </View>
        </View>

        <View style={styles.bentoGrid}>
          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <View
                style={[styles.statIconWrap, { backgroundColor: "#FFDAD6" }]}
              >
                <MaterialIcons name="error" size={22} color="#93000A" />
              </View>
              <Text style={styles.statNumber}>04</Text>
            </View>
            <Text style={styles.statLabel}>Open</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <View
                style={[styles.statIconWrap, { backgroundColor: "#6CF8BB" }]}
              >
                <MaterialIcons name="check-circle" size={22} color="#00714D" />
              </View>
              <Text style={styles.statNumber}>12</Text>
            </View>
            <Text style={styles.statLabel}>Resolved</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <View
                style={[styles.statIconWrap, { backgroundColor: "#DFE9FA" }]}
              >
                <MaterialIcons
                  name="pending-actions"
                  size={22}
                  color="#757682"
                />
              </View>
              <Text style={styles.statNumber}>02</Text>
            </View>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        <View style={styles.primaryHub}>
          <Text style={styles.primaryHubTitle}>Important for New Citizens</Text>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push("/register" as never)}
          >
            <View style={styles.registerLeft}>
              <MaterialIcons name="how-to-reg" size={28} color="#FFFFFF" />
              <View>
                <Text style={styles.registerTitle}>Register Voter Profile</Text>
                <Text style={styles.registerSubtitle}>
                  Mandatory for local body elections
                </Text>
              </View>
            </View>
            <MaterialIcons name="arrow-forward" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/complaints/new" as never)}
          >
            <MaterialIcons name="add-box" size={22} color="#00236F" />
            <Text style={styles.actionText}>New Complaint</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push("/complaints" as never)}
          >
            <MaterialIcons name="track-changes" size={22} color="#00236F" />
            <Text style={styles.actionText}>Track Status</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.feedHeader}>
          <Text style={styles.feedTitle}>Social Work Feed</Text>
          <TouchableOpacity onPress={() => router.push("/feed" as never)}>
            <Text style={styles.viewAll}>View All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.feedRow}
        >
          <View style={styles.feedCard}>
            <View style={styles.feedImageWrap}>
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuCj_taAhu8r7b5EeqEpEI1lBxr_BE7jzjkSYSuxLZzJeNKfFHe1IFlXv_NwLDxZiIzZV4QfYxHpDwbnnLzoEFtRsWYRjUeEQCfJB5gr78qFhXGkUF1UnmOo38gF1OPqiWGkUoPzJehlT3j39pZCdrmRMD3AaDiXprCg8T85EzZnsHmJ0TObMot_Y60shsibKc56SO2aNrD43jqUcKQpamHQcCnXKEFqotoQKBExmfaUOp1ls2iknOViRbi9GpOiub0ebS8XpcNxzBA",
                }}
                style={styles.feedImage}
              />
              <View style={styles.feedTag}>
                <Text style={styles.feedTagText}>Infrastructure</Text>
              </View>
            </View>
            <View style={styles.feedBody}>
              <Text style={styles.feedCardTitle}>
                Ward 12 Road Repair Completion
              </Text>
              <Text style={styles.feedCardDesc}>
                The main artery road for Ward 12 has been successfully
                resurfaced, benefiting over 500 households...
              </Text>
              <View style={styles.feedFoot}>
                <View style={styles.avatarDots}>
                  <View
                    style={[styles.avatarDot, { backgroundColor: "#E2E8F0" }]}
                  />
                  <View
                    style={[
                      styles.avatarDot,
                      { backgroundColor: "#CBD5E1", marginLeft: -8 },
                    ]}
                  />
                  <View
                    style={[
                      styles.avatarDot,
                      { backgroundColor: "#94A3B8", marginLeft: -8 },
                    ]}
                  />
                </View>
                <Text style={styles.feedTime}>2 hours ago</Text>
              </View>
            </View>
          </View>

          <View style={styles.feedCard}>
            <View style={styles.feedImageWrap}>
              <Image
                source={{
                  uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDdsWkKCdU8Wpgz7XaI4PfLDdWi1wY7OFNNSRFDkA09RiwNk51oJIpW_kMflunJwMNICZ3ddIP3CdkPjjwGyIee5Ufhk0Hx38jh3qJz15WaJsOPG3PBZOQOawkRglmuz_EkRqWV-ROl6KkWixW8IcEi9Ac6CME89OeVG5xYHxL4Xqv2beQUVCtAc2YxcVVPWq2k-1EOpDxHGbczEyLYV_oDVlqefd4dpB4_hk1XaVhCEVK2Zv-MAeT1JhoCMEW-8c8L8pEcAI-PkmI",
                }}
                style={styles.feedImage}
              />
              <View style={[styles.feedTag, { backgroundColor: "#00236F" }]}>
                <Text style={styles.feedTagText}>Health</Text>
              </View>
            </View>
            <View style={styles.feedBody}>
              <Text style={styles.feedCardTitle}>Free Health Camp: Sunday</Text>
              <Text style={styles.feedCardDesc}>
                Join us this Sunday at the Community Center for a free general
                checkup and vaccination drive...
              </Text>
              <View style={styles.feedFoot}>
                <View style={styles.avatarDots}>
                  <View
                    style={[styles.avatarDot, { backgroundColor: "#E2E8F0" }]}
                  />
                  <View
                    style={[
                      styles.avatarDot,
                      { backgroundColor: "#CBD5E1", marginLeft: -8 },
                    ]}
                  />
                </View>
                <Text style={styles.feedTime}>5 hours ago</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.quickSection}>
          <Text style={styles.quickTitle}>Quick Links</Text>
          <View style={styles.quickGrid}>
            <View style={styles.quickItem}>
              <View style={styles.quickIconWrap}>
                <MaterialIcons name="water-drop" size={20} color="#00236F" />
              </View>
              <Text style={styles.quickLabel}>Water</Text>
            </View>
            <View style={styles.quickItem}>
              <View style={styles.quickIconWrap}>
                <MaterialIcons name="lightbulb" size={20} color="#00236F" />
              </View>
              <Text style={styles.quickLabel}>Electricity</Text>
            </View>
            <View style={styles.quickItem}>
              <View style={styles.quickIconWrap}>
                <MaterialIcons name="delete" size={20} color="#00236F" />
              </View>
              <Text style={styles.quickLabel}>Waste</Text>
            </View>
            <View style={styles.quickItem}>
              <View style={styles.quickIconWrap}>
                <MaterialIcons name="description" size={20} color="#00236F" />
              </View>
              <Text style={styles.quickLabel}>Education</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={aiOpen}
        animationType="slide"
        onRequestClose={() => setAiOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>AI Help</Text>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() =>
                Alert.alert(
                  "How to register?",
                  "Use the Register button on the dashboard to start.",
                )
              }
            >
              <Text style={styles.modalItemText}>How to register?</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setAiOpen(false);
                router.push("/complaints" as never);
              }}
            >
              <Text style={styles.modalItemText}>Track complaint</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setAiOpen(false);
                router.push("/complaints/new" as never);
              }}
            >
              <Text style={styles.modalItemText}>Submit complaint</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setAiOpen(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
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
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1E3A8A",
  },
  logo: { width: "100%", height: "100%" },
  brand: { fontSize: 24, lineHeight: 30, color: "#00236F", fontWeight: "700" },
  langBtn: {
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  langText: { fontSize: 14, color: "#00236F", fontWeight: "600" },
  content: { paddingTop: 20, paddingHorizontal: 16, paddingBottom: 120 },
  welcomeSection: {
    marginBottom: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  welcomeText: {
    fontSize: 14,
    color: "#444651",
    marginBottom: 4,
    fontWeight: "600",
  },
  title: { fontSize: 28, lineHeight: 36, color: "#00236F", fontWeight: "700" },
  wardBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#DFE9FA",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  wardText: { fontSize: 12, color: "#444651", fontWeight: "600" },
  bentoGrid: { gap: 12, marginBottom: 24 },
  statCard: {
    height: 128,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 16,
    justifyContent: "space-between",
  },
  statTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  statNumber: { fontSize: 24, color: "#00236F", fontWeight: "700" },
  statLabel: { fontSize: 14, color: "#444651", fontWeight: "600" },
  primaryHub: {
    marginBottom: 16,
    backgroundColor: "#EEF4FF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D6E4FF",
    padding: 16,
  },
  primaryHubTitle: {
    fontSize: 12,
    color: "#00236F",
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  registerBtn: {
    height: 64,
    borderRadius: 12,
    backgroundColor: "#00236F",
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#00236F",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  registerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  registerTitle: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  registerSubtitle: { color: "#D6E3FF", fontSize: 10, marginTop: 2 },
  actionGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  actionBtn: {
    flex: 1,
    height: 64,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  actionText: { fontSize: 12, color: "#00236F", fontWeight: "600" },
  feedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  feedTitle: { fontSize: 20, color: "#00236F", fontWeight: "700" },
  viewAll: { fontSize: 14, color: "#006C49", fontWeight: "600" },
  feedRow: { paddingBottom: 8 },
  feedCard: {
    width: 280,
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  feedImageWrap: { height: 128, position: "relative" },
  feedImage: { width: "100%", height: "100%" },
  feedTag: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#006C49",
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  feedTagText: {
    color: "#FFFFFF",
    fontSize: 10,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  feedBody: { padding: 12 },
  feedCardTitle: {
    fontSize: 14,
    color: "#121C28",
    fontWeight: "600",
    marginBottom: 4,
  },
  feedCardDesc: { fontSize: 14, lineHeight: 20, color: "#444651" },
  feedFoot: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  avatarDots: { flexDirection: "row", alignItems: "center" },
  avatarDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  feedTime: { fontSize: 10, color: "#757682", fontWeight: "600" },
  quickSection: { marginTop: 24 },
  quickTitle: {
    fontSize: 20,
    color: "#00236F",
    fontWeight: "700",
    marginBottom: 12,
  },
  quickGrid: { flexDirection: "row", justifyContent: "space-between" },
  quickItem: { alignItems: "center", width: "23%" },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    marginTop: 4,
    fontSize: 10,
    color: "#444651",
    fontWeight: "500",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "#00000055",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    gap: 10,
  },
  modalHandle: {
    alignSelf: "center",
    width: 42,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#D9E3F4",
  },
  modalTitle: { fontSize: 16, color: "#00236F", fontWeight: "700" },
  modalItem: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 10,
    padding: 12,
    backgroundColor: "#F8F9FF",
  },
  modalItemText: { color: "#121C28", fontSize: 14, fontWeight: "600" },
  modalClose: { alignItems: "center", paddingVertical: 10 },
  modalCloseText: { color: "#00236F", fontSize: 14, fontWeight: "700" },
});
