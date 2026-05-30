import { useAuth } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { fetch } from "expo/fetch";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { getApiBase, ChatMsg, Conversation, ModelId, MODEL_LIST } from "@/lib/api";

let msgCounter = 0;
function uid() {
  msgCounter++;
  return `msg-${Date.now()}-${msgCounter}-${Math.random().toString(36).substr(2, 6)}`;
}

interface Message extends ChatMsg {
  id: string;
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { getToken } = useAuth();
  const router = useRouter();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [modelId, setModelId] = useState<ModelId>("humanoid");
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showModels, setShowModels] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const abortRef = useRef<AbortController | null>(null);

  const authHeaders = useCallback(async (): Promise<Record<string, string>> => {
    const token = await getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [getToken]);

  const loadConversations = useCallback(async () => {
    const headers = await authHeaders();
    const r = await fetch(`${getApiBase()}/conversations`, { headers });
    if (r.ok) {
      const data: Conversation[] = await r.json();
      data.sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
      setConversations(data);
    }
  }, [authHeaders]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    (async () => {
      const headers = await authHeaders();
      const r = await fetch(`${getApiBase()}/conversations/${activeId}/messages`, { headers });
      if (r.ok) {
        const data = await r.json();
        setMessages(data.map((m: any) => ({ id: uid(), role: m.role, content: m.content })));
      }
    })();
  }, [activeId, authHeaders]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    inputRef.current?.focus();

    const currentMessages = [...messages];
    const userMsg: Message = { id: uid(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setStreaming(true);
    setShowTyping(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const headers = await authHeaders();
      const chatHistory = [
        ...currentMessages.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: text },
      ];

      const resp = await fetch(`${getApiBase()}/chat`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ messages: chatHistory, modelId }),
        signal: ctrl.signal,
      });

      if (!resp.ok || !resp.body) {
        setShowTyping(false);
        setMessages(prev => [...prev, { id: uid(), role: "assistant", content: "Sorry, something went wrong." }]);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let fullContent = "";
      let assistantAdded = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("event: ")) continue;
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              if (!assistantAdded) {
                setShowTyping(false);
                setMessages(prev => [...prev, { id: uid(), role: "assistant", content: fullContent }]);
                assistantAdded = true;
              } else {
                setMessages(prev => {
                  const updated = [...prev];
                  updated[updated.length - 1] = { ...updated[updated.length - 1], content: fullContent };
                  return updated;
                });
              }
            }
          } catch {}
        }
      }

      // Save conversation after stream
      (async () => {
        try {
          const hdrs = await authHeaders();
          if (!activeId) {
            // Create conversation
            const cr = await fetch(`${getApiBase()}/conversations`, {
              method: "POST",
              headers: { ...hdrs, "Content-Type": "application/json" },
              body: JSON.stringify({ title: text.slice(0, 50), modelId }),
            });
            if (cr.ok) {
              const conv = await cr.json();
              setActiveId(conv.id);
              // Save all messages
              const allMsgs = [...chatHistory, { role: "assistant", content: fullContent }];
              for (const m of allMsgs) {
                await fetch(`${getApiBase()}/conversations/${conv.id}/messages`, {
                  method: "POST",
                  headers: { ...hdrs, "Content-Type": "application/json" },
                  body: JSON.stringify(m),
                });
              }
              loadConversations();
            }
          } else {
            await fetch(`${getApiBase()}/conversations/${activeId}/messages`, {
              method: "POST",
              headers: { ...hdrs, "Content-Type": "application/json" },
              body: JSON.stringify({ role: "user", content: text }),
            });
            await fetch(`${getApiBase()}/conversations/${activeId}/messages`, {
              method: "POST",
              headers: { ...hdrs, "Content-Type": "application/json" },
              body: JSON.stringify({ role: "assistant", content: fullContent }),
            });
          }
        } catch {}
      })();
    } catch (e: any) {
      if (e?.name !== "AbortError") {
        setShowTyping(false);
        setMessages(prev => [...prev, { id: uid(), role: "assistant", content: "Connection error. Please try again." }]);
      }
    } finally {
      setStreaming(false);
      setShowTyping(false);
      abortRef.current = null;
    }
  };

  const handleStop = () => { abortRef.current?.abort(); };

  const handleNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setShowSidebar(false);
    inputRef.current?.focus();
  };

  const handleDeleteConversation = async (id: string) => {
    const headers = await authHeaders();
    await fetch(`${getApiBase()}/conversations/${id}`, { method: "DELETE", headers });
    if (activeId === id) handleNewChat();
    loadConversations();
  };

  const selectedModel = MODEL_LIST.find(m => m.id === modelId) || MODEL_LIST[0];
  const s = styles(colors, insets);
  const reversed = [...messages].reverse();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.headerBtn} onPress={() => setShowSidebar(!showSidebar)}>
          <Feather name="menu" size={22} color={colors.foreground} />
        </Pressable>
        <Pressable style={s.modelPill} onPress={() => setShowModels(!showModels)}>
          <Text style={s.modelEmoji}>{selectedModel.emoji}</Text>
          <Text style={s.modelName}>{selectedModel.name}</Text>
          <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
        </Pressable>
        <Pressable style={s.headerBtn} onPress={handleNewChat}>
          <Feather name="edit" size={20} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Model picker */}
      {showModels && (
        <View style={s.modelDropdown}>
          {MODEL_LIST.map(m => (
            <Pressable
              key={m.id}
              style={[s.modelOption, modelId === m.id && s.modelOptionActive]}
              onPress={() => { setModelId(m.id); setShowModels(false); }}
            >
              <Text style={s.modelOptionEmoji}>{m.emoji}</Text>
              <Text style={[s.modelOptionText, modelId === m.id && s.modelOptionTextActive]}>{m.name}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Sidebar overlay */}
      {showSidebar && (
        <Pressable style={s.overlay} onPress={() => setShowSidebar(false)}>
          <Pressable style={s.sidebar} onPress={() => {}}>
            <Text style={s.sidebarTitle}>Conversations</Text>
            {conversations.length === 0 ? (
              <Text style={s.emptyText}>No conversations yet</Text>
            ) : (
              <FlatList
                data={conversations}
                keyExtractor={c => c.id}
                renderItem={({ item }) => (
                  <View style={s.convRow}>
                    <Pressable
                      style={[s.convItem, activeId === item.id && s.convItemActive]}
                      onPress={() => { setActiveId(item.id); setShowSidebar(false); }}
                    >
                      {item.pinned && <Feather name="bookmark" size={12} color={colors.primary} style={{ marginRight: 4 }} />}
                      <Text style={[s.convTitle, activeId === item.id && s.convTitleActive]} numberOfLines={1}>
                        {item.title}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => handleDeleteConversation(item.id)} style={s.deleteBtn}>
                      <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      )}

      {/* Messages */}
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={0}>
        {messages.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyIcon}>🤖</Text>
            <Text style={s.emptyTitle}>MV AI</Text>
            <Text style={s.emptySubtitle}>Not a chatbot. A living AI cockpit.</Text>
          </View>
        ) : (
          <FlatList
            data={reversed}
            keyExtractor={item => item.id}
            inverted={messages.length > 0}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12 }}
            ListHeaderComponent={
              showTyping ? (
                <View style={[s.bubble, s.aiBubble, { flexDirection: "row", gap: 4, alignItems: "center" }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={s.aiBubbleText}>Thinking…</Text>
                </View>
              ) : null
            }
            renderItem={({ item }) => (
              <View style={item.role === "user" ? s.userRow : s.aiRow}>
                <View style={[s.bubble, item.role === "user" ? s.userBubble : s.aiBubble]}>
                  <Text style={item.role === "user" ? s.userBubbleText : s.aiBubbleText}>
                    {item.content}
                  </Text>
                </View>
              </View>
            )}
          />
        )}

        {/* Input bar */}
        <View style={[s.inputBar, { paddingBottom: insets.bottom + 8 }]}>
          <TextInput
            ref={inputRef}
            style={s.textInput}
            placeholder="Message MV AI…"
            placeholderTextColor={colors.mutedForeground}
            value={input}
            onChangeText={setInput}
            multiline
            blurOnSubmit={false}
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={[s.sendBtn, (!input.trim() && !streaming) && s.sendBtnDisabled]}
            onPress={streaming ? handleStop : handleSend}
            disabled={!streaming && !input.trim()}
          >
            <Feather
              name={streaming ? "square" : "send"}
              size={18}
              color={(!input.trim() && !streaming) ? colors.mutedForeground : colors.primaryForeground}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = (
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>,
  insets: ReturnType<typeof import("react-native-safe-area-context").useSafeAreaInsets>
) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: insets.top + 8,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    headerBtn: { padding: 6 },
    modelPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.card,
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modelEmoji: { fontSize: 16 },
    modelName: { fontSize: 14, fontWeight: "600" as const, color: colors.foreground },
    modelDropdown: {
      position: "absolute",
      top: insets.top + 56,
      left: 60,
      right: 60,
      backgroundColor: colors.card,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      zIndex: 100,
      overflow: "hidden",
    },
    modelOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    modelOptionActive: { backgroundColor: colors.primary + "22" },
    modelOptionEmoji: { fontSize: 16 },
    modelOptionText: { fontSize: 14, color: colors.foreground },
    modelOptionTextActive: { color: colors.primary, fontWeight: "600" as const },
    overlay: {
      position: "absolute",
      inset: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 50,
      flexDirection: "row",
    },
    sidebar: {
      width: "75%",
      backgroundColor: colors.background,
      paddingTop: insets.top + 20,
      paddingHorizontal: 16,
      paddingBottom: 20,
      borderRightWidth: 1,
      borderRightColor: colors.border,
    },
    sidebarTitle: {
      fontSize: 16,
      fontWeight: "700" as const,
      color: colors.foreground,
      marginBottom: 16,
    },
    convRow: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
    convItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: colors.radius,
    },
    convItemActive: { backgroundColor: colors.primary + "22" },
    convTitle: { fontSize: 14, color: colors.foreground, flex: 1 },
    convTitleActive: { color: colors.primary, fontWeight: "600" as const },
    deleteBtn: { padding: 8 },
    emptyText: { color: colors.mutedForeground, fontSize: 14, textAlign: "center", marginTop: 40 },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
    },
    emptyIcon: { fontSize: 48 },
    emptyTitle: { fontSize: 24, fontWeight: "700" as const, color: colors.foreground },
    emptySubtitle: { fontSize: 15, color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 32 },
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    textInput: {
      flex: 1,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      fontSize: 16,
      color: colors.foreground,
      maxHeight: 120,
    },
    sendBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: { backgroundColor: colors.muted },
    userRow: { alignItems: "flex-end", marginBottom: 8 },
    aiRow: { alignItems: "flex-start", marginBottom: 8 },
    bubble: {
      maxWidth: "85%",
      borderRadius: 18,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    userBubble: { backgroundColor: colors.userBubble, borderBottomRightRadius: 4 },
    aiBubble: { backgroundColor: colors.aiBubble, borderBottomLeftRadius: 4 },
    userBubbleText: { color: colors.userBubbleText, fontSize: 15 },
    aiBubbleText: { color: colors.aiBubbleText, fontSize: 15, lineHeight: 22 },
  });
