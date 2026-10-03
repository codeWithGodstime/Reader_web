import { useState, type FormEvent } from "react";
import { ApiError, api } from "../api/client";

const shelves = [
  "Contemporary Fiction",
  "Art, Architecture & Design",
  "Philosophy & Theory",
  "Poetry Collections",
  "Small Press & Zines",
  "Rare & Out of Print",
];

const care = ["Shipping & Delivery", "Packaging & Gifting", "Returns & Exchanges", "Book Concierge", "Store FAQ"];
const store = ["Our Narrative", "Reading Rooms", "Cultural Calendar", "Careers & Fellowships", "Press Enquiries"];

export function Footer() {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  const [error, setError] = useState("");

  async function subscribe(event: FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await api.subscribe(email);
      setJoined(true);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : "The dispatch could not be joined.");
    }
  }

  return (
    <footer id="about" className="mt-10 w-full bg-sheet py-10">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-10 pb-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <span className="font-display text-[22px] font-semibold text-forest">Reader</span>
            <p className="max-w-sm text-sm leading-[22px] text-muted">
              An intimate literary sanctuary. Drawing inspiration from independent art-book sellers and vintage cloth-bound editions, we curate thought-provoking titles for reflective minds.
            </p>
            <div>
              <h2 className="mb-2 text-base font-semibold text-forest">The Literary Dispatch</h2>
              <p className="mb-2 text-xs text-muted">Weekly essays, author interviews, and first-access editions.</p>
              {joined ? (
                <p className="text-sm font-semibold text-forest">You are on the list. We will write soon.</p>
              ) : (
                <form onSubmit={subscribe} className="flex max-w-sm items-center rounded-xl bg-paper p-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Your email address"
                    className="w-full bg-transparent px-3 text-sm outline-none placeholder:text-outline"
                  />
                  <button type="submit" className="rounded-lg bg-forest px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#163028]">
                    Subscribe
                  </button>
                </form>
              )}
              {error && <p className="mt-2 text-xs text-terracotta">{error}</p>}
            </div>
          </div>
          <FooterColumn title="Curated Shelves" items={shelves} />
          <FooterColumn title="Customer Care" items={care} />
          <FooterColumn title="Bookstore" items={store} />
        </div>
        <div className="flex flex-col items-center justify-between gap-4 pt-6 text-xs text-muted md:flex-row">
          <p>© 2024 Reader Bookstore LLC. Crafted with care for slow reading.</p>
          <div className="flex gap-6">
            <a href="#about" className="hover:text-forest">Privacy Policy</a>
            <a href="#about" className="hover:text-forest">Terms of Service</a>
            <a href="#about" className="hover:text-forest">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h2 className="mb-2 text-base font-semibold text-forest">{title}</h2>
      <ul className="space-y-1 text-xs text-muted">
        {items.map((item) => (
          <li key={item}>
            <a href="#about" className="hover:text-forest">{item}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
