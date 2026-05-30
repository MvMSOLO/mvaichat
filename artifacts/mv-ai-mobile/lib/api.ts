/**
 * Lightweight fetch wrapper that mirrors the web app's pattern
 * but uses Bearer token (Clerk JWT) instead of cookies.
 * Cookies are not cross-domain in Expo/React Native, so we use Authorization header.
 */

let _tokenGetter: (() => Promise<string | null>) | null = null;

export function setTokenGetter(fn: () => Promise<string | null>) {
  _tokenGetter = fn;
}

export function getBaseUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : "";
}

export async function apiFetch(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = _tokenGetter ? await _tokenGetter() : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
  return fetch(`${getBaseUrl()}${path}`, { ...options, headers });
}

// --- Typed API helpers ---

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: string;
}

export async function getConversations(): Promise<Conversation[]> {
  const res = await apiFetch("/api/conversations");
  if (!res.ok) return [];
  const data = await res.json();
  return data.conversations ?? data ?? [];
}

export async function createConversation(title?: string): Promise<Conversation | null> {
  const res = await apiFetch("/api/conversations", {
    method: "POST",
    body: JSON.stringify({ title: title ?? "Yangi suhbat" }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function getMessages(conversationId: string): Promise<ConversationMessage[]> {
  const res = await apiFetch(`/api/conversations/${conversationId}/messages`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.messages ?? data ?? [];
}

export async function saveMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string
): Promise<ConversationMessage | null> {
  const res = await apiFetch(`/api/conversations/${conversationId}/messages`, {
    method: "POST",
    body: JSON.stringify({ role, content }),
  });
  if (!res.ok) return null;
  return res.json();
}

export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  await apiFetch(`/api/conversations/${conversationId}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function generateTitle(messages: Array<{ role: string; content: string }>): Promise<string | null> {
  try {
    const res = await apiFetch("/api/chat/title", {
      method: "POST",
      body: JSON.stringify({ messages }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.title ?? null;
  } catch {
    return null;
  }
}
