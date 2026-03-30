import AsyncStorage from "@react-native-async-storage/async-storage";

const OTP_KEY = "jce_mobile_otp_store";

async function loadOtpStore() {
  try {
    const raw = await AsyncStorage.getItem(OTP_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveOtpStore(store) {
  await AsyncStorage.setItem(OTP_KEY, JSON.stringify(store));
}

export async function sendLoginOtp(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) throw new Error("Email is required.");
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const store = await loadOtpStore();
  store[cleanEmail] = {
    otp,
    expiresAt: Date.now() + 5 * 60 * 1000,
  };
  await saveOtpStore(store);
  return { ok: true, devMode: true, otp };
}

export async function verifyLoginOtp(email, otp) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const code = String(otp || "").trim();
  const store = await loadOtpStore();
  const entry = store[cleanEmail];
  if (!entry) throw new Error("No OTP found for this email.");
  if (Date.now() > Number(entry.expiresAt || 0)) {
    delete store[cleanEmail];
    await saveOtpStore(store);
    throw new Error("OTP expired.");
  }
  if (String(entry.otp) !== code) throw new Error("Invalid OTP");
  delete store[cleanEmail];
  await saveOtpStore(store);
  return { ok: true };
}
