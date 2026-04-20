import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { addOrderTrackingEventAdmin, getAllOrdersAdmin, getTrackingStatusOptions } from "../services/orders";
import { useShop } from "../context/ShopContext";
import { canAccess } from "../utils/access";
import { brand } from "../theme/brand";
import { formatDateTimePH } from "../utils/datetime";

const TRACKING_OPTIONS = getTrackingStatusOptions();

const EMPTY_TRACKING_FORM = {
  trackingStatus: "in_transit",
  title: "",
  note: "",
  location: "",
  riderName: "",
  riderPhone: "",
};

function money(n) {
  return `P${Number(n || 0).toLocaleString("en-PH")}`;
}

function prettyStatus(v) {
  return String(v || "").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function AdminOrdersScreen() {
  const { user } = useShop();
  const allowed = canAccess(user, "admin_orders");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openTrackingFor, setOpenTrackingFor] = useState(null);
  const [trackingForm, setTrackingForm] = useState(EMPTY_TRACKING_FORM);

  const loadData = useCallback(async () => {
    setLoading(true);
    const data = await getAllOrdersAdmin();
    setOrders(data);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (allowed) loadData();
    }, [loadData])
  );

  const onAddTracking = async (orderId) => {
    const result = await addOrderTrackingEventAdmin(orderId, trackingForm);
    if (!result.ok) {
      Alert.alert("Update failed", result.error || "Unable to add tracking update.");
      return;
    }
    setOpenTrackingFor(null);
    setTrackingForm(EMPTY_TRACKING_FORM);
    loadData();
  };

  if (!allowed) {
    return (
      <View style={styles.deniedWrap}>
        <Text style={styles.deniedTitle}>Access denied</Text>
        <Text style={styles.deniedText}>You don’t have permission to manage orders.</Text>
      </View>
    );
  }

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
          <Text style={styles.meta}>{formatDateTimePH(o.createdAt)}</Text>
          <Text style={styles.meta}>Payment: {o.payment || "-"}</Text>
          <Text style={styles.meta}>Status: {prettyStatus(o.status)}</Text>

          <Pressable
            style={styles.dropdownTrigger}
            onPress={() => {
              setOpenTrackingFor((prev) => (prev === o.id ? null : o.id));
              setTrackingForm(EMPTY_TRACKING_FORM);
            }}
          >
            <Text style={styles.dropdownTriggerText}>Add Tracking Update</Text>
          </Pressable>

          {openTrackingFor === o.id ? (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Tracking Status</Text>
              <View style={styles.statusRow}>
                {TRACKING_OPTIONS.map((s) => (
                  <Pressable
                    key={`${o.id}-tracking-${s}`}
                    style={[styles.statusPill, trackingForm.trackingStatus === s ? styles.statusPillActive : null]}
                    onPress={() => setTrackingForm((p) => ({ ...p, trackingStatus: s }))}
                  >
                    <Text style={trackingForm.trackingStatus === s ? styles.statusPillTextActive : styles.statusPillText}>
                      {prettyStatus(s.replace(/_/g, " "))}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Title (optional)"
                value={trackingForm.title}
                onChangeText={(v) => setTrackingForm((p) => ({ ...p, title: v }))}
              />
              <TextInput
                style={[styles.input, styles.inputArea]}
                placeholder="Note / update details"
                multiline
                value={trackingForm.note}
                onChangeText={(v) => setTrackingForm((p) => ({ ...p, note: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Location (optional)"
                value={trackingForm.location}
                onChangeText={(v) => setTrackingForm((p) => ({ ...p, location: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Rider name (optional)"
                value={trackingForm.riderName}
                onChangeText={(v) => setTrackingForm((p) => ({ ...p, riderName: v }))}
              />
              <TextInput
                style={styles.input}
                placeholder="Rider mobile number (optional)"
                keyboardType="phone-pad"
                value={trackingForm.riderPhone}
                onChangeText={(v) => setTrackingForm((p) => ({ ...p, riderPhone: v.replace(/[^\d+]/g, "") }))}
              />
              <Pressable style={styles.primaryBtn} onPress={() => onAddTracking(o.id)}>
                <Text style={styles.primaryBtnText}>Save Tracking Update</Text>
              </Pressable>
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
  formCard: { marginTop: 8, borderWidth: 1, borderColor: brand.border, borderRadius: 10, backgroundColor: brand.white, padding: 10 },
  formTitle: { color: brand.dark, fontWeight: "800", marginBottom: 8, fontSize: 12 },
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginBottom: 8 },
  statusPill: { borderWidth: 1, borderColor: brand.border, borderRadius: 999, paddingVertical: 5, paddingHorizontal: 8, backgroundColor: brand.white },
  statusPillActive: { backgroundColor: brand.button, borderColor: brand.button },
  statusPillText: { color: brand.dark, fontSize: 11, fontWeight: "700" },
  statusPillTextActive: { color: brand.white, fontSize: 11, fontWeight: "700" },
  input: { borderWidth: 1, borderColor: brand.border, backgroundColor: brand.white, padding: 9, marginBottom: 8, fontSize: 12 },
  inputArea: { minHeight: 56, textAlignVertical: "top" },
  primaryBtn: { backgroundColor: brand.buttonAlt, borderRadius: 8, paddingVertical: 10 },
  primaryBtnText: { color: brand.white, textAlign: "center", fontWeight: "800", fontSize: 11, letterSpacing: 0.6 },

  deniedWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: brand.bg },
  deniedTitle: { fontSize: 18, fontWeight: "900", color: brand.dark },
  deniedText: { marginTop: 6, color: brand.textLight, textAlign: "center" },
});
