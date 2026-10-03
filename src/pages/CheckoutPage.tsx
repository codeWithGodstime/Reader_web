import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { ShippingMethod } from "../api/types";
import { Cover } from "../components/Cover";
import { Icon } from "../components/Icon";
import { useShop } from "../context/ShopContext";
import { cents, dollars, fromCents } from "../lib/money";

const states = [
  ["OR", "Oregon (OR)"],
  ["WA", "Washington (WA)"],
  ["CA", "California (CA)"],
  ["NY", "New York (NY)"],
  ["MA", "Massachusetts (MA)"],
] as const;

export function CheckoutPage() {
  const { cart, user, ready, setQuantity, removeLine, applyVoucher, removeVoucher, replaceCart } = useShop();
  const navigate = useNavigate();
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [speed, setSpeed] = useState<"standard" | "express">("standard");
  const [email, setEmail] = useState(user?.email ?? "");
  const [news, setNews] = useState(true);
  const [name, setName] = useState(user?.name ?? "");
  const [street, setStreet] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("OR");
  const [postal, setPostal] = useState("");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [pay, setPay] = useState<"card" | "paypal">("card");
  const [brand, setBrand] = useState("visa");
  const [last4, setLast4] = useState("");
  const [exp, setExp] = useState("");
  const [voucher, setVoucher] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (user?.email) setEmail(user.email);
    if (user?.name) setName(user.name);
  }, [user]);

  const merchandise = cart ? fromCents(Math.max(0, cents(cart.subtotal) - cents(cart.discount))) : "0.00";

  useEffect(() => {
    let active = true;
    api.shippingMethods(merchandise).then((rows) => {
      if (active) setMethods(rows);
    }).catch(() => {
      if (active) setMethods([]);
    });
    return () => {
      active = false;
    };
  }, [merchandise]);

  if (!ready) return <div className="mx-auto max-w-7xl px-5 py-10"><div className="h-64 animate-pulse rounded-2xl bg-sheet" /></div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16 text-center">
        <h1 className="font-display text-4xl text-forest">Checkout Sanctuary</h1>
        <p className="mt-2 text-sm text-muted">Sign in to review the bag and place an order.</p>
        <Link to="/login" className="mt-4 inline-flex rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white">Sign in</Link>
      </div>
    );
  }

  const chosen = methods.find((method) => method.code === speed);
  const shippingCents = chosen ? cents(chosen.price) : speed === "express" ? 499 : cents(cart?.shipping ?? "0.00");
  const taxCents = cart ? cents(cart.tax) : 0;
  const totalCents = cart ? Math.max(0, cents(cart.subtotal) - cents(cart.discount)) + shippingCents + taxCents : 0;

  async function submit(event: FormEvent) {
    event.preventDefault();
    const next: string[] = [];
    if (!email.includes("@")) next.push("Enter an email address for tracking.");
    if (name.trim().length < 2) next.push("Enter the full name for the parcel.");
    if (street.trim().length < 4) next.push("Enter a street address.");
    if (city.trim().length < 2) next.push("Enter a city.");
    if (!/^\d{5}$/.test(postal.trim())) next.push("Enter a 5-digit ZIP code.");
    if (phone.trim().length < 7) next.push("Enter a phone number for the courier.");
    let expMonth = 0;
    let expYear = 0;
    if (pay === "card") {
      if (!/^\d{4}$/.test(last4)) next.push("Enter the last 4 digits of the card. The full number is never sent.");
      const match = /^(\d{2})\/(\d{2})$/.exec(exp.trim());
      if (!match) next.push("Enter an expiration as MM/YY.");
      else {
        expMonth = Number(match[1]);
        expYear = 2000 + Number(match[2]);
        if (expMonth < 1 || expMonth > 12) next.push("Enter a valid expiration month.");
      }
    }
    if (!cart || cart.items.length === 0) next.push("Your bag is empty.");
    setErrors(next);
    if (next.length > 0) return;
    setPending(true);
    try {
      await api.checkout({
        email,
        marketing_opt_in: news,
        shipping_method: speed,
        address: {
          full_name: name,
          street,
          line2: line2 || null,
          city,
          state,
          postal_code: postal,
          phone,
          save: true,
        },
        payment: pay === "card"
          ? { method: "card", brand, last4, exp_month: expMonth, exp_year: expYear, save: true }
          : { method: "paypal", save: true },
      });
      const bag = await api.cart();
      replaceCart(bag);
      navigate("/orders");
    } catch (error) {
      setErrors([error instanceof ApiError ? error.message : "The order could not be placed."]);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <div className="mb-8">
        <p className="text-[11px] font-bold tracking-[0.16em] text-terracotta uppercase">Express & Secure</p>
        <h1 className="font-display text-4xl font-semibold text-forest">Checkout Sanctuary</h1>
        <ol className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted">
          <li className="font-semibold text-forest">1 Delivery Details</li>
          <Icon name="chevron_right" className="text-base" />
          <li>2 Payment Method</li>
          <Icon name="chevron_right" className="text-base" />
          <li>3 Review & Place Order</li>
        </ol>
      </div>
      <form onSubmit={(event) => void submit(event)} className="grid items-start gap-8 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {errors.length > 0 && (
            <div className="rounded-xl bg-danger-soft p-4 text-sm text-[#93000a]">
              <ul className="list-disc pl-5">{errors.map((error) => <li key={error}>{error}</li>)}</ul>
            </div>
          )}
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="font-display text-2xl text-forest">1 Contact Information</h2>
            <label className="mt-4 block text-sm font-semibold">Email Address for Order Updates & Tracking
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1 w-full rounded-xl border border-linen px-3 py-3 font-normal outline-none focus:border-forest" />
            </label>
            <p className="mt-2 flex items-center gap-1 text-xs text-muted"><Icon name="check_circle" className="text-sm text-forest" /> Receipt, dispatch notifications, and carrier tracking links will land here.</p>
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input type="checkbox" checked={news} onChange={(event) => setNews(event.target.checked)} className="mt-1 accent-forest" />
              Keep me updated on literary news, rare prints, and author salon invitations.
            </label>
          </section>
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="font-display text-2xl text-forest">2 Delivery Address</h2>
            <p className="text-xs text-muted">Residential / Desk</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Full Name" value={name} onChange={setName} className="sm:col-span-2" />
              <Field label="Street Address" value={street} onChange={setStreet} className="sm:col-span-2" />
              <Field label="Apt, Suite, Floor (Optional)" value={line2} onChange={setLine2} className="sm:col-span-2" />
              <Field label="City" value={city} onChange={setCity} />
              <label className="text-sm font-semibold">State
                <select value={state} onChange={(event) => setState(event.target.value)} className="mt-1 w-full rounded-xl border border-linen px-3 py-3 font-normal outline-none focus:border-forest">
                  {states.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                </select>
              </label>
              <Field label="ZIP Code" value={postal} onChange={setPostal} />
              <Field label="Mobile Phone (Carrier courier updates)" value={phone} onChange={setPhone} />
            </div>
          </section>
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="font-display text-2xl text-forest">3 Delivery Speed</h2>
            <p className="text-xs text-muted">Carbon neutral transit</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {(["standard", "express"] as const).map((code) => {
                const method = methods.find((item) => item.code === code);
                return (
                  <button key={code} type="button" onClick={() => setSpeed(code)} className={`rounded-xl border p-4 text-left ${speed === code ? "border-forest bg-sheet" : "border-linen"}`}>
                    <div className="flex justify-between font-semibold text-forest">
                      <span>{method?.label ?? (code === "standard" ? "Standard Ground" : "Priority Express")}</span>
                      <span>{method ? (method.price === "0.00" ? "FREE" : dollars(method.price)) : "—"}</span>
                    </div>
                    <p className="text-xs text-muted">{method?.eta ?? method?.detail}</p>
                    <p className="mt-2 text-xs">{method?.detail}</p>
                  </button>
                );
              })}
            </div>
          </section>
          <section className="rounded-2xl bg-card p-6 shadow-sm">
            <h2 className="font-display text-2xl text-forest">4 Payment Selection</h2>
            <p className="text-xs text-muted">Card checkout sends brand, last four, and expiry only.</p>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={() => setPay("card")} className={`rounded-full px-4 py-2 text-sm font-semibold ${pay === "card" ? "bg-forest text-white" : "bg-sheet"}`}>Credit Card</button>
              <button type="button" onClick={() => setPay("paypal")} className={`rounded-full px-4 py-2 text-sm font-semibold ${pay === "paypal" ? "bg-forest text-white" : "bg-sheet"}`}>PayPal</button>
            </div>
            {pay === "card" && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-semibold">Brand
                  <select value={brand} onChange={(event) => setBrand(event.target.value)} className="mt-1 w-full rounded-xl border border-linen px-3 py-3 font-normal outline-none focus:border-forest">
                    <option value="visa">Visa</option>
                    <option value="mastercard">Mastercard</option>
                    <option value="amex">American Express</option>
                  </select>
                </label>
                <Field label="Last 4 digits" value={last4} onChange={setLast4} />
                <Field label="Expiration (MM/YY)" value={exp} onChange={setExp} />
              </div>
            )}
          </section>
        </div>
        <aside className="lg:sticky lg:top-28 lg:col-span-5">
          <div className="rounded-2xl bg-card p-6 shadow-paper">
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-2xl text-forest">Order Summary</h2>
              <span className="text-sm text-muted">{cart?.item_count ?? 0} Books</span>
            </div>
            {!cart || cart.items.length === 0 ? (
              <div className="mt-6 rounded-xl bg-sheet p-6 text-center">
                <p className="font-display text-xl text-forest">Your bag is empty</p>
                <Link to="/" className="mt-3 inline-flex text-sm font-semibold text-terracotta">Browse the catalog</Link>
              </div>
            ) : (
              <ul className="mt-4 space-y-4">
                {cart.items.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="spine h-24 w-16 overflow-hidden rounded-md bg-sheet">
                      <Cover src={item.cover_url} alt={item.title} title={item.title} author={item.author_name} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2">
                        <p className="font-display text-lg leading-tight text-forest">{item.title}</p>
                        <p className="font-semibold">{dollars(item.line_total)}</p>
                      </div>
                      <p className="text-xs text-muted">{item.author_name}</p>
                      <p className="text-xs text-muted">{item.format_label} • Qty: {item.quantity}</p>
                      <div className="mt-2 flex gap-2 text-sm">
                        <button type="button" onClick={() => void setQuantity(item.id, item.quantity - 1)}>−</button>
                        <button type="button" onClick={() => void setQuantity(item.id, item.quantity + 1)}>+</button>
                        <button type="button" className="text-terracotta" onClick={() => void removeLine(item.id)}>Remove</button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 flex gap-2">
              <input value={voucher} onChange={(event) => setVoucher(event.target.value)} placeholder="Gift Card or Literary Voucher" className="w-full rounded-xl border border-linen px-3 py-2 text-sm outline-none focus:border-forest" />
              <button
                type="button"
                className="rounded-xl bg-sheet px-4 text-sm font-semibold text-forest"
                onClick={() => {
                  if (!voucher.trim()) return;
                  applyVoucher(voucher.trim()).catch((error: unknown) => {
                    setErrors([error instanceof ApiError ? error.message : "That voucher was not applied."]);
                  });
                }}
              >
                Apply
              </button>
            </div>
            {cart?.voucher && (
              <button type="button" className="mt-2 text-xs text-terracotta" onClick={() => void removeVoucher()}>
                Remove {cart.voucher.code}
              </button>
            )}
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{dollars(cart?.subtotal ?? "0.00")}</dd></div>
              <div className="flex justify-between"><dt>Discount</dt><dd>{dollars(cart?.discount ?? "0.00")}</dd></div>
              <div className="flex justify-between"><dt>Shipping</dt><dd>{shippingCents === 0 ? "FREE" : dollars(fromCents(shippingCents))}</dd></div>
              <div className="flex justify-between"><dt>Estimated Tax</dt><dd>{dollars(cart?.tax ?? "0.00")}</dd></div>
              <div className="flex items-end justify-between border-t border-linen pt-3">
                <dt className="font-display text-2xl text-forest">Total</dt>
                <dd className="font-display text-3xl text-forest">{dollars(fromCents(totalCents))}</dd>
              </div>
            </dl>
            <button type="submit" disabled={pending || !cart || cart.items.length === 0} className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-forest py-3 text-sm font-semibold text-white disabled:bg-outline">
              <Icon name="lock" /> {pending ? "Placing order…" : `Place Order • ${dollars(fromCents(totalCents))}`}
            </button>
            <p className="mt-3 text-center text-xs text-muted">By placing your order, you agree to Reader's Terms of Service and Privacy Policy.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, value, onChange, className = "" }: { label: string; value: string; onChange: (value: string) => void; className?: string }) {
  return (
    <label className={`text-sm font-semibold ${className}`}>
      {label}
      <input value={value} onChange={(event) => onChange(event.target.value)} className="mt-1 w-full rounded-xl border border-linen px-3 py-3 font-normal outline-none focus:border-forest" />
    </label>
  );
}
