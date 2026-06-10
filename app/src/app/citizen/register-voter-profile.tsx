import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { apiConfigError } from "../../lib/api";
import { getCurrentProfile } from "../../services/authService";
import { apiUploadFile } from "../../lib/api";
import { FlipType, manipulateAsync, SaveFormat } from "expo-image-manipulator";
import {
  createVoter,
  getMyVoter,
  updateVoter,
} from "../../services/voterService";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  ActionSheetIOS,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  editable = true,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChangeText?: (value: string) => void;
  editable?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#757682"
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        editable={editable}
      />
    </View>
  );
}

type FamilyMember = {
  name: string;
  relation: string;
  gender: "male" | "female" | "other";
};

export default function RegisterVoterProfileScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [dob, setDob] = useState("");
  const [mobile, setMobile] = useState("");
  const [voterId, setVoterId] = useState("");
  const [boothNumber, setBoothNumber] = useState("");
  const [occupation, setOccupation] = useState("");
  const [village, setVillage] = useState("");
  const [panchayat, setPanchayat] = useState("");
  const [voterRecordId, setVoterRecordId] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [familySizeInput, setFamilySizeInput] = useState("0");
  const [maleCountInput, setMaleCountInput] = useState("0");
  const [femaleCountInput, setFemaleCountInput] = useState("0");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sanitizeAlpha = (value: string) => value.replace(/[^A-Za-z\s]/g, "");

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      if (apiConfigError) {
        return;
      }
      try {
        const [voter, profile] = await Promise.all([
          getMyVoter(),
          getCurrentProfile(),
        ]);
        if (!isActive) {
          return;
        }
        if (voter) {
          setVoterRecordId(voter.id ?? null);
          setFullName(voter.full_name ?? "");
          setFatherName(voter.father_name ?? "");
          setDob(voter.dob ?? "");
          setMobile(voter.mobile ?? profile?.mobile ?? "");
          setVoterId(voter.voter_id ?? "");
          setBoothNumber(voter.booth_number ?? "");
          setOccupation(voter.occupation ?? "");
          setVillage(voter.village ?? "");
          setPanchayat(voter.panchayat ?? "");
          setPhotoUrl(voter.photo_url ?? null);
        } else if (profile?.mobile) {
          setMobile(profile.mobile);
        }
      } catch {
        if (!isActive) {
          return;
        }
      }
    };

    void load();
    return () => {
      isActive = false;
    };
  }, []);

  const handleSubmit = async () => {
    setError(null);
    if (apiConfigError) {
      setError(apiConfigError);
      Alert.alert("Registration", "Profile saved locally.");
      router.push("/dashboard" as never);
      return;
    }
    const nameRegex = /^[A-Za-z\s]+$/;
    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!nameRegex.test(fullName.trim())) {
      setError("Full name must contain only alphabets.");
      return;
    }
    if (fatherName.trim() && !nameRegex.test(fatherName.trim())) {
      setError("Father's / Husband's name must contain only alphabets.");
      return;
    }
    if (!dob.trim()) {
      setError("DOB is required.");
      return;
    }
    if (!voterId.trim()) {
      setError("Voter ID is required.");
      return;
    }
    if (!village.trim()) {
      setError("Village is required.");
      return;
    }
    if (!panchayat.trim()) {
      setError("Panchayat is required.");
      return;
    }
    const hasInvalidMember = familyMembers.some(
      member => !member.name.trim() || !member.relation.trim(),
    );
    if (hasInvalidMember) {
      setError("Family member Name and Relation are required.");
      return;
    }
    const totalCount = Number.parseInt(familySizeInput || "0", 10) || 0;
    const maleCount = Number.parseInt(maleCountInput || "0", 10) || 0;
    const femaleCount = Number.parseInt(femaleCountInput || "0", 10) || 0;
    if (totalCount > 0 && maleCount + femaleCount !== totalCount) {
      setError("Male + Female must equal Total Members.");
      return;
    }
    setIsLoading(true);
    try {
      await createVoter({
        full_name: fullName.trim(),
        father_name: fatherName.trim() || null,
        dob: dob.trim() || null,
        mobile: mobile.trim() || null,
        voter_id: voterId.trim() || null,
        booth_number: boothNumber.trim() || null,
        occupation: occupation.trim() || null,
        village: village.trim() || null,
        panchayat: panchayat.trim() || null,
        photo_url: photoUrl,
      });
      Alert.alert("Registration", "Profile saved successfully.");
      router.push("/dashboard" as never);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Registration failed.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const addFamilyMember = () => {
    setFamilyMembers(prev => [
      ...prev,
      { name: "", relation: "", gender: "male" },
    ]);
  };

  const removeFamilyMember = (index: number) => {
    setFamilyMembers(prev => {
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const updateFamilyMember = (
    index: number,
    key: keyof FamilyMember,
    value: string,
  ) => {
    setFamilyMembers(prev =>
      prev.map((member, idx) =>
        idx === index ? { ...member, [key]: value } : member,
      ),
    );
  };

  const totalMembers = familyMembers.length;
  const maleMembers = familyMembers.filter(m => m.gender === "male").length;
  const femaleMembers = familyMembers.filter(m => m.gender === "female").length;

  const openGenderDropdown = (index: number) => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", "Male", "Female"],
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          if (buttonIndex === 1) {
            updateFamilyMember(index, "gender", "male");
          } else if (buttonIndex === 2) {
            updateFamilyMember(index, "gender", "female");
          }
        },
      );
      return;
    }

    Alert.alert("Select Gender", "", [
      {
        text: "Male",
        onPress: () => updateFamilyMember(index, "gender", "male"),
      },
      {
        text: "Female",
        onPress: () => updateFamilyMember(index, "gender", "female"),
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handlePhotoUpload = async () => {
    setError(null);
    if (apiConfigError) {
      setError(apiConfigError);
      return;
    }
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Camera", "Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      cameraType: ImagePicker.CameraType.front,
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) {
      return;
    }

    const asset = result.assets[0];
    setIsUploadingPhoto(true);
    try {
      let uploadUri = asset.uri;
      if (Platform.OS === "ios") {
        // iOS front camera selfies can be mirrored; flip once to normalize.
        const normalized = await manipulateAsync(
          asset.uri,
          [{ flip: FlipType.Horizontal }],
          { compress: 0.85, format: SaveFormat.JPEG },
        );
        uploadUri = normalized.uri;
      }

      const upload = await apiUploadFile<{ url: string }>(
        "/uploads/voter-photo",
        {
          uri: uploadUri,
          name: asset.fileName ?? `voter-photo-${Date.now()}.jpg`,
          type: asset.mimeType ?? "image/jpeg",
        },
      );
      setPhotoUrl(upload.url);
      if (voterRecordId) {
        await updateVoter(voterRecordId, { photo_url: upload.url });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed.";
      setError(message);
    } finally {
      setIsUploadingPhoto(false);
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
                router.replace("/dashboard" as never);
              }
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#00236F" />
          </TouchableOpacity>
          <Text style={styles.brand}>जन सेवा</Text>
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
          <View style={styles.avatar} />
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.safe} onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title}>Voter Registration</Text>
            <Text style={styles.subtitle}>
              Complete the form below to register a new constituent.
            </Text>
            <Text style={styles.stepText}>
              Step {step} of {totalSteps}
            </Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <View style={styles.uploadCard}>
              <TouchableOpacity
                style={styles.uploadCircle}
                onPress={handlePhotoUpload}
              >
                {photoUrl ? (
                  <Image
                    source={{ uri: photoUrl }}
                    style={styles.photoPreview}
                  />
                ) : (
                  <MaterialIcons name="add-a-photo" size={34} color="#757682" />
                )}
                <Text style={styles.uploadText}>
                  {isUploadingPhoto ? "Uploading..." : "Upload Photo"}
                </Text>
              </TouchableOpacity>
            </View>

            {step === 1 ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <Field
                  label="Full Name (as per ID)"
                  placeholder="Enter Full Name"
                  value={fullName}
                  onChangeText={value => setFullName(sanitizeAlpha(value))}
                />
                <Field
                  label="Father's / Husband's Name"
                  placeholder="Enter Name"
                  value={fatherName}
                  onChangeText={value => setFatherName(sanitizeAlpha(value))}
                />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="DOB / Age"
                      placeholder="DD/MM/YYYY"
                      value={dob}
                      onChangeText={setDob}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Mobile Number"
                      placeholder="+91"
                      value={mobile}
                      onChangeText={setMobile}
                      editable={false}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            {step === 2 ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Election Details</Text>
                <Field
                  label="Voter ID (EPIC Number)"
                  placeholder="ABC1234567"
                  value={voterId}
                  onChangeText={setVoterId}
                />
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Booth Number"
                      placeholder="000"
                      value={boothNumber}
                      onChangeText={setBoothNumber}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Occupation"
                      placeholder="Select..."
                      value={occupation}
                      onChangeText={setOccupation}
                    />
                  </View>
                </View>
                <Field
                  label="Village / Panchayat / Ward"
                  placeholder="Enter Ward or Village name"
                  value={village}
                  onChangeText={setVillage}
                />
                <Field
                  label="Panchayat"
                  placeholder="Enter Panchayat"
                  value={panchayat}
                  onChangeText={setPanchayat}
                />
              </View>
            ) : null}

            {step === 3 ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Milestone Reminders</Text>
                <View style={styles.reminder}>
                  <MaterialIcons name="cake" size={20} color="#1E3A8A" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderLabel}>Birthday</Text>
                    <TextInput
                      placeholder="Select date"
                      placeholderTextColor="#757682"
                      style={styles.reminderInput}
                    />
                  </View>
                </View>
                <View style={styles.reminder}>
                  <MaterialIcons name="favorite" size={20} color="#1E3A8A" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderLabel}>Anniversary</Text>
                    <TextInput
                      placeholder="Select date"
                      placeholderTextColor="#757682"
                      style={styles.reminderInput}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            {step === 4 ? (
              <View style={styles.sectionCard}>
                <View style={styles.familyHead}>
                  <Text style={styles.sectionTitle}>Family Details</Text>
                  <TouchableOpacity
                    style={styles.addBtn}
                    onPress={addFamilyMember}
                  >
                    <MaterialIcons name="add" size={14} color="#00236F" />
                    <Text style={styles.addText}>Add Member</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.countRow}>
                  <Text style={styles.countText}>
                    Total Members: {totalMembers}
                  </Text>
                  <Text style={styles.countText}>Male: {maleMembers}</Text>
                  <Text style={styles.countText}>Female: {femaleMembers}</Text>
                </View>
                <View style={styles.field}>
                  <Text style={styles.label}>How many members in family?</Text>
                  <TextInput
                    placeholder="Enter total family members"
                    maxLength={50}
                    placeholderTextColor="#757682"
                    style={styles.input}
                    keyboardType="number-pad"
                    value={familySizeInput}
                    onChangeText={value =>
                      setFamilySizeInput(value.replace(/[^0-9]/g, ""))
                    }
                  />
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.field}>
                      <Text style={styles.label}>How many males?</Text>
                      <TextInput
                        placeholder="Enter male members"
                        placeholderTextColor="#757682"
                        style={styles.input}
                        keyboardType="number-pad"
                        value={maleCountInput}
                        onChangeText={value =>
                          setMaleCountInput(value.replace(/[^0-9]/g, ""))
                        }
                      />
                    </View>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.field}>
                      <Text style={styles.label}>How many females?</Text>
                      <TextInput
                        placeholder="Enter female members"
                        placeholderTextColor="#757682"
                        style={styles.input}
                        keyboardType="number-pad"
                        value={femaleCountInput}
                        onChangeText={value =>
                          setFemaleCountInput(value.replace(/[^0-9]/g, ""))
                        }
                      />
                    </View>
                  </View>
                </View>

                {familyMembers.length === 0 ? (
                  <Text style={styles.hint}>
                    No members added yet. Tap Add Member to add name and
                    relation.
                  </Text>
                ) : null}

                {familyMembers.map((member, index) => (
                  <View key={`member-${index}`} style={styles.memberRow}>
                    <View style={styles.memberNo}>
                      <Text style={styles.memberNoText}>{index + 1}</Text>
                    </View>
                    <View style={styles.memberFields}>
                      <TextInput
                        placeholder="Name"
                        placeholderTextColor="#757682"
                        style={styles.memberInput}
                        value={member.name}
                        onChangeText={value =>
                          updateFamilyMember(
                            index,
                            "name",
                            sanitizeAlpha(value),
                          )
                        }
                      />
                      <TextInput
                        placeholder="Relation"
                        placeholderTextColor="#757682"
                        style={styles.memberInput}
                        value={member.relation}
                        onChangeText={value =>
                          updateFamilyMember(
                            index,
                            "relation",
                            sanitizeAlpha(value),
                          )
                        }
                      />
                      <View style={styles.genderDropdownWrap}>
                        {/* <Text style={styles.genderLabel}>Gender</Text> */}
                        <TouchableOpacity
                          style={styles.genderDropdownField}
                          onPress={() => openGenderDropdown(index)}
                        >
                          <Text style={styles.genderDropdownValue}>
                            {member.gender === "male" ? "Male" : "Female"}
                          </Text>
                          <MaterialIcons
                            name="keyboard-arrow-down"
                            size={18}
                            color="#444651"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => removeFamilyMember(index)}>
                      <MaterialIcons name="delete" size={20} color="#757682" />
                    </TouchableOpacity>
                  </View>
                ))}

                <Text style={styles.hint}>
                  Enter details of family members residing in the same
                  household.
                </Text>
              </View>
            ) : null}

            <View style={styles.actions}>
              {step > 1 ? (
                <TouchableOpacity style={styles.clearBtn} onPress={prevStep}>
                  <Text style={styles.clearText}>Back</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.clearBtn}
                  onPress={() => router.push("/login" as never)}
                >
                  <Text style={styles.clearText}>Cancel</Text>
                </TouchableOpacity>
              )}
              {step < totalSteps ? (
                <TouchableOpacity style={styles.saveBtn} onPress={nextStep}>
                  <MaterialIcons
                    name="navigate-next"
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={styles.saveText}>Next</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.saveBtn}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  <MaterialIcons name="save" size={18} color="#FFFFFF" />
                  <Text style={styles.saveText}>
                    {isLoading ? "Saving..." : "Submit"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>

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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconBtn: { padding: 6, borderRadius: 20 },
  brand: { fontSize: 20, color: "#00236F", fontWeight: "700" },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  langBtn: {
    borderWidth: 1,
    borderColor: "#00236F",
    borderRadius: 99,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  langText: { color: "#00236F", fontSize: 13, fontWeight: "600" },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#DCE1FF",
  },
  content: { padding: 16, gap: 14, paddingBottom: 110 },
  title: { fontSize: 24, color: "#00236F", fontWeight: "600" },
  subtitle: { fontSize: 14, color: "#444651" },
  stepText: { color: "#006C49", fontSize: 12, fontWeight: "700" },
  errorText: { color: "#BA1A1A", fontSize: 12 },
  uploadCard: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 16,
    alignItems: "center",
  },
  uploadCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "#757682",
    backgroundColor: "#EEF4FF",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  photoPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  uploadText: { fontSize: 12, color: "#757682", fontWeight: "600" },
  hint: { marginTop: 8, fontSize: 12, color: "#444651" },
  sectionCard: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13,
    color: "#00236F",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  field: { gap: 4 },
  label: { fontSize: 12, color: "#121C28", fontWeight: "600" },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 8,
    backgroundColor: "#F8F9FF",
    paddingHorizontal: 12,
    color: "#121C28",
  },
  row: { flexDirection: "row", gap: 8 },
  reminder: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 8,
    backgroundColor: "#F8F9FF",
    padding: 10,
  },
  reminderLabel: { fontSize: 12, color: "#444651" },
  reminderInput: { fontSize: 14, color: "#121C28", paddingTop: 2 },
  familyHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  addText: { color: "#00236F", fontSize: 13, fontWeight: "600" },
  memberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 8,
    backgroundColor: "#F8F9FF",
    padding: 8,
  },
  memberNo: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#DFE9FA",
    alignItems: "center",
    justifyContent: "center",
  },
  memberNoText: { color: "#00236F", fontSize: 12, fontWeight: "700" },
  memberFields: { flex: 1, flexDirection: "row", gap: 6 },
  memberInput: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    color: "#121C28",
    fontSize: 13,
  },
  countRow: { flexDirection: "row", justifyContent: "space-between" },
  countText: { color: "#121C28", fontSize: 12, fontWeight: "600" },
  genderDropdownWrap: { gap: 4 },
  genderLabel: { color: "#444651", fontSize: 11, fontWeight: "600" },
  genderDropdownField: {
    height: 38,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 6,
    paddingHorizontal: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  genderDropdownValue: {
    color: "#121C28",
    fontSize: 12,
    fontWeight: "600",
  },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  saveBtn: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#00236F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  clearBtn: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#757682",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },
  clearText: { color: "#121C28", fontSize: 14, fontWeight: "600" },
});
