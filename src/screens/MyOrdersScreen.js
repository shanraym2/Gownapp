import { useCallback, useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useShop } from "../context/ShopContext";
import { brand } from "../theme/brand";
import { getOrdersByEmail } from "../services/orders";

function formatPrice(num) {
  return `P${Number(num || 0).toLocaleString("en-PH")}`;
}

function statusLabel(status) {
  return String(status || "placed").replace("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function MyOrdersScreen({ navigation }) {
  const { user } = useShop();
  const [loading, setLoading] = useState(true);
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
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Order History</Text>
      <Text style={styles.hint}>Showing orders for {user.email}</Text>
      {loading ? <Text>Loading your orders...</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {!loading && !error && orders.length === 0 ? <Text>You have not placed any orders yet.</Text> : null}
      {orders.map((o) => (
        <View key={o.id} style={styles.card}>
          <Text style={styles.cardTitle}>Order #{o.id}</Text>
          <Text style={styles.meta}>{o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</Text>
          <Text style={styles.meta}>Payment method: {o.payment || "-"}</Text>
          <Text style={styles.meta}>Shipping: {o.shipping?.zoneLabel || "-"}, ETA {o.shipping?.etaLabel || "-"}</Text>
          <Text style={styles.total}>Total: {formatPrice(o.total || o.subtotal)}</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{statusLabel(o.status)}</Text>
          </View>
          <View style={styles.timelineWrap}>
            {(o.statusTimeline || []).map((step, i) => (
              <Text key={`${o.id}-timeline-${i}`} style={styles.timelineItem}>
                • {statusLabel(step.status)} - {step.at ? new Date(step.at).toLocaleString() : "-"}
              </Text>
            ))}
          </View>
          <View style={styles.itemsWrap}>
            {(o.items || []).map((it, i) => (
              <Text key={`${o.id}-${i}`} style={styles.item}>
                {it.qty} x {it.name} - {formatPrice(it.subtotal)}
              </Text>
            ))}
          </View>
        </View>
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
  card: { borderWidth: 1, borderColor: brand.border, padding: 12, marginBottom: 10, backgroundColor: brand.white },
  cardTitle: { fontSize: 16, fontWeight: "700", color: brand.dark },
  meta: { color: brand.textLight, marginTop: 2 },
  total: { color: brand.dark, marginTop: 8, fontWeight: "700" },
  badge: {
    alignSelf: "flex-start",
    marginTop: 8,
    backgroundColor: brand.dark,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  badgeText: { color: brand.white, fontWeight: "800", fontSize: 11, letterSpacing: 0.6 },
  timelineWrap: { marginTop: 8, gap: 2 },
  timelineItem: { color: brand.textLight, fontSize: 12 },
  itemsWrap: { marginTop: 8, gap: 4 },
  item: { color: brand.text },
  btn: { marginTop: 8, backgroundColor: brand.button, paddingVertical: 12, paddingHorizontal: 20 },
  btnText: { color: brand.white, fontWeight: "700" },
});
