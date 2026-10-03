export type FormatCode = "paperback" | "hardcover" | "ebook" | "signed";
export type PriceBand = "any" | "under_16" | "from_16_to_18" | "over_18";
export type SortKey = "featured" | "title" | "price_asc" | "price_desc" | "newest" | "rating";
export type Badge = "bestseller" | "staff_favorite" | "new_release" | "signed_bookplate";
export type OrderStatus = "confirmed" | "packed" | "shipped" | "out_for_delivery" | "delivered" | "cancelled";

export type FieldError = { field: string; message: string };

export type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: FieldError[];
  };
};

export type Page<T> = {
  count: number;
  page: number;
  page_size: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Genre = { slug: string; name: string; book_count: number };

export type BookSummary = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string;
  author_name: string;
  genre: Genre;
  rating: number;
  review_count: number;
  price: string;
  compare_at_price: string | null;
  currency: string;
  format: FormatCode;
  cover_url: string;
  badges: Badge[];
  in_stock: boolean;
  saved: boolean;
};

export type BookFormat = {
  code: FormatCode;
  label: string;
  detail: string;
  price: string;
  compare_at_price: string | null;
  currency: string;
  in_stock: boolean;
  rare: boolean;
};

export type BookDetail = BookSummary & {
  author: { id: string; name: string; bio: string; title_count: number };
  sku: string;
  pages: number;
  publisher: string;
  language: string;
  isbn13: string;
  dimensions: string;
  published_on: string;
  formats: BookFormat[];
  gallery: { label: string; url: string }[];
  table_of_contents: { title: string; page: number }[];
  curator_note: { quote: string; name: string; role: string } | null;
};

export type Review = {
  id: string;
  reviewer_name: string;
  reviewer_title: string | null;
  rating: number;
  body: string;
  edition: string | null;
  verified_purchase: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  member_since: string;
  patron_number: string;
  loyalty_points: number;
  voucher: { code: string; amount: string; currency: string } | null;
  marketing_opt_in: boolean;
  active_order_count: number;
  shelf_count: number;
  saved_book_count: number;
};

export type AuthResponse = { access: string; refresh: string; user: Profile };

export type CartItem = {
  id: string;
  book_id: string;
  title: string;
  author_name: string;
  cover_url: string;
  format: FormatCode;
  format_label: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  currency: string;
};

export type Cart = {
  id: string;
  items: CartItem[];
  item_count: number;
  currency: string;
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
  voucher: { code: string; amount: string; currency: string } | null;
  free_shipping_threshold: string;
  amount_until_free_shipping: string;
};

export type ShippingMethod = {
  code: "standard" | "express";
  label: string;
  detail: string;
  price: string;
  currency: string;
  eta: string;
};

export type AddressInput = {
  full_name: string;
  street: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  phone: string;
  save?: boolean;
};

export type Address = AddressInput & { id: string; is_default: boolean; line2: string | null };

export type PaymentInput = {
  method: "card" | "paypal" | "google_pay";
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  save?: boolean;
};

export type PaymentMethod = {
  id: string;
  method: "card" | "paypal" | "google_pay";
  brand: string | null;
  last4: string | null;
  exp_month: number | null;
  exp_year: number | null;
  is_default: boolean;
};

export type CheckoutRequest = {
  email: string;
  marketing_opt_in?: boolean;
  shipping_method: "standard" | "express";
  address: AddressInput;
  payment: PaymentInput;
};

export type OrderItem = {
  book_id: string | null;
  title: string;
  author_name: string;
  cover_url: string;
  format: FormatCode;
  format_label: string;
  quantity: number;
  unit_price: string;
  line_total: string;
  currency: string;
};

export type Order = {
  id: string;
  number: string;
  status: OrderStatus;
  email: string;
  placed_at: string;
  estimated_delivery: string | null;
  currency: string;
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
  shipping_method: "standard" | "express";
  item_count: number;
  items: OrderItem[];
  address: AddressInput;
  payment: PaymentInput;
  tracking_number: string | null;
  carrier: string | null;
  delivery_instructions: string;
};

export type Tracking = {
  order_id: string;
  number: string;
  status: OrderStatus;
  carrier: string | null;
  tracking_number: string | null;
  estimated_delivery: string | null;
  events: {
    code: OrderStatus;
    label: string;
    location: string | null;
    occurred_at: string | null;
    state: "completed" | "current" | "upcoming";
  }[];
};

export type Invoice = {
  order_id: string;
  number: string;
  placed_at: string;
  email: string;
  ship_to: AddressInput;
  items: OrderItem[];
  subtotal: string;
  discount: string;
  shipping: string;
  tax: string;
  total: string;
  currency: string;
  payment: PaymentInput;
};

export type Shelf = {
  id: string;
  name: string;
  is_default: boolean;
  book_count: number;
  books: BookSummary[];
};

export type BookQuery = {
  q?: string;
  genre?: string;
  price?: PriceBand;
  format?: FormatCode;
  in_stock?: boolean;
  sort?: SortKey;
  page?: number;
  page_size?: number;
};
