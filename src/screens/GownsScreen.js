import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useShop } from "../context/ShopContext";
import { brand } from "../theme/brand";

export function GownsScreen({ navigation, route }) {
  const { gowns, loading, favoritesSet, toggleFavorite } = useShop();
  const [type, setType] = useState("");

  const promoMode = route?.params?.promo === true;

  const types = useMemo(
    () => [...new Set(gowns.map((g) => g.type).filter(Boolean))].sort(),
    [gowns]
  );
  const filtered = useMemo(() => {
    let base = gowns;
    if (promoMode) {
      base = gowns.filter((g) => g.promo);
    }
    return type ? base.filter((g) => g.type === type) : base;
  }, [gowns, type, promoMode]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Bridal Gowns & Dresses</Text>
      {promoMode && (
        <Text style={styles.promoLabel}>Showing all gowns and suits on promo.</Text>
      )}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
        <Pressable style={[styles.chip, !type && styles.chipActive]} onPress={() => setType("")}>
          <Text style={[styles.chipText, !type && styles.chipTextActive]}>All</Text>
        </Pressable>
        {types.map((t) => (
          <Pressable key={t} style={[styles.chip, type === t && styles.chipActive]} onPress={() => setType(t)}>
            <Text style={[styles.chipText, type === t && styles.chipTextActive]}>{t}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {loading ? (
        <Text style={styles.loading}>Loading gowns...</Text>
      ) : (
        filtered.map((item) => (
          <View style={styles.card} key={item.id}>
            <Pressable style={styles.favBtn} onPress={() => toggleFavorite(item.id)}>
              <Ionicons
                name={favoritesSet?.has(Number(item.id)) ? "heart" : "heart-outline"}
                size={18}
                color={favoritesSet?.has(Number(item.id)) ? brand.buttonAlt : brand.textLight}
              />
            </Pressable>
            <Image source={{ uri: item.image }} style={styles.cardImage} />
            <Text style={styles.cardTitle}>{item.name}</Text>
            <Text style={styles.cardMeta}>{item.type} • {item.color}</Text>
            {promoMode && item.promo && item.promoPrice ? (
              <View style={styles.priceRow}>
                <Text style={styles.oldPrice}>{item.price}</Text>
                <Text style={styles.promoPrice}>{item.promoPrice}</Text>
              </View>
            ) : (
              <Text style={styles.cardPrice}>{item.price}</Text>
            )}
            <Pressable style={styles.btn} onPress={() => navigation.navigate("GownDetail", { id: item.id })}>
            <Text style={styles.btnText}>View Gown Details</Text>
            </Pressable>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg },
  content: { padding: 16, paddingBottom: 34 },
  title: { fontSize: 32, fontStyle: "italic", fontWeight: "700", marginBottom: 12, color: brand.dark },
  promoLabel: { color: brand.textLight, fontSize: 12, marginBottom: 10 },
  filters: { marginBottom: 14 },
  chip: { paddingVertical: 9, paddingHorizontal: 14, borderWidth: 1, borderColor: brand.border, marginRight: 8, backgroundColor: brand.white, borderRadius: 999 },
  chipActive: { backgroundColor: brand.buttonAlt, borderColor: brand.buttonAlt },
  chipText: { color: brand.text, fontWeight: "600", fontSize: 12, letterSpacing: 0.6 },
  chipTextActive: { color: brand.white },
  loading: { color: brand.textLight, textAlign: "center", marginTop: 30 },
  card: { marginBottom: 18, backgroundColor: brand.white, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: brand.border, position: "relative" },
  cardImage: { width: "100%", height: 320, marginBottom: 10, borderRadius: 10 },
  cardTitle: { fontSize: 18, fontWeight: "600", color: brand.dark, textAlign: "center" },
  cardMeta: { marginTop: 4, color: brand.textLight, textAlign: "center", fontSize: 12 },
  cardPrice: { marginTop: 6, color: brand.text, textAlign: "center", fontSize: 12, fontWeight: "700", letterSpacing: 0.8 },
  priceRow: { marginTop: 6, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  oldPrice: { color: brand.textLight, fontSize: 12, textDecorationLine: "line-through", fontWeight: "700" },
  promoPrice: { color: brand.buttonAlt, fontSize: 13, fontWeight: "900", letterSpacing: 0.8 },
  btn: { marginTop: 10, backgroundColor: brand.button, paddingVertical: 11, borderRadius: 8 },
  btnText: { color: brand.white, textAlign: "center", fontWeight: "700", letterSpacing: 1.1, fontSize: 11 },
  favBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 999,
    backgroundColor: brand.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: brand.border,
    zIndex: 2,
  },
});
