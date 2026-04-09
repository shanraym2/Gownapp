import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIFICATIONS_KEY = "jce_mobile_notifications";

async function loadNotificationsRaw() {
  try {
    const raw = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveNotificationsRaw(items) {
  await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(items));
}

export async function pushNotification({ email, title, body, data }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail || !title) return;
  const items = await loadNotificationsRaw();
  const entry = {
    id: `${Date.now()}_${Math.round(Math.random() * 10000)}`,
    email: cleanEmail,
    title,
    body: String(body || ""),
    data: data || null,
    read: false,
    createdAt: new Date().toISOString(),
  };
  const next = [entry, ...items].slice(0, 120);
  await saveNotificationsRaw(next);
}

export async function getNotificationsByEmail(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const items = await loadNotificationsRaw();
  return items.filter((x) => String(x.email).trim().toLowerCase() === cleanEmail);
}

export async function markAllNotificationsRead(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const items = await loadNotificationsRaw();
  const next = items.map((x) =>
    String(x.email).trim().toLowerCase() === cleanEmail ? { ...x, read: true } : x
  );
  await saveNotificationsRaw(next);
}
