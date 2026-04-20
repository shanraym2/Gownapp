import { useCallback, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useShop } from "../context/ShopContext";
import { canAccess } from "../utils/access";
import { getAllOrdersAdmin } from "../services/orders";
import { getAllGownsAdmin } from "../services/gowns";
import { brand } from "../theme/brand";

function money(n) {
  return `P${Number(n || 0).toLocaleString("en-PH")}`;
}

function shortMoney(n) {
  const num = Number(n || 0);
  if (!Number.isFinite(num)) return "0";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return `${Math.round(num)}`;
}

function getOrderTotal(o) {
  const t = Number(o?.total);
  if (Number.isFinite(t) && t > 0) return t;
  const sub = Number(o?.subtotal);
  if (Number.isFinite(sub) && sub > 0) return sub;
  return 0;
}

function normalizeStatus(s) {
  return String(s || "placed").trim().toLowerCase();
}

function parseOrderDate(o) {
  const raw = o?.createdAt;
  const d = raw ? new Date(raw) : null;
  return d && !Number.isNaN(d.getTime()) ? d : null;
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function AdminStatsScreen() {
  const { user } = useShop();
  const allowed = canAccess(user, "admin_stats");
  const [orders, setOrders] = useState([]);
  const [gowns, setGowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("week"); // week | today

  const loadData = useCallback(async () => {
    setLoading(true);
    const [ordersData, gownsData] = await Promise.all([getAllOrdersAdmin(), getAllGownsAdmin()]);
    setOrders(Array.isArray(ordersData) ? ordersData : []);
    setGowns(Array.isArray(gownsData) ? gownsData : []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (allowed) loadData();
    }, [loadData])
  );

  const stats = useMemo(() => {
    const allOrders = Array.isArray(orders) ? orders : [];
    const allGowns = Array.isArray(gowns) ? gowns : [];

    const now = Date.now();
    const days7 = 7 * 24 * 60 * 60 * 1000;
    const from7d = new Date(now - days7);
    const todayStart = startOfDay(new Date(now));

    const ordersWithDate = allOrders
      .map((o) => ({ o, d: parseOrderDate(o) }))
      .filter((x) => Boolean(x.d));

    const last7Orders = ordersWithDate.filter((x) => x.d >= from7d).map((x) => x.o);
    const todayOrders = ordersWithDate.filter((x) => x.d >= todayStart).map((x) => x.o);

    const revenueAll = allOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);
    const revenue7 = last7Orders.reduce((sum, o) => sum + getOrderTotal(o), 0);
    const revenueToday = todayOrders.reduce((sum, o) => sum + getOrderTotal(o), 0);

    const totalOrders = allOrders.length;
    const totalOrders7 = last7Orders.length;
    const totalOrdersToday = todayOrders.length;

    const itemsSoldAll = allOrders.reduce(
      (sum, o) => sum + (Array.isArray(o?.items) ? o.items.reduce((s, it) => s + (Number(it?.qty) || 0), 0) : 0),
      0
    );
    const itemsSold7 = last7Orders.reduce(
      (sum, o) => sum + (Array.isArray(o?.items) ? o.items.reduce((s, it) => s + (Number(it?.qty) || 0), 0) : 0),
      0
    );
    const itemsSoldToday = todayOrders.reduce(
      (sum, o) => sum + (Array.isArray(o?.items) ? o.items.reduce((s, it) => s + (Number(it?.qty) || 0), 0) : 0),
      0
    );

    const aovAll = totalOrders ? revenueAll / totalOrders : 0;
    const aov7 = totalOrders7 ? revenue7 / totalOrders7 : 0;
    const aovToday = totalOrdersToday ? revenueToday / totalOrdersToday : 0;

    const statusCounts = allOrders.reduce((acc, o) => {
      const s = normalizeStatus(o?.status);
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const byItem = new Map();
    for (const o of allOrders) {
      const items = Array.isArray(o?.items) ? o.items : [];
      for (const it of items) {
        const id = Number(it?.id);
        if (!Number.isFinite(id)) continue;
        const qty = Number(it?.qty) || 0;
        const subtotal = Number(it?.subtotal) || 0;
        const prev = byItem.get(id) || { id, name: String(it?.name || `#${id}`), qty: 0, revenue: 0 };
        byItem.set(id, { ...prev, qty: prev.qty + qty, revenue: prev.revenue + subtotal });
      }
    }

    const topByQty = [...byItem.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
    const topByRevenue = [...byItem.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    const outOfStock = allGowns.filter((g) => Number(g?.stockQty) <= 0);
    const lowStock = allGowns.filter((g) => {
      const stock = Number(g?.stockQty) || 0;
      const threshold = Number(g?.lowStockThreshold) || 0;
      return stock > 0 && stock <= threshold;
    });

    const uniqueCustomers = new Set(
      allOrders
        .map((o) => String(o?.contact?.email || "").trim().toLowerCase())
        .filter(Boolean)
    );

    // Chart data: week = last 7 days revenue; today = revenue by hour (6 buckets)
    const nowDate = new Date(now);
    const weekBuckets = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date(nowDate);
      d.setDate(d.getDate() - (6 - idx));
      const day = startOfDay(d);
      const label = day.toLocaleDateString("en-PH", { weekday: "short" });
      return { label, value: 0, day };
    });
    for (const { o, d } of ordersWithDate) {
      const bucket = weekBuckets.find((b) => sameDay(b.day, d));
      if (bucket) bucket.value += getOrderTotal(o);
    }

    const hourBuckets = [
      { label: "0-3", from: 0, to: 3, value: 0 },
      { label: "4-7", from: 4, to: 7, value: 0 },
      { label: "8-11", from: 8, to: 11, value: 0 },
      { label: "12-15", from: 12, to: 15, value: 0 },
      { label: "16-19", from: 16, to: 19, value: 0 },
      { label: "20-23", from: 20, to: 23, value: 0 },
    ];
    for (const { o, d } of ordersWithDate) {
      if (!sameDay(d, nowDate)) continue;
      const h = d.getHours();
      const bucket = hourBuckets.find((b) => h >= b.from && h <= b.to);
      if (bucket) bucket.value += getOrderTotal(o);
    }

    return {
      revenueAll,
      revenue7,
      revenueToday,
      totalOrders,
      totalOrders7,
      totalOrdersToday,
      itemsSoldAll,
      itemsSold7,
      itemsSoldToday,
      aovAll,
      aov7,
      aovToday,
      statusCounts,
      topByQty,
      topByRevenue,
      outOfStockCount: outOfStock.length,
      lowStockCount: lowStock.length,
      customersCount: uniqueCustomers.size,
      weekSeries: weekBuckets.map((b) => ({ label: b.label, value: b.value })),
      todaySeries: hourBuckets.map((b) => ({ label: b.label, value: b.value })),
    };
  }, [orders, gowns]);

  const series = range === "today" ? stats.todaySeries : stats.weekSeries;
  const maxValue = Math.max(...series.map((s) => Number(s.value) || 0), 1);

  if (!allowed) {
    return (
      <View style={styles.deniedWrap}>
        <Text style={styles.deniedTitle}>Access denied</Text>
        <Text style={styles.deniedText}>You don’t have permission to view statistics.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.title}>Sales Dashboard</Text>
          <Text style={styles.subtitle}>Admin statistics overview</Text>
        </View>
        <View style={styles.headerIcons}>
          <View style={styles.headerIconPill}>
            <Ionicons name="notifications-outline" size={18} color={brand.dark} />
          </View>
          <View style={styles.headerIconPill}>
            <Ionicons name="settings-outline" size={18} color={brand.dark} />
          </View>
        </View>
      </View>

      {loading ? <Text style={styles.meta}>Loading stats...</Text> : null}

      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrap, { backgroundColor: "#eaf1ff" }]}>
            <Ionicons name="cash-outline" size={18} color="#2b6ef6" />
          </View>
          <Text style={styles.kpiValue}>{money(stats.revenueAll)}</Text>
          <Text style={styles.kpiLabel}>Total revenue</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrap, { backgroundColor: "#e8fbf5" }]}>
            <Ionicons name="receipt-outline" size={18} color="#0b9a6a" />
          </View>
          <Text style={styles.kpiValue}>{stats.totalOrders}</Text>
          <Text style={styles.kpiLabel}>Total orders</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrap, { backgroundColor: "#fff3e6" }]}>
            <Ionicons name="bag-handle-outline" size={18} color="#c46b00" />
          </View>
          <Text style={styles.kpiValue}>{stats.itemsSoldAll}</Text>
          <Text style={styles.kpiLabel}>Items sold</Text>
        </View>

        <View style={styles.kpiCard}>
          <View style={[styles.kpiIconWrap, { backgroundColor: "#ffe9ee" }]}>
            <Ionicons name="cube-outline" size={18} color="#b00020" />
          </View>
          <Text style={styles.kpiValue}>
            {stats.outOfStockCount}/{stats.lowStockCount}
          </Text>
          <Text style={styles.kpiLabel}>Out / Low stock</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Overview</Text>
          <View style={styles.segment}>
            <Pressable
              style={[styles.segmentBtn, range === "week" ? styles.segmentBtnActive : null]}
              onPress={() => setRange("week")}
            >
              <Text style={[styles.segmentText, range === "week" ? styles.segmentTextActive : null]}>Week</Text>
            </Pressable>
            <Pressable
              style={[styles.segmentBtn, range === "today" ? styles.segmentBtnActive : null]}
              onPress={() => setRange("today")}
            >
              <Text style={[styles.segmentText, range === "today" ? styles.segmentTextActive : null]}>Today</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.overviewMetaRow}>
          <View style={styles.overviewPill}>
            <Text style={styles.overviewPillLabel}>Revenue</Text>
            <Text style={styles.overviewPillValue}>
              {range === "today" ? money(stats.revenueToday) : money(stats.revenue7)}
            </Text>
          </View>
          <View style={styles.overviewPill}>
            <Text style={styles.overviewPillLabel}>Orders</Text>
            <Text style={styles.overviewPillValue}>
              {range === "today" ? stats.totalOrdersToday : stats.totalOrders7}
            </Text>
          </View>
          <View style={styles.overviewPill}>
            <Text style={styles.overviewPillLabel}>AOV</Text>
            <Text style={styles.overviewPillValue}>
              {range === "today" ? money(stats.aovToday) : money(stats.aov7)}
            </Text>
          </View>
        </View>

        <View style={styles.chartWrap}>
          <View style={styles.chartBars}>
            {series.map((s) => {
              const heightPct = (Number(s.value) || 0) / maxValue;
              const h = Math.max(3, Math.round(heightPct * 120));
              return (
                <View key={s.label} style={styles.chartBarCol}>
                  <View style={[styles.chartBar, { height: h }]} />
                  <Text style={styles.chartLabel}>{s.label}</Text>
                </View>
              );
            })}
          </View>
          <Text style={styles.chartHint}>Max: {shortMoney(maxValue)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Orders by status</Text>
        {Object.keys(stats.statusCounts || {}).length ? (
          <View style={styles.statusGrid}>
            {Object.entries(stats.statusCounts)
              .sort((a, b) => String(a[0]).localeCompare(String(b[0])))
              .map(([k, v]) => (
                <View key={k} style={styles.statusPill}>
                  <Text style={styles.statusKey}>{k}</Text>
                  <Text style={styles.statusVal}>{v}</Text>
                </View>
              ))}
          </View>
        ) : (
          <Text style={styles.meta}>No orders yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top items</Text>
        {stats.topByRevenue.length ? (
          <>
            {stats.topByRevenue.slice(0, 5).map((x) => (
              <View key={x.id} style={styles.topRow}>
                <Text style={styles.topName} numberOfLines={1}>
                  {x.name}
                </Text>
                <Text style={styles.topValue}>{money(x.revenue)}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.meta}>No sales yet.</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: brand.bg },
  content: { padding: 16, paddingBottom: 28 },

  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  headerIcons: { flexDirection: "row", gap: 8 },
  headerIconPill: {
    width: 36,
    height: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.white,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 28, fontWeight: "900", color: brand.dark, fontStyle: "italic" },
  subtitle: { color: brand.textLight, marginTop: 2, fontSize: 12, fontWeight: "700" },

  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 6, marginBottom: 10 },
  kpiCard: {
    width: "48%",
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 14,
    padding: 12,
  },
  kpiIconWrap: { width: 34, height: 34, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  kpiValue: { marginTop: 10, fontSize: 16, fontWeight: "900", color: brand.dark },
  kpiLabel: { marginTop: 3, fontSize: 12, fontWeight: "700", color: brand.textLight },

  card: {
    backgroundColor: brand.white,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  cardHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  cardTitle: { color: brand.dark, fontWeight: "900" },

  segment: { flexDirection: "row", borderWidth: 1, borderColor: brand.border, borderRadius: 999, overflow: "hidden" },
  segmentBtn: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: brand.white },
  segmentBtnActive: { backgroundColor: brand.button },
  segmentText: { fontSize: 12, fontWeight: "800", color: brand.textLight },
  segmentTextActive: { color: brand.white },

  overviewMetaRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  overviewPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: brand.border,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: brand.white,
  },
  overviewPillLabel: { color: brand.textLight, fontSize: 11, fontWeight: "800" },
  overviewPillValue: { color: brand.dark, fontSize: 12, fontWeight: "900", marginTop: 3 },

  chartWrap: { borderWidth: 1, borderColor: brand.border, borderRadius: 12, padding: 10, backgroundColor: brand.white },
  chartBars: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", height: 150 },
  chartBarCol: { alignItems: "center", flex: 1 },
  chartBar: { width: 10, borderRadius: 999, backgroundColor: brand.buttonAlt },
  chartLabel: { marginTop: 6, fontSize: 10, color: brand.textLight, fontWeight: "800" },
  chartHint: { marginTop: 8, color: brand.textLight, fontSize: 11, fontWeight: "700" },

  statusGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  statusPill: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: brand.border,
    backgroundColor: brand.accentSoft,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  statusKey: { color: brand.dark, fontWeight: "900", fontSize: 11 },
  statusVal: { color: brand.textLight, fontWeight: "900", fontSize: 11 },

  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: 1, borderTopColor: brand.border },
  topName: { flex: 1, minWidth: 0, color: brand.dark, fontWeight: "800", fontSize: 12, paddingRight: 10 },
  topValue: { color: brand.textLight, fontWeight: "900", fontSize: 12 },

  meta: { color: brand.textLight, fontSize: 12, marginTop: 2 },

  deniedWrap: { flex: 1, justifyContent: "center", alignItems: "center", padding: 16, backgroundColor: brand.bg },
  deniedTitle: { fontSize: 18, fontWeight: "900", color: brand.dark },
  deniedText: { marginTop: 6, color: brand.textLight, textAlign: "center" },
});

