import AsyncStorage from "@react-native-async-storage/async-storage";

const SYNC_ENDPOINT_KEY = "jce_mobile_sync_endpoint";
const LAST_SYNC_AT_KEY = "jce_mobile_last_sync_at";

export async function setSyncEndpoint(url) {
  const clean = String(url || "").trim();
  await AsyncStorage.setItem(SYNC_ENDPOINT_KEY, clean);
}

export async function getSyncEndpoint() {
  try {
    const v = await AsyncStorage.getItem(SYNC_ENDPOINT_KEY);
    return v || "";
  } catch {
    return "";
  }
}

export async function getLastSyncAt() {
  try {
    return (await AsyncStorage.getItem(LAST_SYNC_AT_KEY)) || "";
  } catch {
    return "";
  }
}

export async function syncUserData(payload) {
  const endpoint = await getSyncEndpoint();
  if (!endpoint) {
    return { ok: false, skipped: true, reason: "Sync endpoint is not configured." };
  }
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  if (!res.ok) {
    const msg = await res.text();
    return { ok: false, skipped: false, reason: msg || `Sync failed (${res.status})` };
  }
  const now = new Date().toISOString();
  await AsyncStorage.setItem(LAST_SYNC_AT_KEY, now);
  return { ok: true, lastSyncedAt: now };
}
