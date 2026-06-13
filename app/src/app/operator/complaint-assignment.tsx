import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
import { apiConfigError } from "../../lib/api";
import {
  getCitizenDirectory,
  getProfileById,
  type CitizenDirectoryItem,
  type Profile,
} from "../../services/authService";
import {
  assignComplaint,
  createComplaint,
  escalateComplaint,
  getComplaintById,
  getComplaintTimeline,
  getDepartments,
  updateComplaintDetails,
  updateComplaintStatus,
  type Complaint,
  type ComplaintStatus,
  type ComplaintTimelineEvent,
  type Department,
} from "../../services/complaintService";

type Priority = "normal" | "urgent" | "critical";

const COMPLAINT_CATEGORIES = [
  {
    icon: "water-drop" as const,
    label: "Water",
  },
  {
    icon: "lightbulb" as const,
    label: "Electricity",
  },
  {
    icon: "commute" as const,
    label: "Roads",
  },
  {
    icon: "delete" as const,
    label: "Waste",
  },
  {
    icon: "shield" as const,
    label: "Security",
  },
  {
    icon: "health-and-safety" as const,
    label: "Health",
  },
  {
    icon: "school" as const,
    label: "Education",
  },
  {
    icon: "park" as const,
    label: "Public Space",
  },
  {
    icon: "more-horiz" as const,
    label: "Others",
  },
  {
    icon: "build" as const,
    label: "Infrastructure",
  },
  {
    icon: "agriculture" as const,
    label: "Agriculture",
  },
  {
    icon: "work" as const,
    label: "Job & Employment",
  },
  {
    icon: "gavel" as const,
    label: "Land Dispute",
  },
  {
    icon: "groups" as const,
    label: "Personal / Social",
  },
  {
    icon: "local-police" as const,
    label: "Law & Order",
  },
] as const;

const COMPLAINT_SUBCATEGORIES: Record<string, string[]> = {
  Water: ["No Supply", "Low Pressure", "Contamination", "Leakage", "Billing Issue"],
  Electricity: [
    "Power Cut",
    "Voltage Fluctuation",
    "Street Light",
    "Meter Issue",
    "Billing Issue",
  ],
  Roads: ["Potholes", "Damaged Road", "Traffic Signal", "Street Sign", "Drainage"],
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
  Others: ["Noise Pollution", "Stray Animals", "Building Violation", "Corruption", "Other"],
  Infrastructure: ["Road Repair", "Drainage", "Street Light", "Water Supply", "Public Building"],
  Agriculture: ["Crop Damage", "Irrigation", "Fertilizer Supply", "Seed Availability", "Other"],
  "Job & Employment": [
    "MNREGA Delay",
    "Employment Application",
    "Payment Delay",
    "Skill Training",
    "Other",
  ],
  "Land Dispute": ["Boundary Issue", "Record Correction", "Encroachment", "Mutation Delay", "Other"],
  "Personal / Social": [
    "Pension Issue",
    "Certificate Request",
    "Marriage Assistance",
    "Family Record",
    "Other",
  ],
  "Law & Order": ["Noise Complaint", "Street Crime", "Vandalism", "Suspicious Activity", "Other"],
};

const STATUS_OPTIONS: Array<{
  value: ComplaintStatus;
  label: string;
}> = [
  { value: "unassigned", label: "Unassigned" },
  { value: "assigned", label: "Assigned" },
  { value: "acknowledged", label: "Accepted" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "escalated", label: "Escalated" },
  { value: "closed", label: "Closed" },
];

function normalizeDateInput(date: string | null) {
  if (!date) return "";
  return date.slice(0, 10);
}

function parseDateInput(value: string) {
  if (!value) {
    return new Date();
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function StatusPill({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.statusPill, active && styles.statusPillActive]}
      onPress={onPress}
    >
      <Text style={[styles.statusPillText, active && styles.statusPillTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function ComplaintManagementScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const id =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : undefined;
  const isCreateMode = !id;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [timeline, setTimeline] = useState<ComplaintTimelineEvent[]>([]);
  const [linkedCitizen, setLinkedCitizen] = useState<Profile | null>(null);
  const [citizenDirectory, setCitizenDirectory] = useState<CitizenDirectoryItem[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedCitizenProfileId, setSelectedCitizenProfileId] = useState<string | null>(null);
  const [citizenName, setCitizenName] = useState("");
  const [citizenMobile, setCitizenMobile] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [description, setDescription] = useState("");
  const [locationText, setLocationText] = useState("");
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [priority, setPriority] = useState<Priority>("normal");
  const [status, setStatus] = useState<ComplaintStatus>("unassigned");
  const [expectedResolutionDate, setExpectedResolutionDate] = useState("");
  const [remarks, setRemarks] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [resolutionDetails, setResolutionDetails] = useState("");
  const [showCitizenDropdown, setShowCitizenDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubCategoryDropdown, setShowSubCategoryDropdown] = useState(false);
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const canEditComplaintDetails = isCreateMode || complaint?.source === "operator";

  const departmentMap = useMemo(
    () => new Map(departments.map(item => [item.id, item])),
    [departments],
  );

  const categoryOptions = useMemo(() => {
    const options: string[] = [...COMPLAINT_CATEGORIES.map(item => item.label)];
    if (category.trim() && !options.includes(category.trim())) {
      options.unshift(category.trim());
    }
    return options;
  }, [category]);

  const subCategoryOptions = useMemo(() => {
    const baseOptions: string[] = COMPLAINT_SUBCATEGORIES[category.trim()] ?? [];
    if (subCategory.trim() && !baseOptions.includes(subCategory.trim())) {
      return [subCategory.trim(), ...baseOptions];
    }
    return baseOptions;
  }, [category, subCategory]);

  useEffect(() => {
    if (!subCategory.trim()) {
      return;
    }
    if (subCategoryOptions.includes(subCategory.trim())) {
      return;
    }
    setSubCategory("");
  }, [category, subCategory, subCategoryOptions]);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (apiConfigError) {
        setError(apiConfigError);
        return;
      }

      setIsLoading(true);
      try {
        const [departmentData, citizenData] = await Promise.all([
          getDepartments(),
          getCitizenDirectory(),
        ]);
        if (!isActive) return;

        setDepartments(departmentData);
        setCitizenDirectory(citizenData);

        if (!isCreateMode && id) {
          const [complaintData, timelineData] = await Promise.all([
            getComplaintById(id),
            getComplaintTimeline(id),
          ]);
          if (!isActive || !complaintData) return;

          setComplaint(complaintData);
          setTimeline(timelineData);
          setSelectedCitizenProfileId(
            complaintData.citizen_profile_id ??
              complaintData.created_on_behalf_of_citizen_id ??
              null,
          );
          setCitizenName(complaintData.reported_citizen_name ?? "");
          setCitizenMobile(complaintData.reported_citizen_mobile ?? "");
          setCategory(complaintData.category ?? "");
          setSubCategory(complaintData.sub_category ?? "");
          setDescription(complaintData.description ?? "");
          setLocationText(complaintData.location_text ?? "");
          setDepartmentId(complaintData.assigned_department_id ?? null);
          setPriority((complaintData.priority ?? "normal") as Priority);
          setStatus((complaintData.status ?? "unassigned") as ComplaintStatus);
          setExpectedResolutionDate(
            normalizeDateInput(complaintData.expected_resolution_at),
          );
          setRemarks(complaintData.operator_note ?? "");
          setInternalNotes(complaintData.internal_notes ?? "");
          setResolutionDetails(complaintData.resolution_details ?? "");

          const citizenId =
            complaintData.citizen_profile_id ??
            complaintData.created_on_behalf_of_citizen_id;
          if (citizenId) {
            const profile = await getProfileById(citizenId);
            if (!isActive) return;
            setLinkedCitizen(profile);
            setCitizenName(prev => prev || profile?.full_name || "");
            setCitizenMobile(prev => prev || profile?.mobile || "");
          } else {
            setLinkedCitizen(null);
          }
        }
      } catch (err) {
        if (!isActive) return;
        setError(err instanceof Error ? err.message : "Failed to load complaint workspace.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, [id, isCreateMode]);

  const selectedCitizen = useMemo(
    () =>
      citizenDirectory.find(item => item.profile_id === selectedCitizenProfileId) ??
      null,
    [citizenDirectory, selectedCitizenProfileId],
  );

  useEffect(() => {
    if (!selectedCitizen) {
      return;
    }
    setCitizenName(selectedCitizen.full_name ?? "");
    setCitizenMobile(selectedCitizen.mobile ?? "");
  }, [selectedCitizen]);

  const handleDateChange = (
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (event.type === "dismissed" || !selectedDate) {
      setShowDatePicker(false);
      return;
    }
    setExpectedResolutionDate(selectedDate.toISOString().slice(0, 10));
    setShowDatePicker(false);
  };

  const handleCreateComplaint = async () => {
    const created = await createComplaint({
      citizen_profile_id: selectedCitizenProfileId ?? undefined,
      created_on_behalf_of_citizen_id: selectedCitizenProfileId ?? undefined,
      reported_citizen_name: citizenName.trim() || undefined,
      reported_citizen_mobile: citizenMobile.trim() || undefined,
      category: category.trim(),
      sub_category: subCategory.trim() || undefined,
      description: description.trim(),
      location_text: locationText.trim(),
      priority,
      operator_note: remarks.trim() || undefined,
      internal_notes: internalNotes.trim() || undefined,
    });

    if (departmentId) {
      await assignComplaint(created.id, {
        assignedDepartmentId: departmentId,
        priority,
        expectedResolutionAt: expectedResolutionDate
          ? new Date(expectedResolutionDate).toISOString()
          : undefined,
        internalNotes: internalNotes.trim() || undefined,
        note: remarks.trim() || undefined,
      });
    }

    if (status === "escalated") {
      return escalateComplaint(
        created.id,
        remarks.trim() || undefined,
        internalNotes.trim() || undefined,
      );
    }

    if (status !== "unassigned" && status !== "assigned") {
      return updateComplaintStatus(created.id, {
        status,
        note: remarks.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
        resolutionDetails: resolutionDetails.trim() || undefined,
        resolutionNote:
          status === "resolved" || status === "closed"
            ? resolutionDetails.trim() || remarks.trim() || undefined
            : undefined,
      });
    }

    return created;
  };

  const handleUpdateComplaint = async () => {
    if (!id || !complaint) {
      return null;
    }

    const nextOperatorNote = remarks.trim();
    const hasOperatorNoteChange = nextOperatorNote !== (complaint.operator_note ?? "");

    if (canEditComplaintDetails) {
      await updateComplaintDetails(id, {
        citizenProfileId: selectedCitizenProfileId,
        reportedCitizenName: citizenName.trim() || undefined,
        reportedCitizenMobile: citizenMobile.trim() || undefined,
        category: category.trim() || undefined,
        subCategory: subCategory.trim() || undefined,
        description: description.trim() || undefined,
        locationText: locationText.trim() || undefined,
        internalNotes: internalNotes.trim() || undefined,
        resolutionDetails: resolutionDetails.trim() || undefined,
        note: remarks.trim() || undefined,
      });
    }

    if (departmentId) {
      await assignComplaint(id, {
        assignedDepartmentId: departmentId,
        priority,
        expectedResolutionAt: expectedResolutionDate
          ? new Date(expectedResolutionDate).toISOString()
          : undefined,
        internalNotes: internalNotes.trim() || undefined,
        note: remarks.trim() || undefined,
      });
    }

    if (status === "escalated") {
      return escalateComplaint(
        id,
        nextOperatorNote || undefined,
        internalNotes.trim() || undefined,
      );
    }

    const shouldUpdateStatus =
      status !== complaint.status ||
      resolutionDetails.trim() !== (complaint.resolution_details ?? "") ||
      (!canEditComplaintDetails && hasOperatorNoteChange);

    if (shouldUpdateStatus) {
      return updateComplaintStatus(id, {
        status,
        note: nextOperatorNote || undefined,
        internalNotes: internalNotes.trim() || undefined,
        resolutionDetails: resolutionDetails.trim() || undefined,
        resolutionNote:
          status === "resolved" || status === "closed"
            ? resolutionDetails.trim() || nextOperatorNote || undefined
            : undefined,
      });
    }

    return getComplaintById(id);
  };

  const handleSave = async () => {
    setError(null);

    if (!category.trim() || !description.trim() || !locationText.trim()) {
      setError("Category, description, and location are required.");
      return;
    }

    if (!selectedCitizenProfileId && !citizenName.trim()) {
      setError("Select a citizen or enter walk-in citizen details.");
      return;
    }

    if (!departmentId) {
      setError("Select a department to continue.");
      return;
    }

    setIsSaving(true);
    try {
      const result = isCreateMode
        ? await handleCreateComplaint()
        : await handleUpdateComplaint();

      if (isCreateMode) {
        const createdComplaint = result && "id" in result ? result : null;
        if (createdComplaint?.id) {
          Alert.alert("Complaint saved", "Operator complaint created successfully.");
          router.replace(`/operator/complaints/${createdComplaint.id}` as never);
          return;
        }
      }

      if (!isCreateMode && id) {
        const refreshed = await Promise.all([
          getComplaintById(id),
          getComplaintTimeline(id),
        ]);
        setComplaint(refreshed[0]);
        setTimeline(refreshed[1]);
      }

      Alert.alert("Complaint saved", "Complaint management changes were saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save complaint.");
    } finally {
      setIsSaving(false);
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
                router.replace("/operator/complaints" as never);
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#00236F" />
          </TouchableOpacity>
          <View>
            <Text style={styles.brand}>Operator Complaint Desk</Text>
            <Text style={styles.headerSub}>
              {isCreateMode
                ? "Create complaint on behalf of a citizen"
                : complaint?.complaint_number ?? "Manage complaint"}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {isLoading ? <Text style={styles.muted}>Loading complaint workspace...</Text> : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Citizen</Text>
          <Text style={styles.sectionSub}>
            {canEditComplaintDetails
              ? "Link an existing citizen or capture walk-in details."
              : "Citizen-submitted complaint details are read-only for operators."}
          </Text>

          <Text style={styles.label}>Existing Citizen</Text>
          <TouchableOpacity
            style={[styles.select, !canEditComplaintDetails && styles.selectDisabled]}
            onPress={() => {
              if (!canEditComplaintDetails) {
                return;
              }
              setShowCitizenDropdown(prev => !prev);
            }}
            disabled={!canEditComplaintDetails}
          >
            <Text style={styles.selectText}>
              {selectedCitizen?.full_name ?? "Use manual citizen details"}
            </Text>
            <MaterialIcons name="expand-more" size={20} color="#757682" />
          </TouchableOpacity>
          {showCitizenDropdown ? (
            <View style={styles.dropdownMenu}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedCitizenProfileId(null);
                  setShowCitizenDropdown(false);
                }}
              >
                <Text style={styles.dropdownItemText}>Use manual citizen details</Text>
              </TouchableOpacity>
              {citizenDirectory.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setSelectedCitizenProfileId(item.profile_id);
                    setShowCitizenDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>
                    {item.full_name ?? "Citizen"}
                  </Text>
                  <Text style={styles.dropdownItemSub}>
                    {item.voter_id ?? item.mobile ?? "No ID"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <Text style={styles.label}>Citizen Name</Text>
          <TextInput
            style={styles.input}
            value={citizenName}
            onChangeText={setCitizenName}
            placeholder="Citizen or walk-in name"
            placeholderTextColor="#757682"
            editable={canEditComplaintDetails}
          />

          <Text style={styles.label}>Citizen Mobile</Text>
          <TextInput
            style={styles.input}
            value={citizenMobile}
            onChangeText={setCitizenMobile}
            placeholder="Mobile number"
            placeholderTextColor="#757682"
            keyboardType="phone-pad"
            editable={canEditComplaintDetails}
          />

          {linkedCitizen ? (
            <Text style={styles.helperText}>
              Linked citizen profile: {linkedCitizen.full_name ?? "Citizen"}
            </Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Complaint Details</Text>

          <Text style={styles.label}>Category</Text>
          <TouchableOpacity
            style={[styles.select, !canEditComplaintDetails && styles.selectDisabled]}
            onPress={() => {
              if (!canEditComplaintDetails) {
                return;
              }
              setShowSubCategoryDropdown(false);
              setShowCategoryDropdown(prev => !prev);
            }}
            disabled={!canEditComplaintDetails}
          >
            <Text style={styles.selectText}>
              {category || "Select category"}
            </Text>
            <MaterialIcons name="expand-more" size={20} color="#757682" />
          </TouchableOpacity>
          {showCategoryDropdown ? (
            <View style={styles.dropdownMenu}>
              {categoryOptions.map(option => (
                <TouchableOpacity
                  key={option}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setCategory(option);
                    setSubCategory("");
                    setShowCategoryDropdown(false);
                    setShowSubCategoryDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <Text style={styles.label}>Sub-category</Text>
          <TouchableOpacity
            style={[
              styles.select,
              (!canEditComplaintDetails || !category.trim()) && styles.selectDisabled,
            ]}
            onPress={() => {
              if (!canEditComplaintDetails || !category.trim()) {
                return;
              }
              setShowCategoryDropdown(false);
              setShowSubCategoryDropdown(prev => !prev);
            }}
            disabled={!canEditComplaintDetails || !category.trim()}
          >
            <Text style={styles.selectText}>
              {subCategory || "Select sub-category"}
            </Text>
            <MaterialIcons name="expand-more" size={20} color="#757682" />
          </TouchableOpacity>
          {showSubCategoryDropdown ? (
            <View style={styles.dropdownMenu}>
              {subCategoryOptions.length ? (
                subCategoryOptions.map(option => (
                  <TouchableOpacity
                    key={option}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setSubCategory(option);
                      setShowSubCategoryDropdown(false);
                    }}
                  >
                    <Text style={styles.dropdownItemText}>{option}</Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.dropdownEmpty}>
                  <Text style={styles.dropdownEmptyText}>
                    Select a category first
                  </Text>
                </View>
              )}
            </View>
          ) : null}

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            multiline
            placeholder="Describe the issue"
            placeholderTextColor="#757682"
            editable={canEditComplaintDetails}
          />

          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={locationText}
            onChangeText={setLocationText}
            placeholder="Complaint location"
            placeholderTextColor="#757682"
            editable={canEditComplaintDetails}
          />
        </View>

        {!canEditComplaintDetails ? (
          <View style={styles.lockedNotice}>
            <MaterialIcons name="lock" size={16} color="#7A4C00" />
            <Text style={styles.lockedNoticeText}>
              Complaint content came from the citizen and cannot be edited by operators.
            </Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Operator Handling</Text>

          <Text style={styles.label}>Department</Text>
          <TouchableOpacity
            style={styles.select}
            onPress={() => setShowDepartmentDropdown(prev => !prev)}
          >
            <Text style={styles.selectText}>
              {departmentId
                ? departmentMap.get(departmentId)?.name ?? "Department"
                : "Select department"}
            </Text>
            <MaterialIcons name="expand-more" size={20} color="#757682" />
          </TouchableOpacity>
          {showDepartmentDropdown ? (
            <View style={styles.dropdownMenu}>
              {departments.map(item => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.dropdownItem}
                  onPress={() => {
                    setDepartmentId(item.id);
                    setShowDepartmentDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownItemText}>{item.name}</Text>
                  <Text style={styles.dropdownItemSub}>{item.category ?? "General"}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <Text style={styles.label}>Priority</Text>
          <View style={styles.priorityRow}>
            {(["normal", "urgent", "critical"] as Priority[]).map(level => (
              <StatusPill
                key={level}
                active={priority === level}
                label={level.replace(/^./, value => value.toUpperCase())}
                onPress={() => setPriority(level)}
              />
            ))}
          </View>

          <Text style={styles.label}>Status</Text>
          <View style={styles.statusGrid}>
            {STATUS_OPTIONS.map(option => (
              <StatusPill
                key={option.value}
                active={status === option.value}
                label={option.label}
                onPress={() => setStatus(option.value)}
              />
            ))}
          </View>

          <Text style={styles.label}>Expected Resolution Date</Text>
          <TouchableOpacity
            style={styles.select}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.selectText}>
              {expectedResolutionDate || "Select expected resolution date"}
            </Text>
            <MaterialIcons name="calendar-today" size={18} color="#757682" />
          </TouchableOpacity>
          {showDatePicker ? (
            <DateTimePicker
              value={parseDateInput(expectedResolutionDate)}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          ) : null}

          <Text style={styles.label}>Remarks / Timeline Note</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={remarks}
            onChangeText={setRemarks}
            multiline
            placeholder="Short note for the complaint timeline"
            placeholderTextColor="#757682"
          />

          <Text style={styles.label}>Internal Notes</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={internalNotes}
            onChangeText={setInternalNotes}
            multiline
            placeholder="Internal operator notes"
            placeholderTextColor="#757682"
          />

          <Text style={styles.label}>Resolution Details</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={resolutionDetails}
            onChangeText={setResolutionDetails}
            multiline
            placeholder="Resolution summary or closure details"
            placeholderTextColor="#757682"
          />

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSave}
            disabled={isSaving}
          >
            <MaterialIcons name="save" size={18} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {isSaving
                ? "Saving..."
                : isCreateMode
                  ? "Create Complaint"
                  : "Save Complaint Changes"}
            </Text>
          </TouchableOpacity>
        </View>

        {!isCreateMode ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Timeline</Text>
            {timeline.length ? (
              timeline.map(event => (
                <View key={event.id} style={styles.timelineRow}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineBody}>
                    <Text style={styles.timelineStatus}>
                      {(event.new_status ?? "updated").replace(/_/g, " ")}
                    </Text>
                    <Text style={styles.timelineNote}>
                      {event.note ?? "Complaint updated"}
                    </Text>
                    <Text style={styles.timelineMeta}>
                      {new Date(event.created_at).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.muted}>No timeline events recorded yet.</Text>
            )}
          </View>
        ) : null}
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
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconBtn: { padding: 4 },
  brand: { color: "#00236F", fontSize: 20, fontWeight: "700" },
  headerSub: { color: "#5A6272", fontSize: 12 },
  content: { padding: 16, gap: 12, paddingBottom: 120 },
  card: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 10,
  },
  sectionTitle: { color: "#121C28", fontSize: 18, fontWeight: "700" },
  sectionSub: { color: "#5A6272", fontSize: 12, lineHeight: 18 },
  label: { color: "#444651", fontSize: 12, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#D6D8E2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#121C28",
    fontSize: 14,
    backgroundColor: "#FFFFFF",
  },
  textArea: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  select: {
    borderWidth: 1,
    borderColor: "#D6D8E2",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  selectDisabled: { opacity: 0.65 },
  selectText: { color: "#121C28", fontSize: 14, flex: 1, paddingRight: 10 },
  dropdownMenu: {
    borderWidth: 1,
    borderColor: "#D6D8E2",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#EEF0F6",
  },
  dropdownItemText: { color: "#121C28", fontSize: 13, fontWeight: "600" },
  dropdownItemSub: { color: "#757682", fontSize: 11, marginTop: 2 },
  dropdownEmpty: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dropdownEmptyText: { color: "#757682", fontSize: 12 },
  priorityRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statusGrid: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statusPill: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  statusPillActive: {
    borderColor: "#006C49",
    backgroundColor: "#6CF8BB",
  },
  statusPillText: { color: "#444651", fontSize: 12, fontWeight: "600" },
  statusPillTextActive: { color: "#00714D" },
  saveButton: {
    marginTop: 4,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#00236F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  helperText: { color: "#5A6272", fontSize: 12 },
  lockedNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#F5C26B",
    borderRadius: 12,
    backgroundColor: "#FFF8E8",
    padding: 12,
  },
  lockedNoticeText: { flex: 1, color: "#7A4C00", fontSize: 12, lineHeight: 18 },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  muted: { color: "#757682", fontSize: 12 },
  timelineRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00236F",
    marginTop: 6,
  },
  timelineBody: { flex: 1, gap: 2 },
  timelineStatus: {
    color: "#00236F",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  timelineNote: { color: "#444651", fontSize: 13 },
  timelineMeta: { color: "#757682", fontSize: 11 },
});
