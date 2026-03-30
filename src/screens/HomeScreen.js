import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import { useShop } from "../context/ShopContext";
import { brand } from "../theme/brand";

export function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { gowns, cartDetailed, favoritesSet, toggleFavorite } = useShop();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const fallbackImage = "https://via.placeholder.com/800x1000/F5EFE7/5C4A42?text=JCE+Bridal";
  const arImage = gowns[0]?.image || fallbackImage;

  const cartCount = useMemo(
    () => cartDetailed.reduce((sum, item) => sum + (item.qty || 0), 0),
    [cartDetailed]
  );

  const categories = useMemo(() => {
    const set = new Set();
    for (const g of gowns) if (g?.type) set.add(g.type);
    return ["All", ...Array.from(set)];
  }, [gowns]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return gowns.filter((g) => {
      if (!g) return false;
      const catOk = activeCategory === "All" ? true : String(g.type) === activeCategory;
      const qOk = !q
        ? true
        : `${g.name || ""} ${g.type || ""} ${g.color || ""} ${g.silhouette || ""}`
            .toLowerCase()
            .includes(q);
      return catOk && qOk;
    });
  }, [gowns, query, activeCategory]);

  const carouselItems = useMemo(() => {
    const imgs = gowns.slice(0, 5).map((g) => ({
      id: g.id,
      title: g.name,
      image: g.image,
    }));
    return imgs.length ? imgs : [{ id: "fallback", title: "JCE Bridal", image: fallbackImage }];
  }, [gowns]);

  const featuredGowns = useMemo(() => filtered.slice(0, 4), [filtered]);

  const recommended = useMemo(() => {
    const prefType = cartDetailed?.[0]?.type || null;
    const pool = prefType ? filtered.filter((g) => g.type === prefType) : filtered;
    return pool.slice(0, 4);
  }, [filtered, cartDetailed]);

  const newArrivals = useMemo(() => {
    const list = [...filtered];
    return list.slice(-4).reverse();
  }, [filtered]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color={brand.textLight} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Find your gown…"
            placeholderTextColor={brand.textLight}
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>

        <Pressable style={styles.cartBtn} onPress={() => navigation.navigate("Cart")}>
          <Ionicons name="cart" size={20} color={brand.dark} />
          {cartCount > 0 ? (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          ) : null}
        </Pressable>
      </View>

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
        contentContainerStyle={styles.carouselContent}
      >
        {carouselItems.map((c) => (
          <Pressable
            key={String(c.id)}
            style={styles.carouselCard}
            onPress={() => (typeof c.id === "number" ? navigation.navigate("GownDetail", { id: c.id }) : null)}
          >
            <Image source={{ uri: c.image || fallbackImage }} style={styles.carouselImage} />
            <View style={styles.carouselOverlay}>
              <Text style={styles.carouselKicker}>JCE 2026 COLLECTION</Text>
              <Text style={styles.carouselTitle} numberOfLines={2}>
                {c.title}
              </Text>
              <View style={styles.carouselActions}>
                <View style={styles.pill}>
                  <Text style={styles.pillText}>SHOP NOW</Text>
                </View>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>

      <Pressable style={styles.arCta} onPress={() => navigation.navigate("AR Try-On")}>
        <View style={styles.arCtaHeader}>
          <View style={styles.arIconCircle}>
            <Ionicons name="camera-outline" size={22} color={brand.dark} />
          </View>
          <Text style={styles.arCtaBadge}>NEW • AR FEATURE</Text>
        </View>
        <Image source={{ uri: arImage }} style={styles.arImage} />
        <Text style={styles.arCtaTitle}>Try on your gown in AR</Text>
        <Text style={styles.arCtaText}>Stand in front of the camera and preview your dream look in seconds.</Text>
        <View style={styles.arButtonRow}>
          <View style={styles.arPrimaryBtn}>
            <Text style={styles.arPrimaryText}>START AR TRY‑ON</Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.promoBanner}>
        <View style={styles.promoLeft}>
          <Text style={styles.promoTitle}>Promo banner</Text>
          <Text style={styles.promoText}>Limited slots for fittings • New 2026 arrivals</Text>
        </View>
        <Pressable
          style={styles.promoBtn}
          onPress={() => navigation.navigate("Gowns", { promo: true })}
        >
          <Text style={styles.promoBtnText}>Browse</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Featured collection</Text>
        <Text style={styles.sectionHeading}>Handpicked Elegance</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
        {categories.map((c) => {
          const active = c === activeCategory;
          return (
            <Pressable
              key={c}
              style={[styles.categoryChip, active ? styles.categoryChipActive : null]}
              onPress={() => setActiveCategory(c)}
            >
              <Text style={[styles.categoryChipText, active ? styles.categoryChipTextActive : null]}>{c}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.gridSection}>
        <View style={styles.sectionRow}>
          <Text style={styles.gridTitle}>Featured gowns</Text>
          <Pressable onPress={() => navigation.navigate("Gowns")}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        <View style={styles.grid}>
          {featuredGowns.map((g) => (
            <View key={g.id} style={styles.gridCard}>
              <Pressable style={styles.gridCardBody} onPress={() => navigation.navigate("GownDetail", { id: g.id })}>
                <Image source={{ uri: g.image || fallbackImage }} style={styles.gridImage} />
                <Text style={styles.gridName} numberOfLines={1}>
                  {g.name}
                </Text>
                <Text style={styles.gridMeta} numberOfLines={1}>
                  {g.price} • {g.silhouette}
                </Text>
              </Pressable>
              <Pressable style={styles.favBtn} onPress={() => toggleFavorite(g.id)}>
                <Ionicons
                  name={favoritesSet?.has(Number(g.id)) ? "heart" : "heart-outline"}
                  size={18}
                  color={favoritesSet?.has(Number(g.id)) ? brand.buttonAlt : brand.textLight}
                />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.gridSection}>
        <View style={styles.sectionRow}>
          <Text style={styles.gridTitle}>You might also like</Text>
        </View>
        <View style={styles.grid}>
          {recommended.map((g) => (
            <View key={`rec-${g.id}`} style={styles.gridCard}>
              <Pressable style={styles.gridCardBody} onPress={() => navigation.navigate("GownDetail", { id: g.id })}>
                <Image source={{ uri: g.image || fallbackImage }} style={styles.gridImage} />
                <Text style={styles.gridName} numberOfLines={1}>
                  {g.name}
                </Text>
                <Text style={styles.gridMeta} numberOfLines={1}>
                  {g.color} • {g.type}
                </Text>
              </Pressable>
              <Pressable style={styles.favBtn} onPress={() => toggleFavorite(g.id)}>
                <Ionicons
                  name={favoritesSet?.has(Number(g.id)) ? "heart" : "heart-outline"}
                  size={18}
                  color={favoritesSet?.has(Number(g.id)) ? brand.buttonAlt : brand.textLight}
                />
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.gridSection}>
        <View style={styles.sectionRow}>
          <Text style={styles.gridTitle}>New arrivals</Text>
        </View>
        <View style={styles.grid}>
          {newArrivals.map((g) => (
            <View key={`new-${g.id}`} style={styles.gridCard}>
              <Pressable style={styles.gridCardBody} onPress={() => navigation.navigate("GownDetail", { id: g.id })}>
                <Image source={{ uri: g.image || fallbackImage }} style={styles.gridImage} />
                <Text style={styles.gridName} numberOfLines={1}>
                  {g.name}
                </Text>
                <Text style={styles.gridMeta} numberOfLines={1}>
                  {g.price}
                </Text>
              </Pressable>
              <Pressable style={styles.favBtn} onPress={() => toggleFavorite(g.id)}>
                <Ionicons
                  name={favoritesSet?.has(Number(g.id)) ? "heart" : "heart-outline"}
                  size={18}
                  color={favoritesSet?.has(Number(g.id)) ? brand.buttonAlt : brand.textLight}
                />
              </Pressable>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg },
  content: { paddingBottom: 40 },

  topBar: { flexDirection: "row", gap: 12, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 12, alignItems: "center" },
  searchWrap: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, color: brand.dark, fontWeight: "600" },
  cartBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.border,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 999,
    backgroundColor: brand.button,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBadgeText: { color: brand.white, fontSize: 10, fontWeight: "800" },

  carousel: { paddingHorizontal: 16 },
  carouselContent: { gap: 12 },
  carouselCard: { width: 340, height: 210, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: brand.border },
  carouselImage: { width: "100%", height: "100%" },
  carouselOverlay: { position: "absolute", left: 12, right: 12, bottom: 12, backgroundColor: brand.white, borderRadius: 14, padding: 12 },
  carouselKicker: { color: brand.textLight, fontSize: 10, letterSpacing: 1.6, marginBottom: 6 },
  carouselTitle: { color: brand.dark, fontSize: 18, fontWeight: "900", fontStyle: "italic", lineHeight: 20 },
  carouselActions: { marginTop: 10, flexDirection: "row" },
  pill: { backgroundColor: brand.button, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999 },
  pillText: { color: brand.white, fontSize: 10, fontWeight: "900", letterSpacing: 1.1 },

  promoBanner: {
    marginTop: 14,
    marginHorizontal: 16,
    padding: 14,
    borderRadius: 16,
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  promoLeft: { flex: 1 },
  promoTitle: { color: brand.dark, fontWeight: "900", fontSize: 14, marginBottom: 3 },
  promoText: { color: brand.textLight, fontSize: 12 },
  promoBtn: { backgroundColor: brand.accentSoft, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12 },
  promoBtnText: { color: brand.dark, fontWeight: "900", fontSize: 12 },

  arCta: {
    marginTop: 18,
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 20,
    backgroundColor: brand.accentSoft,
    borderWidth: 1,
    borderColor: brand.border,
  },
  arCtaHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  arIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 24,
    backgroundColor: brand.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: brand.border,
  },
  arCtaBadge: { color: brand.dark, fontWeight: "800", fontSize: 11, letterSpacing: 1.4 },
  arImage: { width: "100%", height: 150, borderRadius: 14, marginBottom: 10, marginTop: 8 },
  arCtaTitle: { color: brand.dark, fontWeight: "900", fontSize: 18, marginBottom: 6 },
  arCtaText: { color: brand.textLight, fontSize: 12, lineHeight: 18, marginBottom: 14 },
  arButtonRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  arPrimaryBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: brand.dark,
  },
  arPrimaryText: { color: brand.white, fontWeight: "900", fontSize: 11, letterSpacing: 1.4 },

  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionLabel: { color: brand.textLight, fontSize: 10, letterSpacing: 1.6, marginBottom: 6, textTransform: "uppercase" },
  sectionHeading: { color: brand.dark, fontSize: 22, fontWeight: "900" },

  categoriesRow: { paddingHorizontal: 16, gap: 10, paddingTop: 12, paddingBottom: 2 },
  categoryChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 999, backgroundColor: brand.white, borderWidth: 1, borderColor: brand.border },
  categoryChipActive: { backgroundColor: brand.dark, borderColor: brand.dark },
  categoryChipText: { color: brand.dark, fontWeight: "800", fontSize: 12 },
  categoryChipTextActive: { color: brand.white },

  gridSection: { paddingHorizontal: 16, marginTop: 16 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  gridTitle: { color: brand.dark, fontSize: 16, fontWeight: "900" },
  link: { color: brand.textLight, fontWeight: "800" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridCard: { width: "48%", backgroundColor: brand.white, borderWidth: 1, borderColor: brand.border, borderRadius: 14, padding: 10, position: "relative" },
  gridCardBody: { flex: 1 },
  gridImage: { width: "100%", height: 150, borderRadius: 10, marginBottom: 8 },
  gridName: { color: brand.dark, fontWeight: "800", marginBottom: 2 },
  gridMeta: { color: brand.textLight, fontSize: 12 },
  favBtn: { position: "absolute", top: 10, right: 10, width: 34, height: 34, borderRadius: 999, backgroundColor: brand.white, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: brand.border },
});
