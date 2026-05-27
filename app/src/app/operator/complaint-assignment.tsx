import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { apiConfigError } from "../../lib/api";
import {
  assignComplaint,
  getAllComplaints,
  getDepartments,
} from "../../services/complaintService";
import {
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function ComplaintAssignmentScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState(true);
  const [priority, setPriority] = useState<"Normal" | "Urgent" | "Critical">(
    "Normal",
  );
  const [complaintId, setComplaintId] = useState<string | null>(null);
  const [complaintNumber, setComplaintNumber] = useState("#JS-2023-8842");
  const [category, setCategory] = useState<string>("Infrastructure");
  const [subCategory, setSubCategory] = useState(
    "Pothole Repair & Road Maintenance",
  );
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const targetDepartment = useMemo(() => {
    switch (category) {
      case "Education":
        return "Block Education Office";
      case "Law & Order":
        return "Police Station / Dist. SP Office";
      case "Agriculture":
        return "Agriculture Extension Office";
      case "Job & Employment":
        return "District Employment Office / MNREGA Cell";
      case "Health":
        return "PHC / District Health Office";
      case "Infrastructure":
        return "PWD Block Office / DISCOM";
      case "Land Dispute":
        return "Revenue / Tehsil Office";
      case "Personal / Social":
        return "Social Welfare Department";
      default:
        return "Admin Review Queue";
    }
  }, [category]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (apiConfigError) {
        setError(apiConfigError);
        return;
      }
      try {
        const [complaints, departments] = await Promise.all([
          getAllComplaints(),
          getDepartments(),
        ]);
        const first = complaints.find(item => item.status === "unassigned");
        if (!isActive || !first) {
          return;
        }
        setComplaintId(first.id);
        setComplaintNumber(first.complaint_number ?? first.id);
        setCategory(first.category ?? "General");
        setSubCategory(first.sub_category ?? "General");
        const preferredDepartment = departments.find(
          department => department.name === targetDepartment,
        );
        setDepartmentId(preferredDepartment?.id ?? null);
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

  const handleSubmit = async () => {
    setError(null);
    if (apiConfigError || !complaintId) {
      setError(apiConfigError ?? "No complaint selected.");
      Alert.alert("Assignment", "Complaint marked Assigned successfully.");
      router.push("/operator" as never);
      return;
    }
    if (!departmentId) {
      setError("Department mapping not found for this category.");
      return;
    }
    setIsLoading(true);
    try {
      const priorityValue =
        priority === "Urgent"
          ? "urgent"
          : priority === "Critical"
            ? "critical"
            : "normal";
      await assignComplaint(complaintId, {
        assignedDepartmentId: departmentId,
        priority: priorityValue,
        note: note.trim() || undefined,
      });
      Alert.alert("Assignment", "Complaint marked Assigned successfully.");
      router.push("/operator" as never);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Assignment failed.";
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
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/operator" as never);
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#00236F" />
          </TouchableOpacity>
          <Text style={styles.brand}>Jan Seva Portal</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.langBtn}
            onPress={() =>
              Alert.alert("Language", "Language picker coming soon.")
            }
          >
            <Text style={styles.langText}>English</Text>
          </TouchableOpacity>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={20} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.title}>Assignment Review</Text>
            <Text style={styles.subtitle}>
              Review and route new citizen complaints
            </Text>
          </View>
          <View style={styles.newChip}>
            <View style={styles.dot} />
            <Text style={styles.newChipText}>New Submission</Text>
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.card, selected && styles.cardSelected]}
          onPress={() => setSelected(true)}
        >
          <View style={styles.cardHead}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="assignment" size={20} color="#00236F" />
            </View>
            <View>
              <Text style={styles.labelSm}>Complaint ID</Text>
              <Text style={styles.valueLg}>{complaintNumber}</Text>
            </View>
          </View>
          <Text style={styles.labelSm}>Primary Category</Text>
          <Text style={styles.valueMd}>{category}</Text>
          <Text style={[styles.labelSm, { marginTop: 8 }]}>Sub-Category</Text>
          <Text style={styles.valueMd}>{subCategory}</Text>
        </TouchableOpacity>

        <View style={styles.card}>
          <View style={styles.cardHead}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="location-on" size={20} color="#00236F" />
            </View>
            <View>
              <Text style={styles.labelSm}>Submission Detail</Text>
              <Text style={styles.valueLg}>Ward 14, West Zone</Text>
            </View>
          </View>
          <View style={styles.inline}>
            <MaterialIcons name="schedule" size={16} color="#757682" />
            <Text style={styles.muted}>Submitted 14 mins ago</Text>
          </View>
          <View style={styles.mapBox}>
            <TouchableOpacity
              style={styles.mapBtn}
              onPress={() => Alert.alert("Map", "Map view is a placeholder.")}
            >
              <Text style={styles.mapBtnText}>View Location</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.labelSm}>Detailed Description</Text>
          <Text style={styles.description}>
            "Significant waterlogging and deep potholes near the main market
            entrance. It's causing heavy traffic congestion during peak hours
            and poses risk to two-wheelers."
          </Text>
          <View style={styles.photoRow}>
            <View style={styles.photo} />
            <View style={styles.photo} />
          </View>
        </View>

        <View style={styles.panel}>
          <View style={styles.panelHead}>
            <Text style={styles.panelTitle}>Assign Action</Text>
            <Text style={styles.panelSub}>
              Route this complaint to the field team
            </Text>
          </View>

          <View style={styles.suggestion}>
            <MaterialIcons name="auto-awesome" size={18} color="#00236F" />
            <Text style={styles.suggestionText}>
              Automated analysis suggests{" "}
              <Text style={styles.bold}>Public Works Dept (PWD)</Text> based on
              keywords.
            </Text>
          </View>

          <Text style={styles.inputLabel}>Target Department</Text>
          <TouchableOpacity
            style={styles.select}
            onPress={() => Alert.alert("Routing", targetDepartment)}
          >
            <Text style={styles.selectText}>{targetDepartment}</Text>
            <MaterialIcons name="expand-more" size={20} color="#757682" />
          </TouchableOpacity>

          <Text style={styles.inputLabel}>Priority Level</Text>
          <View style={styles.priorityRow}>
            {(["Normal", "Urgent", "Critical"] as const).map(level => {
              const active = priority === level;
              return (
                <TouchableOpacity
                  key={level}
                  style={[styles.priorityBtn, active && styles.priorityActive]}
                  onPress={() => setPriority(level)}
                >
                  <Text
                    style={[
                      styles.priorityText,
                      active && styles.priorityActiveText,
                    ]}
                  >
                    {level}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputLabel}>Notes to Department</Text>
          <TextInput
            multiline
            style={styles.notes}
            placeholder="Add specific instructions for the field officer..."
            placeholderTextColor="#757682"
            value={note}
            onChangeText={setNote}
          />

          <Text style={styles.inputLabel}>Expected Resolution Date</Text>
          <View style={styles.select}>
            <TextInput style={styles.dateInput} defaultValue="2023-11-20" />
            <MaterialIcons name="calendar-today" size={18} color="#757682" />
          </View>

          <TouchableOpacity
            style={styles.submit}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <MaterialIcons name="send" size={18} color="#FFFFFF" />
            <Text style={styles.submitText}>
              {isLoading ? "Submitting..." : "Submit Assignment"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  header: {
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#00236F", fontSize: 22, fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  langBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16 },
  langText: { color: "#444651", fontSize: 14, fontWeight: "600" },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1E3A8A",
    alignItems: "center",
    justifyContent: "center",
  },
  content: { padding: 16, gap: 12, paddingBottom: 100 },
  titleRow: { gap: 8 },
  title: { color: "#00236F", fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#444651", fontSize: 14 },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  newChip: {
    alignSelf: "flex-start",
    backgroundColor: "#6CF8BB",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#006C49" },
  newChipText: { color: "#00714D", fontSize: 13, fontWeight: "700" },
  card: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 8,
  },
  cardSelected: { borderColor: "#006C49", backgroundColor: "#F0FFF7" },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E5EEFF",
    alignItems: "center",
    justifyContent: "center",
  },
  labelSm: {
    color: "#757682",
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "700",
  },
  valueLg: { color: "#121C28", fontSize: 20, fontWeight: "700" },
  valueMd: { color: "#121C28", fontSize: 16, fontWeight: "600" },
  inline: { flexDirection: "row", alignItems: "center", gap: 6 },
  muted: { color: "#444651", fontSize: 14 },
  mapBox: {
    marginTop: 4,
    height: 96,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    backgroundColor: "#DFE9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  mapBtn: {
    backgroundColor: "#00236F",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  mapBtnText: { color: "#FFFFFF", fontSize: 11, fontWeight: "700" },
  description: { color: "#121C28", fontSize: 16, lineHeight: 24 },
  photoRow: { flexDirection: "row", gap: 8, marginTop: 2 },
  photo: {
    width: 102,
    height: 102,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    backgroundColor: "#D9E3F4",
  },
  panel: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    paddingBottom: 14,
  },
  panelHead: { backgroundColor: "#DCE1FF", padding: 14 },
  panelTitle: { color: "#00236F", fontSize: 20, fontWeight: "700" },
  panelSub: { color: "#264191", fontSize: 12, marginTop: 2 },
  suggestion: {
    margin: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#B6C4FF",
    borderRadius: 8,
    backgroundColor: "#EEF4FF",
    padding: 10,
    flexDirection: "row",
    gap: 8,
  },
  suggestionText: { flex: 1, color: "#121C28", fontSize: 12, lineHeight: 18 },
  bold: { fontWeight: "700" },
  inputLabel: {
    marginHorizontal: 14,
    marginTop: 2,
    marginBottom: 6,
    color: "#444651",
    fontSize: 13,
    fontWeight: "600",
  },
  select: {
    marginHorizontal: 14,
    height: 46,
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: { color: "#121C28", fontSize: 14 },
  priorityRow: {
    marginHorizontal: 14,
    flexDirection: "row",
    gap: 8,
    marginBottom: 2,
  },
  priorityBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  priorityActive: { backgroundColor: "#6CF8BB", borderColor: "#006C49" },
  priorityText: { color: "#444651", fontSize: 12, fontWeight: "700" },
  priorityActiveText: { color: "#00714D" },
  notes: {
    marginHorizontal: 14,
    minHeight: 88,
    borderWidth: 1,
    borderColor: "#757682",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#121C28",
    textAlignVertical: "top",
  },
  dateInput: { flex: 1, color: "#121C28", fontSize: 14, paddingVertical: 0 },
  submit: {
    marginHorizontal: 14,
    marginTop: 12,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#00236F",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },
  submitText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
});
