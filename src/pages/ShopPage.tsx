import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { BookSummary, FormatCode, Genre, PriceBand, SortKey } from "../api/types";
import { BookCard } from "../components/BookCard";
import { Icon } from "../components/Icon";

const priceOptions: { id: PriceBand; label: string }[] = [
  { id: "any", label: "Any price" },
  { id: "under_16", label: "Under $16" },
  { id: "from_16_to_18", label: "$16 – $18" },
  { id: "over_18", label: "$18 and up" },
];

const formats: { id: FormatCode; label: string }[] = [
  { id: "paperback", label: "Paperback" },
  { id: "hardcover", label: "Hardcover" },
  { id: "signed", label: "Signed Copy" },
  { id: "ebook", label: "eBook / PDF" },
];

const sorts: { id: SortKey; label: string }[] = [
  { id: "featured", label: "Featured Picks" },
  { id: "price_asc", label: "Price: low to high" },
  { id: "price_desc", label: "Price: high to low" },
  { id: "newest", label: "Newest Additions" },
  { id: "rating", label: "Top Rated" },
  { id: "title", label: "Title" },
];

export function ShopPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const sort = (params.get("sort") as SortKey) || "featured";
  const page = Number(params.get("page") ?? "1") || 1;
  const [refine, setRefine] = useState(q);
  const [genre, setGenre] = useState(params.get("genre") ?? "");
  const [price, setPrice] = useState<PriceBand>((params.get("price") as PriceBand) || "any");
  const [format, setFormat] = useState<FormatCode | "">((params.get("format") as FormatCode) || "");
  const [inStock, setInStock] = useState(params.get("in_stock") !== "false");
  const [genres, setGenres] = useState<Genre[]>([]);
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [count, setCount] = useState(0);
  const [pageSize, setPageSize] = useState(4);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => setRefine(q), [q]);

  useEffect(() => {
    let active = true;
    api.genres().then((rows) => {
      if (active) setGenres(rows);
    }).catch(() => {
      if (active) setGenres([]);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setStatus("loading");
    api
      .books({
        q: q || undefined,
        genre: genre || undefined,
        price,
        format: format || undefined,
        in_stock: inStock ? true : undefined,
        sort,
        page,
        page_size: 4,
      })
      .then((result) => {
        if (!active) return;
        setBooks(result.results);
        setCount(result.count);
        setPageSize(result.page_size);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        setMessage(error instanceof ApiError ? error.message : "The catalog could not be opened. Is the API running at the configured base URL?");
        setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [q, genre, price, format, inStock, sort, page]);

  function writeParams(patch: Record<string, string | null>) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (!value) next.delete(key);
      else next.set(key, value);
    }
    if (!("page" in patch)) next.delete("page");
    setParams(next);
  }

  const pages = Math.max(1, Math.ceil(count / pageSize));
  const start = count === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, count);

  const chips: { key: string; label: string; clear: () => void }[] = [];
  if (price !== "any") chips.push({ key: "price", label: `Price: ${priceOptions.find((item) => item.id === price)?.label}`, clear: () => setPrice("any") });
  if (inStock) chips.push({ key: "stock", label: "In Stock", clear: () => setInStock(false) });
  if (format) chips.push({ key: "format", label: formats.find((item) => item.id === format)?.label ?? format, clear: () => setFormat("") });
  if (genre) chips.push({ key: "genre", label: genres.find((item) => item.slug === genre)?.name ?? genre, clear: () => setGenre("") });
  if (q) chips.push({ key: "q", label: `Search: ${q}`, clear: () => writeParams({ q: null }) });

  function reset() {
    setGenre("");
    setPrice("any");
    setFormat("");
    setInStock(true);
    setRefine("");
    writeParams({ q: null, sort: null, page: null });
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-6 sm:px-8">
      <header className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <div className="mb-1 flex items-center gap-1 text-forest">
            <span className="text-[11px] font-bold tracking-[0.16em] text-terracotta uppercase">Catalog & Archive</span>
            <span className="text-line">•</span>
            <span className="text-[11px] font-bold text-muted">Autumn 2024 Collection</span>
          </div>
          <h1 className="font-display text-4xl leading-[48px] font-semibold tracking-[-0.02em] text-forest md:text-[40px]">Find your next book</h1>
          <p className="mt-1 text-base leading-[26px] text-muted">
            Fiction, memoir, and ideas worth keeping. Curated for readers who cherish good writing. Add titles to your cart, and we will package each copy in archival wax paper.
          </p>
        </div>
        <div className="flex items-center gap-4 self-start rounded-xl bg-sheet p-4 shadow-sm md:self-auto">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-forest text-card">
            <Icon name="auto_stories" className="text-lg" />
          </div>
          <div>
            <span className="block text-[11px] font-bold tracking-[0.04em] text-muted uppercase">Curator's Note</span>
            <span className="text-sm font-semibold text-forest">Hand-selected paperbacks</span>
          </div>
        </div>
      </header>

      <section className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-sheet p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-[11px] font-bold text-muted">Active filters:</span>
          {chips.length === 0 && <span className="text-sm text-muted">None yet — the full shelf is open.</span>}
          {chips.map((chip) => (
            <button key={chip.key} type="button" onClick={chip.clear} className="inline-flex items-center gap-1 rounded-full bg-card px-4 py-1.5 text-[13px] font-semibold text-forest shadow-sm">
              {chip.label}
              <Icon name="close" className="text-sm text-muted" />
            </button>
          ))}
          <button type="button" className="ml-1 text-[11px] font-bold text-terracotta hover:underline" onClick={reset}>Reset all</button>
        </div>
        <div className="ml-auto flex items-center gap-6 text-xs text-muted">
          <span className="hidden sm:inline">
            Showing <strong className="font-semibold text-forest">{start}–{end}</strong> of <strong className="font-semibold text-forest">{count}</strong> books
          </span>
          <label className="flex items-center gap-1 rounded-lg bg-card px-4 py-1.5 shadow-sm">
            <span className="text-[11px] font-bold text-muted">Sort by:</span>
            <select
              value={sort}
              onChange={(event) => writeParams({ sort: event.target.value === "featured" ? null : event.target.value })}
              className="bg-transparent text-base font-semibold text-forest outline-none"
            >
              {sorts.map((item) => (
                <option key={item.id} value={item.id}>{item.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="grid items-start gap-10 lg:grid-cols-12">
        <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-3">
          <div className="space-y-6 rounded-xl bg-card p-6 shadow-sm">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                writeParams({ q: refine.trim() || null });
              }}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-base font-semibold text-forest">Refine Search</span>
                <Icon name="filter_alt" className="text-lg text-outline" />
              </div>
              <label className="flex items-center rounded-lg bg-sheet px-2 py-2">
                <Icon name="search" className="mr-1 text-base text-outline" />
                <input value={refine} onChange={(event) => setRefine(event.target.value)} placeholder="Title, keyword, author..." className="w-full bg-transparent text-xs outline-none placeholder:text-outline" />
              </label>
            </form>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-forest">Genres</span>
                <button type="button" className="text-[11px] font-bold text-terracotta" onClick={() => setGenre("")}>Clear</button>
              </div>
              <label className="flex cursor-pointer items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-ink">
                  <input type="checkbox" checked={genre === ""} onChange={() => setGenre("")} className="h-4 w-4 accent-forest" />
                  All Volumes
                </span>
              </label>
              {genres.map((item) => (
                <label key={item.slug} className="flex cursor-pointer items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-ink">
                    <input type="checkbox" checked={genre === item.slug} onChange={() => setGenre(genre === item.slug ? "" : item.slug)} className="h-4 w-4 accent-forest" />
                    {item.name}
                  </span>
                  <span className={`text-[11px] font-bold ${genre === item.slug ? "text-terracotta" : "text-muted"}`}>{item.book_count}</span>
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <span className="block text-base font-semibold text-forest">Price Shelf</span>
              {priceOptions.map((option) => (
                <label key={option.id} className={`flex cursor-pointer items-center gap-2 text-xs ${price === option.id ? "rounded bg-sheet px-1 py-1 font-semibold text-forest" : "text-ink"}`}>
                  <input type="radio" name="price" checked={price === option.id} onChange={() => setPrice(option.id)} className="h-4 w-4 accent-forest" />
                  {option.label}
                </label>
              ))}
            </div>
            <div className="space-y-2">
              <span className="block text-base font-semibold text-forest">Format</span>
              <div className="grid grid-cols-2 gap-2">
                {formats.map((item) => (
                  <button key={item.id} type="button" onClick={() => setFormat((current) => (current === item.id ? "" : item.id))} className={`rounded-lg px-2 py-2 text-center text-[13px] font-semibold ${format === item.id ? "bg-forest text-white" : "bg-sheet text-ink hover:bg-[#e5e2dd]"}`}>
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-sheet p-2">
              <div>
                <p className="text-xs font-semibold text-forest">Ready to Ship</p>
                <p className="text-[11px] text-muted">In local warehouse</p>
              </div>
              <button type="button" role="switch" aria-checked={inStock} onClick={() => setInStock((value) => !value)} className={`relative h-5 w-9 rounded-full ${inStock ? "bg-forest" : "bg-[#e5e2dd]"}`}>
                <span className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition ${inStock ? "translate-x-4" : ""}`} />
              </button>
            </div>
            <button type="button" onClick={reset} className="flex w-full items-center justify-center gap-1 rounded-lg bg-sheet py-2 text-[13px] font-semibold text-ink hover:bg-[#e5e2dd]">
              <Icon name="restart_alt" className="text-sm" /> Clear all filters
            </button>
          </div>
          <div className="rounded-xl bg-forest p-4 text-white shadow-sm">
            <p className="text-[11px] font-bold tracking-wider text-foam uppercase">Slow Reading Club</p>
            <h2 className="mt-1 font-display text-lg font-semibold">Need a recommendation?</h2>
            <p className="mt-1 text-xs text-moss">Our literary concierge matches your taste with overlooked independent press editions.</p>
            <a href="#about" className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-foam hover:underline">
              Ask our booksellers <Icon name="arrow_forward" className="text-sm" />
            </a>
          </div>
        </aside>

        <section className="flex flex-col gap-10 lg:col-span-9">
          {status === "loading" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => <div key={index} className="h-[420px] animate-pulse rounded-2xl bg-sheet" />)}
            </div>
          )}
          {status === "error" && (
            <div className="rounded-2xl border border-danger-soft bg-white p-8 text-center">
              <p className="font-display text-2xl text-forest">The shelf did not open</p>
              <p className="mt-2 text-sm text-muted">{message}</p>
              <button type="button" onClick={() => writeParams({ page: String(page) })} className="mt-4 rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white">Try again</button>
            </div>
          )}
          {status === "ready" && books.length === 0 && (
            <div className="rounded-2xl bg-card p-10 text-center shadow-sm">
              <p className="font-display text-2xl text-forest">Nothing on this shelf</p>
              <p className="mt-2 text-sm text-muted">Try another genre, a wider price, or clear the search.</p>
              <button type="button" onClick={reset} className="mt-4 rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white">Reset filters</button>
            </div>
          )}
          {status === "ready" && books.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {books.map((book) => <BookCard key={book.id} book={book} />)}
            </div>
          )}
          <nav aria-label="Catalog pagination" className="flex flex-col items-center justify-between gap-4 rounded-xl bg-sheet px-6 py-4 shadow-sm sm:flex-row">
            <p className="text-xs text-muted">Showing <strong className="font-semibold text-forest">{start}–{end}</strong> of {count} books • Displaying {pageSize} per page</p>
            <div className="flex items-center gap-1">
              <button type="button" disabled={page <= 1} onClick={() => writeParams({ page: String(page - 1) })} className="flex items-center gap-1 rounded-full px-4 py-1.5 text-[13px] font-semibold text-outline disabled:opacity-60">
                <Icon name="arrow_back" className="text-base" /> Previous
              </button>
              {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
                <button key={number} type="button" aria-current={number === page ? "page" : undefined} onClick={() => writeParams({ page: number === 1 ? null : String(number) })} className={`flex h-8 w-8 items-center justify-center rounded-full text-[13px] font-semibold shadow-sm ${number === page ? "bg-forest text-white" : "bg-card text-forest"}`}>
                  {number}
                </button>
              ))}
              <button type="button" disabled={page >= pages} onClick={() => writeParams({ page: String(page + 1) })} className="flex items-center gap-1 rounded-full px-4 py-1.5 text-[13px] font-semibold text-forest disabled:opacity-60">
                Next <Icon name="arrow_forward" className="text-base" />
              </button>
            </div>
          </nav>
          <div id="staff-note" className="flex flex-col items-center gap-6 rounded-2xl bg-sheet p-6 shadow-sm md:flex-row md:p-10">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blush md:h-20 md:w-20">
              <Icon name="format_quote" className="text-3xl text-terracotta" />
            </div>
            <div className="text-center md:text-left">
              <p className="font-display text-lg font-semibold text-forest italic">“A reader lives a thousand lives before he dies. The man who never reads lives only one.”</p>
              <p className="mt-2 text-[13px] font-semibold text-muted">George R.R. Martin — <span className="text-terracotta">Reader Bookstore Staff Favorites</span></p>
            </div>
            <Link to="/?sort=rating" className="inline-flex shrink-0 items-center gap-1 rounded-full bg-card px-4 py-2 text-[13px] font-semibold text-forest shadow-sm hover:bg-forest hover:text-white md:ml-auto">
              Explore curated lists <Icon name="north_east" className="text-sm" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
