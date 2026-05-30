import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Platform,
  Alert,
  Switch,
  useColorScheme,
} from "react-native";
import { useAuth, useUser } from "@clerk/expo";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

const PERSONAS = [
  { id: "friend", label: "Do'st" },
  { id: "professional", label: "Professional" },
  { id: "funny", label: "Hazilkash" },
  { id: "mentor", label: "Mentor" },
  { id: "poet", label: "Shoir" },
];

const LANGS = [
  { id: "Uzbek", label: "O'zbek" },
  { id: "Russian", label: "Русский" },
  { id: "English", label: "English" },
  { id: "auto", label: "Avtomatik" },
];

const LENGTHS = [
  { id: "short", label: "Qisqa" },
  { id: "balanced", label: "Balansli" },
  { id: "long", label: "Batafsil" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  return (
    <View style={sec.wrap}>
      <Text style={[sec.title, { color: isDark ? "#8e8fa5" : "#737373" }]}>{title}</Text>
      <View style={[sec.card, { backgroundColor: isDark ? "#10101c" : "#ffffff", borderColor: isDark ? "#1f2035" : "#e0ddd8" }]}>
        {children}
      </View>
    </View>
  );
}
const sec = StyleSheet.create({
  wrap: { marginBottom: 24 },
  title: { fontSize: 11, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 8, marginLeft: 4, fontFamily: "Inter_600SemiBold" },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
});

function OptionRow({
  label,
  options,
  value,
  onChange,
  color,
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  color: string;
}) {
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  return (
    <View style={row.wrap}>
      <Text style={[row.label, { color: isDark ? "#f5f3ee" : "#13121f" }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
        {options.map((opt) => (
          <Pressable
            key={opt.id}
            onPress={() => { onChange(opt.id); Haptics.selectionAsync(); }}
            style={[
              row.chip,
              { borderColor: isDark ? "#1f2035" : "#e0ddd8", backgroundColor: isDark ? "#181825" : "#f5f5f5" },
              value === opt.id && { borderColor: color, backgroundColor: color + "22" },
            ]}
          >
            <Text style={[row.chipText, { color: isDark ? "#8e8fa5" : "#737373" }, value === opt.id && { color }]}>
              {opt.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
const row = StyleSheet.create({
  wrap: { padding: 16 },
  label: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});

function ToggleRow({ label, value, onChange, icon }: { label: string; value: boolean; onChange: (v: boolean) => void; icon: string }) {
  const scheme = useColorScheme();
  const isDark = scheme !== "light";
  return (
    <View style={[tog.row, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: isDark ? "#1f2035" : "#e0ddd8" }]}>
      <View style={tog.left}>
        <Ionicons name={icon as any} size={18} color="#a855f7" style={{ marginRight: 10 }} />
        <Text style={[tog.label, { color: isDark ? "#f5f3ee" : "#13121f" }]}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: "#1f2035", true: "#a855f7" }} thumbColor="#fff" />
    </View>
  );
}
const tog = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  left: { flexDirection: "row", alignItems: "center" },
  label: { fontSize: 14, fontFamily: "Inter_400Regular" },
});

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const { user } = useUser();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";

  const [persona, setPersona] = useState("friend");
  const [lang, setLang] = useState("Uzbek");
  const [length, setLength] = useState("balanced");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const bg = isDark ? "#09090f" : "#f5f2ec";
  const fgStrong = isDark ? "#f5f3ee" : "#13121f";
  const fgMuted = isDark ? "#8e8fa5" : "#737373";
  const cardBg = isDark ? "#10101c" : "#ffffff";
  const cardBorder = isDark ? "#1f2035" : "#e0ddd8";

  async function handleSignOut() {
    Alert.alert("Chiqish", "Hisobdan chiqmoqchimisiz?", [
      { text: "Bekor", style: "cancel" },
      {
        text: "Chiqish",
        style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/sign-in");
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View
        style={[
          h.header,
          {
            backgroundColor: bg,
            paddingTop: Platform.OS === "web" ? 67 : insets.top,
            borderBottomColor: cardBorder,
          },
        ]}
      >
        <Text style={[h.title, { color: fgStrong }]}>Sozlamalar</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile card */}
        <View style={[prof.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={prof.avatar}>
            <Text style={prof.avatarText}>
              {(user?.fullName ?? user?.emailAddresses?.[0]?.emailAddress ?? "U")[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[prof.name, { color: fgStrong }]}>
              {user?.fullName ?? "Foydalanuvchi"}
            </Text>
            <Text style={[prof.email, { color: fgMuted }]}>
              {user?.emailAddresses?.[0]?.emailAddress ?? ""}
            </Text>
          </View>
          <View style={prof.badge}>
            <Text style={prof.badgeText}>PRO</Text>
          </View>
        </View>

        {/* AI Persona */}
        <Section title="AI Shaxsiyati">
          <OptionRow label="Persona" options={PERSONAS} value={persona} onChange={setPersona} color="#a855f7" />
        </Section>

        {/* Language */}
        <Section title="Til">
          <OptionRow label="Javob tili" options={LANGS} value={lang} onChange={setLang} color="#0dcff0" />
        </Section>

        {/* Response length */}
        <Section title="Javob uzunligi">
          <OptionRow label="Uzunlik" options={LENGTHS} value={length} onChange={setLength} color="#f04db0" />
        </Section>

        {/* Preferences */}
        <Section title="Xususiyatlar">
          <ToggleRow label="Ovoz rejimi" value={voiceEnabled} onChange={setVoiceEnabled} icon="mic-outline" />
          <ToggleRow label="Tovushlar" value={soundEnabled} onChange={setSoundEnabled} icon="volume-medium-outline" />
        </Section>

        {/* App info */}
        <Section title="Ilova haqida">
          <View style={[info.row, { borderTopWidth: 0 }]}>
            <Feather name="info" size={16} color={fgMuted} />
            <Text style={[info.label, { color: fgMuted }]}>MV AI Mobile v1.0</Text>
          </View>
          <View style={[info.row, { borderTopColor: cardBorder }]}>
            <Feather name="cpu" size={16} color={fgMuted} />
            <Text style={[info.label, { color: fgMuted }]}>ECLIPSE Design System v9</Text>
          </View>
        </Section>

        {/* Sign out */}
        <Pressable style={[so.btn, { borderColor: "#e83a3a22", backgroundColor: "#e83a3a11" }]} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={18} color="#e83a3a" />
          <Text style={so.text}>Chiqish</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const h = StyleSheet.create({
  header: {
    paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 28, fontWeight: "700", fontFamily: "Inter_700Bold", marginTop: 4 },
});

const prof = StyleSheet.create({
  card: {
    flexDirection: "row", alignItems: "center", gap: 14,
    padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "#a855f722", borderWidth: 1.5, borderColor: "#a855f7",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 22, fontWeight: "700", color: "#a855f7", fontFamily: "Inter_700Bold" },
  name: { fontSize: 16, fontWeight: "700", fontFamily: "Inter_700Bold" },
  email: { fontSize: 13, marginTop: 2, fontFamily: "Inter_400Regular" },
  badge: {
    backgroundColor: "#a855f722", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "#a855f7",
  },
  badgeText: { color: "#a855f7", fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold", letterSpacing: 1 },
});

const info = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 13, borderTopWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 13, fontFamily: "Inter_400Regular" },
});

const so = StyleSheet.create({
  btn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    paddingVertical: 16, borderRadius: 16, borderWidth: 1, marginTop: 4,
  },
  text: { color: "#e83a3a", fontSize: 15, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
