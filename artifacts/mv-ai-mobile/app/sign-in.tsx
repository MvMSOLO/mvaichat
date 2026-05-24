import { useSignIn, useSignUp } from "@clerk/expo";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function SignInScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { signIn, setActive: setSignInActive, isLoaded: signInLoaded } = useSignIn();
  const { signUp, setActive: setSignUpActive, isLoaded: signUpLoaded } = useSignUp();

  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!signInLoaded) return;
    setLoading(true);
    setError("");
    try {
      const result = await signIn.create({ identifier: email, password });
      if (result.status === "complete") {
        await setSignInActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      setError(e?.errors?.[0]?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!signUpLoaded) return;
    setLoading(true);
    setError("");
    try {
      await signUp.create({ emailAddress: email, password });
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setVerifying(true);
    } catch (e: any) {
      setError(e?.errors?.[0]?.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!signUpLoaded) return;
    setLoading(true);
    setError("");
    try {
      const result = await signUp.attemptEmailAddressVerification({ code });
      if (result.status === "complete") {
        await setSignUpActive({ session: result.createdSessionId });
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      setError(e?.errors?.[0]?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const s = styles(colors, insets);

  if (verifying) {
    return (
      <View style={s.container}>
        <Text style={s.title}>Check your email</Text>
        <Text style={s.subtitle}>Enter the code sent to {email}</Text>
        <TextInput
          style={s.input}
          placeholder="Verification code"
          placeholderTextColor={colors.mutedForeground}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          autoFocus
        />
        {error ? <Text style={s.error}>{error}</Text> : null}
        <Pressable style={s.button} onPress={handleVerify} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Verify</Text>}
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={s.container}>
        <Text style={s.brand}>MV AI</Text>
        <Text style={s.title}>{mode === "sign-in" ? "Welcome back" : "Create account"}</Text>
        <Text style={s.subtitle}>Your AI cockpit</Text>

        <TextInput
          style={s.input}
          placeholder="Email"
          placeholderTextColor={colors.mutedForeground}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={s.input}
          placeholder="Password"
          placeholderTextColor={colors.mutedForeground}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={s.error}>{error}</Text> : null}

        <Pressable
          style={s.button}
          onPress={mode === "sign-in" ? handleSignIn : handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={s.buttonText}>{mode === "sign-in" ? "Sign In" : "Sign Up"}</Text>
          )}
        </Pressable>

        <Pressable onPress={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}>
          <Text style={s.toggle}>
            {mode === "sign-in" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = (colors: ReturnType<typeof import("@/hooks/useColors").useColors>, insets: ReturnType<typeof import("react-native-safe-area-context").useSafeAreaInsets>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: 24,
      paddingTop: insets.top + 60,
      gap: 12,
    },
    brand: {
      fontSize: 13,
      fontWeight: "700" as const,
      letterSpacing: 3,
      color: colors.primary,
      textTransform: "uppercase",
      marginBottom: 8,
    },
    title: {
      fontSize: 28,
      fontWeight: "700" as const,
      color: colors.foreground,
    },
    subtitle: {
      fontSize: 15,
      color: colors.mutedForeground,
      marginBottom: 8,
    },
    input: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: colors.radius,
      padding: 14,
      fontSize: 16,
      color: colors.foreground,
    },
    error: {
      color: colors.destructive,
      fontSize: 13,
    },
    button: {
      backgroundColor: colors.primary,
      borderRadius: colors.radius,
      padding: 16,
      alignItems: "center",
      marginTop: 4,
    },
    buttonText: {
      color: colors.primaryForeground,
      fontWeight: "600" as const,
      fontSize: 16,
    },
    toggle: {
      color: colors.primary,
      textAlign: "center",
      marginTop: 8,
      fontSize: 14,
    },
  });
