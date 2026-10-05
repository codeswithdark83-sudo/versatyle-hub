import { Fragment } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
const hero = "/images/hero.jpg";
const heroBanner = "/images/hero-banner.jpg";
const chapterEssentials = "/images/chapter-essentials.jpg";

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
      eyebrow: "Chapter One — The Essentials",
      title: "More Than Just Clothes.",
      body: "Versatile is about comfort, confidence and everyday style. Designed for real life, made for every you.",
      image: chapterEssentials,
      alt: "Model in an off-white tee and black trousers sitting on stone steps beside a Versatile duffel bag",
      to: "/shop",
      cta: "Explore collection",
      layout: "wide",
    },
    {
      no: "02",
      eyebrow: "Chapter Two — Everyday",
      title: "Considered Basics",
      body: "The building blocks. Fabrics chosen for how they age, cuts drawn for how they live.",
      image: hero,
      alt: "Model in a minimalist wool coat",
      to: "/shop",
      cta: "Explore the basics",
      layout: "image-right",
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

      {/* CINEMATIC CHAPTERS */}
      <div>
        {chapters.map((c, i) => (
          <ChapterPanel key={c.no} chapter={c} index={i} total={chapters.length} />
        ))}
      </div>

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
  to: string;
  search?: Record<string, string>;
  cta: string;
  layout: "image-left" | "image-right" | "wide";
};

/**
 * Full-bleed chapter panel. Phones/tablets: photo fills the panel and the copy sits at the
 * bottom over a dark fade. Desktop (lg+): copy sits on one side; portrait photos fill the
 * other half, the landscape photo ("wide") spans the whole panel.
 * Colours are fixed (not theme tokens) because the panel is always a dark photograph.
 */
function ChapterPanel({
  chapter,
  index,
  total,
}: {
  chapter: Chapter;
  index: number;
  total: number;
}) {
  const wide = chapter.layout === "wide";
  const imageLeft = chapter.layout === "image-left";
  const textRight = wide || imageLeft;
  const pad = (n: number) => String(n).padStart(2, "0");

  const imgClass = wide
    ? "inset-0 w-full object-cover object-[30%_center] sm:object-[28%_center] lg:object-[20%_center]"
    : `inset-y-0 w-full object-cover object-[50%_20%] lg:w-1/2 ${
        imageLeft ? "lg:left-0" : "lg:right-0"
      }`;

  return (
    <section
      aria-label={chapter.eyebrow}
      className="relative isolate overflow-hidden bg-[#0b0b0c] text-[#f5f3ee] h-[88svh] lg:h-[100svh] min-h-[600px] max-h-[920px]"
    >
      <img
        src={chapter.image}
        alt={chapter.alt}
        width={wide ? 1871 : 1024}
        height={wide ? 841 : 1200}
        loading="lazy"
        className={`absolute -z-20 h-full ${imgClass}`}
      />
      {/* Legibility: bottom-up fade on small screens */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/45 to-black/5 lg:hidden" />
      {/* Desktop: fade the photo into the dark copy side */}
      {wide ? (
        <div className="absolute inset-0 -z-10 hidden lg:block bg-gradient-to-r from-transparent from-45% via-black/45 to-black/85" />
      ) : (
        <div
          className={`absolute inset-y-0 -z-10 hidden w-1/2 lg:block ${
            imageLeft
              ? "left-0 bg-gradient-to-r from-transparent from-60% to-[#0b0b0c]"
              : "right-0 bg-gradient-to-l from-transparent from-60% to-[#0b0b0c]"
          }`}
        />
      )}

      <div
        className={`relative max-w-[1440px] mx-auto h-full px-6 md:px-10 flex items-end pb-14 lg:pb-0 lg:items-center ${
          textRight ? "lg:justify-end" : "lg:justify-start"
        }`}
      >
        <div className={`w-full max-w-xl lg:w-[42%] ${textRight ? "lg:mr-10 xl:mr-16" : "lg:ml-0"}`}>
          <Reveal>
            <p className="eyebrow text-[#f5f3ee]/75 mb-5 md:mb-7">{chapter.eyebrow}</p>
          </Reveal>
          <h3 className="font-serif text-5xl sm:text-6xl xl:text-7xl leading-[0.98] tracking-tight mb-6">
            <RevealWords text={chapter.title} delay={0.1} italicLast />
          </h3>
          <Reveal delay={0.18}>
            <p className="text-base md:text-lg text-[#f5f3ee]/75 leading-relaxed mb-8 max-w-md">
              {chapter.body}
            </p>
            <Link
              to={chapter.to}
              search={chapter.search}
              className="eyebrow link-underline pb-1 inline-block text-[#f5f3ee]"
            >
              {chapter.cta} →
            </Link>
          </Reveal>
        </div>
      </div>

      {/* Desktop-only editorial details */}
      <div
        aria-hidden="true"
        className={`hidden lg:flex absolute top-1/2 -translate-y-1/2 flex-col items-center gap-3 eyebrow text-[#f5f3ee]/50 ${
          textRight ? "right-10" : "left-1/2 -translate-x-1/2"
        }`}
      >
        <span className="text-[#f5f3ee] font-semibold">{pad(index + 1)}</span>
        <span className="h-10 w-px bg-[#f5f3ee]/40" />
        <span>{pad(total)}</span>
      </div>
      <div
        aria-hidden="true"
        className="hidden lg:block absolute bottom-8 left-10 eyebrow text-[10px] leading-5 text-[#f5f3ee]/60"
      >
        — Premium quality
        <br />— Everyday wear
      </div>
      <div
        aria-hidden="true"
        className="hidden lg:block absolute bottom-8 right-10 text-right eyebrow text-[10px] leading-5 text-[#f5f3ee]/60"
      >
        Versatile
        <br />
        Est. 2024
      </div>
    </section>
  );
}
