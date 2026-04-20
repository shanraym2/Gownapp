import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useShop } from "../context/ShopContext";
import { brand } from "../theme/brand";

export function GownDetailScreen({ route, navigation }) {
  const { id } = route.params || {};
  const { gowns, addToCart, favoritesSet, toggleFavorite } = useShop();

  const gown = useMemo(
    () => gowns.find((g) => Number(g.id) === Number(id)) || null,
    [gowns, id]
  );

  if (!gown) {
    return (
      <View style={styles.center}>
        <Text>We could not find this gown.</Text>
      </View>
    );
  }

  const liked = favoritesSet?.has(Number(gown.id));
  const stockQty = gown?.stockQty === undefined ? null : Number(gown.stockQty);
  const isOutOfStock = Number.isFinite(stockQty) && stockQty <= 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Image source={{ uri: gown.image }} style={styles.image} />
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Text style={styles.title}>{gown.name}</Text>
          <Pressable style={styles.favBtn} onPress={() => toggleFavorite(gown.id)}>
            <Ionicons name={liked ? "heart" : "heart-outline"} size={20} color={liked ? brand.buttonAlt : brand.textLight} />
          </Pressable>
        </View>
        {gown.promo && gown.promoPrice ? (
          <View style={styles.priceRow}>
            <Text style={styles.oldPrice}>{gown.price}</Text>
            <Text style={styles.promoPrice}>{gown.promoPrice}</Text>
          </View>
        ) : (
          <Text style={styles.price}>{gown.price}</Text>
        )}
        <Text style={styles.desc}>{gown.description}</Text>
        <Text style={styles.meta}>Type: {gown.type}</Text>
        <Text style={styles.meta}>Color: {gown.color}</Text>
        <Text style={styles.meta}>Silhouette: {gown.silhouette}</Text>
        {Number.isFinite(stockQty) ? (
          <Text style={isOutOfStock ? styles.stockOut : styles.stockOk}>
            {isOutOfStock ? "Out of stock" : `Only ${stockQty} left`}
          </Text>
        ) : null}
      </View>

      <Pressable
        style={[styles.btn, isOutOfStock ? styles.btnDisabled : null]}
        disabled={isOutOfStock}
        onPress={async () => {
          const result = await addToCart(gown.id);
          if (!result?.ok) {
            Alert.alert("Cannot add to cart", result?.reason || "Not available.");
            return;
          }
          navigation.navigate("Cart");
        }}
      >
        <Text style={styles.btnText}>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg },
  content: { padding: 16, gap: 10, paddingBottom: 28 },
  image: { width: "100%", height: 420, marginBottom: 2, borderRadius: 14 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  infoCard: { backgroundColor: brand.white, borderRadius: 14, borderWidth: 1, borderColor: brand.border, padding: 14 },
  infoHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 4 },
  title: { fontSize: 32, fontWeight: "700", color: brand.dark, fontStyle: "italic" },
  favBtn: { width: 40, height: 40, borderRadius: 999, backgroundColor: brand.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: brand.border },
  price: { fontSize: 13, color: brand.textLight, fontWeight: "600", marginBottom: 10, letterSpacing: 1.2, textTransform: "uppercase" },
  priceRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  oldPrice: { fontSize: 13, color: brand.textLight, fontWeight: "700", letterSpacing: 1.2, textDecorationLine: "line-through" },
  promoPrice: { fontSize: 14, color: brand.buttonAlt, fontWeight: "900", letterSpacing: 1.2, textTransform: "uppercase" },
  desc: { color: brand.textLight, lineHeight: 21, marginBottom: 10 },
  meta: { color: brand.text, fontSize: 13, marginBottom: 4 },
  stockOk: { marginTop: 6, color: brand.textLight, fontSize: 12, fontWeight: "800" },
  stockOut: { marginTop: 6, color: "#b00020", fontSize: 12, fontWeight: "900" },
  btn: { marginTop: 6, backgroundColor: brand.button, paddingVertical: 12, borderRadius: 9 },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: brand.white, textAlign: "center", fontWeight: "700", letterSpacing: 1.1, fontSize: 11 },
});
