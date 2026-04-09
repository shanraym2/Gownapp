import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchGowns } from "../services/gowns";
import { clearUser, loadCart, loadFavorites, loadUser, saveCart, saveFavorites, saveUser } from "../utils/storage";
import { getLastSyncAt, syncUserData } from "../services/sync";

const ShopContext = createContext(null);

export function ShopProvider({ children }) {
  const [gowns, setGowns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [favoritesIds, setFavoritesIds] = useState([]);
  const [lastSyncedAt, setLastSyncedAt] = useState("");

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
        setCart(cartData);
        setUser(userData);
        setFavoritesIds(favoritesData.map((x) => Number(x)).filter((n) => !Number.isNaN(n)));
        setLastSyncedAt(lastSync);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const addToCart = async (id) => {
    const next = [...cart];
    const item = next.find((i) => i.id === id);
    if (item) item.qty += 1;
    else next.push({ id, qty: 1 });
    setCart(next);
    await saveCart(next);
  };

  const setQty = async (id, qty) => {
    const safeQty = Math.max(1, qty);
    const next = cart.map((i) => (i.id === id ? { ...i, qty: safeQty } : i));
    setCart(next);
    await saveCart(next);
  };

  const removeFromCart = async (id) => {
    const next = cart.filter((i) => i.id !== id);
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
        const gown = gowns.find((g) => Number(g.id) === Number(c.id));
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

  const favoritesSet = useMemo(() => new Set(favoritesIds.map((id) => Number(id))), [favoritesIds]);

  const favoritesDetailed = useMemo(() => {
    return favoritesIds
      .map((id) => gowns.find((g) => Number(g.id) === Number(id)))
      .filter(Boolean);
  }, [favoritesIds, gowns]);

  const toggleFavorite = async (id) => {
    const numericId = Number(id);
    const next = favoritesIds.includes(numericId)
      ? favoritesIds.filter((x) => Number(x) !== numericId)
      : [...favoritesIds, numericId];
    setFavoritesIds(next);
    await saveFavorites(next);
  };

  const value = {
    loading,
    gowns,
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
