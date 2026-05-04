import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL, adminAuthHeaders, getAdminSecret } from "../config/apiEnv";

const STORAGE_KEY = "jce_mobile_admin_secret";

/** Call on app start before any admin API requests. */
export async function loadStoredAdminSecret() {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    const t = String(v || "").trim();
    if (t) globalThis.__JCE_ADMIN_SECRET_OVERRIDE__ = t;
    else delete globalThis.__JCE_ADMIN_SECRET_OVERRIDE__;
  } catch {
    delete globalThis.__JCE_ADMIN_SECRET_OVERRIDE__;
  }
}

/** Persist the same secret you use on the web admin panel (browser localStorage). */
export async function saveAdminSecret(secret) {
  const t = String(secret || "").trim();
  if (t) {
    await AsyncStorage.setItem(STORAGE_KEY, t);
    globalThis.__JCE_ADMIN_SECRET_OVERRIDE__ = t;
  } else {
    await AsyncStorage.removeItem(STORAGE_KEY);
    delete globalThis.__JCE_ADMIN_SECRET_OVERRIDE__;
  }
}

export async function pingAdminApi() {
  if (!getAdminSecret()) return { ok: false, error: "No admin secret configured." };
  const url = `${String(API_BASE_URL).replace(/\/+$/, "")}/api/admin/ping`;
  try {
    const r = await fetch(url, { headers: adminAuthHeaders() });
    const body = await r.json().catch(() => ({}));
    return { ok: r.ok && body?.ok === true, status: r.status };
  } catch (e) {
    return { ok: false, error: e?.message || "Network error" };
  }
}
