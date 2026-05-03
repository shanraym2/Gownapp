import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useShop } from "../context/ShopContext";
import { brand } from "../theme/brand";
import { normalizeId } from "../utils/id";

export function FavoritesScreen({ navigation }) {
  const { favoritesDetailed, favoritesSet, toggleFavorite } = useShop();
  const fallbackImage = "https://via.placeholder.com/800x1000/F5EFE7/5C4A42?text=JCE+Bridal";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Favorites</Text>
      <Text style={styles.subtitle}>Save your most loved looks for later.</Text>

      {favoritesDetailed.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="heart-outline" size={44} color={brand.textLight} />
          <Text style={styles.emptyTitle}>No favorites yet</Text>
          <Text style={styles.emptyText}>Tap the heart icon on any gown to save it here.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {favoritesDetailed.map((g) => {
            const liked = favoritesSet?.has(normalizeId(g.id));
            return (
              <View key={g.id} style={styles.card}>
                <Pressable
                  style={styles.cardBody}
                  onPress={() => navigation.navigate("GownDetail", { id: g.id })}
                >
                  <Image source={{ uri: g.image || fallbackImage }} style={styles.cardImage} />
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {g.name}
                  </Text>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {g.price} • {g.silhouette}
                  </Text>
                </Pressable>
                <Pressable style={styles.heartBtn} onPress={() => toggleFavorite(g.id)}>
                  <Ionicons name={liked ? "heart" : "heart-outline"} size={18} color={liked ? brand.buttonAlt : brand.textLight} />
                </Pressable>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg },
  content: { padding: 16, paddingBottom: 30 },
  title: { fontSize: 32, color: brand.dark, fontWeight: "900", fontStyle: "italic", marginBottom: 4 },
  subtitle: { color: brand.textLight, marginBottom: 16, lineHeight: 18, fontSize: 12 },

  emptyWrap: { marginTop: 24, paddingVertical: 26, alignItems: "center", borderRadius: 16, borderWidth: 1, borderColor: brand.border, backgroundColor: brand.white },
  emptyTitle: { color: brand.dark, fontWeight: "900", fontSize: 16, marginTop: 10 },
  emptyText: { color: brand.textLight, textAlign: "center", marginTop: 6, lineHeight: 18, fontSize: 12, paddingHorizontal: 20 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: "48%", backgroundColor: brand.white, borderWidth: 1, borderColor: brand.border, borderRadius: 14, padding: 10, position: "relative" },
  cardBody: { flex: 1 },
  cardImage: { width: "100%", height: 160, borderRadius: 10, marginBottom: 8 },
  heartBtn: { position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: 999, backgroundColor: brand.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: brand.border },
  cardTitle: { color: brand.dark, fontWeight: "900", fontSize: 14, marginBottom: 3 },
  cardMeta: { color: brand.textLight, fontSize: 12, fontWeight: "700" },
});

