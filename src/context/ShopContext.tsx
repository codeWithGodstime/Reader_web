import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { ApiError, api, clearSession, getAccessToken, setSession } from "../api/client";
import type { Cart, FormatCode, Profile } from "../api/types";

type ShopContextValue = {
  user: Profile | null;
  cart: Cart | null;
  ready: boolean;
  notice: string | null;
  count: number;
  clearNotice: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  addToCart: (bookId: string, format: FormatCode, quantity?: number) => Promise<boolean>;
  setQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeLine: (itemId: string) => Promise<void>;
  applyVoucher: (code: string) => Promise<void>;
  removeVoucher: () => Promise<void>;
  replaceCart: (cart: Cart) => void;
  refreshProfile: () => Promise<void>;
};

const ShopContext = createContext<ShopContextValue | null>(null);

function message(error: unknown, fallback: string) {
  return error instanceof ApiError ? error.message : fallback;
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadSession = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setCart(null);
      setReady(true);
      return;
    }
    try {
      const [profile, bag] = await Promise.all([api.me(), api.cart()]);
      setUser(profile);
      setCart(bag);
    } catch {
      clearSession();
      setUser(null);
      setCart(null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const acceptSession = useCallback(async (auth: { access: string; refresh: string; user: Profile }) => {
    setSession(auth.access, auth.refresh);
    setUser(auth.user);
    const bag = await api.cart();
    setCart(bag);
    setNotice(`Welcome back, ${auth.user.name.split(" ")[0]}.`);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await acceptSession(await api.login({ email, password }));
  }, [acceptSession]);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    await acceptSession(await api.loginWithGoogle(idToken));
  }, [acceptSession]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const auth = await api.register({ name, email, password });
    setSession(auth.access, auth.refresh);
    setUser(auth.user);
    const bag = await api.cart();
    setCart(bag);
    setNotice("Your shelf is ready.");
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* The local session still ends if the server is unreachable. */
    }
    clearSession();
    setUser(null);
    setCart(null);
  }, []);

  const addToCart = useCallback(async (bookId: string, format: FormatCode, quantity = 1) => {
    if (!getAccessToken()) {
      setNotice("Sign in to add a book to your bag.");
      return false;
    }
    try {
      setCart(await api.addCartItem({ book_id: bookId, format, quantity }));
      setNotice("Added to your bag");
      return true;
    } catch (error) {
      setNotice(message(error, "Could not update the bag."));
      return false;
    }
  }, []);

  const setQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      setCart(await api.updateCartItem(itemId, quantity));
    } catch (error) {
      setNotice(message(error, "Could not update that quantity."));
    }
  }, []);

  const removeLine = useCallback(async (itemId: string) => {
    try {
      setCart(await api.removeCartItem(itemId));
    } catch (error) {
      setNotice(message(error, "Could not remove that title."));
    }
  }, []);

  const applyVoucher = useCallback(async (code: string) => {
    setCart(await api.applyVoucher(code));
    setNotice("Voucher applied.");
  }, []);

  const removeVoucher = useCallback(async () => {
    setCart(await api.removeVoucher());
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!getAccessToken()) return;
    setUser(await api.me());
  }, []);

  const value = useMemo<ShopContextValue>(
    () => ({
      user,
      cart,
      ready,
      notice,
      count: cart?.item_count ?? 0,
      clearNotice: () => setNotice(null),
      login,
      loginWithGoogle,
      register,
      logout,
      addToCart,
      setQuantity,
      removeLine,
      applyVoucher,
      removeVoucher,
      replaceCart: setCart,
      refreshProfile,
    }),
    [user, cart, ready, notice, login, loginWithGoogle, register, logout, addToCart, setQuantity, removeLine, applyVoucher, removeVoucher, refreshProfile],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop must be used within ShopProvider");
  return value;
}
