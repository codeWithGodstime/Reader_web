import { useState } from "react";

const cloth: Record<string, string> = {
  fiction: "from-[#3d2a24] to-[#1e3a2f]",
  memoir: "from-[#6b3a2a] to-[#1e3a2f]",
  nonfiction: "from-[#1e3a2f] to-[#314c41]",
  thriller: "from-[#14221c] to-[#3a2a18]",
};

export function Cover({
  src,
  alt,
  title,
  author,
  genre,
}: {
  src?: string | null;
  alt: string;
  title: string;
  author?: string;
  genre?: string;
}) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return <img src={src} alt={alt} className="h-full w-full object-cover" onError={() => setFailed(true)} />;
  }
  const tone = cloth[genre ?? ""] ?? cloth.fiction;
  return (
    <div className={`flex h-full w-full flex-col justify-between bg-gradient-to-b p-4 text-paper ${tone}`}>
      <span className="text-[10px] font-bold tracking-[0.18em] text-ochre uppercase">{genre}</span>
      <span className="font-display text-xl leading-tight font-semibold">{title}</span>
      {author && <span className="text-xs text-foam">{author}</span>}
    </div>
  );
}
