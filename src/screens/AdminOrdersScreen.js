import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { getAllOrdersAdmin, updateOrderStatusAdmin } from "../services/orders";
import { brand } from "../theme/brand";

const STATUS_OPTIONS = ["placed", "paid", "processing", "shipped", "completed"];

function money(n) {
  return `P${Number(n || 0).toLocaleString("en-PH")}`;
}

function prettyStatus(v) {
  return String(v || "").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function AdminOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openStatusMenuFor, setOpenStatusMenuFor] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getAllOrdersAdmin();
    setOrders(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onUpdateStatus = async (orderId, status) => {
    const result = await updateOrderStatusAdmin(orderId, status);
    if (!result.ok) {
      Alert.alert("Update failed", result.error || "Unable to update status.");
      return;
    }
    setOpenStatusMenuFor(null);
    loadData();
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Orders</Text>
      {loading ? <Text style={styles.meta}>Loading orders...</Text> : null}
      {!loading && !orders.length ? <Text style={styles.meta}>No orders yet.</Text> : null}
      {orders.map((o) => (
        <View key={o.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Order #{o.id}</Text>
            <Text style={styles.total}>{money(o.total || o.subtotal)}</Text>
          </View>
          <Text style={styles.meta}>{o?.contact?.firstName} {o?.contact?.lastName} — {o?.contact?.email}</Text>
          <Text style={styles.meta}>{o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</Text>
          <Text style={styles.meta}>Payment: {o.payment || "-"}</Text>
          <Text style={styles.meta}>Status: {prettyStatus(o.status)}</Text>

          <Pressable style={styles.dropdownTrigger} onPress={() => setOpenStatusMenuFor((prev) => (prev === o.id ? null : o.id))}>
            <Text style={styles.dropdownTriggerText}>Change Status</Text>
          </Pressable>
          {openStatusMenuFor === o.id ? (
            <View style={styles.dropdownMenu}>
              {STATUS_OPTIONS.map((s) => (
                <Pressable key={`${o.id}-${s}`} style={styles.dropdownItem} onPress={() => onUpdateStatus(o.id, s)}>
                  <Text style={styles.dropdownItemText}>{prettyStatus(s)}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <View style={styles.itemsWrap}>
            {(o.items || []).map((it, idx) => (
              <Text key={`${o.id}-${idx}`} style={styles.item}>
                {it.name} x {it.qty} — {money(it.subtotal)}
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
  content: { padding: 16, paddingBottom: 28 },
  title: { fontSize: 34, fontWeight: "800", color: brand.dark, marginBottom: 12, fontStyle: "italic" },
  card: {
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  cardTitle: { color: brand.dark, fontWeight: "800", fontSize: 14 },
  total: { color: brand.dark, fontWeight: "800", fontSize: 13 },
  meta: { color: brand.textLight, fontSize: 12, marginTop: 2 },
  itemsWrap: { marginTop: 8, gap: 3 },
  item: { color: brand.text, fontSize: 12 },
  dropdownTrigger: {
    marginTop: 8,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: brand.accentSoft,
  },
  dropdownTriggerText: { color: brand.dark, fontSize: 12, fontWeight: "700" },
  dropdownMenu: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 8,
    backgroundColor: brand.white,
    overflow: "hidden",
  },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: brand.border },
  dropdownItemText: { color: brand.dark, fontWeight: "700", fontSize: 12 },
});
