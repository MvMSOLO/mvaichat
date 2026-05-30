import { useAuth, useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { fetch } from "expo/fetch";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getApiBase, UserSettings } from "@/lib/api";

const PERSONAS = [
  { id: "friend", label: "Do'st" },
  { id: "professional", label: "Professional" },
  { id: "funny", label: "Hazilkash" },
  { id: "mentor", label: "Mentor" },
  { id: "poet", label: "Shoir" },
];
const LANGS = [
  { id: "auto", label: "Avtomatik" },
  { id: "Uzbek", label: "O'zbek" },
  { id: "Russian", label: "Русский" },
  { id: "English", label: "English" },
];
const LENGTHS = [
  { id: "short", label: "Qisqa" },
  { id: "balanced", label: "Balansli" },
  { id: "long", label: "Batafsil" },
];

const DEFAULTS: UserSettings = {
  persona: "friend",
  language: "auto",
  response_style: "friendly",
  response_length: "balanced",
  sound_enabled: true,
  voice_enabled: true,
};

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getToken, signOut } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [getToken]);

  const loadSettings = useCallback(async () => {
    const headers = await authHeaders();
    const r = await fetch(`${getApiBase()}/settings`, { headers });
    if (r.ok) {
      const data = await r.json();
      setSettings({
        persona: data.persona || "friend",
        language: data.language || "auto",
        response_style: data.responseStyle || "friendly",
        response_length: data.responseLength || "balanced",
        sound_enabled: data.soundEnabled ?? true,
        voice_enabled: data.voiceEnabled ?? true,
      });
    }
    setLoaded(true);
  }, [authHeaders]);

  useEffect(() => { loadSettings(); }, [loadSettings]);

  const save = async (patch: Partial<UserSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    try {
      const headers = await authHeaders();
      const body: any = {};
      if (patch.persona != null) body.persona = patch.persona;
      if (patch.language != null) body.language = patch.language;
      if (patch.response_style != null) body.responseStyle = patch.response_style;
      if (patch.response_length != null) body.responseLength = patch.response_length;
      if (patch.sound_enabled != null) body.soundEnabled = patch.sound_enabled;
      if (patch.voice_enabled != null) body.voiceEnabled = patch.voice_enabled;
      await fetch(`${getApiBase()}/settings`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace("/sign-in");
  };

  const s = styles(colors, insets);

  if (!loaded) {
    return (
      <View style={[s.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentInsetAdjustmentBehavior="automatic">
      <View style={{ paddingTop: insets.top + 16 }}>
        {/* Profile */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Profile</Text>
          <View style={s.card}>
            <View style={s.profileRow}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() || "?"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.profileEmail} numberOfLines={1}>
                  {user?.primaryEmailAddress?.emailAddress || "Unknown"}
                </Text>
                <Text style={s.profileSub}>MV AI account</Text>
              </View>
              {saving && <ActivityIndicator size="small" color={colors.primary} />}
            </View>
          </View>
        </View>

        {/* Persona */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Shaxsiyat (Persona)</Text>
          <View style={s.card}>
            <View style={s.chipRow}>
              {PERSONAS.map(p => (
                <Pressable
                  key={p.id}
                  style={[s.chip, settings.persona === p.id && s.chipActive]}
                  onPress={() => save({ persona: p.id })}
                >
                  <Text style={[s.chipText, settings.persona === p.id && s.chipTextActive]}>
                    {p.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Language */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Til (Language)</Text>
          <View style={s.card}>
            <View style={s.chipRow}>
              {LANGS.map(l => (
                <Pressable
                  key={l.id}
                  style={[s.chip, settings.language === l.id && s.chipActive]}
                  onPress={() => save({ language: l.id })}
                >
                  <Text style={[s.chipText, settings.language === l.id && s.chipTextActive]}>
                    {l.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Response length */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Javob uzunligi</Text>
          <View style={s.card}>
            <View style={s.chipRow}>
              {LENGTHS.map(l => (
                <Pressable
                  key={l.id}
                  style={[s.chip, settings.response_length === l.id && s.chipActive]}
                  onPress={() => save({ response_length: l.id })}
                >
                  <Text style={[s.chipText, settings.response_length === l.id && s.chipTextActive]}>
                    {l.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* Toggles */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preferences</Text>
          <View style={s.card}>
            <View style={s.row}>
              <View style={s.rowLeft}>
                <Feather name="volume-2" size={18} color={colors.primary} />
                <Text style={s.rowLabel}>Sound</Text>
              </View>
              <Switch
                value={settings.sound_enabled}
                onValueChange={v => save({ sound_enabled: v })}
                trackColor={{ true: colors.primary }}
              />
            </View>
            <View style={[s.row, { borderTopWidth: 1, borderTopColor: colors.border }]}>
              <View style={s.rowLeft}>
                <Feather name="mic" size={18} color={colors.primary} />
                <Text style={s.rowLabel}>Voice</Text>
              </View>
              <Switch
                value={settings.voice_enabled}
                onValueChange={v => save({ voice_enabled: v })}
                trackColor={{ true: colors.primary }}
              />
            </View>
          </View>
        </View>

        {/* Sign out */}
        <View style={[s.section, { marginBottom: insets.bottom + 32 }]}>
          <Pressable style={s.signOutBtn} onPress={handleSignOut}>
            <Feather name="log-out" size={18} color={colors.destructive} />
            <Text style={s.signOutText}>Sign Out</Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = (
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>,
  insets: ReturnType<typeof import("react-native-safe-area-context").useSafeAreaInsets>
) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    section: { marginBottom: 24, paddingHorizontal: 16 },
    sectionTitle: {
      fontSize: 12,
      fontWeight: "600" as const,
      color: colors.mutedForeground,
      textTransform: "uppercase",
      letterSpacing: 1,
      marginBottom: 8,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    profileRow: {
      flexDirection: "row",
      alignItems: "center",
      padding: 16,
      gap: 12,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: { color: "#fff", fontSize: 18, fontWeight: "700" as const },
    profileEmail: { fontSize: 15, fontWeight: "600" as const, color: colors.foreground },
    profileSub: { fontSize: 13, color: colors.mutedForeground, marginTop: 2 },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      padding: 12,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.secondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, color: colors.foreground },
    chipTextActive: { color: "#fff", fontWeight: "600" as const },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    rowLabel: { fontSize: 15, color: colors.foreground },
    signOutBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.destructive + "44",
      borderRadius: colors.radius,
      paddingVertical: 14,
    },
    signOutText: { color: colors.destructive, fontSize: 15, fontWeight: "600" as const },
  });
