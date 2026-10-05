import { Fragment } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
const heroBanner = "/images/hero-banner.jpg";
const chapterEssentials = "/images/chapter-essentials.jpg";
const collectionMen = "/images/collection-men.jpg";
const collectionWomen = "/images/collection-women.jpg";

import { ProductCard } from "@/components/ProductCard";
import { listProducts } from "@/lib/catalog.functions";
import { Reveal, RevealWords, Stagger, StaggerItem } from "@/components/motion/Reveal";


const TICKER_ITEMS = [
  "We are Versatile",
  "Crafted in limited runs",
  "New arrivals every Friday",
];

/**
 * One half of the endless ticker. The list is repeated four times so a single group is
 * always wider than the screen; the track then slides exactly one group to the left
 * and restarts, which looks like a seamless loop.
 */
function TickerGroup({ hidden }: { hidden?: boolean }) {
  return (
    <div className="ticker__content" aria-hidden={hidden || undefined}>
      {[0, 1, 2, 3].map((rep) => (
        <span key={rep} className="ticker__rep" aria-hidden={rep > 0 || undefined}>
          {TICKER_ITEMS.map((text) => (
            <Fragment key={text}>
              <span>{text}</span>
              <span aria-hidden="true">·</span>
            </Fragment>
          ))}
        </span>
      ))}
    </div>
  );
}

export const Route = createFileRoute("/")({
  loader: () => listProducts(),
  component: Home,
  errorComponent: () => (
    <div className="max-w-xl mx-auto py-32 text-center px-6">
      <h1 className="font-serif text-3xl">Versatile</h1>
      <p className="mt-3 text-sm text-foreground/60">The store is loading — please refresh.</p>
    </div>
  ),
});

function Home() {
  const newArrivals = Route.useLoaderData().slice(0, 4);
  const chapters: Chapter[] = [
    {
      no: "01",
      eyebrow: "Chapter One — Outerwear",
      title: "The Winter Edit",
      body: "Structured wool, considered proportion. A quiet study in warmth built for the long walk home.",
      image: collectionMen,
      alt: "Model in a black oversized hoodie and joggers",
      layout: "panel",
      side: "left",
      cta: "Explore the edit",
      to: "/shop",
      search: { category: "men" },
    },
    {
      no: "02",
      eyebrow: "Chapter Two — The Essentials",
      title: "More Than Just Clothes",
      body: "Versatile is about comfort, confidence and everyday style. Designed for real life, made for every you.",
      image: chapterEssentials,
      alt: "Model in an off-white tee and black trousers sitting on stone steps beside a Versatile duffel bag",
      layout: "banner",
      cta: "Explore collection",
      to: "/shop",
    },
    {
      no: "03",
      eyebrow: "Chapter Three — Silhouette",
      title: "Fluid Lines",
      body: "Drape, weight, and movement. Pieces cut to fall, not to force — for a wardrobe that breathes.",
      image: collectionWomen,
      alt: "Model in a rose-coloured hoodie and joggers",
      layout: "panel",
      side: "right",
      cta: "Explore the edit",
      to: "/shop",
      search: { category: "women" },
    },
  ];

  return (
    <>
      {/* HERO — full-bleed photo, nav floats over it */}
      <section className="relative border-b border-border">
        <div className="relative isolate overflow-hidden bg-[#0b0b0c] h-[100svh] min-h-[620px] max-h-[960px] md:max-h-[1000px]">
          <img
            src={heroBanner}
            alt="Versatile oversized tees in off-white and black on a clothing rail, with folded tees and a cap on a stone plinth"
            width={1459}
            height={1078}
            fetchPriority="high"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[68%_center] sm:object-[62%_center] lg:object-[center_right] animate-ken-burns"
          />
          {/* Legibility overlays: bottom-up on phones, left-to-right on larger screens */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/50 to-black/10 lg:hidden" />
          <div className="absolute inset-0 -z-10 hidden lg:block bg-gradient-to-r from-black/75 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-black/55 to-transparent" />

          <div className="max-w-[1440px] mx-auto h-full px-6 md:px-10 flex items-end lg:items-center pb-14 lg:pb-0 pt-24">
            <div className="max-w-[640px] text-[#f5f3ee] animate-fade-up">
              <p className="eyebrow text-[#f5f3ee]/75 mb-5 md:mb-8">Autumn / Winter – Volume 07</p>
              <h1 className="font-serif text-[3.6rem] sm:text-7xl lg:text-[8rem] xl:text-[8.5rem] leading-[0.92] tracking-tight mb-6 md:mb-8">
                Wear
                <br />
                your <span className="italic font-light">style</span>.
              </h1>
              <p className="max-w-sm md:max-w-md text-base md:text-lg text-[#f5f3ee]/80 leading-relaxed mb-8 md:mb-10">
                Premium quality clothing designed for modern minds. Comfort, style and versatility
                — all in one place.
              </p>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link
                  to="/shop"
                  className="eyebrow inline-flex items-center gap-3 bg-[#f5f3ee] text-[#141414] px-7 md:px-8 py-4 hover:bg-white transition-colors"
                >
                  Shop the Collection <span aria-hidden="true">→</span>
                </Link>
                <Link
                  to="/shop"
                  className="eyebrow link-underline pb-1 text-[#f5f3ee]"
                >
                  The Journal →
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Continuously looping benefits ticker */}
        <div className="ticker border-t border-border bg-background">
          <div className="ticker__track eyebrow text-foreground/50">
            <TickerGroup />
            <TickerGroup hidden />
          </div>
        </div>
      </section>

      {/* CHAPTERS — full-bleed editorial scenes */}
      {chapters.map((c) => (
        <ChapterScene key={c.no} chapter={c} total={chapters.length} />
      ))}

      {/* NEW ARRIVALS */}
      <section className="py-24 md:py-28 border-t border-border">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          <Reveal className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <p className="eyebrow text-foreground/60 mb-4">Just In</p>
              <h2 className="font-serif text-5xl md:text-6xl leading-[0.95]">
                New <span className="italic">Arrivals</span>
              </h2>
            </div>
            <Link to="/shop" className="eyebrow link-underline pb-1 self-start md:self-auto">
              View all pieces →
            </Link>
          </Reveal>
          <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-x-6 md:gap-x-8 gap-y-12">
            {newArrivals.map((p) => (
              <StaggerItem key={p.slug}>
                <ProductCard product={p} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>


      {/* MANIFESTO / TESTIMONIAL */}
      <section className="py-32 md:py-40 border-t border-border bg-card">
        <Reveal className="max-w-[1280px] mx-auto px-6 md:px-10 grid md:grid-cols-12 gap-8">
          <p className="eyebrow md:col-span-3 text-foreground/60">A note from the atelier</p>
          <div className="md:col-span-9">
            <blockquote className="font-serif text-3xl md:text-5xl leading-[1.15] tracking-tight">
              We design in the space between what a garment is and what it becomes.
              <span className="italic text-foreground/70"> Cloth, gesture, patience — the ordinary made deliberate.</span>
            </blockquote>
            <div className="mt-10 flex items-center gap-4">
              <span className="w-10 h-px bg-foreground/30" />
              <span className="eyebrow">Elena V. — Creative Director</span>
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}

type Chapter = {
  no: string;
  eyebrow: string;
  title: string;
  body: string;
  image: string;
  alt: string;
  layout: "banner" | "panel";
  side?: "left" | "right";
  cta: string;
  to: string;
  search?: Record<string, string>;
};

function ChapterText({ chapter, className = "" }: { chapter: Chapter; className?: string }) {
  return (
    <div className={`text-[#f5f3ee] ${className}`}>
      <Reveal>
        <p className="eyebrow text-[#f5f3ee]/80 mb-5 md:mb-6">{chapter.eyebrow}</p>
      </Reveal>
      <h3 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[0.98] tracking-tight mb-6">
        <RevealWords text={chapter.title} delay={0.1} italicLast />
      </h3>
      <Reveal delay={0.18}>
        <p className="text-base md:text-lg text-[#f5f3ee]/70 leading-relaxed mb-8 md:mb-10 max-w-md">
          {chapter.body}
        </p>
        <Link
          to={chapter.to}
          search={chapter.search}
          className="eyebrow link-underline pb-2 inline-block text-[#f5f3ee]"
        >
          {chapter.cta} →
        </Link>
      </Reveal>
    </div>
  );
}

/** Small editorial details (progress counter and corner captions) — large screens only. */
function ChapterDetails({ no, total }: { no: string; total: number }) {
  return (
    <div className="hidden lg:block pointer-events-none absolute inset-0 text-[#f5f3ee]">
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-3 eyebrow !text-[11px]">
        <span className="font-semibold">{no}</span>
        <span className="h-12 w-px bg-[#f5f3ee]/40" />
        <span className="text-[#f5f3ee]/50">{String(total).padStart(2, "0")}</span>
      </div>
      <div className="absolute left-10 bottom-8 flex flex-col gap-1 eyebrow !text-[10px] text-[#f5f3ee]/60">
        <span>— Premium quality</span>
        <span>— Everyday wear</span>
      </div>
      <div className="absolute right-8 bottom-8 text-right flex flex-col gap-1 eyebrow !text-[10px] text-[#f5f3ee]/60">
        <span>Versatile</span>
        <span>Est. 2024</span>
      </div>
    </div>
  );
}

function ChapterScene({ chapter, total }: { chapter: Chapter; total: number }) {
  if (chapter.layout === "banner") {
    return (
      <section className="relative bg-[#0b0b0c] border-t border-white/5 overflow-hidden">
        <div className="relative isolate flex min-h-[max(88svh,700px)] lg:min-h-[92svh] lg:max-h-[960px]">
          <img
            src={chapter.image}
            alt={chapter.alt}
            width={1871}
            height={841}
            loading="lazy"
            className="absolute inset-0 -z-20 h-full w-full object-cover object-[25%_center] sm:object-[22%_center] lg:object-[30%_center]"
          />
          <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent lg:hidden" />
          <div className="absolute inset-0 -z-10 hidden lg:block bg-gradient-to-l from-black/50 via-transparent to-transparent" />
          <div className="relative w-full max-w-[1440px] mx-auto px-6 md:px-10 grid lg:grid-cols-12 items-end lg:items-center pt-32 pb-14 lg:py-24">
            <ChapterText chapter={chapter} className="lg:col-start-7 lg:col-span-6 xl:col-start-8 xl:col-span-5" />
          </div>
          <ChapterDetails no={chapter.no} total={total} />
        </div>
      </section>
    );
  }

  const imageLeft = chapter.side !== "right";
  return (
    <section className="relative bg-[#0b0b0c] border-t border-white/5 overflow-hidden">
      <div className="grid lg:grid-cols-2 lg:min-h-[92svh]">
        <div
          className={`relative h-[72svh] sm:h-[78svh] lg:h-auto bg-[#0b0b0c] ${imageLeft ? "" : "lg:order-2"}`}
        >
          <img
            src={chapter.image}
            alt={chapter.alt}
            width={1200}
            height={1440}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0b0b0c] to-transparent lg:hidden" />
        </div>
        <div className="relative flex items-center px-6 md:px-10 lg:px-20 py-14 lg:py-24 -mt-16 lg:mt-0">
          <ChapterText chapter={chapter} className="relative max-w-xl" />
          <ChapterDetails no={chapter.no} total={total} />
        </div>
      </div>
    </section>
  );
}
