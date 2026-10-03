import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ApiError, api, clearSession, getAccessToken, readStoredProfile, setSession, writeStoredProfile } from "../api/client";
import type { BookSummary, Cart, FormatCode, Profile } from "../api/types";
import { cartSocketUrl, savedSocketUrl } from "../config";

type SavedResult = "ok" | "auth" | "error";

type ShopContextValue = {
  user: Profile | null;
  cart: Cart | null;
  ready: boolean;
  notice: string | null;
  count: number;
  savedBooks: BookSummary[];
  shelfName: string;
  shelfLoaded: boolean;
  isSaved: (bookId: string, fallback?: boolean) => boolean;
  toggleSaved: (book: BookSummary) => Promise<SavedResult>;
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

function withSaved(book: BookSummary): BookSummary {
  return { ...book, saved: true };
}

function isSavedUpdate(value: unknown): value is { type: "saved.updated"; saved: { name?: string; saved_book_count?: number; books: BookSummary[] } } {
  if (!value || typeof value !== "object") return false;
  const message = value as { type?: unknown; saved?: { books?: unknown } };
  return message.type === "saved.updated" && !!message.saved && Array.isArray(message.saved.books);
}

function isCartUpdate(value: unknown): value is { type: "cart.updated"; cart: Cart } {
  if (!value || typeof value !== "object") return false;
  const message = value as { type?: unknown; cart?: { items?: unknown; item_count?: unknown } };
  return message.type === "cart.updated" && !!message.cart && Array.isArray(message.cart.items) && typeof message.cart.item_count === "number";
}

export function ShopProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [cart, setCart] = useState<Cart | null>(null);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [savedBooks, setSavedBooks] = useState<BookSummary[]>([]);
  const [removedIds, setRemovedIds] = useState<Set<string>>(() => new Set());
  const [shelfName, setShelfName] = useState("Saved Shelves");
  const [shelfLoaded, setShelfLoaded] = useState(false);
  const savedBooksRef = useRef<BookSummary[]>([]);
  const removedRef = useRef<Set<string>>(new Set());
  const shelfLoadedRef = useRef(false);
  const shelfVersion = useRef(0);
  const bookGeneration = useRef(new Map<string, number>());
  const saveTails = useRef(new Map<string, Promise<void>>());

  const commitShelf = useCallback((books: BookSummary[], removed: Set<string>, loaded: boolean) => {
    savedBooksRef.current = books;
    removedRef.current = removed;
    shelfLoadedRef.current = loaded;
    setSavedBooks(books);
    setRemovedIds(removed);
    setShelfLoaded(loaded);
  }, []);

  const adjustSavedCount = useCallback((delta: number) => {
    setUser((profile) => (
      profile ? { ...profile, saved_book_count: Math.max(0, profile.saved_book_count + delta) } : profile
    ));
  }, []);

  const replaceShelf = useCallback((serverBooks: BookSummary[]) => {
    commitShelf(serverBooks.map(withSaved), new Set(), true);
  }, [commitShelf]);

  const unionShelf = useCallback((serverBooks: BookSummary[]) => {
    if (!getAccessToken()) return;
    const removed = removedRef.current;
    const extras = savedBooksRef.current.filter((book) => !serverBooks.some((item) => item.id === book.id));
    const rest = serverBooks
      .filter((book) => !removed.has(book.id))
      .map((book) => withSaved(savedBooksRef.current.find((item) => item.id === book.id) ?? book));
    commitShelf([...extras.map(withSaved), ...rest], new Set(removed), true);
  }, [commitShelf]);

  const loadSavedShelf = useCallback(async () => {
    const started = shelfVersion.current;
    if (!getAccessToken()) {
      if (started !== shelfVersion.current) return;
      setShelfName("Saved Shelves");
      commitShelf([], new Set(), true);
      return;
    }
    try {
      const rows = await api.shelves();
      if (!getAccessToken()) return;
      const saved = rows.find((row) => row.is_default) ?? rows[0];
      if (!saved) {
        setShelfName("Saved Shelves");
        if (started !== shelfVersion.current) unionShelf([]);
        else replaceShelf([]);
        return;
      }
      const detail = await api.shelf(saved.id);
      if (!getAccessToken()) return;
      setShelfName(detail.name);
      if (started !== shelfVersion.current) unionShelf(detail.books);
      else replaceShelf(detail.books);
    } catch (error) {
      if (started !== shelfVersion.current || !getAccessToken()) return;
      setShelfLoaded(true);
      shelfLoadedRef.current = true;
      setNotice(message(error, "Shelves could not be opened."));
    }
  }, [commitShelf, replaceShelf, unionShelf]);

  const isSaved = useCallback((bookId: string, fallback = false) => {
    if (removedIds.has(bookId)) return false;
    if (savedBooks.some((book) => book.id === bookId)) return true;
    if (!shelfLoaded) return fallback;
    return false;
  }, [removedIds, savedBooks, shelfLoaded]);

  const toggleSaved = useCallback((book: BookSummary): Promise<SavedResult> => {
    if (!getAccessToken()) return Promise.resolve("auth");
    const wasSaved = removedRef.current.has(book.id)
      ? false
      : savedBooksRef.current.some((item) => item.id === book.id)
        ? true
        : shelfLoadedRef.current
          ? false
          : book.saved;
    const nextSaved = !wasSaved;
    const previousBooks = savedBooksRef.current;
    const previousRemoved = new Set(removedRef.current);
    const previousLoaded = shelfLoadedRef.current;
    const generation = (bookGeneration.current.get(book.id) ?? 0) + 1;
    bookGeneration.current.set(book.id, generation);
    shelfVersion.current += 1;

    const removed = new Set(removedRef.current);
    const without = savedBooksRef.current.filter((item) => item.id !== book.id);
    if (nextSaved) removed.delete(book.id);
    else removed.add(book.id);
    commitShelf(nextSaved ? [withSaved(book), ...without] : without, removed, true);
    adjustSavedCount(nextSaved ? 1 : -1);

    const request = () => (nextSaved ? api.saveBook(book.id) : api.unsaveBook(book.id));
    const queued = (saveTails.current.get(book.id) ?? Promise.resolve()).then(request, request);
    const settled = queued.then(async () => {
      if (bookGeneration.current.get(book.id) !== generation) return "ok" as const;
      try {
        await loadSavedShelf();
      } catch {
        /* The shelf list already includes the optimistic title. */
      }
      return "ok" as const;
    }).catch((error: unknown) => {
      if (bookGeneration.current.get(book.id) !== generation) return "error" as const;
      shelfVersion.current += 1;
      commitShelf(previousBooks, previousRemoved, previousLoaded);
      adjustSavedCount(nextSaved ? -1 : 1);
      if (error instanceof ApiError && error.status === 401) return "auth" as const;
      setNotice(message(error, "Could not update your shelf."));
      return "error" as const;
    });
    saveTails.current.set(book.id, settled.then(() => undefined, () => undefined));
    return settled;
  }, [adjustSavedCount, commitShelf, loadSavedShelf]);

  const loadSession = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      setCart(null);
      setShelfName("Saved Shelves");
      commitShelf([], new Set(), true);
      setReady(true);
      return;
    }
    const cached = readStoredProfile();
    if (cached) setUser(cached);
    try {
      const profile = await api.me();
      writeStoredProfile(profile);
      setUser(profile);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        clearSession();
        shelfVersion.current += 1;
        setUser(null);
        setCart(null);
        setShelfName("Saved Shelves");
        commitShelf([], new Set(), true);
        setReady(true);
        return;
      }
      if (!cached) {
        setUser(null);
        setReady(true);
        return;
      }
    }
    try {
      setCart(await api.cart());
    } catch {
      setCart(null);
    }
    await loadSavedShelf();
    setReady(true);
  }, [commitShelf, loadSavedShelf]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!user?.id) return;
    let stopped = false;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const clearRetry = () => {
      if (!retryTimer) return;
      clearTimeout(retryTimer);
      retryTimer = null;
    };

    const schedule = () => {
      if (stopped || attempt >= 8) return;
      clearRetry();
      const delay = Math.min(1000 * 2 ** attempt, 15000);
      attempt += 1;
      retryTimer = setTimeout(connect, delay);
    };

    const connect = () => {
      if (stopped) return;
      const token = getAccessToken();
      if (!token) {
        schedule();
        return;
      }
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
      const next = new WebSocket(cartSocketUrl(token));
      socket = next;
      next.onopen = () => {
        attempt = 0;
      };
      next.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        try {
          const parsed: unknown = JSON.parse(event.data);
          if (isCartUpdate(parsed)) setCart(parsed.cart);
        } catch {
          /* Ignore frames that are not a cart snapshot. */
        }
      };
      next.onclose = (event) => {
        if (socket === next) socket = null;
        if (stopped) return;
        if (event.code === 4401) {
          void api.cart().then((bag) => {
            if (!stopped) setCart(bag);
          }).catch(() => undefined).finally(schedule);
          return;
        }
        schedule();
      };
    };

    connect();
    return () => {
      stopped = true;
      clearRetry();
      if (!socket) return;
      socket.onclose = null;
      socket.close();
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    let stopped = false;
    let socket: WebSocket | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const clearRetry = () => {
      if (!retryTimer) return;
      clearTimeout(retryTimer);
      retryTimer = null;
    };

    const schedule = () => {
      if (stopped || attempt >= 8) return;
      clearRetry();
      const delay = Math.min(1000 * 2 ** attempt, 15000);
      attempt += 1;
      retryTimer = setTimeout(connect, delay);
    };

    const connect = () => {
      if (stopped) return;
      const token = getAccessToken();
      if (!token) {
        schedule();
        return;
      }
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
      const next = new WebSocket(savedSocketUrl(token));
      socket = next;
      next.onopen = () => {
        attempt = 0;
      };
      next.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        try {
          const parsed: unknown = JSON.parse(event.data);
          if (!isSavedUpdate(parsed)) return;
          if (parsed.saved.name) setShelfName(parsed.saved.name);
          replaceShelf(parsed.saved.books);
          if (typeof parsed.saved.saved_book_count === "number") {
            const count = parsed.saved.saved_book_count;
            setUser((profile) => {
              if (!profile || profile.saved_book_count === count) return profile;
              const next = { ...profile, saved_book_count: count };
              writeStoredProfile(next);
              return next;
            });
          }
        } catch {
          /* Ignore frames that are not a saved-items snapshot. */
        }
      };
      next.onclose = (event) => {
        if (socket === next) socket = null;
        if (stopped) return;
        if (event.code === 4401) {
          void loadSavedShelf().catch(() => undefined).finally(schedule);
          return;
        }
        schedule();
      };
    };

    const onVisible = () => {
      if (document.visibilityState !== "visible" || stopped) return;
      attempt = 0;
      clearRetry();
      if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) return;
      connect();
    };

    document.addEventListener("visibilitychange", onVisible);
    connect();
    return () => {
      stopped = true;
      clearRetry();
      document.removeEventListener("visibilitychange", onVisible);
      if (!socket) return;
      socket.onclose = null;
      socket.close();
    };
  }, [user?.id, loadSavedShelf, replaceShelf]);

  const acceptSession = useCallback(async (auth: { access: string; refresh: string; user: Profile }) => {
    setSession(auth.access, auth.refresh);
    writeStoredProfile(auth.user);
    setUser(auth.user);
    const bag = await api.cart();
    setCart(bag);
    shelfLoadedRef.current = false;
    setShelfLoaded(false);
    await loadSavedShelf();
    setNotice(`Welcome back, ${auth.user.name.split(" ")[0]}.`);
  }, [loadSavedShelf]);

  const login = useCallback(async (email: string, password: string) => {
    await acceptSession(await api.login({ email, password }));
  }, [acceptSession]);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    await acceptSession(await api.loginWithGoogle(idToken));
  }, [acceptSession]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const auth = await api.register({ name, email, password });
    setSession(auth.access, auth.refresh);
    writeStoredProfile(auth.user);
    setUser(auth.user);
    const bag = await api.cart();
    setCart(bag);
    shelfLoadedRef.current = false;
    setShelfLoaded(false);
    await loadSavedShelf();
    setNotice("Your shelf is ready.");
  }, [loadSavedShelf]);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* The local session still ends if the server is unreachable. */
    }
    clearSession();
    shelfVersion.current += 1;
    setUser(null);
    setCart(null);
    setShelfName("Saved Shelves");
    commitShelf([], new Set(), true);
  }, [commitShelf]);

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
    const profile = await api.me();
    writeStoredProfile(profile);
    setUser(profile);
  }, []);

  const value = useMemo<ShopContextValue>(
    () => ({
      user,
      cart,
      ready,
      notice,
      count: cart?.item_count ?? 0,
      savedBooks,
      shelfName,
      shelfLoaded,
      isSaved,
      toggleSaved,
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
    [user, cart, ready, notice, savedBooks, shelfName, shelfLoaded, isSaved, toggleSaved, login, loginWithGoogle, register, logout, addToCart, setQuantity, removeLine, applyVoucher, removeVoucher, refreshProfile],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw new Error("useShop must be used within ShopProvider");
  return value;
}
