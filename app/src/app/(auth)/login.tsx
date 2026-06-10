import { Redirect, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { apiConfigError } from "../../lib/api";
import {
  getCurrentProfile,
  signInStaff,
  verifyOtp,
} from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { ROLE_HOME } from "../../constants/permissions";
import {
  Alert,
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

type Role = "citizen" | "operator" | "officer" | "leader" | "admin";
const DEMO_CITIZEN_MOBILE = "9999999999";
const DEMO_CITIZEN_OTP = "123456";
const DEMO_ROLE_CREDENTIALS: Record<
  Exclude<Role, "citizen">,
  { email: string; password: string }
> = {
  operator: { email: "operator@janseva.local", password: "Demo@12345" },
  officer: { email: "officer@janseva.local", password: "Demo@12345" },
  leader: { email: "leader@janseva.local", password: "Demo@12345" },
  admin: { email: "admin@janseva.local", password: "Demo@12345" },
};

export default function LoginScreen() {
  const router = useRouter();
  const { login, isHydrated, isLoggedIn, userRole } = useAuth();
  const [role, setRole] = useState<Role>("citizen");
  const [isNewCitizen, setIsNewCitizen] = useState(false);
  const [mobile, setMobile] = useState(DEMO_CITIZEN_MOBILE);
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toAppRole = (value: string): Role => value as Role;
  const roleLabel = useMemo(() => {
    switch (role) {
      case "operator":
        return "Operator";
      case "officer":
        return "Officer";
      case "leader":
        return "Leadership";
      case "admin":
        return "Admin";
      default:
        return "Citizen";
    }
  }, [role]);

  if (isHydrated && isLoggedIn && userRole) {
    return <Redirect href={ROLE_HOME[userRole] as never} />;
  }

  const handleRoleChange = (nextRole: Role) => {
    setRole(nextRole);
    if (nextRole === "citizen") {
      setMobile(DEMO_CITIZEN_MOBILE);
      setStaffEmail("");
      setStaffPassword("");
      return;
    }
    setStaffEmail(DEMO_ROLE_CREDENTIALS[nextRole].email);
    setStaffPassword(DEMO_ROLE_CREDENTIALS[nextRole].password);
  };

  const handlePrimary = async () => {
    setError(null);
    if (role === "citizen") {
      if (apiConfigError) {
        setError(apiConfigError);
        login("citizen");
        router.replace((isNewCitizen ? "/register" : "/dashboard") as never);
        return;
      }
      setIsLoading(true);
      try {
        const result = await verifyOtp(mobile.trim(), DEMO_CITIZEN_OTP);
        const profile = result.profile ?? (await getCurrentProfile());
        const resolvedRole = toAppRole(profile?.role ?? "citizen");
        login(resolvedRole);
        if (resolvedRole === "citizen" && !profile) {
          router.replace("/register" as never);
        } else {
          router.replace("/dashboard" as never);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Citizen login failed.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    if (role === "operator") {
      if (apiConfigError) {
        setError(apiConfigError);
        login("operator");
        router.replace("/operator" as never);
        return;
      }
      if (!staffEmail.trim() || !staffPassword) {
        setError("Enter staff email and password.");
        return;
      }
      setIsLoading(true);
      try {
        const result = await signInStaff(staffEmail.trim(), staffPassword);
        const resolvedRole = toAppRole(result.profile?.role ?? role);
        login(resolvedRole);
        router.replace(
          (resolvedRole === "admin" ? "/admin/settings" : "/operator") as never,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Staff login failed.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    if (role === "officer") {
      if (apiConfigError) {
        setError(apiConfigError);
        login("officer");
        router.replace("/officer" as never);
        return;
      }
      if (!staffEmail.trim() || !staffPassword) {
        setError("Enter staff email and password.");
        return;
      }
      setIsLoading(true);
      try {
        const result = await signInStaff(staffEmail.trim(), staffPassword);
        const resolvedRole = toAppRole(result.profile?.role ?? role);
        login(resolvedRole);
        router.replace(
          (resolvedRole === "admin" ? "/admin/settings" : "/officer") as never,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Staff login failed.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    if (role === "leader") {
      if (apiConfigError) {
        setError(apiConfigError);
        login("leader");
        router.replace("/leader" as never);
        return;
      }
      if (!staffEmail.trim() || !staffPassword) {
        setError("Enter staff email and password.");
        return;
      }
      setIsLoading(true);
      try {
        const result = await signInStaff(staffEmail.trim(), staffPassword);
        const resolvedRole = toAppRole(result.profile?.role ?? role);
        login(resolvedRole);
        router.replace(
          (resolvedRole === "admin" ? "/admin/settings" : "/leader") as never,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Staff login failed.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    if (role === "admin") {
      if (apiConfigError) {
        setError(apiConfigError);
        login("admin");
        router.replace("/admin" as never);
        return;
      }
      if (!staffEmail.trim() || !staffPassword) {
        setError("Enter staff email and password.");
        return;
      }
      setIsLoading(true);
      try {
        const result = await signInStaff(staffEmail.trim(), staffPassword);
        const resolvedRole = toAppRole(result.profile?.role ?? role);
        login(resolvedRole);
        router.replace("/admin" as never);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Staff login failed.";
        setError(message);
      } finally {
        setIsLoading(false);
      }
      return;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.safe}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.safe} onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.page}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.bgCircleTop} />
            <View style={styles.bgCircleBottom} />

            <View style={styles.card}>
              <View style={styles.langWrap}>
                <TouchableOpacity
                  style={styles.langChip}
                  onPress={() =>
                    Alert.alert("Language", "Language picker coming soon.")
                  }
                >
                  <Text style={styles.langText}>🌐 English</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.identity}>
                <Image
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuB3KCLAm_bp4r3Smg7u6y5K60YihOKySrMW6Nf0miuTIwhG5wiYywI3wl4OZtiv3bJqgIie1Q3kKxBhXw1OMnj1flaRGTv0Gfi9jBTyq3dqWlXIk7mBmgqSY83EZMR6xhMYoO71gdqsYrKlsEbaynvd7JqlRr73Ae3QKWpCDOmf7i2tThiFsO3chNQGV_u-Ns9IWMRSTZ_WbJ2BIyMcOTg38MuPl7WTNYa4BZl_--FtFQKlHpTfngMGmVfD11NuyhrS7XGYlyRF4TY",
                  }}
                  style={styles.emblem}
                />
                <Text style={styles.brand}>जन सेवा</Text>
                <Text style={styles.subtitle}>
                  Empowering Citizens through Digital Services
                </Text>
              </View>

              {role === "citizen" ? (
                <>
                  <Text style={styles.label}>Mobile Number</Text>
                  <View style={styles.inputWrap}>
                    <Text style={styles.prefix}>+91</Text>
                    <TextInput
                      placeholder="Enter 10-digit number"
                      keyboardType="phone-pad"
                      style={styles.input}
                      maxLength={10}
                      value={mobile}
                      onChangeText={setMobile}
                      editable={false}
                    />
                  </View>
                </>
              ) : (
                <>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    placeholder="Enter staff email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                    value={staffEmail}
                    onChangeText={setStaffEmail}
                  />
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    placeholder="Enter password"
                    secureTextEntry
                    style={styles.input}
                    value={staffPassword}
                    onChangeText={setStaffPassword}
                  />
                </>
              )}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <View style={styles.roleRow}>
                {(
                  [
                    "citizen",
                    "operator",
                    "officer",
                    "leader",
                    "admin",
                  ] as Role[]
                ).map(item => {
                  const active = role === item;
                  return (
                    <TouchableOpacity
                      key={item}
                      style={[styles.roleChip, active && styles.roleChipActive]}
                      onPress={() => handleRoleChange(item)}
                    >
                      <Text
                        style={[
                          styles.roleChipText,
                          active && styles.roleChipTextActive,
                        ]}
                      >
                        {item === "leader"
                          ? "Leadership"
                          : item.charAt(0).toUpperCase() + item.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {role === "citizen" ? (
                <View style={styles.citizenRow}>
                  <TouchableOpacity
                    style={[
                      styles.citizenToggle,
                      !isNewCitizen && styles.citizenToggleActive,
                    ]}
                    onPress={() => setIsNewCitizen(false)}
                  >
                    <Text
                      style={[
                        styles.citizenToggleText,
                        !isNewCitizen && styles.citizenToggleTextActive,
                      ]}
                    >
                      Registered
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.citizenToggle,
                      isNewCitizen && styles.citizenToggleActive,
                    ]}
                    onPress={() => setIsNewCitizen(true)}
                  >
                    <Text
                      style={[
                        styles.citizenToggleText,
                        isNewCitizen && styles.citizenToggleTextActive,
                      ]}
                    >
                      New Mobile
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handlePrimary}
                disabled={isLoading}
              >
                <Text style={styles.primaryBtnText}>
                  {isLoading ? "Sending OTP..." : `${roleLabel} Continue`}
                </Text>
                <Text style={styles.btnIcon}>→</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.linkBtn}
                onPress={() =>
                  router.push({
                    pathname: "/feed",
                    params: { role: "public" },
                  } as never)
                }
              >
                <Text style={styles.linkText}>Public Social Feed</Text>
              </TouchableOpacity>

              <View style={styles.orRow}>
                <View style={styles.line} />
                <Text style={styles.orText}>OR</Text>
                <View style={styles.line} />
              </View>

              <View style={styles.altRow}>
                <TouchableOpacity
                  style={styles.altBtn}
                  onPress={() =>
                    Alert.alert(
                      "Biometric",
                      "Biometric login is a placeholder.",
                    )
                  }
                >
                  <Text style={styles.altText}>Biometric</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.altBtn}
                  onPress={() =>
                    Alert.alert("QR Login", "QR login is a placeholder.")
                  }
                >
                  <Text style={styles.altText}>QR Login</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.footer}>
                <View style={styles.footerLogos}>
                  <Image
                    source={{
                      uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBcYdx_P2_7Ttha-Crwo5rgs-wx2KXUw3oKVwUEc-AscuXVgoZfQ89hB077-6Vv4Vdp4B8irnjlyyHmM0OLlh_rviTlof9ZH8KB0gB6WLTbt5L8MerrWImHbCiCjP8-_CtEkHPI9mzOsahqoZ1p2_e4x2s-M75UGc-GSadGMjpazVq2CYivZT0MeUDxQLq1isGjVwrfZ69clRfVFJEirGmEiEXuV5qR6ZK60iHkJxdhvYkW_amEVGzrl9bgHObdNTPqOme5SEy5Xq0",
                    }}
                    style={styles.footerLogo}
                  />
                  <Image
                    source={{
                      uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDnZGong7NvNHzgBUaIMgEnmdODekQaNfjsdq8h9bh52aoiJUhsE7n5qn7xFN5KjKkc-AZObR_Yz3wOIXwP4qosKQtzWppQdOATOhILI-RQJun4e7x3kOxd6jH3pm5qOfTdJ9TzfuVr6s9pCeShsHggnPvlM6PaX3sjWTAzXRzmiY9Ivo16U-_zZQqlpC4E1OeiNuVmeyhBFWk3ssGmwnjqdtRjSxpxrGr4HhhRmgYmPXiLYvQPerUSEQKjkZOsPty38SWCYFNuuN0",
                    }}
                    style={styles.footerLogo}
                  />
                </View>
                <Text style={styles.secured}>
                  SECURED BY NATIONAL INFORMATICS CENTRE
                </Text>
                <View style={styles.helpRow}>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert("Help", "Support contact coming soon.")
                    }
                  >
                    <Text style={styles.helpText}>Need Help?</Text>
                  </TouchableOpacity>
                  <Text style={styles.helpDivider}>|</Text>
                  <TouchableOpacity
                    onPress={() =>
                      Alert.alert(
                        "Accessibility",
                        "Accessibility options coming soon.",
                      )
                    }
                  >
                    <Text style={styles.helpText}>Accessibility</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9FF" },
  page: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
    justifyContent: "center",
  },
  bgCircleTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "#DFE9FA",
    top: -90,
    right: -90,
    opacity: 0.55,
  },
  bgCircleBottom: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 999,
    backgroundColor: "#E5EEFF",
    bottom: -90,
    left: -90,
    opacity: 0.55,
  },
  langWrap: { position: "absolute", top: 16, right: 0, zIndex: 2 },
  langChip: {
    backgroundColor: "#fff",
    borderColor: "#C5C5D3",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  langText: { fontSize: 12, color: "#121C28", fontWeight: "600" },
  card: {
    // backgroundColor: "#fff",
    // borderColor: "#C5C5D3",
    // borderWidth: 1,
    // borderRadius: 12,
    padding: 24,
  },
  identity: { alignItems: "center", marginBottom: 24 },
  emblem: { width: 78, height: 78, resizeMode: "contain", marginBottom: 14 },
  brand: { fontSize: 24, color: "#00236F", fontWeight: "700" },
  subtitle: {
    marginTop: 8,
    fontSize: 13,
    color: "#444651",
    textAlign: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#121C28",
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputWrap: { position: "relative", marginBottom: 16 },
  prefix: {
    position: "absolute",
    left: 14,
    top: 16,
    fontSize: 16,
    color: "#444651",
    zIndex: 1,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 8,
    paddingLeft: 48,
    paddingRight: 12,
    fontSize: 16,
    color: "#121C28",
    backgroundColor: "#F8F9FF",
  },
  errorText: { color: "#BA1A1A", fontSize: 12, marginTop: 6 },
  primaryBtn: {
    height: 48,
    borderRadius: 8,
    backgroundColor: "#00236F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryBtnText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  btnIcon: { color: "#fff", fontSize: 16, fontWeight: "700" },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 16,
  },
  line: { flex: 1, height: 1, backgroundColor: "#C5C5D3" },
  orText: { fontSize: 12, color: "#757682", fontWeight: "600" },
  altRow: { flexDirection: "row", gap: 10 },
  altBtn: {
    flex: 1,
    height: 48,
    borderColor: "#C5C5D3",
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  altText: { color: "#444651", fontSize: 14, fontWeight: "600" },
  roleRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  roleChip: {
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  roleChipActive: { borderColor: "#00236F", backgroundColor: "#E5EEFF" },
  roleChipText: { color: "#444651", fontSize: 12, fontWeight: "600" },
  roleChipTextActive: { color: "#00236F" },
  citizenRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  citizenToggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#C5C5D3",
    borderRadius: 999,
    paddingVertical: 6,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  citizenToggleActive: { borderColor: "#006C49", backgroundColor: "#6CF8BB" },
  citizenToggleText: { color: "#444651", fontSize: 12, fontWeight: "600" },
  citizenToggleTextActive: { color: "#00714D" },
  linkBtn: { alignItems: "center", marginTop: 12 },
  linkText: { color: "#006C49", fontSize: 13, fontWeight: "700" },
  footer: { marginTop: 22, alignItems: "center", gap: 10 },
  footerLogos: { flexDirection: "row", gap: 18, opacity: 0.7 },
  footerLogo: { width: 86, height: 32, resizeMode: "contain" },
  secured: {
    fontSize: 10,
    letterSpacing: 0.6,
    color: "#757682",
    fontWeight: "600",
    textAlign: "center",
  },
  helpRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  helpText: { fontSize: 12, color: "#444651" },
  helpDivider: { color: "#C5C5D3" },
});
