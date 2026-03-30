import AsyncStorage from "@react-native-async-storage/async-storage";

const ORDERS_KEY = "jce_mobile_orders";

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
  const newOrder = {
    ...order,
    id: Date.now(),
    status: "placed",
  };
  const next = [newOrder, ...orders];
  await saveOrders(next);
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
