import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  Platform,
  ActivityIndicator,
  useColorScheme,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fetch } from "expo/fetch";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@clerk/expo";
import * as Haptics from "expo-haptics";

const AI_MODES = [
  { id: "humanoid", label: "Humanoid", icon: "person-outline" as const, color: "#f2470e" },
  { id: "ideal", label: "Ideal", icon: "sparkles" as const, color: "#a855f7" },
  { id: "code", label: "Code", icon: "code-slash-outline" as const, color: "#22c55e" },
  { id: "vision", label: "Vision", icon: "eye-outline" as const, color: "#ec4899" },
  { id: "search", label: "Search", icon: "search-outline" as const, color: "#eab308" },
  { id: "agents", label: "Agents", icon: "flash-outline" as const, color: "#0dcff0" },
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: string;
}

let msgCounter = 0;
function uid() {
  msgCounter++;
  return `m${Date.now()}-${msgCounter}-${Math.random().toString(36).slice(2, 7)}`;
}

function TypingDots({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8, paddingHorizontal: 4 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[dot.dot, { backgroundColor: color, opacity: 0.5 + i * 0.15 }]} />
      ))}
    </View>
  );
}
const dot = StyleSheet.create({ dot: { width: 8, height: 8, borderRadius: 4 } });

function ModeChip({
  mode,
  selected,
  onPress,
}: {
  mode: (typeof AI_MODES)[0];
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        chip.base,
        selected && { backgroundColor: mode.color + "22", borderColor: mode.color },
      ]}
    >
      <Ionicons name={mode.icon as any} size={14} color={selected ? mode.color : "#8e8fa5"} />
      <Text style={[chip.label, selected && { color: mode.color }]}>{mode.label}</Text>
    </Pressable>
  );
}
const chip = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#1f2035",
    backgroundColor: "#10101c",
    marginRight: 8,
  },
  label: { fontSize: 12, color: "#8e8fa5", fontFamily: "Inter_500Medium" },
});

function MessageBubble({ msg, primaryColor }: { msg: Message; primaryColor: string }) {
  const isUser = msg.role === "user";
  return (
    <View style={[mb.row, isUser && mb.rowUser]}>
      {!isUser && (
        <View style={[mb.avatar, { borderColor: primaryColor }]}>
          <Text style={[mb.avatarText, { color: primaryColor }]}>AI</Text>
        </View>
      )}
      <View style={[mb.bubble, isUser ? mb.bubbleUser : mb.bubbleAI, isUser && { backgroundColor: primaryColor }]}>
        <Text style={[mb.text, isUser && { color: "#09090f" }]}>{msg.content}</Text>
      </View>
    </View>
  );
}
const mb = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "flex-end", marginVertical: 4, marginHorizontal: 16, gap: 8 },
  rowUser: { flexDirection: "row-reverse" },
  avatar: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 1.5, backgroundColor: "#10101c",
    alignItems: "center", justifyContent: "center",
    marginBottom: 2,
  },
  avatarText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  bubble: { maxWidth: "78%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: "#10101c", borderBottomLeftRadius: 4 },
  text: { color: "#f5f3ee", fontSize: 15, lineHeight: 22, fontFamily: "Inter_400Regular" },
});

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { getToken } = useAuth();
  const scheme = useColorScheme();
  const isDark = scheme !== "light";

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [selectedMode, setSelectedMode] = useState(AI_MODES[0]);
  const inputRef = useRef<TextInput>(null);

  const bg = isDark ? "#09090f" : "#f5f2ec";
  const headerBg = isDark ? "#09090f" : "#f5f2ec";

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const currentMessages = [...messages];
    const userMsg: Message = { id: uid(), role: "user", content: text, mode: selectedMode.id };
    setMessages((prev) => [...prev, userMsg]);
    setIsStreaming(true);
    setShowTyping(true);

    try {
      const token = await getToken();
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = domain ? `https://${domain}` : "";

      const chatHistory = [
        ...currentMessages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text },
      ];

      const response = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          messages: chatHistory,
          mode: selectedMode.id,
          model: "auto",
          stream: true,
        }),
      });

      if (!response.ok) throw new Error("Response error");

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");

      const decoder = new TextDecoder();
      let full = "";
      let buf = "";
      let added = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            const chunk = parsed.content ?? parsed.delta?.content ?? parsed.choices?.[0]?.delta?.content ?? "";
            if (!chunk) continue;
            full += chunk;
            if (!added) {
              setShowTyping(false);
              setMessages((prev) => [
                ...prev,
                { id: uid(), role: "assistant", content: full, mode: selectedMode.id },
              ]);
              added = true;
            } else {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = { ...updated[updated.length - 1], content: full };
                return updated;
              });
            }
          } catch {}
        }
      }

      if (!added) {
        setShowTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "assistant", content: full || "Javob olishda xatolik.", mode: selectedMode.id },
        ]);
      }
    } catch {
      setShowTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: "Xatolik yuz berdi. Qayta urinib ko'ring." },
      ]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
    }

    setTimeout(() => inputRef.current?.focus(), 100);
  }, [input, isStreaming, messages, selectedMode, getToken]);

  const reversed = [...messages].reverse();

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View
        style={[
          s.header,
          {
            backgroundColor: headerBg,
            paddingTop: Platform.OS === "web" ? 67 : insets.top,
            borderBottomColor: isDark ? "#1f2035" : "#e0ddd8",
          },
        ]}
      >
        <View style={s.headerLeft}>
          <View style={[s.modeDot, { backgroundColor: selectedMode.color }]} />
          <Text style={[s.headerTitle, { color: isDark ? "#f5f3ee" : "#13121f" }]}>
            MV AI
          </Text>
        </View>
        <Pressable
          onPress={() => {
            setMessages([]);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          style={s.newChatBtn}
        >
          <Feather name="plus-square" size={20} color={isDark ? "#8e8fa5" : "#737373"} />
        </Pressable>
      </View>

      {/* Mode selector */}
      <View style={[s.modeBar, { borderBottomColor: isDark ? "#1f2035" : "#e0ddd8" }]}>
        <FlatList
          data={AI_MODES}
          horizontal
          keyExtractor={(m) => m.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
          renderItem={({ item }) => (
            <ModeChip
              mode={item}
              selected={selectedMode.id === item.id}
              onPress={() => {
                setSelectedMode(item);
                Haptics.selectionAsync();
              }}
            />
          )}
        />
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {messages.length === 0 ? (
          <View style={s.emptyState}>
            <View style={[s.emptyIcon, { borderColor: selectedMode.color }]}>
              <Text style={[s.emptyEmoji, { color: selectedMode.color }]}>AI</Text>
            </View>
            <Text style={[s.emptyTitle, { color: isDark ? "#f5f3ee" : "#13121f" }]}>
              {selectedMode.label} rejimi
            </Text>
            <Text style={[s.emptyHint, { color: isDark ? "#8e8fa5" : "#737373" }]}>
              Savol yozing yoki so'rang...
            </Text>
          </View>
        ) : (
          <FlatList
            data={reversed}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble msg={item} primaryColor={selectedMode.color} />
            )}
            inverted={messages.length > 0}
            ListHeaderComponent={
              showTyping ? (
                <View style={{ paddingHorizontal: 24, paddingBottom: 4 }}>
                  <TypingDots color={selectedMode.color} />
                </View>
              ) : null
            }
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 8 }}
            showsVerticalScrollIndicator={false}
          />
        )}

        {/* Input bar */}
        <View
          style={[
            s.inputBar,
            {
              paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 8,
              backgroundColor: isDark ? "#09090f" : "#f5f2ec",
              borderTopColor: isDark ? "#1f2035" : "#e0ddd8",
            },
          ]}
        >
          <View
            style={[
              s.inputWrap,
              {
                backgroundColor: isDark ? "#181825" : "#ffffff",
                borderColor: isDark ? "#1f2035" : "#e0ddd8",
              },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[s.input, { color: isDark ? "#f5f3ee" : "#13121f" }]}
              value={input}
              onChangeText={setInput}
              placeholder="Yozing..."
              placeholderTextColor={isDark ? "#8e8fa5" : "#737373"}
              multiline
              maxLength={4000}
              blurOnSubmit={false}
              onSubmitEditing={handleSend}
            />
            <Pressable
              onPress={handleSend}
              disabled={!input.trim() || isStreaming}
              style={[
                s.sendBtn,
                { backgroundColor: selectedMode.color },
                (!input.trim() || isStreaming) && s.sendBtnDisabled,
              ]}
            >
              {isStreaming ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="arrow-up" size={18} color={isDark ? "#09090f" : "#fff"} />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  modeDot: { width: 8, height: 8, borderRadius: 4 },
  headerTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold" },
  newChatBtn: { padding: 4 },
  modeBar: { borderBottomWidth: StyleSheet.hairlineWidth },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 40 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 1.5, alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  emptyEmoji: { fontSize: 20, fontWeight: "800", fontFamily: "Inter_700Bold" },
  emptyTitle: { fontSize: 18, fontWeight: "700", fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyHint: { fontSize: 14, textAlign: "center", marginTop: 6, fontFamily: "Inter_400Regular" },
  inputBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, paddingHorizontal: 14 },
  inputWrap: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    borderRadius: 24, borderWidth: 1, paddingLeft: 16, paddingRight: 8, paddingVertical: 8,
  },
  input: { flex: 1, fontSize: 15, maxHeight: 120, fontFamily: "Inter_400Regular", paddingTop: 2 },
  sendBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    alignSelf: "flex-end",
  },
  sendBtnDisabled: { opacity: 0.4 },
});
