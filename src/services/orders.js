import AsyncStorage from "@react-native-async-storage/async-storage";
import { pushNotification } from "./notifications";

const ORDERS_KEY = "jce_mobile_orders";
const STATUS_FLOW = ["placed", "paid", "processing", "shipped", "completed"];

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
  const orders = await loadOrders();
  const now = new Date().toISOString();
  const newOrder = {
    ...order,
    id: Date.now(),
    status: "placed",
    statusTimeline: [{ status: "placed", at: now, note: "Order has been placed." }],
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
