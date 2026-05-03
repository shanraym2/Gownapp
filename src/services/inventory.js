import { fetchGowns, setGownsCatalogAdmin } from "./gowns";
import { idsEqual, normalizeId } from "../utils/id";

function toNonNegativeInt(value, fallback = 0) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (Number.isNaN(n)) return fallback;
  return Math.max(0, n);
}

function normalizeCatalogItem(g) {
  const stockQty = toNonNegativeInt(g?.stockQty, 0);
  const lowStockThreshold = toNonNegativeInt(g?.lowStockThreshold, 0);
  return { ...g, stockQty, lowStockThreshold };
}

export async function ensureInventoryFields() {
  const items = await fetchGowns();
  const next = (Array.isArray(items) ? items : []).map(normalizeCatalogItem);
  await setGownsCatalogAdmin(next);
  return { ok: true, items: next };
}

export async function getStockForGownId(id) {
  const targetId = normalizeId(id);
  const items = await fetchGowns();
  const item = (Array.isArray(items) ? items : []).find((g) => idsEqual(g?.id, targetId));
  const normalized = item ? normalizeCatalogItem(item) : null;
  return { ok: Boolean(normalized), stockQty: normalized?.stockQty ?? 0, item: normalized };
}

export async function adjustStockAdmin(gownId, delta) {
  const targetId = normalizeId(gownId);
  const deltaInt = Number.parseInt(String(delta ?? "0"), 10) || 0;
  const items = await fetchGowns();
  const next = (Array.isArray(items) ? items : []).map(normalizeCatalogItem);
  const index = next.findIndex((g) => idsEqual(g?.id, targetId));
  if (index < 0) return { ok: false, error: "Gown not found." };
  const current = next[index];
  const updated = { ...current, stockQty: Math.max(0, Number(current.stockQty || 0) + deltaInt) };
  next[index] = updated;
  await setGownsCatalogAdmin(next);
  return { ok: true, item: updated };
}

export async function setStockAdmin(gownId, stockQty) {
  const targetId = normalizeId(gownId);
  const qty = toNonNegativeInt(stockQty, 0);
  const items = await fetchGowns();
  const next = (Array.isArray(items) ? items : []).map(normalizeCatalogItem);
  const index = next.findIndex((g) => idsEqual(g?.id, targetId));
  if (index < 0) return { ok: false, error: "Gown not found." };
  const updated = { ...next[index], stockQty: qty };
  next[index] = updated;
  await setGownsCatalogAdmin(next);
  return { ok: true, item: updated };
}

export async function validateAndReserveInventoryForOrder(orderItems) {
  const items = await fetchGowns();
  const catalog = (Array.isArray(items) ? items : []).map(normalizeCatalogItem);

  const needs = (Array.isArray(orderItems) ? orderItems : [])
    .map((i) => ({ id: normalizeId(i?.id), qty: toNonNegativeInt(i?.qty, 0) }))
    .filter((i) => Boolean(i.id) && i.qty > 0);

  const errors = [];
  for (const need of needs) {
    const g = catalog.find((x) => idsEqual(x?.id, need.id));
    if (!g) {
      errors.push(`Item #${need.id} is no longer available.`);
      continue;
    }
    if (g.stockQty < need.qty) {
      errors.push(`${g.name} only has ${g.stockQty} left (you requested ${need.qty}).`);
    }
  }

  if (errors.length) {
    return { ok: false, error: errors.join("\n") };
  }

  // Deduct stock
  const nextCatalog = catalog.map((g) => {
    const need = needs.find((n) => idsEqual(n.id, g?.id));
    if (!need) return g;
    return { ...g, stockQty: Math.max(0, Number(g.stockQty || 0) - need.qty) };
  });

  await setGownsCatalogAdmin(nextCatalog);
  return { ok: true };
}

