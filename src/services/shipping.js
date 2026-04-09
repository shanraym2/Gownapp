const ZONES = [
  { key: "metro_manila", label: "Metro Manila", provinces: ["ncr", "metro manila", "manila"], fee: 150, etaDays: [1, 2] },
  { key: "luzon", label: "Luzon", provinces: ["bulacan", "laguna", "cavite", "rizal", "batangas", "pampanga", "quezon"], fee: 230, etaDays: [2, 4] },
  { key: "visayas", label: "Visayas", provinces: ["cebu", "iloilo", "bohol", "negros occidental", "negros oriental", "leyte", "samar"], fee: 290, etaDays: [3, 5] },
  { key: "mindanao", label: "Mindanao", provinces: ["davao del sur", "davao", "misamis oriental", "zamboanga del sur", "bukidnon"], fee: 320, etaDays: [4, 6] },
];

function normalize(input) {
  return String(input || "").trim().toLowerCase();
}

export function resolveShippingZone(province) {
  const p = normalize(province);
  const match = ZONES.find((z) => z.provinces.includes(p));
  return match || { key: "national", label: "National", fee: 350, etaDays: [4, 7] };
}

export function calculateShipping({ province, subtotal }) {
  const zone = resolveShippingZone(province);
  const baseFee = zone.fee;
  const subtotalNum = Number(subtotal || 0);
  const discount = subtotalNum >= 120000 ? 120 : subtotalNum >= 70000 ? 60 : 0;
  const shippingFee = Math.max(0, baseFee - discount);
  return {
    zoneKey: zone.key,
    zoneLabel: zone.label,
    baseFee,
    discount,
    shippingFee,
    etaMinDays: zone.etaDays[0],
    etaMaxDays: zone.etaDays[1],
    etaLabel: `${zone.etaDays[0]}-${zone.etaDays[1]} days`,
  };
}
