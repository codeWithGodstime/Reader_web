import type { ReactNode } from "react";

/** Shared pulse block. Callers set radius so it can match cards, pills, or rows. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-pulse bg-linen ${className}`} />;
}

export function SkeletonRegion({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

/** Mirrors `BookCard`: cover, rating, title, author, blurb, price, cart button. */
export function BookCardSkeleton() {
  return (
    <article aria-hidden="true" className="flex flex-col justify-between rounded-2xl bg-card p-4 shadow-sm">
      <div>
        <Skeleton className="mb-4 aspect-[2/3] w-full rounded-xl" />
        <Skeleton className="h-3 w-14 rounded" />
        <Skeleton className="mt-2 h-5 w-4/5 rounded" />
        <Skeleton className="mt-2 h-3 w-1/2 rounded" />
        <Skeleton className="mt-3 h-3 w-full rounded" />
        <Skeleton className="mt-1.5 h-3 w-11/12 rounded" />
      </div>
      <div className="mt-4 pt-4">
        <div className="flex items-baseline justify-between">
          <Skeleton className="h-3 w-16 rounded" />
          <Skeleton className="h-5 w-12 rounded" />
        </div>
        <Skeleton className="mt-2 h-9 w-full rounded-full" />
      </div>
    </article>
  );
}
