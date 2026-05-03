import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchGowns } from "../services/gowns";
import { clearUser, loadCart, loadFavorites, loadUser, saveCart, saveFavorites, saveUser } from "../utils/storage";
import { getLastSyncAt, syncUserData } from "../services/sync";
import { idsEqual, normalizeId } from "../utils/id";

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [gowns, setGowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [favoritesIds, setFavoritesIds] = useState([]);
  const [lastSyncedAt, setLastSyncedAt] = useState("");

  const reloadGowns = useCallback(async () => {
    const data = await fetchGowns();
    setGowns(Array.isArray(data) ? data : []);
    return data;
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [gownsData, cartData, userData, favoritesData] = await Promise.all([
          fetchGowns(),
          loadCart(),
          loadUser(),
          loadFavorites(),
        ]);
        const lastSync = await getLastSyncAt();
        if (!mounted) return;
        setGowns(gownsData);
        const normalizedCart = Array.isArray(cartData)
          ? cartData
              .map((x) => ({
                id: normalizeId(x?.id),
                qty: Math.max(1, Number(x?.qty) || 1),
              }))
              .filter((x) => x.id)
          : [];
        setCart(normalizedCart);
        setUser(userData);
        setFavoritesIds(favoritesData.map((x) => normalizeId(x)).filter(Boolean));
        setLastSyncedAt(lastSync);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addToCart = async (id, quantity = 1) => {
    const normalizedId = normalizeId(id);
    const addQty = Math.max(1, Number(quantity) || 1);
    if (!normalizedId) {
      return { ok: false, reason: "Invalid item." };
    }
    if (!user?.email) {
      return { ok: false, reason: "Please sign in first before adding items to cart.", requiresAuth: true };
    }

    const gown = gowns.find((g) => idsEqual(g.id, normalizedId));
    if (!gown) {
      return { ok: false, reason: "Item not found." };
    }
    const stockQty = gown?.stockQty === undefined ? null : Number(gown.stockQty);
    if (Number.isFinite(stockQty) && stockQty <= 0) {
      return { ok: false, reason: "Out of stock." };
    }

    const next = [...cart];
    const item = next.find((i) => idsEqual(i.id, normalizedId));
    if (item) {
      const nextQty = item.qty + addQty;
      if (Number.isFinite(stockQty) && nextQty > stockQty) {
        return { ok: false, reason: `Only ${stockQty} left.` };
      }
      item.qty = nextQty;
    } else {
      if (Number.isFinite(stockQty) && addQty > stockQty) {
        return { ok: false, reason: `Only ${stockQty} left.` };
      }
      next.push({ id: normalizedId, qty: addQty });
    }
    setCart(next);
    await saveCart(next);
    return { ok: true };
  };

  const setQty = async (id, qty) => {
    const normalizedId = normalizeId(id);
    const gown = gowns.find((g) => idsEqual(g.id, normalizedId));
    const stockQty = gown?.stockQty === undefined ? null : Number(gown.stockQty);
    const safeQty = Math.max(1, qty);
    const cappedQty =
      Number.isFinite(stockQty) && stockQty >= 0 ? Math.min(safeQty, stockQty) : safeQty;
    const next = cart.map((i) => (idsEqual(i.id, normalizedId) ? { ...i, qty: cappedQty } : i));
    setCart(next);
    await saveCart(next);
    return { ok: true, qty: cappedQty };
  };

  const removeFromCart = async (id) => {
    const normalizedId = normalizeId(id);
    const next = cart.filter((i) => !idsEqual(i.id, normalizedId));
    setCart(next);
    await saveCart(next);
  };

  const clearCart = async () => {
    setCart([]);
    await saveCart([]);
  };

  const login = async (nextUser) => {
    setUser(nextUser);
    await saveUser(nextUser);
  };

  const logout = async () => {
    setUser(null);
    await clearUser();
  };

  const syncNow = async () => {
    if (!user?.email) return { ok: false, reason: "Please sign in first." };
    const result = await syncUserData({
      user,
      cart,
      favoritesIds,
      syncedAt: new Date().toISOString(),
    });
    if (result?.ok && result?.lastSyncedAt) {
      setLastSyncedAt(result.lastSyncedAt);
    }
    return result;
  };

  const cartDetailed = useMemo(() => {
    return cart
      .map((c) => {
        const gown = gowns.find((g) => idsEqual(g.id, c.id));
        if (!gown) return null;
        const priceNum = Number(String(gown.price || "").replace(/[^\d]/g, "")) || 0;
        return { ...gown, qty: c.qty, subtotal: priceNum * c.qty, priceNum };
      })
      .filter(Boolean);
  }, [cart, gowns]);

  const subtotal = useMemo(
    () => cartDetailed.reduce((sum, item) => sum + item.subtotal, 0),
    [cartDetailed]
  );

  const favoritesSet = useMemo(() => new Set(favoritesIds.map((id) => normalizeId(id))), [favoritesIds]);

  const favoritesDetailed = useMemo(() => {
    return favoritesIds
      .map((id) => gowns.find((g) => idsEqual(g.id, id)))
      .filter(Boolean);
  }, [favoritesIds, gowns]);

  const toggleFavorite = async (id) => {
    const normalizedId = normalizeId(id);
    const next = favoritesIds.map(normalizeId).includes(normalizedId)
      ? favoritesIds.map(normalizeId).filter((x) => x !== normalizedId)
      : [...favoritesIds.map(normalizeId), normalizedId];
    setFavoritesIds(next);
    await saveFavorites(next);
  };

  const value = {
    loading,
    gowns,
    reloadGowns,
    cartDetailed,
    subtotal,
    favoritesIds,
    favoritesDetailed,
    favoritesSet,
    toggleFavorite,
    user,
    addToCart,
    setQty,
    removeFromCart,
    clearCart,
    login,
    logout,
    lastSyncedAt,
    syncNow,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside ShopProvider");
  return ctx;
}
