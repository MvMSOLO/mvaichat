import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useSignUp, useAuth } from "@clerk/expo";
import { Redirect, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const BG = "#09090f";
const CARD = "#10101c";
const PRIMARY = "#a855f7";
const FOREGROUND = "#f5f3ee";
const MUTED = "#8e8fa5";
const BORDER = "#1f2035";
const INPUT_BG = "#181825";

export default function SignUpScreen() {
  const { signUp, setActive, isLoaded } = useSignUp();
  const { isSignedIn } = useAuth();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (isSignedIn) return <Redirect href="/(tabs)" />;

  async function handleSignUp() {
    if (!isLoaded || !signUp) return;
    if (!email || !password) {
      Alert.alert("Xato", "Email va parol kiriting");
      return;
    }
    setLoading(true);
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err: any) {
      Alert.alert("Xato", err?.errors?.[0]?.message ?? "Noma'lum xato");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    if (!isLoaded || !signUp) return;
    setLoading(true);
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (err: any) {
      Alert.alert("Xato", err?.errors?.[0]?.message ?? "Tasdiqlash kodi noto'g'ri");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top + 20 }]}>
      <KeyboardAvoidingView
        style={s.inner}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.logoArea}>
          <View style={s.logoRing}>
            <Text style={s.logoText}>MV</Text>
          </View>
          <Text style={s.appName}>MV AI</Text>
          <Text style={s.tagline}>
            {pendingVerification ? "Emailni tasdiqlang" : "Hisob yarating"}
          </Text>
        </View>

        <View style={s.card}>
          {!pendingVerification ? (
            <>
              <Text style={s.cardTitle}>Ro'yxatdan o'tish</Text>
              <View style={s.field}>
                <Text style={s.label}>Email</Text>
                <View style={s.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={MUTED} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@example.com"
                    placeholderTextColor={MUTED}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                  />
                </View>
              </View>
              <View style={s.field}>
                <Text style={s.label}>Parol</Text>
                <View style={s.inputWrap}>
                  <Ionicons name="lock-closed-outline" size={18} color={MUTED} style={s.inputIcon} />
                  <TextInput
                    style={[s.input, { flex: 1 }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    placeholderTextColor={MUTED}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={s.eyeBtn}>
                    <Ionicons name={showPassword ? "eye-off-outline" : "eye-outline"} size={18} color={MUTED} />
                  </Pressable>
                </View>
              </View>
              <Pressable style={[s.btn, loading && s.btnDisabled]} onPress={handleSignUp} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Davom etish</Text>}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={s.cardTitle}>Email tasdiqlash</Text>
              <Text style={s.verifyHint}>
                {email} manziliga yuborilgan 6 xonali kodni kiriting
              </Text>
              <View style={s.field}>
                <View style={s.inputWrap}>
                  <Ionicons name="shield-checkmark-outline" size={18} color={MUTED} style={s.inputIcon} />
                  <TextInput
                    style={s.input}
                    value={code}
                    onChangeText={setCode}
                    placeholder="123456"
                    placeholderTextColor={MUTED}
                    keyboardType="number-pad"
                    maxLength={6}
                  />
                </View>
              </View>
              <Pressable style={[s.btn, loading && s.btnDisabled]} onPress={handleVerify} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Tasdiqlash</Text>}
              </Pressable>
            </>
          )}
        </View>

        <View style={s.footer}>
          <Text style={s.footerText}>Hisob bor? </Text>
          <Pressable onPress={() => router.back()}>
            <Text style={s.footerLink}>Kirish</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  inner: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  logoArea: { alignItems: "center", marginBottom: 40 },
  logoRing: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 2, borderColor: PRIMARY, backgroundColor: CARD,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
    shadowColor: PRIMARY, shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 0 },
    elevation: 12,
  },
  logoText: { fontSize: 24, fontWeight: "700", color: PRIMARY, fontFamily: "Inter_700Bold" },
  appName: { fontSize: 28, fontWeight: "700", color: FOREGROUND, fontFamily: "Inter_700Bold" },
  tagline: { fontSize: 14, color: MUTED, marginTop: 4, fontFamily: "Inter_400Regular" },
  card: { backgroundColor: CARD, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: BORDER },
  cardTitle: { fontSize: 20, fontWeight: "700", color: FOREGROUND, marginBottom: 20, fontFamily: "Inter_700Bold" },
  verifyHint: { fontSize: 14, color: MUTED, marginBottom: 16, fontFamily: "Inter_400Regular", lineHeight: 20 },
  field: { marginBottom: 16 },
  label: { fontSize: 12, color: MUTED, marginBottom: 6, fontFamily: "Inter_500Medium", letterSpacing: 0.5 },
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: INPUT_BG, borderRadius: 12,
    borderWidth: 1, borderColor: BORDER, paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, color: FOREGROUND, fontSize: 15, paddingVertical: 14, fontFamily: "Inter_400Regular" },
  eyeBtn: { padding: 4 },
  btn: {
    backgroundColor: PRIMARY, borderRadius: 14,
    paddingVertical: 16, alignItems: "center", marginTop: 8,
    shadowColor: PRIMARY, shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#09090f", fontWeight: "700", fontSize: 16, fontFamily: "Inter_700Bold" },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 24, alignItems: "center" },
  footerText: { color: MUTED, fontSize: 14, fontFamily: "Inter_400Regular" },
  footerLink: { color: PRIMARY, fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
