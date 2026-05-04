import { useCallback, useEffect, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useShop } from "../context/ShopContext";
import { brand } from "../theme/brand";
import { getOrdersByEmail } from "../services/orders";
import { formatDateTimePH } from "../utils/datetime";
import { idsEqual } from "../utils/id";

function formatPrice(num) {
  return `P${Number(num || 0).toLocaleString("en-PH")}`;
}

function statusLabel(status) {
  return String(status || "placed").replace("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function MyOrdersScreen({ navigation }) {
  const { user, gowns } = useShop();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const loadOrders = useCallback(async () => {
    if (!user?.email) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await getOrdersByEmail(user.email);
      setOrders(data || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  const onRefresh = useCallback(async () => {
    if (!user?.email) {
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    try {
      const data = await getOrdersByEmail(user.email);
      setOrders(data || []);
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }, [user?.email]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders])
  );

  if (!user?.email) {
    return (
      <View style={styles.center}>
        <Text style={styles.hint}>Please sign in to view your order history.</Text>
        <Pressable style={styles.btn} onPress={() => navigation.navigate("Login")}>
          <Text style={styles.btnText}>Sign In</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.screen} 
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Order History</Text>
      <Text style={styles.hint}>Showing orders for {user.email}</Text>
      {loading ? <Text>Loading your orders...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && orders.length === 0 ? <Text>You have not placed any orders yet.</Text> : null}
      {orders.map((o) => (
        <Pressable
          key={o.id}
          style={styles.card}
          onPress={() => navigation.navigate("OrderDetail", { orderId: o.id })}
        >
          <View style={styles.rowTop}>
            {(() => {
              const firstItem = (o.items || [])[0];
              const gown = gowns.find((g) => idsEqual(g?.id, firstItem?.id));
              if (gown?.image) {
                return <Image source={{ uri: gown.image }} style={styles.thumb} />;
              }
              return <View style={styles.thumbFallback} />;
            })()}

            <View style={styles.mainCol}>
              <Text style={styles.productName} numberOfLines={2}>
                {(o.items || [])[0]?.name || `Order #${o.id}`}
              </Text>
              <Text style={styles.meta}>Order #{o.id}</Text>
              <Text style={styles.meta}>{formatDateTimePH(o.createdAt)}</Text>
              <Text style={styles.meta}>x{(o.items || []).reduce((sum, it) => sum + (Number(it?.qty) || 0), 0)} items</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{statusLabel(o.status)}</Text>
              </View>
            </View>

            <View style={styles.rightCol}>
              <Text style={styles.totalLabel}>Order Total:</Text>
              <Text style={styles.totalValue}>{formatPrice(o.total || o.subtotal)}</Text>
            </View>
          </View>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg },
  content: { padding: 16, paddingBottom: 30 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16 },
  title: { fontSize: 30, fontWeight: "700", color: brand.dark, marginBottom: 4, fontStyle: "italic" },
  hint: { color: brand.textLight, marginBottom: 12 },
  error: { color: "#a82949", marginBottom: 8 },
  card: { borderWidth: 1, borderColor: brand.border, borderRadius: 10, padding: 10, marginBottom: 10, backgroundColor: brand.white },
  rowTop: { flexDirection: "row", alignItems: "center" },
  thumb: { width: 56, height: 56, borderRadius: 6, borderWidth: 1, borderColor: brand.border, backgroundColor: "#eee" },
  thumbFallback: { width: 56, height: 56, borderRadius: 6, borderWidth: 1, borderColor: brand.border, backgroundColor: "#f3f3f3" },
  mainCol: { flex: 1, marginLeft: 10, minWidth: 0 },
  productName: { color: brand.dark, fontSize: 15, fontWeight: "700" },
  meta: { color: brand.textLight, marginTop: 2, fontSize: 12 },
  rightCol: { alignItems: "flex-end", marginLeft: 8 },
  totalLabel: { color: brand.dark, fontSize: 12 },
  totalValue: { color: "#c5482f", fontWeight: "900", fontSize: 24, marginTop: 2 },
  badge: {
    alignSelf: "flex-start",
    marginTop: 6,
    backgroundColor: brand.dark,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeText: { color: brand.white, fontWeight: "800", fontSize: 11, letterSpacing: 0.6 },
  btn: { marginTop: 8, backgroundColor: brand.button, paddingVertical: 12, paddingHorizontal: 20 },
  btnText: { color: brand.white, fontWeight: "700" },
});
