import AsyncStorage from "@react-native-async-storage/async-storage";
import { pushNotification } from "./notifications";
import { ensureInventoryFields, validateAndReserveInventoryForOrder } from "./inventory";

const ORDERS_KEY = "jce_mobile_orders";
const STATUS_FLOW = ["placed", "paid", "processing", "shipped", "completed"];
const TRACKING_STATUS_FLOW = [
  "order_placed",
  "preparing_to_ship",
  "picked_up",
  "in_transit",
  "arrived_hub",
  "out_for_delivery",
  "delivered",
];

async function loadOrders() {
  try {
    const raw = await AsyncStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveOrders(orders) {
  await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export async function submitOrder(order) {
  await ensureInventoryFields();
  const inventoryResult = await validateAndReserveInventoryForOrder(order?.items);
  if (!inventoryResult?.ok) {
    throw new Error(inventoryResult?.error || "Not enough stock to place this order.");
  }

  const orders = await loadOrders();
  const now = new Date().toISOString();
  const newOrder = {
    ...order,
    id: Date.now(),
    status: "placed",
    statusTimeline: [],
    createdAt: order.createdAt || now,
  };
  const next = [newOrder, ...orders];
  await saveOrders(next);
  await pushNotification({
    email: order?.contact?.email,
    title: "Order placed",
    body: `Order #${newOrder.id} has been placed.`,
    data: { orderId: newOrder.id, status: "placed" },
  });
  return { ok: true, order: newOrder };
}

export async function getOrdersByEmail(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const orders = await loadOrders();
  return orders.filter(
    (o) =>
      String(o?.contact?.email || "")
        .trim()
        .toLowerCase() === cleanEmail
  );
}

export async function getAllOrdersAdmin() {
  return loadOrders();
}

export async function getOrderById(orderId) {
  const orders = await loadOrders();
  return orders.find((x) => Number(x?.id) === Number(orderId)) || null;
}

export async function updateOrderStatusAdmin(orderId, nextStatus) {
  const targetStatus = String(nextStatus || "").trim().toLowerCase();
  if (!STATUS_FLOW.includes(targetStatus)) {
    return { ok: false, error: "Invalid status." };
  }
  const orders = await loadOrders();
  const index = orders.findIndex((x) => Number(x.id) === Number(orderId));
  if (index < 0) return { ok: false, error: "Order not found." };
  const current = orders[index];
  const timeline = Array.isArray(current.statusTimeline) ? [...current.statusTimeline] : [];
  timeline.push({
    status: targetStatus,
    at: new Date().toISOString(),
    note: `Admin set status to ${targetStatus}.`,
  });
  const updated = {
    ...current,
    status: targetStatus,
    statusTimeline: timeline,
  };
  const next = [...orders];
  next[index] = updated;
  await saveOrders(next);
  await pushNotification({
    email: updated?.contact?.email,
    title: "Order status updated",
    body: `Order #${updated.id} is now ${targetStatus}.`,
    data: { orderId: updated.id, status: targetStatus },
  });
  return { ok: true, order: updated };
}

function cleanText(v) {
  return String(v || "").trim();
}

function normalizeTrackingStatus(status) {
  const s = cleanText(status).toLowerCase();
  return TRACKING_STATUS_FLOW.includes(s) ? s : "in_transit";
}

function mapTrackingToOrderStatus(trackingStatus) {
  const s = normalizeTrackingStatus(trackingStatus);
  if (s === "delivered") return "completed";
  if (s === "out_for_delivery" || s === "in_transit" || s === "arrived_hub" || s === "picked_up") return "shipped";
  if (s === "preparing_to_ship") return "processing";
  return "placed";
}

export function getTrackingStatusOptions() {
  return TRACKING_STATUS_FLOW;
}

export async function addOrderTrackingEventAdmin(orderId, payload) {
  const orders = await loadOrders();
  const index = orders.findIndex((x) => Number(x.id) === Number(orderId));
  if (index < 0) return { ok: false, error: "Order not found." };

  const current = orders[index];
  const trackingStatus = normalizeTrackingStatus(payload?.trackingStatus || payload?.status);
  const event = {
    status: trackingStatus,
    title: cleanText(payload?.title) || trackingStatus.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
    note: cleanText(payload?.note) || "",
    location: cleanText(payload?.location) || "",
    riderName: cleanText(payload?.riderName) || "",
    riderPhone: cleanText(payload?.riderPhone) || "",
    at: payload?.at ? new Date(payload.at).toISOString() : new Date().toISOString(),
  };

  const timeline = Array.isArray(current.statusTimeline) ? [...current.statusTimeline] : [];
  timeline.push(event);

  const updated = {
    ...current,
    status: mapTrackingToOrderStatus(trackingStatus),
    statusTimeline: timeline,
  };
  const next = [...orders];
  next[index] = updated;
  await saveOrders(next);
  await pushNotification({
    email: updated?.contact?.email,
    title: "Shipment update",
    body: `Order #${updated.id}: ${event.title}.`,
    data: { orderId: updated.id, status: event.status },
  });
  return { ok: true, order: updated };
}
