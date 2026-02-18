import React, { useMemo, useState } from "react";
import { SafeAreaView, View, Text, Pressable, FlatList } from "react-native";

type Item = { id: string; title: string; subtitle: string; description: string };

export default function App() {
  const items = useMemo<Item[]>(
    () => [
      { id: "1", title: "Item One", subtitle: "Short subtitle", description: "Long description for item one." },
      { id: "2", title: "Item Two", subtitle: "Short subtitle", description: "Long description for item two." },
      { id: "3", title: "Item Three", subtitle: "Short subtitle", description: "Long description for item three." }
    ],
    []
  );

  const [selected, setSelected] = useState<Item | null>(null);

  if (selected) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0b0f", padding: 12 }}>
        <Pressable onPress={() => setSelected(null)} style={{ alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, backgroundColor: "#222" }}>
          <Text style={{ color: "white" }}>← Back</Text>
        </Pressable>

        <View style={{ marginTop: 14, backgroundColor: "#1a1a22", borderRadius: 16, padding: 14 }}>
          <Text style={{ color: "white", fontSize: 20, fontWeight: "800" }}>{selected.title}</Text>
          <Text style={{ color: "#aaa", marginTop: 6 }}>{selected.subtitle}</Text>
          <Text style={{ color: "#ddd", marginTop: 12, lineHeight: 20 }}>{selected.description}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0b0b0f" }}>
      <View style={{ padding: 12 }}>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "700" }}>Catalog</Text>
        <Text style={{ color: "#aaa" }}>{items.length} items</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 12 }}
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelected(item)} style={{ backgroundColor: "#1a1a22", borderRadius: 14, padding: 12, marginVertical: 6 }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>{item.title}</Text>
            <Text style={{ color: "#aaa", marginTop: 4 }}>{item.subtitle}</Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}
