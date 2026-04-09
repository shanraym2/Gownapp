import AsyncStorage from "@react-native-async-storage/async-storage";

const CART_KEY = "jce_mobile_cart";
const USER_KEY = "jce_mobile_user";
const FAVORITES_KEY = "jce_mobile_favorites";
const AR_FIT_PROFILES_KEY = "jce_mobile_ar_fit_profiles";
const ADDRESSES_KEY = "jce_mobile_addresses";
const CHECKOUT_PROFILE_KEY = "jce_mobile_checkout_profiles";

export async function loadCart() {
  try {
    const raw = await AsyncStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveCart(items) {
  await AsyncStorage.setItem(CART_KEY, JSON.stringify(items));
}

export async function loadUser() {
  try {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function saveUser(user) {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function clearUser() {
  await AsyncStorage.removeItem(USER_KEY);
}

export async function loadFavorites() {
  try {
    const raw = await AsyncStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveFavorites(ids) {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
}

export async function loadArFitProfiles() {
  try {
    const raw = await AsyncStorage.getItem(AR_FIT_PROFILES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveArFitProfiles(profiles) {
  await AsyncStorage.setItem(AR_FIT_PROFILES_KEY, JSON.stringify(profiles));
}

export async function loadAddresses() {
  try {
    const raw = await AsyncStorage.getItem(ADDRESSES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveAddresses(addressesByEmail) {
  await AsyncStorage.setItem(ADDRESSES_KEY, JSON.stringify(addressesByEmail || {}));
}

export async function loadCheckoutProfiles() {
  try {
    const raw = await AsyncStorage.getItem(CHECKOUT_PROFILE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export async function saveCheckoutProfiles(profilesByEmail) {
  await AsyncStorage.setItem(CHECKOUT_PROFILE_KEY, JSON.stringify(profilesByEmail || {}));
}
