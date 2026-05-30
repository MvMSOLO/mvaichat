import React, { useState, useRef, useCallback, useEffect } from "react";
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
import {
  apiFetch,
  getBaseUrl,
  createConversation,
  saveMessage,
  generateTitle,
  updateConversationTitle,
  getMessages,
} from "@/lib/api";
import type { Conversation, ConversationMessage } from "@/lib/api";

const AI_MODES = [
  { id: "humanoid", label: "Humanoid", icon: "person-outline" as const, color: "#f2470e" },
  { id: "ideal",    label: "Ideal",    icon: "sparkles" as const,         color: "#a855f7" },
  { id: "code",     label: "Code",     icon: "code-slash-outline" as const, color: "#22c55e" },
  { id: "vision",   label: "Vision",   icon: "eye-outline" as const,      color: "#ec4899" },
  { id: "search",   label: "Search",   icon: "search-outline" as const,   color: "#eab308" },
  { id: "agents",   label: "Agents",   icon: "flash-outline" as const,    color: "#0dcff0" },
] as const;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  mode?: string;
}

let msgCounter = 0;
function uid() {
  msgCounter++;
  return `m${Date.now()}-${msgCounter}`;
}

// --- Sub-components ---

function TypingDots({ color }: { color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 8, paddingHorizontal: 4 }}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[dot.dot, { backgroundColor: color, opacity: 0.4 + i * 0.2 }]} />
      ))}
    </View>
  );
}
const dot = StyleSheet.create({ dot: { width: 8, height: 8, borderRadius: 4 } });

function ModeChip({ mode, selected, onPress }: { mode: typeof AI_MODES[number]; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[chip.base, selected && { backgroundColor: mode.color + "22", borderColor: mode.color }]}
    >
      <Ionicons name={mode.icon as any} size={14} color={selected ? mode.color : "#8e8fa5"} />
      <Text style={[chip.label, selected && { color: mode.color }]}>{mode.label}</Text>
    </Pressable>
  );
}
const chip = StyleSheet.create({
  base: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: "#1f2035", backgroundColor: "#10101c", marginRight: 8,
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
    alignItems: "center", justifyContent: "center", marginBottom: 2,
  },
  avatarText: { fontSize: 10, fontWeight: "700", fontFamily: "Inter_700Bold" },
  bubble: { maxWidth: "78%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleUser: { borderBottomRightRadius: 4 },
  bubbleAI: { backgroundColor: "#10101c", borderBottomLeftRadius: 4 },
  text: { color: "#f5f3ee", fontSize: 15, lineHeight: 22, fontFamily: "Inter_400Regular" },
});

// --- Main screen ---

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
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [convTitle, setConvTitle] = useState<string>("MV AI");
  const inputRef = useRef<TextInput>(null);

  const bg = isDark ? "#09090f" : "#f5f2ec";
  const borderColor = isDark ? "#1f2035" : "#e0ddd8";
  const fgStrong = isDark ? "#f5f3ee" : "#13121f";
  const fgMuted = isDark ? "#8e8fa5" : "#737373";

  // Stream from /api/chat (mirrors web useChatStream)
  const streamChat = useCallback(async (
    convId: string,
    chatHistory: Array<{ role: string; content: string }>,
    onChunk: (chunk: string) => void
  ) => {
    const token = getToken ? await getToken() : null;
    const baseUrl = getBaseUrl();

    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        messages: chatHistory,
        modelId: "auto",
        settings: {
          mode: selectedMode.id,
          conversationId: convId,
        },
      }),
    });

    if (response.status === 429) throw new Error("rate_limit");
    if (!response.ok || !response.body) throw new Error("stream_error");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    let buf = "";
    let pendingEvent: string | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });

      let nlIdx: number;
      while ((nlIdx = buf.indexOf("\n")) !== -1) {
        let line = buf.slice(0, nlIdx);
        buf = buf.slice(nlIdx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (line.startsWith(":")) continue;
        if (!line.trim()) { pendingEvent = null; continue; }
        if (line.startsWith("event: ")) { pendingEvent = line.slice(7).trim(); continue; }
        if (!line.startsWith("data: ")) continue;
        const json = line.slice(6).trim();
        if (json === "[DONE]") return full;
        if (pendingEvent && pendingEvent !== "message") { pendingEvent = null; continue; }
        try {
          const parsed = JSON.parse(json);
          const chunk = parsed.choices?.[0]?.delta?.content ?? parsed.content ?? parsed.delta?.content ?? "";
          if (chunk) { full += chunk; onChunk(chunk); }
        } catch {}
      }
    }
    return full;
  }, [getToken, selectedMode.id]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic user bubble
    const userMsgId = uid();
    setMessages((prev) => [...prev, { id: userMsgId, role: "user", content: text, mode: selectedMode.id }]);
    setIsStreaming(true);
    setShowTyping(true);

    try {
      // 1. Lazy conversation creation (mirrors web handleSend)
      let convId = conversationId;
      if (!convId) {
        const conv = await createConversation("Yangi suhbat");
        if (conv) {
          convId = conv.id;
          setConversationId(convId);
          setConvTitle("Yangi suhbat");
        }
      }

      // 2. Persist user message
      if (convId) {
        await saveMessage(convId, "user", text);
      }

      // 3. Build history for streaming
      const historyForStream = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content: text },
      ];

      // 4. Stream AI response
      let assistantMsgId = uid();
      let streamedContent = "";
      let bubbleAdded = false;

      const assistantContent = await streamChat(
        convId ?? "",
        historyForStream,
        (chunk) => {
          streamedContent += chunk;
          if (!bubbleAdded) {
            setShowTyping(false);
            setMessages((prev) => [
              ...prev,
              { id: assistantMsgId, role: "assistant", content: streamedContent, mode: selectedMode.id },
            ]);
            bubbleAdded = true;
          } else {
            setMessages((prev) => {
              const updated = [...prev];
              const idx = updated.findIndex((m) => m.id === assistantMsgId);
              if (idx !== -1) updated[idx] = { ...updated[idx], content: streamedContent };
              return updated;
            });
          }
        }
      );

      const finalContent = assistantContent || streamedContent || "Javob olishda xatolik.";
      if (!bubbleAdded) {
        setShowTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: assistantMsgId, role: "assistant", content: finalContent, mode: selectedMode.id },
        ]);
      }

      // 5. Persist assistant message
      if (convId) {
        await saveMessage(convId, "assistant", finalContent);
      }

      // 6. Generate title for new conversations (mirrors web generateTitle)
      if (convId && messages.length === 0) {
        const title = await generateTitle([
          { role: "user", content: text },
          { role: "assistant", content: finalContent },
        ]);
        if (title) {
          await updateConversationTitle(convId, title);
          setConvTitle(title);
        }
      }
    } catch (err: any) {
      setShowTyping(false);
      let errMsg = "Xatolik yuz berdi. Qayta urinib ko'ring.";
      if (err?.message === "rate_limit") errMsg = "Sekinroq yuboring. Biroz kuting.";
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: errMsg },
      ]);
    } finally {
      setIsStreaming(false);
      setShowTyping(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, isStreaming, messages, selectedMode, conversationId, streamChat]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setConvTitle("MV AI");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const reversed = [...messages].reverse();

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      {/* Header */}
      <View
        style={[
          s.header,
          {
            backgroundColor: bg,
            paddingTop: Platform.OS === "web" ? 67 : insets.top,
            borderBottomColor: borderColor,
          },
        ]}
      >
        <View style={s.headerLeft}>
          <View style={[s.modeDot, { backgroundColor: selectedMode.color }]} />
          <Text style={[s.headerTitle, { color: fgStrong }]} numberOfLines={1}>
            {convTitle}
          </Text>
        </View>
        <Pressable onPress={handleNewChat} style={s.newChatBtn}>
          <Feather name="plus-square" size={20} color={fgMuted} />
        </Pressable>
      </View>

      {/* Mode selector */}
      <View style={[s.modeBar, { borderBottomColor: borderColor }]}>
        <FlatList
          data={AI_MODES as any}
          horizontal
          keyExtractor={(m: any) => m.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}
          renderItem={({ item }: any) => (
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

      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        {/* Messages / Empty state */}
        {messages.length === 0 ? (
          <View style={s.emptyState}>
            <View style={[s.emptyIcon, { borderColor: selectedMode.color }]}>
              <Text style={[s.emptyEmoji, { color: selectedMode.color }]}>AI</Text>
            </View>
            <Text style={[s.emptyTitle, { color: fgStrong }]}>{selectedMode.label} rejimi</Text>
            <Text style={[s.emptyHint, { color: fgMuted }]}>Savol yozing yoki so'rang...</Text>
          </View>
        ) : (
          <FlatList
            data={reversed}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <MessageBubble msg={item} primaryColor={selectedMode.color} />
            )}
            inverted
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
              backgroundColor: bg,
              borderTopColor: borderColor,
            },
          ]}
        >
          <View
            style={[
              s.inputWrap,
              { backgroundColor: isDark ? "#181825" : "#ffffff", borderColor },
            ]}
          >
            <TextInput
              ref={inputRef}
              style={[s.input, { color: fgStrong }]}
              value={input}
              onChangeText={setInput}
              placeholder="Yozing..."
              placeholderTextColor={fgMuted}
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
                <Ionicons name="arrow-up" size={18} color="#09090f" />
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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1, marginRight: 8 },
  modeDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
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
    alignItems: "center", justifyContent: "center", alignSelf: "flex-end",
  },
  sendBtnDisabled: { opacity: 0.4 },
});
