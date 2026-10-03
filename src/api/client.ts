import { API_BASE_URL } from "../config";
import type {
  Address,
  AuthResponse,
  BookDetail,
  BookQuery,
  BookSummary,
  Cart,
  CheckoutRequest,
  ErrorBody,
  FormatCode,
  Genre,
  Invoice,
  Order,
  Page,
  PaymentMethod,
  Profile,
  Review,
  Shelf,
  ShippingMethod,
  Tracking,
} from "./types";

const ACCESS_KEY = "reader.access";
const REFRESH_KEY = "reader.refresh";
const USER_KEY = "reader.user";

export class ApiError extends Error {
  status: number;
  code: string;
  details: { field: string; message: string }[];

  constructor(status: number, code: string, message: string, details: { field: string; message: string }[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_KEY);
}

export function setSession(access: string, refresh: string) {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export function readStoredProfile(): Profile | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Profile;
    if (!parsed || typeof parsed.id !== "string" || typeof parsed.name !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredProfile(profile: Profile) {
  localStorage.setItem(USER_KEY, JSON.stringify(profile));
}

async function readError(response: Response) {
  let body: ErrorBody | null = null;
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    body = null;
  }
  return new ApiError(
    response.status,
    body?.error.code ?? "request_failed",
    body?.error.message ?? `The bookstore API returned HTTP ${response.status}.`,
    body?.error.details ?? [],
  );
}

let refreshing: Promise<string | null> | null = null;

async function refreshAccess() {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return null;
  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });
  if (!response.ok) {
    clearSession();
    return null;
  }
  const tokens = (await response.json()) as { access: string; refresh: string };
  setSession(tokens.access, tokens.refresh);
  return tokens.access;
}

async function request<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers = new Headers();
  if (init.body !== undefined) headers.set("Content-Type", "application/json");
  const send = async (token: string | null) => {
    const next = new Headers(headers);
    if (init.auth !== false && token) next.set("Authorization", `Bearer ${token}`);
    return fetch(`${API_BASE_URL}${path}`, {
      method: init.method ?? "GET",
      headers: next,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    });
  };

  let token = init.auth === false ? null : getAccessToken();
  let response = await send(token);
  if (response.status === 401 && init.auth !== false && localStorage.getItem(REFRESH_KEY)) {
    refreshing ??= refreshAccess().finally(() => {
      refreshing = null;
    });
    token = await refreshing;
    if (token) response = await send(token);
  }
  if (!response.ok) throw await readError(response);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

function queryString(query: BookQuery) {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.genre) params.set("genre", query.genre);
  if (query.price && query.price !== "any") params.set("price", query.price);
  if (query.format) params.set("format", query.format);
  if (query.in_stock !== undefined) params.set("in_stock", String(query.in_stock));
  if (query.sort) params.set("sort", query.sort);
  if (query.page) params.set("page", String(query.page));
  if (query.page_size) params.set("page_size", String(query.page_size));
  const text = params.toString();
  return text ? `?${text}` : "";
}

export const api = {
  register(body: { name: string; email: string; password: string }) {
    return request<AuthResponse>("/api/v1/auth/register", { method: "POST", body, auth: false });
  },
  login(body: { email: string; password: string }) {
    return request<AuthResponse>("/api/v1/auth/login", { method: "POST", body, auth: false });
  },
  loginWithGoogle(idToken: string) {
    return request<AuthResponse>("/api/v1/auth/google", {
      method: "POST",
      body: { id_token: idToken },
      auth: false,
    });
  },
  logout() {
    const refresh = localStorage.getItem(REFRESH_KEY);
    return request<void>("/api/v1/auth/logout", { method: "POST", body: { refresh } });
  },
  me() {
    return request<Profile>("/api/v1/me");
  },
  updateMe(body: { name?: string; phone?: string | null; marketing_opt_in?: boolean }) {
    return request<Profile>("/api/v1/me", { method: "PATCH", body });
  },
  genres() {
    return request<Genre[]>("/api/v1/genres");
  },
  books(query: BookQuery) {
    return request<Page<BookSummary>>(`/api/v1/books${queryString(query)}`);
  },
  book(bookId: string) {
    return request<BookDetail>(`/api/v1/books/${bookId}`);
  },
  related(bookId: string) {
    return request<BookSummary[]>(`/api/v1/books/${bookId}/related`);
  },
  reviews(bookId: string) {
    return request<Page<Review>>(`/api/v1/books/${bookId}/reviews?page_size=12`);
  },
  createReview(bookId: string, body: { rating: number; body: string; edition?: string }) {
    return request<Review>(`/api/v1/books/${bookId}/reviews`, { method: "POST", body });
  },
  saveBook(bookId: string) {
    return request<{ book_id: string; saved: boolean }>(`/api/v1/books/${bookId}/save`, { method: "POST" });
  },
  unsaveBook(bookId: string) {
    return request<{ book_id: string; saved: boolean }>(`/api/v1/books/${bookId}/save`, { method: "DELETE" });
  },
  cart() {
    return request<Cart>("/api/v1/cart");
  },
  addCartItem(body: { book_id: string; format: FormatCode; quantity?: number }) {
    return request<Cart>("/api/v1/cart/items", { method: "POST", body });
  },
  updateCartItem(itemId: string, quantity: number) {
    return request<Cart>(`/api/v1/cart/items/${itemId}`, { method: "PATCH", body: { quantity } });
  },
  removeCartItem(itemId: string) {
    return request<Cart>(`/api/v1/cart/items/${itemId}`, { method: "DELETE" });
  },
  applyVoucher(code: string) {
    return request<Cart>("/api/v1/cart/voucher", { method: "POST", body: { code } });
  },
  removeVoucher() {
    return request<Cart>("/api/v1/cart/voucher", { method: "DELETE" });
  },
  shippingMethods(subtotal: string) {
    return request<ShippingMethod[]>(`/api/v1/shipping-methods?subtotal=${encodeURIComponent(subtotal)}`, { auth: false });
  },
  checkout(body: CheckoutRequest) {
    return request<Order>("/api/v1/checkout", { method: "POST", body });
  },
  oneClick(body: { book_id: string; format: FormatCode; quantity?: number }) {
    return request<Order>("/api/v1/checkout/one-click", { method: "POST", body });
  },
  orders(query: { status?: "all" | "active" | "past"; q?: string; page?: number }) {
    const params = new URLSearchParams();
    if (query.status) params.set("status", query.status);
    if (query.q) params.set("q", query.q);
    params.set("page_size", "20");
    if (query.page) params.set("page", String(query.page));
    return request<Page<Order>>(`/api/v1/orders?${params.toString()}`);
  },
  tracking(orderId: string) {
    return request<Tracking>(`/api/v1/orders/${orderId}/tracking`);
  },
  invoice(orderId: string) {
    return request<Invoice>(`/api/v1/orders/${orderId}/invoice`);
  },
  updateOrder(orderId: string, delivery_instructions: string) {
    return request<Order>(`/api/v1/orders/${orderId}`, { method: "PATCH", body: { delivery_instructions } });
  },
  buyAgain(orderId: string) {
    return request<Cart>(`/api/v1/orders/${orderId}/buy-again`, { method: "POST" });
  },
  addresses() {
    return request<Address[]>("/api/v1/addresses");
  },
  paymentMethods() {
    return request<PaymentMethod[]>("/api/v1/payment-methods");
  },
  shelves() {
    return request<{ id: string; name: string; is_default: boolean; book_count: number }[]>("/api/v1/shelves");
  },
  shelf(shelfId: string) {
    return request<Shelf>(`/api/v1/shelves/${shelfId}`);
  },
  subscribe(email: string) {
    return request<{ email: string; subscribed: boolean }>("/api/v1/newsletter/subscriptions", {
      method: "POST",
      body: { email },
      auth: false,
    });
  },
};
