import { useCallback, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { deleteGownAdmin, getAllGownsAdmin, upsertGownAdmin } from "../services/gowns";
import { brand } from "../theme/brand";

const EMPTY_FORM = {
  id: "",
  name: "",
  price: "",
  promoPrice: "",
  image: "",
  type: "Gowns",
  color: "",
  silhouette: "",
  description: "",
};

export function AdminGownsScreen() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getAllGownsAdmin();
    setItems(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onSave = async () => {
    if (!String(form.name || "").trim()) {
      Alert.alert("Missing name", "Please enter a gown name.");
      return;
    }
    const result = await upsertGownAdmin(form);
    if (!result.ok) {
      Alert.alert("Save failed", "Could not save gown.");
      return;
    }
    setForm(EMPTY_FORM);
    loadData();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Gowns</Text>
      <Text style={styles.subtitle}>Add or edit gowns/suits/dresses.</Text>

      <View style={styles.formCard}>
        <TextInput style={styles.input} placeholder="ID (optional for edit)" value={String(form.id)} onChangeText={(v) => setForm((p) => ({ ...p, id: v.replace(/\D/g, "") }))} keyboardType="number-pad" />
        <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
        <TextInput style={styles.input} placeholder="Price (e.g. P85,000)" value={form.price} onChangeText={(v) => setForm((p) => ({ ...p, price: v }))} />
        <TextInput style={styles.input} placeholder="Promo price" value={form.promoPrice} onChangeText={(v) => setForm((p) => ({ ...p, promoPrice: v }))} />
        <TextInput style={styles.input} placeholder="Type (Gowns, Dresses, Suit)" value={form.type} onChangeText={(v) => setForm((p) => ({ ...p, type: v }))} />
        <TextInput style={styles.input} placeholder="Color" value={form.color} onChangeText={(v) => setForm((p) => ({ ...p, color: v }))} />
        <TextInput style={styles.input} placeholder="Silhouette" value={form.silhouette} onChangeText={(v) => setForm((p) => ({ ...p, silhouette: v }))} />
        <TextInput style={styles.input} placeholder="Image URL" value={form.image} onChangeText={(v) => setForm((p) => ({ ...p, image: v }))} autoCapitalize="none" />
        <TextInput style={[styles.input, styles.inputArea]} placeholder="Description" value={form.description} onChangeText={(v) => setForm((p) => ({ ...p, description: v }))} multiline />
        <Pressable style={styles.primaryBtn} onPress={onSave}>
          <Text style={styles.primaryBtnText}>Save Gown</Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Current Catalog</Text>
      {loading ? <Text style={styles.subtitle}>Loading gowns...</Text> : null}
      {items.map((g) => (
        <View key={g.id} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <Image source={{ uri: g.image }} style={styles.itemImage} />
            <View style={styles.itemHeaderText}>
              <Text style={styles.itemTitle}>{g.name}</Text>
              <Text style={styles.itemMeta}>#{g.id} • {g.type} • {g.price}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={() => setForm({
              id: String(g.id),
              name: g.name || "",
              price: g.price || "",
              promoPrice: g.promoPrice || "",
              image: g.image || "",
              type: g.type || "Gowns",
              color: g.color || "",
              silhouette: g.silhouette || "",
              description: g.description || "",
            })}>
              <Text style={styles.secondaryBtnText}>Edit</Text>
            </Pressable>
            <Pressable
              style={styles.dangerBtn}
              onPress={() =>
                Alert.alert("Delete gown", `Delete ${g.name}?`, [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                      await deleteGownAdmin(g.id);
                      loadData();
                    },
                  },
                ])
              }
            >
              <Text style={styles.dangerBtnText}>Delete</Text>
            </Pressable>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 34, fontWeight: "800", color: brand.dark, fontStyle: "italic" },
  subtitle: { color: brand.textLight, marginTop: 4, marginBottom: 12 },
  formCard: { borderWidth: 1, borderColor: brand.border, backgroundColor: brand.white, borderRadius: 12, padding: 10, marginBottom: 14 },
  input: { borderWidth: 1, borderColor: brand.border, backgroundColor: brand.white, padding: 10, marginBottom: 8 },
  inputArea: { minHeight: 70, textAlignVertical: "top" },
  primaryBtn: { backgroundColor: brand.button, paddingVertical: 12, borderRadius: 8, marginTop: 2 },
  primaryBtnText: { color: brand.white, textAlign: "center", fontWeight: "800" },
  sectionTitle: { color: brand.dark, fontWeight: "800", marginBottom: 8 },
  itemCard: { borderWidth: 1, borderColor: brand.border, borderRadius: 10, backgroundColor: brand.white, padding: 10, marginBottom: 8 },
  itemHeader: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 8 },
  itemImage: { width: 56, height: 56, borderRadius: 8, borderWidth: 1, borderColor: brand.border, backgroundColor: "#eee" },
  itemHeaderText: { flex: 1, minWidth: 0 },
  itemTitle: { color: brand.dark, fontWeight: "800", fontSize: 14 },
  itemMeta: { color: brand.textLight, marginTop: 2, fontSize: 12 },
  row: { flexDirection: "row", gap: 8 },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: brand.border, paddingVertical: 9, backgroundColor: brand.white, borderRadius: 8 },
  secondaryBtnText: { textAlign: "center", color: brand.dark, fontWeight: "700" },
  dangerBtn: { flex: 1, paddingVertical: 9, backgroundColor: "#a82949", borderRadius: 8 },
  dangerBtnText: { textAlign: "center", color: brand.white, fontWeight: "700" },
});
