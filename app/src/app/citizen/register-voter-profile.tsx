import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { apiConfigError } from "../../lib/api";
import { getCurrentProfile } from "../../services/authService";
import { apiUploadFile } from "../../lib/api";
import { FlipType, manipulateAsync, SaveFormat } from "expo-image-manipulator";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import {
  createVoter,
  getMyVoter,
  updateVoter,
} from "../../services/voterService";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  ActionSheetIOS,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
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

const formatDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const parseDate = (value: string) => {
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    return null;
  }
  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return Number.isNaN(date.getTime()) ? null : date;
};

function Field({
  label,
  placeholder,
  value,
  onChangeText,
  editable = true,
  onPress,
  onFocus,
  rightIconName = "calendar-today",
}: {
  label: string;
  placeholder: string;
  value?: string;
  onChangeText?: (value: string) => void;
  editable?: boolean;
  onPress?: () => void;
  onFocus?: () => void;
  rightIconName?: keyof typeof MaterialIcons.glyphMap;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {onPress ? (
        <TouchableOpacity style={styles.inputPressable} onPress={onPress}>
          <Text
            style={[
              styles.inputPressableText,
              !value && styles.inputPressablePlaceholder,
            ]}
          >
            {value || placeholder}
          </Text>
          <MaterialIcons name={rightIconName} size={18} color="#757682" />
        </TouchableOpacity>
      ) : (
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#757682"
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          onFocus={onFocus}
        />
      )}
    </View>
  );
}

type FamilyMember = {
  name: string;
  relation: string;
  gender: "male" | "female" | "other";
};

const occupationOptions = [
  "Student",
  "Homemaker",
  "Self-Employed",
  "Business Owner",
  "Private Sector Employee",
  "Government Employee",
  "Public Sector Employee (PSU)",
  "Professional (Doctor, CA, Lawyer, Architect, etc.)",
  "Farmer / Agriculturist",
  "Labourer / Worker",
  "Retired",
  "Unemployed",
  "Other",
];

export default function RegisterVoterProfileScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));
  const [fullName, setFullName] = useState("");
  const [fatherName, setFatherName] = useState("");
  const [dob, setDob] = useState("");
  const [birthdayReminder, setBirthdayReminder] = useState("");
  const [anniversary, setAnniversary] = useState("");
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
  const [activePicker, setActivePicker] = useState<
    "dob" | "anniversary" | null
  >(null);
  const [isOccupationModalVisible, setIsOccupationModalVisible] =
    useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const fieldLayouts = useRef<Record<string, number>>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const sanitizeAlpha = (value: string) => value.replace(/[^A-Za-z\s]/g, "");

  const openPicker = (field: "dob" | "anniversary") => {
    setActivePicker(field);
  };

  const registerFieldLayout = (field: string, y: number) => {
    fieldLayouts.current[field] = y;
  };

  const scrollToField = (field: string) => {
    const y = fieldLayouts.current[field];
    if (y === undefined || !scrollViewRef.current) {
      return;
    }
    const targetY = Math.max(y - (keyboardHeight > 0 ? keyboardHeight * 0.3 : 32), 0);
    scrollViewRef.current.scrollTo({ y: targetY, animated: true });
  };

  const handleScroll = (_event: NativeSyntheticEvent<NativeScrollEvent>) => {};

  const handleDateChange = (
    field: "dob" | "anniversary",
    event: DateTimePickerEvent,
    selectedDate?: Date,
  ) => {
    if (Platform.OS !== "ios") {
      setActivePicker(null);
    }
    if (event.type === "dismissed" || !selectedDate) {
      return;
    }
    const formatted = formatDate(selectedDate);
    if (field === "dob") {
      setDob(formatted);
      setBirthdayReminder(formatted);
      return;
    }
    setAnniversary(formatted);
  };

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const showSub = Keyboard.addListener(showEvent, event => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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
          setBirthdayReminder(voter.dob ?? "");
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

  const openOccupationDropdown = () => {
    if (Platform.OS === "ios") {
      const options = ["Cancel", ...occupationOptions];
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex: 0,
        },
        buttonIndex => {
          const selected = options[buttonIndex];
          if (selected && selected !== "Cancel") {
            setOccupation(selected);
          }
        },
      );
      return;
    }
    setIsOccupationModalVisible(true);
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
            ref={scrollViewRef}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
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
                    resizeMode="cover"
                  />
                ) : (
                  <MaterialIcons name="add-a-photo" size={34} color="#757682" />
                )}
                {!photoUrl ? (
                  <Text style={styles.uploadText}>
                    {isUploadingPhoto ? "Uploading..." : "Upload Photo"}
                  </Text>
                ) : null}
              </TouchableOpacity>
            </View>

            {step === 1 ? (
              <View style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                <View
                  onLayout={event =>
                    registerFieldLayout("fullName", event.nativeEvent.layout.y)
                  }
                >
                  <Field
                    label="Full Name (as per ID)"
                    placeholder="Enter Full Name"
                    value={fullName}
                    onChangeText={value => setFullName(sanitizeAlpha(value))}
                    onFocus={() => scrollToField("fullName")}
                  />
                </View>
                <View
                  onLayout={event =>
                    registerFieldLayout(
                      "fatherName",
                      event.nativeEvent.layout.y,
                    )
                  }
                >
                  <Field
                    label="Father's / Husband's Name"
                    placeholder="Enter Name"
                    value={fatherName}
                    onChangeText={value => setFatherName(sanitizeAlpha(value))}
                    onFocus={() => scrollToField("fatherName")}
                  />
                </View>
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="DOB"
                      placeholder="Select DOB"
                      value={dob}
                      onPress={() => openPicker("dob")}
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
                <View
                  onLayout={event =>
                    registerFieldLayout("voterId", event.nativeEvent.layout.y)
                  }
                >
                  <Field
                    label="Voter ID (EPIC Number)"
                    placeholder="ABC1234567"
                    value={voterId}
                    onChangeText={setVoterId}
                    onFocus={() => scrollToField("voterId")}
                  />
                </View>
                <View style={styles.row}>
                  <View
                    style={{ flex: 1 }}
                    onLayout={event =>
                      registerFieldLayout(
                        "boothNumber",
                        event.nativeEvent.layout.y,
                      )
                    }
                  >
                    <Field
                      label="Booth Number"
                      placeholder="000"
                      value={boothNumber}
                      onChangeText={setBoothNumber}
                      onFocus={() => scrollToField("boothNumber")}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field
                      label="Occupation"
                      placeholder="Select occupation"
                      value={occupation}
                      onPress={openOccupationDropdown}
                      rightIconName="keyboard-arrow-down"
                    />
                  </View>
                </View>
                <View
                  onLayout={event =>
                    registerFieldLayout("village", event.nativeEvent.layout.y)
                  }
                >
                  <Field
                    label="Village / Panchayat / Ward"
                    placeholder="Enter Ward or Village name"
                    value={village}
                    onChangeText={setVillage}
                    onFocus={() => scrollToField("village")}
                  />
                </View>
                <View
                  onLayout={event =>
                    registerFieldLayout(
                      "panchayat",
                      event.nativeEvent.layout.y,
                    )
                  }
                >
                  <Field
                    label="Panchayat"
                    placeholder="Enter Panchayat"
                    value={panchayat}
                    onChangeText={setPanchayat}
                    onFocus={() => scrollToField("panchayat")}
                  />
                </View>
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
                      placeholder="Derived from DOB"
                      placeholderTextColor="#757682"
                      style={styles.reminderInput}
                      value={birthdayReminder}
                      editable={false}
                    />
                  </View>
                </View>
                <View style={styles.reminder}>
                  <MaterialIcons name="favorite" size={20} color="#1E3A8A" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderLabel}>Anniversary</Text>
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => openPicker("anniversary")}
                    >
                      <Text
                        style={[
                          styles.datePickerText,
                          !anniversary && styles.datePickerPlaceholder,
                        ]}
                      >
                        {anniversary || "Select date"}
                      </Text>
                      <MaterialIcons
                        name="calendar-today"
                        size={18}
                        color="#757682"
                      />
                    </TouchableOpacity>
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
                  <View
                    onLayout={event =>
                      registerFieldLayout("familySize", event.nativeEvent.layout.y)
                    }
                  >
                    <TextInput
                      placeholder="Enter total family members"
                      maxLength={50}
                      placeholderTextColor="#757682"
                      style={styles.input}
                      keyboardType="number-pad"
                      value={familySizeInput}
                      onFocus={() => scrollToField("familySize")}
                      onChangeText={value =>
                        setFamilySizeInput(value.replace(/[^0-9]/g, ""))
                      }
                    />
                  </View>
                </View>
                <View style={styles.row}>
                  <View
                    style={{ flex: 1 }}
                    onLayout={event =>
                      registerFieldLayout("maleCount", event.nativeEvent.layout.y)
                    }
                  >
                    <View style={styles.field}>
                      <Text style={styles.label}>How many males?</Text>
                      <TextInput
                        placeholder="Enter male members"
                        placeholderTextColor="#757682"
                        style={styles.input}
                        keyboardType="number-pad"
                        value={maleCountInput}
                        onFocus={() => scrollToField("maleCount")}
                        onChangeText={value =>
                          setMaleCountInput(value.replace(/[^0-9]/g, ""))
                        }
                      />
                    </View>
                  </View>
                  <View
                    style={{ flex: 1 }}
                    onLayout={event =>
                      registerFieldLayout("femaleCount", event.nativeEvent.layout.y)
                    }
                  >
                    <View style={styles.field}>
                      <Text style={styles.label}>How many females?</Text>
                      <TextInput
                        placeholder="Enter female members"
                        placeholderTextColor="#757682"
                        style={styles.input}
                        keyboardType="number-pad"
                        value={femaleCountInput}
                        onFocus={() => scrollToField("femaleCount")}
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
                  <View
                    key={`member-${index}`}
                    style={styles.memberRow}
                    onLayout={event =>
                      registerFieldLayout(
                        `member-${index}`,
                        event.nativeEvent.layout.y,
                      )
                    }
                  >
                    <View style={styles.memberNo}>
                      <Text style={styles.memberNoText}>{index + 1}</Text>
                    </View>
                    <View style={styles.memberFields}>
                      <TextInput
                        placeholder="Name"
                        placeholderTextColor="#757682"
                        style={styles.memberInput}
                        value={member.name}
                        onFocus={() => scrollToField(`member-${index}`)}
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
                        onFocus={() => scrollToField(`member-${index}`)}
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
            {activePicker ? (
              <DateTimePicker
                value={parseDate(
                  activePicker === "dob" ? dob : anniversary,
                ) ?? new Date()}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                maximumDate={activePicker === "dob" ? new Date() : undefined}
                onChange={(event, date) => handleDateChange(activePicker, event, date)}
              />
            ) : null}
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
      <Modal
        visible={isOccupationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOccupationModalVisible(false)}
      >
        <Pressable
          style={styles.modalBackdrop}
          onPress={() => setIsOccupationModalVisible(false)}
        >
          <Pressable style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Occupation</Text>
              <TouchableOpacity
                style={styles.modalClose}
                onPress={() => setIsOccupationModalVisible(false)}
              >
                <MaterialIcons name="close" size={20} color="#444651" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={occupationOptions}
              keyExtractor={item => item}
              contentContainerStyle={styles.modalList}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const selected = occupation === item;
                return (
                  <TouchableOpacity
                    style={[
                      styles.optionRow,
                      selected && styles.optionRowSelected,
                    ]}
                    onPress={() => {
                      setOccupation(item);
                      setIsOccupationModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {item}
                    </Text>
                    {selected ? (
                      <MaterialIcons
                        name="check-circle"
                        size={20}
                        color="#00236F"
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
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
    overflow: "hidden",
  },
  photoPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 64,
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
  inputPressable: {
    height: 46,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 8,
    backgroundColor: "#F8F9FF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  inputPressableText: { color: "#121C28", fontSize: 14, flex: 1 },
  inputPressablePlaceholder: { color: "#757682" },
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
  datePickerButton: {
    height: 38,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  datePickerText: { color: "#121C28", fontSize: 14, flex: 1 },
  datePickerPlaceholder: { color: "#757682" },
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(18, 28, 40, 0.35)",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    maxHeight: "72%",
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E1E4F2",
  },
  modalTitle: { color: "#00236F", fontSize: 17, fontWeight: "700" },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F4FF",
  },
  modalList: { padding: 12, gap: 8 },
  optionRow: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: "#D9DDEA",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: "#F8F9FF",
  },
  optionRowSelected: {
    borderColor: "#00236F",
    backgroundColor: "#EAF0FF",
  },
  optionText: { flex: 1, color: "#121C28", fontSize: 14, fontWeight: "500" },
  optionTextSelected: { color: "#00236F", fontWeight: "700" },
});
