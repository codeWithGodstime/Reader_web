import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { BookDetail, BookSummary, FormatCode, Review } from "../api/types";
import { BookCard } from "../components/BookCard";
import { Cover } from "../components/Cover";
import { Icon } from "../components/Icon";
import { useShop } from "../context/ShopContext";
import { dollars } from "../lib/money";

export function BookPage() {
  const { bookId = "" } = useParams();
  const navigate = useNavigate();
  const { addToCart, user } = useShop();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [related, setRelated] = useState<BookSummary[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "missing" | "error">("loading");
  const [message, setMessage] = useState("");
  const [format, setFormat] = useState<FormatCode>("paperback");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [tab, setTab] = useState<"about" | "author" | "reviews">("about");
  const [saved, setSaved] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    let active = true;
    setStatus("loading");
    Promise.all([api.book(bookId), api.related(bookId), api.reviews(bookId)])
      .then(([detail, companions, reviewPage]) => {
        if (!active) return;
        setBook(detail);
        setFormat(detail.format);
        setSaved(detail.saved);
        setRelated(companions);
        setReviews(reviewPage.results);
        setQuantity(1);
        setStatus("ready");
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 404) setStatus("missing");
        else {
          setMessage(error instanceof ApiError ? error.message : "This title could not be opened.");
          setStatus("error");
        }
      });
    return () => {
      active = false;
    };
  }, [bookId]);

  if (status === "loading") {
    return <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8"><div className="h-[520px] animate-pulse rounded-2xl bg-sheet" /></div>;
  }
  if (status === "missing") {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <p className="font-display text-3xl text-forest">This title is not on the shelf</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white">Return to the catalog</Link>
      </div>
    );
  }
  if (status === "error" || !book) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <p className="font-display text-3xl text-forest">The shelf did not open</p>
        <p className="mt-2 text-sm text-muted">{message}</p>
        <Link to="/" className="mt-6 inline-flex rounded-full bg-forest px-5 py-2 text-sm font-semibold text-white">Return to the catalog</Link>
      </div>
    );
  }

  const selected = book.formats.find((item) => item.code === format) ?? book.formats[0];
  const gallery = book.gallery.length > 0 ? book.gallery : [{ label: "Front", url: book.cover_url }];

  async function add() {
    const ok = await addToCart(book!.id, format, quantity);
    if (!ok) return;
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted">
        <Link to="/" className="hover:text-forest">Home</Link>
        <span>/</span>
        <Link to="/" className="hover:text-forest">Catalog</Link>
        <span>/</span>
        <span>{book.genre.name}</span>
        <span>/</span>
        <span className="text-forest">{book.title}</span>
      </nav>
      <div className="grid items-start gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="spine relative aspect-[3/4] overflow-hidden rounded-2xl bg-sheet shadow-paper">
            <Cover src={gallery[0]?.url} alt={book.title} title={book.title} author={book.author_name} genre={book.genre.slug} />
            <span className="absolute top-4 left-4 rounded-full bg-sheet/95 px-3 py-1 text-[11px] font-bold text-forest">{book.genre.name}</span>
            <button
              type="button"
              aria-label="Bookmark title"
              onClick={() => {
                const action = saved ? api.unsaveBook(book.id) : api.saveBook(book.id);
                action.then((result) => setSaved(result.saved)).catch((error: unknown) => {
                  if (error instanceof ApiError && error.status === 401) navigate("/login");
                });
              }}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-card/90 text-forest shadow-sm"
            >
              <Icon name={saved ? "bookmark" : "bookmark_border"} filled={saved} />
            </button>
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {["Front", "Back Cover", "Spine Detail", "Sample Page"].map((label, index) => {
              const image = gallery[index] ?? gallery[0];
              return (
                <div key={label} className={`overflow-hidden rounded-lg bg-sheet ${index === 0 ? "ring-2 ring-forest" : ""}`}>
                  <div className="aspect-[3/4]">
                    <Cover src={image?.url} alt={label} title={book.title} genre={book.genre.slug} />
                  </div>
                  <p className="px-1 py-1 text-center text-[10px] font-bold text-muted">{image?.label ?? label}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 flex items-center gap-2 text-xs text-muted"><Icon name="menu_book" className="text-base" /> Acid-free archival cream pages</p>
        </div>
        <div className="lg:col-span-7">
          <p className="text-xs font-semibold text-forest">{book.in_stock ? "In Stock & Ready to Ship" : "Reprint in progress"} • Item #{book.sku}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {book.badges.includes("bestseller") && <span className="inline-flex items-center gap-1 rounded-full bg-blush px-3 py-1 text-[11px] font-bold text-terracotta"><Icon name="local_fire_department" className="text-sm" /> Bestseller</span>}
            {book.badges.includes("staff_favorite") && <span className="inline-flex items-center gap-1 rounded-full bg-sheet px-3 py-1 text-[11px] font-bold text-forest"><Icon name="star" filled className="text-sm text-ochre" /> Staff Favorite</span>}
          </div>
          <p className="mt-4 text-[11px] font-bold tracking-[0.08em] text-terracotta uppercase">{book.genre.name} • Published {book.published_on}</p>
          <h1 className="mt-1 font-display text-4xl leading-tight font-semibold text-forest">{book.title}</h1>
          {book.subtitle && <p className="mt-1 font-display text-lg text-muted italic">{book.subtitle}</p>}
          <p className="mt-2 text-sm">by <span className="font-semibold">{book.author_name}</span></p>
          <p className="mt-3 text-sm text-muted">
            <span className="font-semibold text-forest">{book.rating.toFixed(1)}</span> ({book.review_count.toLocaleString()} verified readers)
          </p>
          {selected && (
            <div className="mt-5 flex items-end gap-3">
              <span className="font-display text-4xl font-semibold text-forest">{dollars(selected.price)}</span>
              {selected.compare_at_price && <span className="text-sm text-muted line-through">{dollars(selected.compare_at_price)}</span>}
            </div>
          )}
          <p className="mt-2 flex items-center gap-1 text-xs text-muted"><Icon name="local_shipping" className="text-base" /> Eligible for free standard shipping</p>
          <div className="mt-6">
            <p className="text-sm font-semibold text-forest">Choose Format</p>
            <p className="text-xs text-muted">All physical copies include cloth-feel bookmarks</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {book.formats.map((item) => (
                <button key={item.code} type="button" onClick={() => setFormat(item.code)} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left ${format === item.code ? "border-forest bg-sheet" : "border-linen bg-card"}`}>
                  <span>
                    <span className="block text-sm font-semibold text-forest">{item.label} {item.rare && <span className="text-[11px] text-terracotta">Rare</span>}</span>
                    <span className="text-xs text-muted">{item.detail}</span>
                  </span>
                  <span className="font-semibold text-forest">{dollars(item.price)}</span>
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center rounded-full border border-linen bg-card">
              <button type="button" className="px-4 py-3" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
              <span className="min-w-6 text-center font-semibold">{quantity}</span>
              <button type="button" className="px-4 py-3" onClick={() => setQuantity((value) => value + 1)}>+</button>
            </div>
            <button type="button" disabled={!book.in_stock} onClick={() => void add()} className={`flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white disabled:bg-outline ${added ? "bg-terracotta" : "bg-forest"}`}>
              <Icon name="shopping_bag" /> {added ? "Added to your basket" : `Add to Cart — ${selected ? dollars(selected.price) : ""}`}
            </button>
            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-linen px-5 py-3 text-sm font-semibold text-forest"
              onClick={() => {
                if (!user) {
                  navigate("/login");
                  return;
                }
                api.oneClick({ book_id: book.id, format, quantity }).then(() => navigate("/orders")).catch((error: unknown) => {
                  setMessage(error instanceof ApiError ? error.message : "1-click buy needs a saved address and payment method.");
                });
              }}
            >
              <Icon name="bolt" /> 1-Click Buy
            </button>
          </div>
          {message && tab !== "reviews" && <p className="mt-3 text-sm text-terracotta">{message}</p>}
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["local_shipping", "Free delivery > $35", "Tracking on all orders"],
              ["eco", "Dispatched in 24h", "Plastic-free packaging"],
              ["replay", "30-day returns", "Hassle-free guarantee"],
            ].map(([icon, title, detail]) => (
              <li key={title} className="flex items-start gap-2 rounded-xl bg-sheet p-3">
                <Icon name={icon} className="text-forest" />
                <span><span className="block text-sm font-semibold text-forest">{title}</span><span className="text-xs text-muted">{detail}</span></span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section className="mt-12 grid gap-8 lg:grid-cols-12">
        <div className="rounded-2xl bg-card p-6 shadow-sm lg:col-span-4">
          <h2 className="font-display text-xl text-forest">Edition Specifications</h2>
          <dl className="mt-4 space-y-2 text-sm">
            {[
              ["Length", `${book.pages} pages`],
              ["Publisher", book.publisher],
              ["Language", book.language],
              ["ISBN-13", book.isbn13],
              ["Dimensions", book.dimensions],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between gap-4 border-b border-linen py-2">
                <dt className="text-muted">{label}</dt>
                <dd className="font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        <div className="lg:col-span-8">
          <div className="flex flex-wrap gap-2 border-b border-linen">
            {([
              ["about", "About This Work"],
              ["author", "About the Author"],
              ["reviews", "Verified Reader Reviews"],
            ] as const).map(([id, label]) => (
              <button key={id} type="button" onClick={() => setTab(id)} className={`px-3 py-2 text-sm font-semibold ${tab === id ? "border-b-2 border-terracotta text-forest" : "text-muted"}`}>{label}</button>
            ))}
          </div>
          <div className="pt-5 text-sm leading-6 text-[#424844]">
            {tab === "about" && <p>{book.description}</p>}
            {tab === "author" && (
              <div className="rounded-xl bg-sheet p-5">
                {book.curator_note && (
                  <>
                    <p className="text-[11px] font-bold tracking-wider text-terracotta uppercase">Curator Note</p>
                    <p className="mt-2 font-display text-xl text-forest">{book.curator_note.name}</p>
                    <p className="text-xs text-muted">{book.curator_note.role}</p>
                    <p className="mt-3 italic">“{book.curator_note.quote}”</p>
                  </>
                )}
                <p className="mt-4 font-display text-lg text-forest">{book.author.name}</p>
                <p>{book.author.bio}</p>
                <p className="mt-2 text-muted">View all {book.author.title_count} titles by {book.author.name}</p>
              </div>
            )}
            {tab === "reviews" && (
              <div className="space-y-4">
                {user ? (
                  <form
                    className="rounded-xl border border-linen p-4"
                    onSubmit={(event) => {
                      event.preventDefault();
                      setReviewError("");
                      api.createReview(book.id, { rating, body: reviewBody, edition: selected?.label })
                        .then((review) => {
                          setReviews((current) => [review, ...current]);
                          setReviewBody("");
                        })
                        .catch((error: unknown) => setReviewError(error instanceof ApiError ? error.message : "The review was not saved."));
                    }}
                  >
                    <label className="text-sm font-semibold text-forest">
                      Rating
                      <input type="number" min={1} max={5} value={rating} onChange={(event) => setRating(Number(event.target.value))} className="mt-1 block w-24 rounded-xl border border-linen px-3 py-2" />
                    </label>
                    <textarea value={reviewBody} onChange={(event) => setReviewBody(event.target.value)} required placeholder="Write a review" className="mt-3 w-full rounded-xl border border-linen px-3 py-2" rows={3} />
                    {reviewError && <p className="mt-2 text-terracotta">{reviewError}</p>}
                    <button type="submit" className="mt-3 rounded-full bg-forest px-4 py-2 text-sm font-semibold text-white">Publish review</button>
                  </form>
                ) : (
                  <Link to="/login" className="text-sm font-semibold text-terracotta">Sign in to write a review</Link>
                )}
                {reviews.length === 0 && <p className="text-muted">No reviews yet.</p>}
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-xl border border-linen p-4">
                    <p className="font-semibold text-forest">{review.reviewer_name}</p>
                    <p className="text-xs text-muted">{review.reviewer_title} {review.verified_purchase ? "· Verified purchase" : ""} {review.edition ? `· ${review.edition}` : ""}</p>
                    <p className="mt-2">“{review.body}”</p>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {book.table_of_contents.length > 0 && (
        <section className="mt-10 rounded-2xl bg-card p-6 shadow-sm">
          <h2 className="font-display text-2xl text-forest">Table of Contents</h2>
          <ol className="mt-4 divide-y divide-linen">
            {book.table_of_contents.map((chapter) => (
              <li key={chapter.title} className="flex justify-between py-3 text-sm"><span>{chapter.title}</span><span className="text-muted">p. {chapter.page}</span></li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-12">
        <p className="text-[11px] font-bold tracking-wider text-terracotta uppercase">Hand-Curated Companion Shelf</p>
        <h2 className="font-display text-[28px] text-forest">Frequently Read Next</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {related.map((item) => <BookCard key={item.id} book={item} />)}
        </div>
      </section>
    </div>
  );
}
