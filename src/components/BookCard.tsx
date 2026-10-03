import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ApiError, api } from "../api/client";
import type { BookSummary } from "../api/types";
import { useShop } from "../context/ShopContext";
import { dollars } from "../lib/money";
import { Cover } from "./Cover";
import { Icon } from "./Icon";

const formatLabel: Record<BookSummary["format"], string> = {
  paperback: "Paperback",
  hardcover: "Hardcover Edition",
  ebook: "eBook",
  signed: "Signed Edition",
};

export function BookCard({ book }: { book: BookSummary }) {
  const { addToCart } = useShop();
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(book.saved);
  const [busy, setBusy] = useState(false);

  useEffect(() => setSaved(book.saved), [book.saved]);

  return (
    <article className="group flex flex-col justify-between rounded-2xl bg-card p-4 shadow-sm transition hover:shadow-lift">
      <div>
        <div className="spine relative mb-4 aspect-[2/3] overflow-hidden rounded-xl bg-sheet">
          <Link to={`/books/${book.id}`} className="block h-full">
            <Cover src={book.cover_url} alt={book.title} title={book.title} author={book.author_name} genre={book.genre.slug} />
          </Link>
          <span className="absolute top-2 left-2 rounded bg-sheet/95 px-1.5 py-0.5 text-[11px] font-bold text-forest shadow-sm">
            {book.genre.name}
          </span>
          <button
            type="button"
            aria-label={saved ? "Remove bookmark" : "Bookmark title"}
            disabled={busy}
            onClick={() => {
              setBusy(true);
              const action = saved ? api.unsaveBook(book.id) : api.saveBook(book.id);
              action
                .then((result) => setSaved(result.saved))
                .catch((error: unknown) => {
                  if (error instanceof ApiError && error.status === 401) navigate("/login");
                })
                .finally(() => setBusy(false));
            }}
            className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-card/90 text-forest shadow-sm backdrop-blur-sm hover:text-terracotta"
          >
            <Icon name={saved ? "bookmark" : "bookmark_border"} filled={saved} className="text-base" />
          </button>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-terracotta">
            <Icon name="star" filled className="text-sm" />
            <span className="text-[11px] font-bold">{book.rating.toFixed(1)}</span>
            <span className="text-xs text-muted">({book.review_count.toLocaleString()})</span>
          </div>
          <h3 className="truncate font-display text-lg leading-6 font-semibold text-forest group-hover:text-terracotta">
            <Link to={`/books/${book.id}`}>{book.title}</Link>
          </h3>
          <p className="text-xs text-muted">{book.author_name}</p>
          <p className="line-clamp-2 pt-1 text-xs leading-[18px] text-[#424844]">{book.description}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-col gap-2 pt-4">
        <div className="flex items-baseline justify-between">
          <span className={`text-[11px] font-bold ${book.format === "hardcover" ? "text-terracotta" : "text-muted"}`}>
            {formatLabel[book.format]}
          </span>
          <span className="font-display text-lg font-semibold text-forest">{dollars(book.price)}</span>
        </div>
        <button
          type="button"
          disabled={!book.in_stock || added}
          onClick={() => {
            void addToCart(book.id, book.format).then((ok) => {
              if (!ok) return;
              setAdded(true);
              window.setTimeout(() => setAdded(false), 1600);
            });
          }}
          className={`flex items-center justify-center gap-1 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-sm transition active:scale-95 disabled:cursor-not-allowed disabled:bg-outline ${added ? "bg-terracotta" : "bg-forest hover:bg-[#163028]"}`}
        >
          <Icon name="shopping_bag" className="text-base" />
          <span>{!book.in_stock ? "Waitlist" : added ? "Added to bag ✓" : "Add to cart"}</span>
        </button>
      </div>
    </article>
  );
}
