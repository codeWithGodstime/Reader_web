/** Local API origin. Used only while `import.meta.env.DEV` is true. Matches `.env.example`. */
const LOCAL_API_BASE_URL = "http://127.0.0.1:8001";

function apiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL?.trim();
  if (configured) return configured;
  if (import.meta.env.DEV) return LOCAL_API_BASE_URL;
  throw new Error("VITE_API_BASE_URL is required. Set it in the environment before building.");
}

/** Django origin. Endpoint paths come from the backend contract. */
export const API_BASE_URL = apiBaseUrl();

/** Same host as the HTTP API, with the access JWT the REST client already stores. */
export function cartSocketUrl(accessToken: string) {
  const wsBase = API_BASE_URL.replace(/^http/i, "ws").replace(/\/$/, "");
  const url = new URL("/ws/cart/", `${wsBase}/`);
  url.searchParams.set("token", accessToken);
  return url.toString();
}

/** Same host and access JWT as the cart socket. */
export function savedSocketUrl(accessToken: string) {
  const wsBase = API_BASE_URL.replace(/^http/i, "ws").replace(/\/$/, "");
  const url = new URL("/ws/saved/", `${wsBase}/`);
  url.searchParams.set("token", accessToken);
  return url.toString();
}

/** Google Identity Services client ID. Empty leaves Continue with Google disabled. */
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? "";
