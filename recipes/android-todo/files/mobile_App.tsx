import React, { useEffect, useMemo, useState } from "react";
import { SafeAreaView, View, Text, TextInput, Pressable, FlatList, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Todo = { id: string; text: string; done: boolean; createdAt: number };
const KEY = "todo_items_v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function App() {
  const [items, setItems] = useState<Todo[]>([]);
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const done = items.filter(i => i.done).length;
    return { total: items.length, done };
  }, [items]);

  useEffect(() => {
    (async () => {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(KEY, JSON.stringify(items)).catch(() => {});
  }, [items]);

  function add() {
    const t = text.trim();
    if (!t) return;
    setItems(prev => [{ id: uid(), text: t, done: false, createdAt: Date.now() }, ...prev]);
    setText("");
  }

  function toggle(id: string) {
    setItems(prev => prev.map(i => (i.id === id ? { ...i, done: !i.done } : i)));
  }

  function remove(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function clearAll() {
    Alert.alert("Clear all?", "Remove all todos?", [
      { text: "Cancel", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => setItems([]) },
    ]);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0b0f" }}>
      <View style={{ padding: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>To-Do</Text>
          <Text style={{ color: "#aaa" }}>Done {stats.done}/{stats.total}</Text>
        </View>
        <Pressable onPress={clearAll} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: "#222" }}>
          <Text style={{ color: "white" }}>Clear</Text>
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 10, padding: 12 }}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="New task…"
          placeholderTextColor="#777"
          style={{ flex: 1, color: "white", backgroundColor: "#14141b", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 }}
          returnKeyType="done"
          onSubmitEditing={add}
        />
        <Pressable onPress={add} style={{ paddingHorizontal: 14, justifyContent: "center", borderRadius: 12, backgroundColor: "#2b6fff" }}>
          <Text style={{ color: "white", fontWeight: "700" }}>Add</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#1a1a22", borderRadius: 14, padding: 12, marginVertical: 6 }}>
            <Pressable onPress={() => toggle(item.id)} style={{ flex: 1 }}>
              <Text style={{ color: "white", fontSize: 16, textDecorationLine: item.done ? "line-through" : "none", opacity: item.done ? 0.6 : 1 }}>
                {item.text}
              </Text>
            </Pressable>
            <Pressable onPress={() => remove(item.id)} style={{ paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: "#2a2a35" }}>
              <Text style={{ color: "white" }}>Del</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
