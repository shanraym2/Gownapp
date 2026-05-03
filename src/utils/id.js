export function normalizeId(value) {
  return String(value ?? "").trim();
}

export function idsEqual(a, b) {
  return normalizeId(a) === normalizeId(b);
}
