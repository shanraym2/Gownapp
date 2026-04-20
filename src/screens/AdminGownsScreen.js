import { useCallback, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { deleteGownAdmin, getAllGownsAdmin, upsertGownAdmin } from "../services/gowns";
import { useShop } from "../context/ShopContext";
import { canAccess } from "../utils/access";
import { brand } from "../theme/brand";

const EMPTY_FORM = {
  id: "",
  name: "",
  price: "",
  promoPrice: "",
  promo: false,
  image: "",
  type: "Gowns",
  color: "",
  silhouette: "",
  description: "",
  stockQty: "0",
  lowStockThreshold: "0",
};

export function AdminGownsScreen() {
  const { user } = useShop();
  const allowed = canAccess(user, "admin_gowns");
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);

  const pickImageFromGallery = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow photo library access to pick an image.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;
    setForm((p) => ({ ...p, image: uri }));
  }, []);

  const takePhotoForImage = useCallback(async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Please allow camera access to take a photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
    });
    if (result.canceled) return;
    const uri = result.assets?.[0]?.uri;
    if (!uri) return;
    setForm((p) => ({ ...p, image: uri }));
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getAllGownsAdmin();
    setItems(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (allowed) loadData();
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

  if (!allowed) {
    return (
      <View style={styles.deniedWrap}>
        <Text style={styles.deniedTitle}>Access denied</Text>
        <Text style={styles.deniedText}>You don’t have permission to manage gowns.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Gowns</Text>
      <Text style={styles.subtitle}>Add or edit gowns/suits/dresses.</Text>

      <View style={styles.formCard}>
        <TextInput style={styles.input} placeholder="ID (optional for edit)" value={String(form.id)} onChangeText={(v) => setForm((p) => ({ ...p, id: v.replace(/\D/g, "") }))} keyboardType="number-pad" />
        <TextInput style={styles.input} placeholder="Name" value={form.name} onChangeText={(v) => setForm((p) => ({ ...p, name: v }))} />
        <TextInput style={styles.input} placeholder="Price (e.g. P85,000)" value={form.price} onChangeText={(v) => setForm((p) => ({ ...p, price: v }))} />
        <View style={styles.promoRow}>
          <View style={styles.promoLeft}>
            <Text style={styles.promoLabel}>Discount / Promo</Text>
            <Text style={styles.promoHint}>Turn on to show discounted price + appear in promo banner.</Text>
          </View>
          <Switch
            value={Boolean(form.promo)}
            onValueChange={(v) => setForm((p) => ({ ...p, promo: Boolean(v) }))}
            thumbColor={brand.white}
            trackColor={{ false: brand.border, true: brand.buttonAlt }}
          />
        </View>
        <TextInput
          style={[styles.input, !form.promo ? styles.inputDisabled : null]}
          placeholder="Discounted price (e.g. P64,000)"
          value={form.promoPrice}
          editable={Boolean(form.promo)}
          onChangeText={(v) => setForm((p) => ({ ...p, promoPrice: v }))}
        />
        <TextInput style={styles.input} placeholder="Type (Gowns, Dresses, Suit)" value={form.type} onChangeText={(v) => setForm((p) => ({ ...p, type: v }))} />
        <TextInput style={styles.input} placeholder="Color" value={form.color} onChangeText={(v) => setForm((p) => ({ ...p, color: v }))} />
        <TextInput style={styles.input} placeholder="Silhouette" value={form.silhouette} onChangeText={(v) => setForm((p) => ({ ...p, silhouette: v }))} />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Stock qty (e.g. 5)"
            value={String(form.stockQty)}
            onChangeText={(v) => setForm((p) => ({ ...p, stockQty: v.replace(/[^\d]/g, "") }))}
            keyboardType="number-pad"
          />
          <TextInput
            style={[styles.input, styles.inputHalf]}
            placeholder="Low-stock alert at (e.g. 2)"
            value={String(form.lowStockThreshold)}
            onChangeText={(v) => setForm((p) => ({ ...p, lowStockThreshold: v.replace(/[^\d]/g, "") }))}
            keyboardType="number-pad"
          />
        </View>
        <TextInput style={styles.input} placeholder="Image URL" value={form.image} onChangeText={(v) => setForm((p) => ({ ...p, image: v }))} autoCapitalize="none" />
        <View style={styles.imagePickerRow}>
          <Pressable style={styles.secondaryBtn} onPress={pickImageFromGallery}>
            <Text style={styles.secondaryBtnText}>Pick from Gallery</Text>
          </Pressable>
          <Pressable style={styles.secondaryBtn} onPress={takePhotoForImage}>
            <Text style={styles.secondaryBtnText}>Take Photo</Text>
          </Pressable>
        </View>
        {String(form.image || "").trim() ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: String(form.image).trim() }} style={styles.previewImage} />
            <Pressable style={styles.clearImageBtn} onPress={() => setForm((p) => ({ ...p, image: "" }))}>
              <Text style={styles.clearImageText}>Remove image</Text>
            </Pressable>
          </View>
        ) : null}
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
              <Text style={styles.itemMeta}>
                #{g.id} • {g.type} • {g.promo && g.promoPrice ? `${g.price} → ${g.promoPrice}` : g.price}
              </Text>
              <Text style={Number(g.stockQty) <= 0 ? styles.stockOut : Number(g.stockQty) <= Number(g.lowStockThreshold || 0) ? styles.stockLow : styles.stockOk}>
                Stock: {Number(g.stockQty) || 0}
                {Number(g.stockQty) <= 0 ? " (out)" : Number(g.stockQty) <= Number(g.lowStockThreshold || 0) ? " (low)" : ""}
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <Pressable style={styles.secondaryBtn} onPress={() => setForm({
              id: String(g.id),
              name: g.name || "",
              price: g.price || "",
              promoPrice: g.promoPrice || "",
              promo: Boolean(g.promo),
              image: g.image || "",
              type: g.type || "Gowns",
              color: g.color || "",
              silhouette: g.silhouette || "",
              description: g.description || "",
              stockQty: String(Number(g.stockQty) || 0),
              lowStockThreshold: String(Number(g.lowStockThreshold) || 0),
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
  inputHalf: { flex: 1 },
  inputDisabled: { opacity: 0.5 },
  inputArea: { minHeight: 70, textAlignVertical: "top" },
  promoRow: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 8, paddingVertical: 4 },
  promoLeft: { flex: 1 },
  promoLabel: { color: brand.dark, fontWeight: "900" },
  promoHint: { color: brand.textLight, fontSize: 12, marginTop: 2 },
  imagePickerRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
  previewWrap: { borderWidth: 1, borderColor: brand.border, borderRadius: 10, overflow: "hidden", backgroundColor: brand.white, marginBottom: 8 },
  previewImage: { width: "100%", height: 180, backgroundColor: "#eee" },
  clearImageBtn: { paddingVertical: 10, paddingHorizontal: 12, borderTopWidth: 1, borderTopColor: brand.border, backgroundColor: brand.white },
  clearImageText: { color: brand.textLight, fontWeight: "800", textAlign: "center", fontSize: 12 },
  primaryBtn: { backgroundColor: brand.button, paddingVertical: 12, borderRadius: 8, marginTop: 2 },
  primaryBtnText: { color: brand.white, textAlign: "center", fontWeight: "800" },
  sectionTitle: { color: brand.dark, fontWeight: "800", marginBottom: 8 },
  itemCard: { borderWidth: 1, borderColor: brand.border, borderRadius: 10, backgroundColor: brand.white, padding: 10, marginBottom: 8 },
  itemHeader: { flexDirection: "row", gap: 10, alignItems: "center", marginBottom: 8 },
  itemImage: { width: 56, height: 56, borderRadius: 8, borderWidth: 1, borderColor: brand.border, backgroundColor: "#eee" },
  itemHeaderText: { flex: 1, minWidth: 0 },
  itemTitle: { color: brand.dark, fontWeight: "800", fontSize: 14 },
  itemMeta: { color: brand.textLight, marginTop: 2, fontSize: 12 },
  stockOk: { marginTop: 4, fontSize: 12, fontWeight: "800", color: brand.text },
  stockLow: { marginTop: 4, fontSize: 12, fontWeight: "900", color: "#a36a00" },
  stockOut: { marginTop: 4, fontSize: 12, fontWeight: "900", color: "#b00020" },
  row: { flexDirection: "row", gap: 8 },
  secondaryBtn: { flex: 1, borderWidth: 1, borderColor: brand.border, paddingVertical: 9, backgroundColor: brand.white, borderRadius: 8 },
  secondaryBtnText: { textAlign: "center", color: brand.dark, fontWeight: "700" },
  dangerBtn: { flex: 1, paddingVertical: 9, backgroundColor: "#a82949", borderRadius: 8 },
  dangerBtnText: { textAlign: "center", color: brand.white, fontWeight: "700" },

  deniedWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: brand.bg },
  deniedTitle: { fontSize: 18, fontWeight: "900", color: brand.dark },
  deniedText: { marginTop: 6, color: brand.textLight, textAlign: "center" },
});
