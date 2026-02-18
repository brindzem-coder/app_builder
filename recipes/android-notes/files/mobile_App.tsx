import React, { useEffect, useState } from "react";
import { SafeAreaView, View, Text, TextInput, Pressable, FlatList } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Note = { id: string; title: string; body: string; createdAt: number };
const KEY = "notes_v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) setNotes(JSON.parse(raw));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(notes)).catch(() => {});
  }, [notes]);

  function add() {
    const t = title.trim();
    const b = body.trim();
    if (!t && !b) return;
    setNotes(prev => [{ id: uid(), title: t || "Untitled", body: b, createdAt: Date.now() }, ...prev]);
    setTitle("");
    setBody("");
  }

  function remove(id: string) {
    setNotes(prev => prev.filter(n => n.id !== id));
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0b0f" }}>
      <View style={{ padding: 12 }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>Notes</Text>
        <Text style={{ color: "#aaa" }}>{notes.length} notes</Text>
      </View>

      <View style={{ paddingHorizontal: 12, gap: 10 }}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Title…"
          placeholderTextColor="#777"
          style={{ color: "white", backgroundColor: "#14141b", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 }}
        />
        <TextInput
          value={body}
          onChangeText={setBody}
          placeholder="Note text…"
          placeholderTextColor="#777"
          multiline
          style={{ color: "white", backgroundColor: "#14141b", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, minHeight: 90 }}
        />
        <Pressable onPress={add} style={{ paddingVertical: 10, borderRadius: 12, backgroundColor: "#2b6fff", alignItems: "center" }}>
          <Text style={{ color: "white", fontWeight: "700" }}>Add note</Text>
        </Pressable>
      </View>

      <FlatList
        data={notes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 12, paddingTop: 12 }}
        renderItem={({ item }) => (
          <View style={{ backgroundColor: "#1a1a22", borderRadius: 14, padding: 12, marginVertical: 6 }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{item.title}</Text>
            {item.body ? <Text style={{ color: "#ddd", marginTop: 6 }}>{item.body}</Text> : null}
            <Pressable onPress={() => remove(item.id)} style={{ marginTop: 10, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "#2a2a35" }}>
              <Text style={{ color: "white" }}>Delete</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
