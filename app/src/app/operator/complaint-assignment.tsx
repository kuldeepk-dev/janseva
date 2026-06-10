import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { apiConfigError } from "../../lib/api";
import {
  assignComplaint,
  getComplaintById,
  getDepartments,
  subAssignComplaint,
} from "../../services/complaintService";
import {
  getDepartmentOfficers,
  type OfficerDirectoryItem,
} from "../../services/officerService";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ComplaintAssignmentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;
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
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [officers, setOfficers] = useState<OfficerDirectoryItem[]>([]);
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(
    null,
  );
  const [isLoadingOfficers, setIsLoadingOfficers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const resolveTargetDepartment = (value: string) => {
    switch (value) {
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
  };
  const targetDepartment = useMemo(() => {
    return resolveTargetDepartment(category);
  }, [category]);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (apiConfigError) {
        setError(apiConfigError);
        return;
      }
      if (!id) {
        setError("No complaint ID provided.");
        return;
      }
      setIsFetching(true);
      try {
        const [departments, selectedComplaint] = await Promise.all([
          getDepartments(),
          getComplaintById(id),
        ]);
        if (!isActive || !selectedComplaint) {
          setError("No complaint found.");
          return;
        }
        setComplaintId(selectedComplaint.id);
        setComplaintNumber(
          selectedComplaint.complaint_number ?? selectedComplaint.id,
        );
        const complaintCategory = selectedComplaint.category ?? "General";
        setCategory(complaintCategory);
        setSubCategory(selectedComplaint.sub_category ?? "General");
        setDescription(selectedComplaint.description ?? "");
        setLocationText(selectedComplaint.location_text ?? "Not specified");
        setAttachmentUrl(selectedComplaint.attachment_url);
        const preferredDepartment = departments.find(
          department =>
            department.name === resolveTargetDepartment(complaintCategory),
        );
        setDepartmentId(preferredDepartment?.id ?? null);
      } catch (err) {
        if (!isActive) {
          return;
        }
        const message = err instanceof Error ? err.message : "Failed to load.";
        setError(message);
      } finally {
        if (isActive) {
          setIsFetching(false);
        }
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, [id]);

  useEffect(() => {
    let isActive = true;

    const loadOfficers = async () => {
      if (!departmentId) {
        setOfficers([]);
        setSelectedOfficerId(null);
        return;
      }
      setIsLoadingOfficers(true);
      try {
        const data = await getDepartmentOfficers(departmentId);
        if (!isActive) {
          return;
        }
        setOfficers(data);
        if (!data.some(officer => officer.profile_id === selectedOfficerId)) {
          setSelectedOfficerId(data[0]?.profile_id ?? null);
        }
      } catch (err) {
        if (!isActive) {
          return;
        }
        const message =
          err instanceof Error ? err.message : "Failed to load officers.";
        setError(message);
      } finally {
        if (isActive) {
          setIsLoadingOfficers(false);
        }
      }
    };

    void loadOfficers();
    return () => {
      isActive = false;
    };
  }, [departmentId]);

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
      if (selectedOfficerId) {
        await subAssignComplaint(
          complaintId,
          selectedOfficerId,
          note.trim() || undefined,
        );
      }
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
        {isFetching && !error ? (
          <Text style={styles.muted}>Loading complaint...</Text>
        ) : null}

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
            <View style={{ flex: 1 }}>
              <Text style={styles.labelSm}>Complaint Location</Text>
              <Text style={styles.valueLg}>
                {locationText || "Not specified"}
              </Text>
            </View>
          </View>
          <View style={styles.inline}>
            <MaterialIcons name="schedule" size={16} color="#757682" />
            <Text style={styles.muted}>Submitted recently</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.labelSm}>Detailed Description</Text>
          <Text style={styles.description}>
            {description || "No description provided."}
          </Text>
          {attachmentUrl && (
            <View style={styles.photoRow}>
              <View style={styles.photo}>
                <MaterialIcons name="image" size={32} color="#757682" />
              </View>
            </View>
          )}
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

          <Text style={styles.inputLabel}>Available Officers</Text>
          {isLoadingOfficers ? (
            <Text style={styles.muted}>Loading officers...</Text>
          ) : officers.length ? (
            <View style={styles.officerRow}>
              {officers.map(officer => {
                const isActive = officer.profile_id === selectedOfficerId;
                return (
                  <TouchableOpacity
                    key={officer.id}
                    
                    style={[
                      styles.officerChip,
                      isActive && styles.officerChipActive,
                    ]}
                    onPress={() =>
                      setSelectedOfficerId(officer.profile_id ?? null)
                    }
                  >
                    <Text
                      style={[
                        styles.officerChipText,
                        isActive && styles.officerChipTextActive,
                      ]}
                    >
                      {officer.full_name ?? officer.email ?? "Officer"}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text style={styles.muted}>
              No officers found for this department.
            </Text>
          )}

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
    alignItems: "center",
    justifyContent: "center",
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
  officerRow: {
    marginHorizontal: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 2,
  },
  officerChip: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  officerChipActive: { borderColor: "#00236F", backgroundColor: "#E5EEFF" },
  officerChipText: { color: "#444651", fontSize: 12, fontWeight: "600" },
  officerChipTextActive: { color: "#00236F" },
});
