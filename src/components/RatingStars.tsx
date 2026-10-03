import { Icon } from "./Icon";

/** Five stars in one row. Filled through the whole-star portion, then a half star when needed. */
export function RatingStars({ rating, className = "" }: { rating: number; className?: string }) {
  const full = Math.min(5, Math.max(0, Math.floor(rating)));
  const half = full < 5 && rating - full >= 0.25;

  return (
    <span className={`inline-flex flex-row flex-nowrap items-center gap-0.5 ${className}`} aria-label={`${rating.toFixed(1)} out of 5`}>
      {Array.from({ length: 5 }, (_, index) => {
        const active = index < full || (index === full && half);
        const name = index === full && half ? "star_half" : "star";
        return (
          <Icon
            key={index}
            name={name}
            filled={active}
            className={`text-sm ${active ? "text-terracotta" : "text-linen"}`}
          />
        );
      })}
    </span>
  );
}
