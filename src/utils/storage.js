import AsyncStorage from "@react-native-async-storage/async-storage";

const CART_KEY = "jce_mobile_cart";
const USER_KEY = "jce_mobile_user";
const FAVORITES_KEY = "jce_mobile_favorites";

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
