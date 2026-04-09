import AsyncStorage from "@react-native-async-storage/async-storage";
import { GOWNS } from "../data/gowns";

const GOWNS_KEY = "jce_mobile_gowns_catalog";

export async function fetchGowns() {
  try {
    const raw = await AsyncStorage.getItem(GOWNS_KEY);
    const stored = raw ? JSON.parse(raw) : null;
    if (Array.isArray(stored) && stored.length) return stored;
    return GOWNS;
  } catch {
    return GOWNS;
  }
}

async function saveGownsCatalog(items) {
  await AsyncStorage.setItem(GOWNS_KEY, JSON.stringify(items || []));
}

export async function getAllGownsAdmin() {
  return fetchGowns();
}

export async function upsertGownAdmin(payload) {
  const items = await fetchGowns();
  const id = Number(payload?.id) || Date.now();
  const nextItem = {
    id,
    name: String(payload?.name || "").trim(),
    price: String(payload?.price || "").trim() || "P0",
    promoPrice: String(payload?.promoPrice || "").trim(),
    image: String(payload?.image || "").trim(),
    alt: String(payload?.alt || "").trim(),
    type: String(payload?.type || "").trim() || "Gowns",
    color: String(payload?.color || "").trim() || "Ivory",
    silhouette: String(payload?.silhouette || "").trim() || "A-line",
    description: String(payload?.description || "").trim() || "No description provided.",
    promo: Boolean(payload?.promo),
  };
  const index = items.findIndex((x) => Number(x.id) === id);
  const next = [...items];
  if (index >= 0) next[index] = { ...next[index], ...nextItem };
  else next.unshift(nextItem);
  await saveGownsCatalog(next);
  return { ok: true, item: nextItem };
}

export async function deleteGownAdmin(id) {
  const numericId = Number(id);
  const items = await fetchGowns();
  const next = items.filter((x) => Number(x.id) !== numericId);
  await saveGownsCatalog(next);
  return { ok: true };
}
