import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const list = images.filter(Boolean);
  if (list.length === 0) {
    return <div className="bg-muted aspect-[3/4] outline outline-1 -outline-offset-1 outline-border" />;
  }
  const idx = Math.min(i, list.length - 1);
  const go = (d: number) => setI((idx + d + list.length) % list.length);
  return (
    <div>
      <div className="relative bg-muted aspect-[3/4] overflow-hidden outline outline-1 -outline-offset-1 outline-border">
        <img
          key={list[idx]}
          src={list[idx]}
          alt={`${name} — photo ${idx + 1}`}
          width={900}
          height={1200}
          className="w-full h-full object-cover"
        />
        {list.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Previous photo"
              onClick={() => go(-1)}
              className="absolute left-2 top-1/2 -translate-y-1/2 size-9 grid place-items-center bg-background/80 backdrop-blur hover:bg-background"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Next photo"
              onClick={() => go(1)}
              className="absolute right-2 top-1/2 -translate-y-1/2 size-9 grid place-items-center bg-background/80 backdrop-blur hover:bg-background"
            >
              <ChevronRight className="size-5" />
            </button>
            <span className="absolute bottom-3 right-3 eyebrow bg-background/80 backdrop-blur px-2 py-1 !text-[10px]">
              {idx + 1} / {list.length}
            </span>
          </>
        )}
      </div>
      {list.length > 1 && (
        <ul className="mt-3 grid grid-cols-5 sm:grid-cols-6 gap-2">
          {list.map((src, k) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => setI(k)}
                aria-label={`Show photo ${k + 1}`}
                aria-current={k === idx}
                className={`block w-full aspect-[3/4] overflow-hidden bg-muted border ${
                  k === idx ? "border-foreground" : "border-border opacity-70 hover:opacity-100"
                }`}
              >
                <img src={src} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
