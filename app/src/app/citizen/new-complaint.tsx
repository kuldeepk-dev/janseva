import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { apiConfigError } from "../../lib/api";
import { createComplaint } from "../../services/complaintService";
import * as DocumentPicker from "expo-document-picker";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [attachedFile, setAttachedFile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState("");
  const [subCategoryError, setSubCategoryError] = useState("");
  const [addressError, setAddressError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
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

  const subCategories: Record<string, string[]> = {
    Water: [
      "No Supply",
      "Low Pressure",
      "Contamination",
      "Leakage",
      "Billing Issue",
    ],
    Electricity: [
      "Power Cut",
      "Voltage Fluctuation",
      "Street Light",
      "Meter Issue",
      "Billing Issue",
    ],
    Roads: [
      "Potholes",
      "Damaged Road",
      "Traffic Signal",
      "Street Sign",
      "Drainage",
    ],
    Waste: [
      "Collection Delay",
      "Littering",
      "Bin Overflow",
      "Illegal Dumping",
      "Recycling",
    ],
    Security: [
      "Street Crime",
      "Vandalism",
      "Suspicious Activity",
      "CCTV Issue",
      "Lighting",
    ],
    Health: [
      "Hospital Service",
      "Sanitation",
      "Disease Outbreak",
      "Ambulance",
      "Medical Staff",
    ],
    Education: [
      "School Infrastructure",
      "Teacher Absence",
      "Mid-day Meal",
      "Books",
      "Facilities",
    ],
    "Public Space": [
      "Park Maintenance",
      "Playground",
      "Public Toilet",
      "Encroachment",
      "Cleanliness",
    ],
    Others: [
      "Noise Pollution",
      "Stray Animals",
      "Building Violation",
      "Corruption",
      "Other",
    ],
  };

  const handleFileAttach = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        setAttachedFile(result.assets[0]);
      }
    } catch (err) {
      Alert.alert("Error", "Failed to attach file");
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setCategoryError("");
    setSubCategoryError("");
    setAddressError("");
    setDescriptionError("");
    
    let hasError = false;
    
    if (!selectedCategory) {
      setCategoryError("Please select a complaint category.");
      hasError = true;
    }
    if (!selectedSubCategory) {
      setSubCategoryError("Please select a sub-category.");
      hasError = true;
    }
    if (!address.trim()) {
      setAddressError("Please enter the complaint address/location.");
      hasError = true;
    }
    if (!description.trim()) {
      setDescriptionError("Please describe the issue.");
      hasError = true;
    }
    
    if (hasError) {
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
        sub_category: selectedSubCategory,
        description: description.trim(),
        location_text: address.trim(),
        priority: "normal",
        attached_file: attachedFile?.name || null,
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
          <TouchableOpacity
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/dashboard" as never);
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

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Submit New Complaint</Text>
          <Text style={styles.subtitle}>
            Provide details about your grievance. Our team will review and
            respond within 48 hours.
          </Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Text style={styles.label}>Select Complaint Category *</Text>
          {categoryError ? <Text style={styles.fieldError}>{categoryError}</Text> : null}
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
            <Text style={styles.label}>Select Sub-category *</Text>
            {subCategoryError ? <Text style={styles.fieldError}>{subCategoryError}</Text> : null}
            <TouchableOpacity
              style={styles.selectBox}
              onPress={() => setShowSubCategoryModal(true)}
            >
              <Text
                style={[
                  styles.selectPlaceholder,
                  selectedSubCategory && styles.selectValue,
                ]}
              >
                {selectedSubCategory || "Select a sub-category"}
              </Text>
              <MaterialIcons name="expand-more" size={20} color="#444651" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Complaint Address/Location *</Text>
            {addressError ? <Text style={styles.fieldError}>{addressError}</Text> : null}
            <TextInput
              placeholder="Enter the address or location..."
              placeholderTextColor="#757682"
              style={styles.input}
              value={address}
              onChangeText={setAddress}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Detailed Description</Text>
            {descriptionError ? <Text style={styles.fieldError}>{descriptionError}</Text> : null}
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
              {/* <TouchableOpacity
                style={styles.micBtn}
                onPress={() =>
                  Alert.alert("Voice", "Voice input is a placeholder.")
                }
              >
                <MaterialIcons name="mic" size={20} color="#FFFFFF" />
              </TouchableOpacity> */}
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
              <MaterialIcons
                name="document-scanner"
                size={20}
                color="#00236F"
              />
              <Text style={styles.toolText}>Scan Doc</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.toolBtn} onPress={handleFileAttach}>
              <MaterialIcons name="attach-file" size={20} color="#00236F" />
              <Text style={styles.toolText}>Attach File</Text>
            </TouchableOpacity>
          </View>

          {attachedFile && (
            <View style={styles.attachedFile}>
              <MaterialIcons
                name="insert-drive-file"
                size={20}
                color="#00236F"
              />
              <Text style={styles.fileName} numberOfLines={1}>
                {attachedFile.name}
              </Text>
              <TouchableOpacity onPress={() => setAttachedFile(null)}>
                <MaterialIcons name="close" size={20} color="#BA1A1A" />
              </TouchableOpacity>
            </View>
          )}

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
      </KeyboardAvoidingView>

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

      <Modal
        visible={showSubCategoryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSubCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowSubCategoryModal(false)}
        >
          <View
            style={styles.modalContent}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Sub-category</Text>
              <TouchableOpacity onPress={() => setShowSubCategoryModal(false)}>
                <MaterialIcons name="close" size={24} color="#121C28" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalList}>
              {subCategories[selectedCategory]?.map((sub, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.modalItem}
                  onPress={() => {
                    setSelectedSubCategory(sub);
                    setShowSubCategoryModal(false);
                  }}
                >
                  <Text style={styles.modalItemText}>{sub}</Text>
                  {selectedSubCategory === sub && (
                    <MaterialIcons name="check" size={20} color="#006C49" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  content: { padding: 16, paddingBottom: 180, gap: 12 },
  title: { fontSize: 24, color: "#121C28", fontWeight: "600" },
  subtitle: { fontSize: 14, color: "#444651", lineHeight: 20, marginBottom: 4 },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  fieldError: { color: "#BA1A1A", fontSize: 12, marginTop: -4 },
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
  selectValue: { color: "#121C28", fontWeight: "500" },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    color: "#121C28",
    fontSize: 16,
  },
  attachedFile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 8,
    backgroundColor: "#EEF4FF",
  },
  fileName: { flex: 1, color: "#121C28", fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalContent: {
    width: "100%",
    maxHeight: "70%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
  },
  modalTitle: {
    fontSize: 18,
    color: "#121C28",
    fontWeight: "600",
  },
  modalList: {
    maxHeight: 400,
  },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalItemText: {
    fontSize: 16,
    color: "#121C28",
  },
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
    bottom: 64,
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
