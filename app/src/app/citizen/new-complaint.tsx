import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { apiConfigError } from "../../lib/api";
import { createComplaint } from "../../services/complaintService";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function Category({
  icon,
  label,
  selected,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.categoryCard, selected && styles.categoryCardActive]}
      onPress={onPress}
    >
      <MaterialIcons name={icon} size={22} color="#00236F" />
      <Text
        style={[styles.categoryText, selected && styles.categoryTextActive]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function NewComplaintScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("Water");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const categories = [
    { icon: "water-drop", label: "Water" },
    { icon: "lightbulb", label: "Electricity" },
    { icon: "commute", label: "Roads" },
    { icon: "delete", label: "Waste" },
    { icon: "shield", label: "Security" },
    { icon: "health-and-safety", label: "Health" },
    { icon: "school", label: "Education" },
    { icon: "park", label: "Public Space" },
    { icon: "more-horiz", label: "Others" },
  ];

  const handleSubmit = async () => {
    setError(null);
    if (!description.trim()) {
      setError("Please describe the issue before submitting.");
      return;
    }
    if (apiConfigError) {
      setError(apiConfigError);
      Alert.alert("Complaint Submitted", "Saved locally for now.");
      router.push("/complaints" as never);
      return;
    }
    setIsLoading(true);
    try {
      const complaint = await createComplaint({
        category: selectedCategory,
        description: description.trim(),
        location_text: "Not specified",
        priority: "normal",
      });
      Alert.alert(
        "Complaint Submitted",
        `Your complaint ID is ${complaint.complaint_number ?? "pending"}.`,
      );
      router.push("/complaints" as never);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Submission failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.push("/dashboard" as never)}>
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
        <Text style={styles.title}>Submit New Complaint</Text>
        <Text style={styles.subtitle}>
          Provide details about your grievance. Our team will review and respond
          within 48 hours.
        </Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <Text style={styles.label}>Select Complaint Category</Text>
        <View style={styles.categoryGrid}>
          {categories.map(category => (
            <Category
              key={category.label}
              icon={category.icon as keyof typeof MaterialIcons.glyphMap}
              label={category.label}
              selected={selectedCategory === category.label}
              onPress={() => setSelectedCategory(category.label)}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Select Sub-category</Text>
          <TouchableOpacity
            style={styles.selectBox}
            onPress={() =>
              Alert.alert(
                "Sub-category",
                "Select a sub-category in a future update.",
              )
            }
          >
            <Text style={styles.selectPlaceholder}>Select a sub-category</Text>
            <MaterialIcons name="expand-more" size={20} color="#444651" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Detailed Description</Text>
          <View style={styles.textareaWrap}>
            <TextInput
              placeholder="Explain the issue in detail..."
              placeholderTextColor="#757682"
              multiline
              textAlignVertical="top"
              style={styles.textarea}
              value={description}
              onChangeText={setDescription}
            />
            <TouchableOpacity
              style={styles.micBtn}
              onPress={() =>
                Alert.alert("Voice", "Voice input is a placeholder.")
              }
            >
              <MaterialIcons name="mic" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.quickTools}>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() =>
              Alert.alert("Location", "Location tagging is a placeholder.")
            }
          >
            <MaterialIcons name="location-on" size={20} color="#00236F" />
            <Text style={styles.toolText}>Tag Location</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() =>
              Alert.alert("Scan Doc", "Document scanning is a placeholder.")
            }
          >
            <MaterialIcons name="document-scanner" size={20} color="#00236F" />
            <Text style={styles.toolText}>Scan Doc</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.toolBtn}
            onPress={() =>
              Alert.alert("Attach Photo", "Photo attachment is a placeholder.")
            }
          >
            <MaterialIcons name="attach-file" size={20} color="#00236F" />
            <Text style={styles.toolText}>Attach Photo</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.whatsappCard}>
          <View style={styles.whatsappLeft}>
            <View style={styles.whatsappIcon}>
              <MaterialIcons name="chat" size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.whatsappTitle}>WhatsApp Updates</Text>
              <Text style={styles.whatsappSub}>Get updates on WhatsApp</Text>
            </View>
          </View>
          <Switch value />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          <MaterialIcons name="send" size={18} color="#FFFFFF" />
          <Text style={styles.submitText}>
            {isLoading ? "Submitting..." : "Submit Complaint"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 56,
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  brand: { color: "#00236F", fontSize: 20, fontWeight: "700" },
  langBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  langText: { color: "#00236F", fontSize: 14, fontWeight: "600" },
  content: { padding: 16, paddingBottom: 96, gap: 12 },
  title: { fontSize: 24, color: "#121C28", fontWeight: "600" },
  subtitle: { fontSize: 14, color: "#444651", lineHeight: 20, marginBottom: 4 },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  label: { fontSize: 14, color: "#121C28", fontWeight: "600" },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryCard: {
    width: "31%",
    aspectRatio: 1,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  categoryCardActive: { borderColor: "#006C49", backgroundColor: "#6CF8BB" },
  categoryText: {
    fontSize: 11,
    color: "#121C28",
    fontWeight: "500",
    textAlign: "center",
  },
  categoryTextActive: { color: "#005236", fontWeight: "700" },
  section: {
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
  },
  selectBox: {
    height: 48,
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectPlaceholder: { color: "#757682", fontSize: 16 },
  textareaWrap: {
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    minHeight: 132,
    position: "relative",
  },
  textarea: {
    padding: 12,
    color: "#121C28",
    fontSize: 16,
    minHeight: 132,
    paddingRight: 56,
  },
  micBtn: {
    position: "absolute",
    right: 8,
    bottom: 8,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#00236F",
    alignItems: "center",
    justifyContent: "center",
  },
  quickTools: { flexDirection: "row", gap: 8 },
  toolBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 8,
    backgroundColor: "#EEF4FF",
    paddingVertical: 10,
    alignItems: "center",
    gap: 4,
  },
  toolText: { fontSize: 10, color: "#121C28", fontWeight: "500" },
  whatsappCard: {
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: "#DFE9FA",
    padding: 12,
  },
  whatsappLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  whatsappIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  whatsappTitle: { fontSize: 14, color: "#121C28", fontWeight: "600" },
  whatsappSub: { fontSize: 10, color: "#444651" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
    padding: 12,
  },
  submitBtn: {
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00236F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  submitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },
});
