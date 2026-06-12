import { Redirect, useLocalSearchParams, useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useMemo, useRef, useState } from "react";
import { apiConfigError } from "../../lib/api";
import { getCurrentProfile, verifyOtp } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import { ROLE_HOME } from "../../constants/permissions";
import {
  Alert,
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

export default function OtpScreen() {
  const router = useRouter();
  const { mobile, role, devOtp } = useLocalSearchParams<{
    mobile?: string;
    role?: string;
    devOtp?: string;
  }>();
  const { login, isHydrated, isLoggedIn, userRole } = useAuth();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<Array<TextInput | null>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const displayMobile = mobile ?? "+91 •••• ••••";
  const token = useMemo(() => otp.join(""), [otp]);

  if (isHydrated && isLoggedIn && userRole) {
    return <Redirect href={ROLE_HOME[userRole] as never} />;
  }

  const handleChange = (index: number, value: string) => {
    const next = [...otp];
    const digit = value.replace(/\D/g, "").slice(0, 1);
    next[index] = digit;
    setOtp(next);
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    setError(null);
    if (apiConfigError) {
      setError(apiConfigError);
      login(
        (role as "citizen" | "operator" | "leader") ?? "citizen",
      );
      router.replace("/dashboard" as never);
      return;
    }
    if (!mobile) {
      setError("Missing mobile number. Please retry login.");
      return;
    }
    if (token.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setIsLoading(true);
    try {
      const result = await verifyOtp(mobile, token);
      const profile = result.profile ?? (await getCurrentProfile());
      const resolvedRole =
        profile?.role ??
        (role as "citizen" | "operator" | "leader") ??
        "citizen";
      login(resolvedRole as "citizen" | "operator" | "leader");
      if (resolvedRole === "citizen" && !profile) {
        router.replace("/register" as never);
      } else if (resolvedRole === "operator") {
        router.replace("/operator" as never);
      } else if (resolvedRole === "leader") {
        router.replace("/leader" as never);
      } else {
        router.replace("/dashboard" as never);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "OTP verification failed.";
      setError(message);
    } finally {
      setIsLoading(false);
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
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => {
                  if (router.canGoBack()) {
                    router.back();
                  } else {
                    router.replace("/login" as never);
                  }
                }}
              >
                <MaterialIcons name="arrow-back" size={28} color="#0A2A82" />
              </TouchableOpacity>
              <Text style={styles.brand}>जन सेवा</Text>
              <View style={styles.langChip}>
                <MaterialIcons name="language" size={18} color="#0A2A82" />
                <Text style={styles.langText}>English</Text>
                <MaterialIcons
                  name="keyboard-arrow-down"
                  size={18}
                  color="#0A2A82"
                />
              </View>
            </View>

            <View style={styles.body}>
              <View style={styles.lockWrap}>
                <View style={styles.lockCard}>
                  <Text style={styles.lockEmoji}>🔒</Text>
                </View>
                <View style={styles.shieldBadge}>
                  <Text style={styles.shieldText}>🛡</Text>
                </View>
              </View>

              <Text style={styles.title}>Verify OTP</Text>
              <Text style={styles.subtitle}>
                Enter the 6-digit code sent to{" "}
                <Text style={styles.bold}>{displayMobile}</Text>
              </Text>
              {typeof devOtp === "string" && devOtp.length === 6 ? (
                <Text style={styles.devHint}>Dev OTP: {devOtp}</Text>
              ) : null}

              <View style={styles.otpCard}>
                <View style={styles.otpRow}>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <TextInput
                      key={i}
                      ref={ref => {
                        inputRefs.current[i] = ref;
                      }}
                      style={styles.otpBox}
                      maxLength={1}
                      keyboardType="number-pad"
                      value={otp[i]}
                      onChangeText={value => handleChange(i, value)}
                      onKeyPress={({ nativeEvent }) => {
                        if (
                          nativeEvent.key === "Backspace" &&
                          !otp[i] &&
                          i > 0
                        ) {
                          inputRefs.current[i - 1]?.focus();
                        }
                      }}
                    />
                  ))}
                </View>

                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                <TouchableOpacity style={styles.cta} onPress={handleVerify}>
                  <Text style={styles.ctaText}>
                    {isLoading ? "Verifying..." : "Verify & Proceed →"}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.timerText}>
                Didn't receive the code? <Text style={styles.timer}>00:28</Text>
              </Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("OTP", "A new OTP will be sent shortly.")
                }
              >
                <Text style={styles.resend}>Resend OTP</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <View style={styles.footerLineWrap}>
                <MaterialIcons name="security" size={18} color="#777B87" />
                <Text style={styles.footerLine}>
                  Secured by National Informatics Centre
                </Text>
              </View>
              <Text style={styles.footerSub}>
                DIGITAL INDIA | GOVERNMENT OF INDIA
              </Text>
            </View>
          </ScrollView>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#EDEDF5" },
  header: {
    minHeight: 70,
    borderBottomWidth: 1,
    borderBottomColor: "#C9CBD7",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    gap: 16,
  },
  brand: { fontSize: 24, color: "#0A2A82", fontWeight: "800", flex: 1 },
  langChip: {
    borderWidth: 1,
    borderColor: "#B8BDCF",
    backgroundColor: "#F3F4F8",
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  langText: { color: "#0A2A82", fontSize: 13, fontWeight: "500" },
  body: { paddingHorizontal: 20, alignItems: "center", paddingTop: 24 },
  lockWrap: { marginBottom: 18 },
  lockCard: {
    width: 170,
    height: 170,
    borderRadius: 14,
    borderWidth: 4,
    borderColor: "#F4F4F8",
    backgroundColor: "#0C1728",
    alignItems: "center",
    justifyContent: "center",
  },
  lockEmoji: { fontSize: 52 },
  shieldBadge: {
    position: "absolute",
    right: -8,
    bottom: -8,
    width: 46,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#00714D",
    alignItems: "center",
    justifyContent: "center",
  },
  shieldText: { fontSize: 18 },
  title: {
    fontSize: 44 / 2,
    color: "#111827",
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#3E4452",
    marginBottom: 20,
    textAlign: "center",
  },
  devHint: {
    fontSize: 13,
    color: "#0A2A82",
    fontWeight: "600",
    marginBottom: 12,
  },
  bold: { color: "#111827", fontWeight: "700" },
  otpCard: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#D8DAE4",
    backgroundColor: "#F7F7FA",
    borderRadius: 14,
    padding: 12,
    marginBottom: 20,
  },
  otpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  errorText: { color: "#BA1A1A", fontSize: 12, marginBottom: 10 },
  otpBox: {
    width: 42,
    height: 56,
    borderWidth: 1.4,
    borderColor: "#BDC2D4",
    borderRadius: 8,
    backgroundColor: "#F9FAFC",
    textAlign: "center",
    fontSize: 20,
    color: "#111827",
    fontWeight: "700",
  },
  cta: {
    height: 50,
    borderRadius: 12,
    backgroundColor: "#29439A",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { color: "#FFFFFF", fontSize: 20 / 1.2, fontWeight: "500" },
  timerText: { fontSize: 18, color: "#3A4050", marginBottom: 10 },
  timer: { color: "#0A2A82", fontWeight: "700" },
  resend: { color: "#B8BBC8", fontSize: 18, fontWeight: "700" },
  footer: {
    marginTop: "auto",
    borderTopWidth: 1,
    borderTopColor: "#D0D2DD",
    paddingVertical: 12,
    alignItems: "center",
    gap: 8,
  },
  footerLineWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  footerLine: { color: "#777B87", fontSize: 16 },
  footerSub: {
    color: "#616672",
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: "600",
  },
});
