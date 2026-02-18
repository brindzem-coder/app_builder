import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Role = "user" | "assistant";
type Message = { id: string; role: Role; content: string; createdAt: number };

const STORAGE_KEY = "chat_messages_v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Prefer env from .env, but keep a safe default for Android emulator:
  const apiUrl = useMemo(() => process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:8787", []);

  const listRef = useRef<FlatList<Message>>(null);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(messages)).catch(() => {});
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 60);
  }, [messages]);

  async function send() {
    const trimmed = text.trim();
    if (!trimmed || isTyping) return;

    const userMsg: Message = { id: uid(), role: "user", content: trimmed, createdAt: Date.now() };
    const next = [...messages, userMsg];

    setMessages(next);
    setText("");
    setIsTyping(true);

    try {
      const res = await fetch(`${apiUrl}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const botText = String(data?.text ?? "");
      const botMsg: Message = { id: uid(), role: "assistant", content: botText, createdAt: Date.now() };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e: any) {
      const botMsg: Message = {
        id: uid(),
        role: "assistant",
        content: `⚠️ Помилка: ${e?.message ?? "unknown"}`,
        createdAt: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  }

  function clearChat() {
    setMessages([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0b0f" }}>
      <View style={{ padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>AI Chat</Text>

        <Pressable
          onPress={clearChat}
          style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#222" }}
        >
          <Text style={{ color: "white" }}>Clear</Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <View
            style={{
              alignSelf: item.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "86%",
              marginVertical: 6,
              padding: 10,
              borderRadius: 14,
              backgroundColor: item.role === "user" ? "#2b6fff" : "#1a1a22",
            }}
          >
            <Text style={{ color: "white", fontSize: 15, lineHeight: 20 }}>{item.content}</Text>
          </View>
        )}
        ListFooterComponent={
          isTyping ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
              <ActivityIndicator />
              <Text style={{ color: "#bbb" }}>Assistant is typing…</Text>
            </View>
          ) : null
        }
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={{ flexDirection: "row", padding: 12, gap: 10, borderTopWidth: 1, borderTopColor: "#222" }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Write a message…"
            placeholderTextColor="#777"
            style={{
              flex: 1,
              color: "white",
              backgroundColor: "#14141b",
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              fontSize: 15,
            }}
            returnKeyType="send"
            onSubmitEditing={send}
          />

          <Pressable
            onPress={send}
            disabled={!text.trim() || isTyping}
            style={{
              paddingHorizontal: 14,
              justifyContent: "center",
              borderRadius: 12,
              backgroundColor: isTyping ? "#333" : "#2b6fff",
              opacity: text.trim() ? 1 : 0.6,
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
