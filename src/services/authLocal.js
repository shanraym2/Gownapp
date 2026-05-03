import AsyncStorage from "@react-native-async-storage/async-storage";
import { isRealName, passwordMeetsRules } from "../utils/authValidation";
import { normalizeRole } from "../utils/access";

const USERS_KEY = "jce_users";
const API_BASE_URL = String(process.env.EXPO_PUBLIC_API_BASE_URL || "").trim().replace(/\/+$/, "");
const ADMIN_SECRET = String(process.env.EXPO_PUBLIC_ADMIN_SECRET || "").trim();

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

function makeUrl(path) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

async function requestJson(path, options = {}) {
  if (!API_BASE_URL) {
    return { ok: false, error: "API base URL is missing." };
  }
  try {
    const res = await fetch(makeUrl(path), {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.includeAdminSecret !== false && ADMIN_SECRET ? { "x-admin-secret": ADMIN_SECRET } : {}),
        ...(options.headers || {}),
      },
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.ok === false) {
      return { ok: false, error: data?.error || `Request failed (${res.status})` };
    }
    return { ok: true, data };
  } catch (error) {
    return { ok: false, error: error?.message || "Network request failed." };
  }
}

function splitName(name) {
  const clean = String(name || "").trim().replace(/\s+/g, " ");
  const parts = clean.split(" ").filter(Boolean);
  const firstName = parts[0] || clean;
  const lastName = parts.slice(1).join(" ") || firstName || "User";
  return { firstName, lastName, name: clean };
}

async function resolveUserByEmail(email, fallbackName = "") {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return null;

  const usersRes = await requestJson("/api/admin/users");
  if (usersRes.ok) {
    const match = (Array.isArray(usersRes.data?.users) ? usersRes.data.users : []).find(
      (u) => normalizeEmail(u?.email) === cleanEmail
    );
    if (match?.id) {
      return {
        id: String(match.id),
        firstName: String(match.firstName || "").trim(),
        lastName: String(match.lastName || "").trim(),
        name: String(match.name || `${match.firstName || ""} ${match.lastName || ""}`).trim(),
        email: cleanEmail,
        role: normalizeRole(match.role),
      };
    }
  }

  const ensured = await requestJson("/api/mobile/ensure-user", {
    method: "POST",
    body: { email: cleanEmail, name: String(fallbackName || "").trim() },
  });
  if (ensured.ok && ensured.data?.userId) {
    const { firstName, lastName, name } = splitName(fallbackName);
    return {
      id: String(ensured.data.userId),
      firstName,
      lastName,
      name,
      email: cleanEmail,
      role: "customer",
    };
  }
  return null;
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
  const { firstName, lastName } = splitName(cleanName);

  const remote = await requestJson("/api/auth/register", {
    method: "POST",
    includeAdminSecret: false,
    body: {
      firstName,
      lastName,
      email: cleanEmail,
      password: cleanPassword,
    },
  });
  if (remote.ok && remote.data?.user) {
    return {
      ok: true,
      user: {
        id: remote.data.user.id,
        name: remote.data.user.name,
        email: remote.data.user.email,
        role: normalizeRole(remote.data.user.role),
      },
    };
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
  const cleanPass = String(password || "");

  const remote = await requestJson("/api/auth/login", {
    method: "POST",
    includeAdminSecret: false,
    body: { email: cleanEmail, password: cleanPass },
  });
  if (remote.ok && remote.data?.user) {
    return {
      ok: true,
      user: {
        id: remote.data.user.id,
        name: remote.data.user.name,
        email: remote.data.user.email,
        role: normalizeRole(remote.data.user.role),
      },
    };
  }

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

  const remote = await requestJson("/api/auth/reset-password", {
    method: "POST",
    includeAdminSecret: false,
    body: { email: cleanEmail, password: String(password || "") },
  });
  if (remote.ok) return { ok: true };

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

  const resolved = await resolveUserByEmail(cleanEmail, cleanName);
  if (resolved?.id) {
    const { firstName, lastName } = splitName(cleanName);
    const remote = await requestJson("/api/auth/update-profile", {
      method: "PATCH",
      includeAdminSecret: false,
      headers: { "x-user-id": String(resolved.id) },
      body: {
        firstName,
        lastName,
        email: cleanEmail,
      },
    });
    if (remote.ok && remote.data?.user) {
      return {
        ok: true,
        user: {
          id: remote.data.user.id,
          name: remote.data.user.name,
          email: remote.data.user.email,
          phone: cleanPhone,
          role: normalizeRole(remote.data.user.role),
        },
      };
    }
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

  const loginCheck = await requestJson("/api/auth/login", {
    method: "POST",
    includeAdminSecret: false,
    body: { email: cleanEmail, password: String(currentPassword || "") },
  });
  if (loginCheck.ok && loginCheck.data?.user?.id) {
    const remote = await requestJson("/api/auth/update-profile", {
      method: "PATCH",
      includeAdminSecret: false,
      headers: { "x-user-id": String(loginCheck.data.user.id) },
      body: { password: String(nextPassword || "") },
    });
    if (remote.ok) return { ok: true };
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

  const loginCheck = await requestJson("/api/auth/login", {
    method: "POST",
    includeAdminSecret: false,
    body: { email: cleanEmail, password: String(password || "") },
  });
  if (loginCheck.ok && loginCheck.data?.user?.id) {
    const remote = await requestJson(`/api/admin/users?id=${encodeURIComponent(String(loginCheck.data.user.id))}`, {
      method: "DELETE",
    });
    if (remote.ok) return { ok: true };
  }

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
  const remote = await requestJson("/api/admin/users");
  if (remote.ok) {
    return (Array.isArray(remote.data?.users) ? remote.data.users : []).map((u) => ({
      id: u?.id,
      name: String(u?.name || `${u?.firstName || ""} ${u?.lastName || ""}`).trim(),
      firstName: u?.firstName || "",
      lastName: u?.lastName || "",
      email: String(u?.email || ""),
      phone: String(u?.phone || ""),
      role: normalizeRole(u?.role),
      isActive: u?.isActive !== false,
      createdAt: u?.createdAt || null,
    }));
  }
  const users = await loadUsers();
  return (Array.isArray(users) ? users : []).map((u) => ({ ...u, role: normalizeRole(u?.role), isActive: true }));
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

  const split = cleanName.split(/\s+/).filter(Boolean);
  const firstName = split[0] || cleanName;
  const lastName = split.slice(1).join(" ") || "User";

  const remote = await requestJson("/api/admin/users", {
    method: "POST",
    body: {
      firstName,
      lastName,
      email: cleanEmail,
      password: cleanPassword,
      role: nextRole,
    },
  });
  if (remote.ok) {
    return {
      ok: true,
      user: {
        id: remote.data?.user?.id,
        name: remote.data?.user?.name,
        email: remote.data?.user?.email,
        role: normalizeRole(remote.data?.user?.role),
        isActive: remote.data?.user?.isActive !== false,
      },
    };
  }
  const users = await loadUsers();
  if (users.some((u) => normalizeEmail(u.email) === cleanEmail)) return { ok: false, error: "An account with this email already exists." };
  const passwordHash = await sha256(cleanPassword);
  const user = { id: Date.now(), name: cleanName, email: cleanEmail, passwordHash, role: nextRole, isActive: true };
  await saveUsers([...users, user]);
  return { ok: true, user };
}

export async function updateUserRoleAdmin({ id, email, role }) {
  const cleanEmail = normalizeEmail(email);
  const nextRole = normalizeRole(role);
  if (nextRole === "customer") return { ok: false, error: "Staff role is required." };
  if (id) {
    const remote = await requestJson("/api/admin/users", {
      method: "PUT",
      body: { id, role: nextRole },
    });
    if (remote.ok) return { ok: true, user: remote.data?.user };
  }
  const users = await loadUsers();
  const index = users.findIndex((u) => normalizeEmail(u.email) === cleanEmail);
  if (index < 0) return { ok: false, error: "No account found with this email." };
  const updated = [...users];
  updated[index] = { ...updated[index], role: nextRole };
  await saveUsers(updated);
  return { ok: true, user: updated[index] };
}

export async function deleteUserAdmin({ id, email }) {
  const cleanEmail = normalizeEmail(email);
  if (id) {
    const remote = await requestJson(`/api/admin/users?id=${encodeURIComponent(String(id))}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (remote.ok) return { ok: true };
  }
  const users = await loadUsers();
  const index = users.findIndex((u) => normalizeEmail(u.email) === cleanEmail);
  if (index < 0) return { ok: false, error: "No account found with this email." };
  const updated = users.filter((u) => normalizeEmail(u.email) !== cleanEmail);
  await saveUsers(updated);
  return { ok: true };
}
