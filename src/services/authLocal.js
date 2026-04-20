import AsyncStorage from "@react-native-async-storage/async-storage";
import { isRealName, passwordMeetsRules } from "../utils/authValidation";
import { normalizeRole } from "../utils/access";

const USERS_KEY = "jce_users";

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || "").trim());
}

async function sha256(input) {
  const text = String(input || "");
  try {
    if (!globalThis.crypto?.subtle) return text;
    const bytes = new TextEncoder().encode(text);
    const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    return text;
  }
}

export async function loadUsers() {
  try {
    const raw = await AsyncStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function saveUsers(users) {
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export async function registerUser({ name, email, password }) {
  const cleanName = String(name || "").trim().replace(/\s+/g, " ");
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || "");
  if (!isRealName(cleanName)) {
    return { ok: false, error: "Please use a real name (letters/spaces/hyphen/apostrophe only)." };
  }
  if (!isValidEmail(cleanEmail)) return { ok: false, error: "Please enter a valid email." };
  if (!passwordMeetsRules(cleanPassword)) {
    return { ok: false, error: "Password must be at least 8 chars with letters and numbers." };
  }
  const users = await loadUsers();
  if (users.some((u) => normalizeEmail(u.email) === cleanEmail)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const passwordHash = await sha256(cleanPassword);
  const role = cleanEmail.includes("admin") ? "admin" : "customer";
  const user = { id: Date.now(), name: cleanName, email: cleanEmail, passwordHash, role };
  const next = [...users, user];
  await saveUsers(next);
  return { ok: true, user };
}

export async function verifyLoginCredentials({ email, password }) {
  const cleanEmail = normalizeEmail(email);
  const users = await loadUsers();
  const hash = await sha256(password);
  const match = users.find((u) => normalizeEmail(u.email) === cleanEmail && u.passwordHash === hash);
  return match ? { ok: true, user: match } : { ok: false, error: "Invalid email or password." };
}

export async function resetUserPassword({ email, password }) {
  const cleanEmail = normalizeEmail(email);
  if (!passwordMeetsRules(password)) {
    return { ok: false, error: "Password must be at least 8 chars with letters and numbers." };
  }
  const users = await loadUsers();
  const index = users.findIndex((u) => normalizeEmail(u.email) === cleanEmail);
  if (index < 0) return { ok: false, error: "No account found with this email." };
  const hash = await sha256(password);
  const updated = [...users];
  updated[index] = { ...updated[index], passwordHash: hash };
  await saveUsers(updated);
  return { ok: true, user: updated[index] };
}

export async function updateUserProfile({ email, name, phone }) {
  const cleanEmail = normalizeEmail(email);
  const cleanName = String(name || "").trim().replace(/\s+/g, " ");
  const cleanPhone = String(phone || "").trim();
  if (!isRealName(cleanName)) {
    return { ok: false, error: "Please use a real name (letters/spaces/hyphen/apostrophe only)." };
  }
  const users = await loadUsers();
  const index = users.findIndex((u) => normalizeEmail(u.email) === cleanEmail);
  if (index < 0) return { ok: false, error: "No account found with this email." };
  const updated = [...users];
  updated[index] = { ...updated[index], name: cleanName, phone: cleanPhone };
  await saveUsers(updated);
  return { ok: true, user: updated[index] };
}

export async function changeUserPassword({ email, currentPassword, nextPassword }) {
  const cleanEmail = normalizeEmail(email);
  if (!passwordMeetsRules(nextPassword)) {
    return { ok: false, error: "New password must be at least 8 chars with letters and numbers." };
  }
  const users = await loadUsers();
  const index = users.findIndex((u) => normalizeEmail(u.email) === cleanEmail);
  if (index < 0) return { ok: false, error: "No account found with this email." };
  const currentHash = await sha256(currentPassword);
  if (users[index].passwordHash !== currentHash) {
    return { ok: false, error: "Current password is incorrect." };
  }
  const nextHash = await sha256(nextPassword);
  const updated = [...users];
  updated[index] = { ...updated[index], passwordHash: nextHash };
  await saveUsers(updated);
  return { ok: true };
}

export async function deleteUserAccount({ email, password }) {
  const cleanEmail = normalizeEmail(email);
  const users = await loadUsers();
  const index = users.findIndex((u) => normalizeEmail(u.email) === cleanEmail);
  if (index < 0) return { ok: false, error: "No account found with this email." };
  const hash = await sha256(password);
  if (users[index].passwordHash !== hash) {
    return { ok: false, error: "Password is incorrect." };
  }
  const updated = users.filter((u) => normalizeEmail(u.email) !== cleanEmail);
  await saveUsers(updated);
  return { ok: true };
}

// -------- Admin helpers (local staff management) --------

export async function listUsersAdmin() {
  const users = await loadUsers();
  return (Array.isArray(users) ? users : []).map((u) => ({ ...u, role: normalizeRole(u?.role) }));
}

export async function createUserAdmin({ name, email, password, role }) {
  const cleanName = String(name || "").trim().replace(/\s+/g, " ");
  const cleanEmail = normalizeEmail(email);
  const cleanPassword = String(password || "");
  const nextRole = normalizeRole(role);

  if (!isRealName(cleanName)) {
    return { ok: false, error: "Please use a real name (letters/spaces/hyphen/apostrophe only)." };
  }
  if (!isValidEmail(cleanEmail)) return { ok: false, error: "Please enter a valid email." };
  if (!passwordMeetsRules(cleanPassword)) {
    return { ok: false, error: "Password must be at least 8 chars with letters and numbers." };
  }
  if (nextRole === "customer") return { ok: false, error: "Staff role is required (admin/staff)." };

  const users = await loadUsers();
  if (users.some((u) => normalizeEmail(u.email) === cleanEmail)) {
    return { ok: false, error: "An account with this email already exists." };
  }
  const passwordHash = await sha256(cleanPassword);
  const user = { id: Date.now(), name: cleanName, email: cleanEmail, passwordHash, role: nextRole };
  const next = [...users, user];
  await saveUsers(next);
  return { ok: true, user };
}

export async function updateUserRoleAdmin({ email, role }) {
  const cleanEmail = normalizeEmail(email);
  const nextRole = normalizeRole(role);
  if (nextRole === "customer") return { ok: false, error: "Staff role is required." };
  const users = await loadUsers();
  const index = users.findIndex((u) => normalizeEmail(u.email) === cleanEmail);
  if (index < 0) return { ok: false, error: "No account found with this email." };
  const updated = [...users];
  updated[index] = { ...updated[index], role: nextRole };
  await saveUsers(updated);
  return { ok: true, user: updated[index] };
}

export async function deleteUserAdmin({ email }) {
  const cleanEmail = normalizeEmail(email);
  const users = await loadUsers();
  const index = users.findIndex((u) => normalizeEmail(u.email) === cleanEmail);
  if (index < 0) return { ok: false, error: "No account found with this email." };
  const updated = users.filter((u) => normalizeEmail(u.email) !== cleanEmail);
  await saveUsers(updated);
  return { ok: true };
}
