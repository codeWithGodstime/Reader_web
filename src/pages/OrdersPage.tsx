import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { Address, Invoice, Order, PaymentMethod, Shelf, Tracking } from "../api/types";
import { AVATAR_URL } from "../brand";
import { Cover } from "../components/Cover";
import { Icon } from "../components/Icon";
import { useShop } from "../context/ShopContext";
import { dollars } from "../lib/money";

const panels = [
  { id: "orders", label: "Orders & Tracking", icon: "inventory_2" },
  { id: "shelves", label: "Saved Shelves", icon: "bookmarks" },
  { id: "account", label: "Account Settings", icon: "manage_accounts" },
  { id: "payment", label: "Addresses & Payment", icon: "credit_card" },
] as const;

type PanelId = (typeof panels)[number]["id"];

export function OrdersPage() {
  const { user, ready, replaceCart, refreshProfile } = useShop();
  const [params, setParams] = useSearchParams();
  const panel = (params.get("panel") as PanelId) || "orders";
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<Order[]>([]);
  const [past, setPast] = useState<Order[]>([]);
  const [tracking, setTracking] = useState<Tracking | null>(null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [instructions, setInstructions] = useState("");
  const [note, setNote] = useState("");
  const [shelf, setShelf] = useState<Shelf | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? "");
  }, [user]);

  useEffect(() => {
    if (!ready || !user) return;
    let activeRequest = true;
    setStatus("loading");
    Promise.all([api.orders({ status: "active" }), api.orders({ status: "past", q: query || undefined })])
      .then(async ([open, closed]) => {
        if (!activeRequest) return;
        setActive(open.results);
        setPast(closed.results);
        const first = open.results[0];
        if (first) {
          setInstructions(first.delivery_instructions ?? "");
          setTracking(await api.tracking(first.id));
        } else setTracking(null);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!activeRequest) return;
        setMessage(error instanceof ApiError ? error.message : "Orders could not be loaded.");
        setStatus("error");
      });
    return () => {
      activeRequest = false;
    };
  }, [ready, user, query]);

  useEffect(() => {
    if (!user || panel !== "shelves") return;
    api.shelves().then(async (rows) => {
      const saved = rows.find((row) => row.is_default) ?? rows[0];
      if (saved) setShelf(await api.shelf(saved.id));
    }).catch((error: unknown) => setMessage(error instanceof ApiError ? error.message : "Shelves could not be opened."));
  }, [user, panel]);

  useEffect(() => {
    if (!user || panel !== "payment") return;
    Promise.all([api.addresses(), api.paymentMethods()]).then(([nextAddresses, nextPayments]) => {
      setAddresses(nextAddresses);
      setPayments(nextPayments);
    }).catch((error: unknown) => setMessage(error instanceof ApiError ? error.message : "Saved details could not be opened."));
  }, [user, panel]);

  if (!ready) return <div className="mx-auto max-w-7xl px-5 py-10"><div className="h-64 animate-pulse rounded-2xl bg-sheet" /></div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="font-display text-4xl text-forest">Orders & Tracking</h1>
        <p className="mt-2 text-sm text-muted">Sign in to see parcels, shelves, and receipts.</p>
        <Link to="/login" className="mt-4 inline-flex rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white">Sign in</Link>
      </div>
    );
  }

  const shipment = active[0];

  function select(id: PanelId) {
    const next = new URLSearchParams(params);
    if (id === "orders") next.delete("panel");
    else next.set("panel", id);
    setParams(next);
  }

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-12">
      <aside className="space-y-4 lg:col-span-3">
        <div className="rounded-2xl bg-card p-5 shadow-sm">
          <img src={AVATAR_URL} alt="" className="h-16 w-16 rounded-full object-cover" />
          <h1 className="mt-3 font-display text-2xl text-forest">{user.name}</h1>
          <p className="text-sm text-muted">Bibliophile Fellow</p>
          <p className="text-xs text-muted">Member since {user.member_since} • Reader Guild Patron #{user.patron_number}</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Stat icon="local_shipping" value={`${user.active_order_count} Active`} label="In-transit parcel" />
          <Stat icon="bookmarks" value={`${user.shelf_count} Shelves`} label={`${user.saved_book_count} saved books`} />
          <Stat icon="loyalty" value={`${user.loyalty_points} pts`} label={user.voucher ? `${dollars(user.voucher.amount)} voucher` : "No voucher"} />
        </div>
        <nav className="rounded-2xl bg-card p-2 shadow-sm">
          {panels.map((item) => (
            <button key={item.id} type="button" onClick={() => select(item.id)} className={`flex w-full items-center gap-2 rounded-xl px-3 py-3 text-left text-sm font-semibold ${panel === item.id ? "bg-forest text-white" : "text-ink hover:bg-sheet"}`}>
              <Icon name={item.icon} className="text-base" /> {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <section className="space-y-6 lg:col-span-9">
        {message && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-[#93000a]">{message}</p>}
        {panel === "orders" && status === "loading" && <div className="h-64 animate-pulse rounded-2xl bg-sheet" />}
        {panel === "orders" && status === "error" && <p className="text-sm text-muted">{message}</p>}
        {panel === "orders" && status === "ready" && (
          <>
            {shipment ? (
              <article className="rounded-2xl bg-card p-6 shadow-sm">
                <p className="text-[11px] font-bold tracking-wider text-terracotta uppercase">Active Shipment</p>
                <h2 className="font-display text-[28px] text-forest">Estimated Delivery: {shipment.estimated_delivery ?? "Being scheduled"}</h2>
                <p className="mt-1 text-sm text-muted">Order #{shipment.number} • Placed {new Date(shipment.placed_at).toLocaleDateString()} • {shipment.item_count} items • {dollars(shipment.total)}</p>
                <div className="mt-4 rounded-xl bg-sheet p-4 text-sm">
                  <p className="font-semibold text-forest">Carrier Information</p>
                  <p className="text-muted">{tracking?.carrier ?? shipment.carrier} • Tracking ID: {tracking?.tracking_number ?? shipment.tracking_number}</p>
                  <button type="button" className="mt-2 text-xs font-semibold text-terracotta" onClick={() => void navigator.clipboard?.writeText(tracking?.tracking_number ?? shipment.tracking_number ?? "")}>Copy tracking ID</button>
                </div>
                <ol className="mt-5 grid gap-3 md:grid-cols-5">
                  {(tracking?.events ?? []).map((step) => (
                    <li key={step.code} className={`rounded-xl p-3 ${step.state === "current" ? "bg-forest text-white" : "bg-sheet"}`}>
                      <p className="text-sm font-semibold">{step.label}</p>
                      <p className={`text-xs ${step.state === "current" ? "text-foam" : "text-muted"}`}>{step.occurred_at ? new Date(step.occurred_at).toLocaleString() : step.state}</p>
                    </li>
                  ))}
                </ol>
                <h3 className="mt-6 font-display text-xl text-forest">Parcel Contents ({shipment.items.length} Volumes)</h3>
                <ul className="mt-3 space-y-3">
                  {shipment.items.map((item) => (
                    <li key={`${item.title}-${item.format}`} className="flex gap-3">
                      <div className="spine h-20 w-14 overflow-hidden rounded-md bg-sheet">
                        <Cover src={item.cover_url} alt={item.title} title={item.title} author={item.author_name} />
                      </div>
                      <div>
                        <p className="font-display text-lg text-forest">{item.title}</p>
                        <p className="text-xs text-muted">{item.author_name} • {item.format_label}</p>
                        <p className="text-sm font-semibold">{dollars(item.unit_price)} · Qty: {item.quantity}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" className="rounded-full border border-linen px-4 py-2 text-sm font-semibold" onClick={() => setNote(note ? "" : instructions || "Leave the parcel with the doorman.")}>Change Delivery Instructions</button>
                  <button type="button" className="rounded-full border border-linen px-4 py-2 text-sm font-semibold" onClick={() => void api.invoice(shipment.id).then(setInvoice)}>View Invoice / Receipt</button>
                </div>
                {note !== "" && (
                  <form className="mt-3 flex gap-2" onSubmit={(event) => {
                    event.preventDefault();
                    void api.updateOrder(shipment.id, note).then((order) => {
                      setInstructions(order.delivery_instructions);
                      setNote("");
                    });
                  }}>
                    <input value={note} onChange={(event) => setNote(event.target.value)} className="w-full rounded-xl border border-linen px-3 py-2 text-sm" />
                    <button type="submit" className="rounded-full bg-forest px-4 text-sm font-semibold text-white">Save</button>
                  </form>
                )}
                {invoice && (
                  <div className="mt-4 rounded-xl bg-sheet p-4 text-sm">
                    <p className="font-semibold text-forest">Invoice {invoice.number}</p>
                    <p>Total {dollars(invoice.total)} · {invoice.email}</p>
                    <button type="button" className="mt-2 text-xs text-terracotta" onClick={() => setInvoice(null)}>Close</button>
                  </div>
                )}
              </article>
            ) : (
              <div className="rounded-2xl bg-card p-8 text-center shadow-sm">
                <p className="font-display text-2xl text-forest">No parcel is in transit</p>
                <Link to="/" className="mt-4 inline-flex rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white">Find a book</Link>
              </div>
            )}
            <div>
              <h2 className="font-display text-[28px] text-forest">Archived & Delivered Orders</h2>
              <label className="mt-3 flex max-w-md items-center rounded-xl border border-linen bg-card px-3 py-2">
                <Icon name="search" className="text-outline" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search past orders" className="w-full bg-transparent px-2 text-sm outline-none" />
              </label>
              {past.length === 0 && <p className="mt-4 text-sm text-muted">No delivered orders match that search.</p>}
              <ul className="mt-4 space-y-4">
                {past.map((order) => (
                  <li key={order.id} className="rounded-2xl bg-card p-5 shadow-sm">
                    <div className="flex flex-wrap justify-between gap-2 text-sm text-muted">
                      <p>Order #{order.number} • {new Date(order.placed_at).toLocaleDateString()} • {order.status} • {dollars(order.total)}</p>
                    </div>
                    {order.items.map((item) => (
                      <div key={`${order.id}-${item.title}`} className="mt-3 flex gap-3">
                        <div className="spine h-16 w-12 overflow-hidden rounded-md bg-sheet">
                          <Cover src={item.cover_url} alt={item.title} title={item.title} />
                        </div>
                        <div>
                          <p className="font-display text-lg text-forest">{item.title}</p>
                          <p className="text-xs text-muted">{item.author_name} • {item.format_label}</p>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="mt-3 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white" onClick={() => void api.buyAgain(order.id).then((bag) => {
                      replaceCart(bag);
                    })}>Buy Again</button>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
        {panel === "shelves" && (
          <div className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="font-display text-3xl text-forest">{shelf?.name ?? "Saved Shelves"}</h2>
            {!shelf || shelf.books.length === 0 ? <p className="mt-3 text-sm text-muted">No bookmarks yet.</p> : (
              <ul className="mt-4 space-y-3">
                {shelf.books.map((book) => (
                  <li key={book.id}><Link to={`/books/${book.id}`} className="font-display text-xl text-forest">{book.title}</Link><p className="text-sm text-muted">{book.author_name}</p></li>
                ))}
              </ul>
            )}
          </div>
        )}
        {panel === "account" && (
          <form className="rounded-2xl bg-card p-6 shadow-sm" onSubmit={(event) => {
            event.preventDefault();
            void api.updateMe({ name, phone: phone || null }).then(() => refreshProfile());
          }}>
            <h2 className="font-display text-3xl text-forest">Account Settings</h2>
            <label className="mt-4 block text-sm font-semibold">Name<input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-xl border border-linen px-3 py-3 font-normal" /></label>
            <label className="mt-3 block text-sm font-semibold">Phone<input value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1 w-full rounded-xl border border-linen px-3 py-3 font-normal" /></label>
            <button type="submit" className="mt-4 rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white">Save profile</button>
          </form>
        )}
        {panel === "payment" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-card p-6 shadow-sm">
              <h2 className="font-display text-3xl text-forest">Addresses</h2>
              {addresses.length === 0 && <p className="mt-2 text-sm text-muted">No saved addresses yet. Checkout can store the next one.</p>}
              <ul className="mt-3 space-y-2 text-sm">
                {addresses.map((address) => (
                  <li key={address.id}>{address.full_name}, {address.street}, {address.city} {address.state} {address.postal_code}{address.is_default ? " · Default" : ""}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-card p-6 shadow-sm">
              <h2 className="font-display text-3xl text-forest">Payment</h2>
              {payments.length === 0 && <p className="mt-2 text-sm text-muted">No saved payment display records yet.</p>}
              <ul className="mt-3 space-y-2 text-sm">
                {payments.map((method) => (
                  <li key={method.id}>{method.method} {method.brand ?? ""} {method.last4 ? `•••• ${method.last4}` : ""}{method.is_default ? " · Default" : ""}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div className="rounded-xl bg-card p-3 shadow-sm">
      <Icon name={icon} className="text-forest" />
      <p className="mt-1 text-sm font-semibold text-forest">{value}</p>
      <p className="text-[11px] text-muted">{label}</p>
    </div>
  );
}
