import { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { AVATAR_URL, LOGO_URL } from "../brand";
import { useShop } from "../context/ShopContext";
import { Icon } from "./Icon";
import { Skeleton } from "./Skeleton";

const links = [
  { to: "/", label: "Shop & Catalog", end: true },
  { to: "/?sort=rating", label: "Bestsellers" },
  { to: "/#staff-note", label: "Curated Collections" },
  { to: "/#about", label: "About" },
];

export function Header() {
  const { count, user, ready, logout } = useShop();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    const close = () => setMenuOpen(false);
    window.addEventListener("scroll", close);
    return () => window.removeEventListener("scroll", close);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-paper/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-md">
      <div className="bg-forest px-5 py-1 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between text-[11px] font-bold tracking-[0.04em]">
          <div className="mx-auto flex items-center gap-2 sm:mx-0">
            <Icon name="eco" className="text-sm" />
            <span>Free delivery on orders over $35 • Hand-wrapped in recyclable paper</span>
          </div>
          <div className="hidden items-center gap-6 sm:flex">
            <a className="hover:text-foam" href="#about">Book Club</a>
            <a className="hover:text-foam" href="#about">Store Locator</a>
            <Link className="hover:text-foam" to="/orders">Help Desk</Link>
          </div>
        </div>
      </div>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Reader" className="h-8 w-8 rounded-md object-cover" />
          <span className="flex flex-col">
            <span className="font-display text-lg leading-none font-semibold text-forest">Reader</span>
            <span className="text-xs leading-tight text-muted">Books for every shelf</span>
          </span>
        </Link>

        <form
          className="hidden max-w-md flex-1 md:flex"
          onSubmit={(event) => {
            event.preventDefault();
            navigate(`/?q=${encodeURIComponent(query.trim())}`);
          }}
        >
          <label className="flex w-full items-center rounded-xl bg-sheet px-4 py-2">
            <Icon name="search" className="mr-2 text-lg text-outline" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-outline"
              placeholder="Search titles, authors, genres..."
            />
            <kbd className="hidden rounded bg-paper px-1.5 py-0.5 text-[11px] font-bold text-muted shadow-sm lg:inline-flex">⌘K</kbd>
          </label>
        </form>

        <nav className="hidden items-center gap-6 text-base font-semibold xl:flex">
          {links.map((link) => (
            <NavLink
              key={link.label}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                isActive
                  ? "py-1 text-forest underline decoration-terracotta decoration-2 underline-offset-8"
                  : "py-1 text-[#424844] hover:text-ink"
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link to="/orders?panel=shelves" aria-label="Saved books" className="rounded-full p-2 text-[#424844] hover:bg-[#f0ede9] hover:text-ink">
            <Icon name="bookmark" className="text-xl" />
          </Link>
          <Link to="/checkout" aria-label="Shopping bag" className="relative rounded-full p-2 text-[#424844] hover:bg-[#f0ede9] hover:text-ink">
            <Icon name="shopping_bag" className="text-xl" />
            {count > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-terracotta text-[10px] font-bold text-white">
                {count}
              </span>
            )}
          </Link>
          {user ? (
            <div className="relative pl-1">
              <button
                type="button"
                className="flex items-center gap-1 rounded-full p-1 hover:bg-[#f0ede9]"
                aria-expanded={menuOpen}
                aria-label="Account menu"
                onClick={() => setMenuOpen((open) => !open)}
              >
                <img src={AVATAR_URL} alt="" className="h-8 w-8 rounded-full object-cover" />
                <Icon name="expand_more" className="text-base text-outline" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-linen bg-card p-2 shadow-paper">
                  <p className="px-3 py-2 font-display text-base text-forest">{user.name}</p>
                  <p className="px-3 pb-2 text-xs text-muted">Patron #{user.patron_number}</p>
                  <Link to="/orders" className="block rounded-xl px-3 py-2 text-sm hover:bg-sheet" onClick={() => setMenuOpen(false)}>
                    Orders & Tracking
                  </Link>
                  <Link to="/orders?panel=shelves" className="block rounded-xl px-3 py-2 text-sm hover:bg-sheet" onClick={() => setMenuOpen(false)}>
                    Saved Shelves
                  </Link>
                  <button
                    type="button"
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-sheet"
                    onClick={() => {
                      setMenuOpen(false);
                      void logout();
                    }}
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          ) : ready ? (
            <Link
              to="/login?mode=register"
              className="ml-1 rounded-full bg-forest px-3 py-2 text-sm font-semibold text-white sm:px-4"
            >
              Sign up
            </Link>
          ) : (
            <div role="status" aria-label="Loading account" className="ml-1">
              <span className="sr-only">Loading account</span>
              <Skeleton className="h-9 w-20 rounded-full" />
            </div>
          )}
          <button type="button" className="rounded-full p-2 xl:hidden" aria-label="Open menu" onClick={() => setNavOpen((open) => !open)}>
            <Icon name={navOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>
      {navOpen && (
        <nav className="border-t border-linen bg-paper px-5 py-3 xl:hidden">
          {links.map((link) => (
            <Link key={link.label} to={link.to} className="block py-2 text-sm font-semibold text-forest" onClick={() => setNavOpen(false)}>
              {link.label}
            </Link>
          ))}
          <form
            className="mt-2 md:hidden"
            onSubmit={(event) => {
              event.preventDefault();
              setNavOpen(false);
              navigate(`/?q=${encodeURIComponent(query.trim())}`);
            }}
          >
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search titles, authors, genres..."
              className="w-full rounded-xl border border-linen bg-card px-3 py-2 text-sm outline-none focus:border-forest"
            />
          </form>
        </nav>
      )}
    </header>
  );
}
