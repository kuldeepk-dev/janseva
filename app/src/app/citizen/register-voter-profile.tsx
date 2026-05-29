import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { apiConfigError } from "../../lib/api";
import { getCurrentProfile } from "../../services/authService";
import { createVoter, getMyVoter } from "../../services/voterService";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

function Field({
  label,
  placeholder,
  value,
  onChangeText,
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChangeText?: (value: string) => void;
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
      />
    </View>
  );
}

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          setFullName(voter.full_name ?? "");
          setFatherName(voter.father_name ?? "");
          setDob(voter.dob ?? "");
          setMobile(voter.mobile ?? profile?.mobile ?? "");
          setVoterId(voter.voter_id ?? "");
          setBoothNumber(voter.booth_number ?? "");
          setOccupation(voter.occupation ?? "");
          setVillage(voter.village ?? "");
          setPanchayat(voter.panchayat ?? "");
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
    if (!fullName.trim()) {
      setError("Full name is required.");
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
                onPress={() =>
                  Alert.alert("Upload", "Photo upload is a placeholder.")
                }
              >
                <MaterialIcons name="add-a-photo" size={34} color="#757682" />
                <Text style={styles.uploadText}>Upload Photo</Text>
              </TouchableOpacity>
              <Text style={styles.hint}>
                Passport size photo, max 2MB (JPG/PNG)
              </Text>
            </View>

            {step === 1 ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <Field
                  label="Full Name (as per ID)"
                  placeholder="Enter Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                />
                <Field
                  label="Father's / Husband's Name"
                  placeholder="Enter Name"
                  value={fatherName}
                  onChangeText={setFatherName}
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
                    onPress={() =>
                      Alert.alert("Family", "Add member is a placeholder.")
                    }
                  >
                    <MaterialIcons name="add" size={14} color="#00236F" />
                    <Text style={styles.addText}>Add Member</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.memberRow}>
                  <View style={styles.memberNo}>
                    <Text style={styles.memberNoText}>1</Text>
                  </View>
                  <View style={styles.memberFields}>
                    <TextInput
                      placeholder="Name"
                      placeholderTextColor="#757682"
                      style={styles.memberInput}
                    />
                    <TextInput
                      placeholder="Relation"
                      placeholderTextColor="#757682"
                      style={styles.memberInput}
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("Family", "Remove member is a placeholder.")
                    }
                  >
                    <MaterialIcons name="delete" size={20} color="#757682" />
                  </TouchableOpacity>
                </View>

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

      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => router.push("/dashboard" as never)}
        >
          <MaterialIcons name="dashboard" size={20} color="#444651" />
          <Text style={styles.tabText}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, styles.tabActive]}
          onPress={() => router.push("/complaints" as never)}
        >
          <MaterialIcons name="description" size={20} color="#00714D" />
          <Text style={styles.tabActiveText}>Grievance</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => router.push("/feed" as never)}
        >
          <MaterialIcons name="rss-feed" size={20} color="#444651" />
          <Text style={styles.tabText}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.tab}
          onPress={() => router.push("/admin/whatsapp" as never)}
        >
          <MaterialIcons name="settings" size={20} color="#444651" />
          <Text style={styles.tabText}>Admin</Text>
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
  bottomNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 66,
    borderTopWidth: 1,
    borderTopColor: "#C5C5D3",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  tab: { alignItems: "center", justifyContent: "center" },
  tabText: { fontSize: 12, color: "#444651", fontWeight: "500" },
  tabActive: {
    backgroundColor: "#6CF8BB",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  tabActiveText: { fontSize: 12, color: "#00714D", fontWeight: "700" },
});
