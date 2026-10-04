import { Fragment } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
const hero = "/images/hero.jpg";
const heroBanner = "/images/hero-banner.jpg";
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
  const zigzag = [
    {
      no: "01",
      eyebrow: "Chapter One — Outerwear",
      title: "The Winter Edit",
      body: "Structured wool, considered proportion. A quiet study in warmth built for the long walk home.",
      image: collectionMen,
      to: "/shop",
      search: { category: "men" },
    },
    {
      no: "02",
      eyebrow: "Chapter Two — Silhouette",
      title: "Fluid Lines",
      body: "Drape, weight, and movement. Pieces cut to fall, not to force — for a wardrobe that breathes.",
      image: collectionWomen,
      to: "/shop",
      search: { category: "women" },
    },
    {
      no: "03",
      eyebrow: "Chapter Three — Everyday",
      title: "Considered Basics",
      body: "The building blocks. Fabrics chosen for how they age, cuts drawn for how they live.",
      image: hero,
      to: "/shop",
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
            <div className="max-w-[640px] text-brand-offwhite animate-fade-up">
              <p className="eyebrow text-brand-offwhite/75 mb-5 md:mb-8">Autumn / Winter – Volume 07</p>
              <h1 className="font-serif text-[3.6rem] sm:text-7xl lg:text-[8rem] xl:text-[8.5rem] leading-[0.92] tracking-tight mb-6 md:mb-8">
                Wear
                <br />
                your <span className="italic font-light">style</span>.
              </h1>
              <p className="max-w-sm md:max-w-md text-base md:text-lg text-brand-offwhite/80 leading-relaxed mb-8 md:mb-10">
                Premium quality clothing designed for modern minds. Comfort, style and versatility
                — all in one place.
              </p>
              <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                <Link
                  to="/shop"
                  className="eyebrow inline-flex items-center gap-3 bg-brand-offwhite text-brand-charcoal px-7 md:px-8 py-4 hover:bg-white transition-colors"
                >
                  Shop the Collection <span aria-hidden="true">→</span>
                </Link>
                <Link
                  to="/shop"
                  className="eyebrow link-underline pb-1 text-brand-offwhite"
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

      {/* ZIGZAG CHAPTERS */}
      <section className="py-24 md:py-32 px-6 md:px-10">
        <div className="max-w-[1280px] mx-auto space-y-24 md:space-y-40">
          {zigzag.map((c, i) => (
            <ZigRow key={c.no} chapter={c} reverse={i % 2 === 1} />
          ))}
        </div>
      </section>

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

function ZigRow({
  chapter,
  reverse,
}: {
  chapter: {
    no: string;
    eyebrow: string;
    title: string;
    body: string;
    image: string;
    to: string;
    search?: Record<string, string>;
  };
  reverse: boolean;
}) {
  return (
    <div className="grid md:grid-cols-12 gap-8 md:gap-16 items-center">
      <Reveal
        y={40}
        className={`md:col-span-7 ${reverse ? "md:order-2" : ""}`}
      >
        <Link to={chapter.to} search={chapter.search} className="group block relative">
          <div className="aspect-[5/6] overflow-hidden bg-muted">
            <img
              src={chapter.image}
              alt={chapter.title}
              width={1200}
              height={1440}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.045]"
            />
          </div>
          <span className="absolute top-4 left-4 eyebrow bg-background/90 backdrop-blur px-3 py-1.5">
            {chapter.no}
          </span>
        </Link>
      </Reveal>
      <div className={`md:col-span-5 ${reverse ? "md:order-1 md:pr-8" : "md:pl-8"}`}>
        <Reveal delay={0.08}>
          <p className="eyebrow text-foreground/60 mb-6">{chapter.eyebrow}</p>
        </Reveal>
        <h3 className="font-serif text-5xl md:text-6xl leading-[0.95] tracking-tight mb-6">
          <RevealWords text={chapter.title} delay={0.12} italicLast />
        </h3>

        <Reveal delay={0.2}>
          <p className="text-base text-foreground/70 leading-relaxed mb-8 max-w-md">{chapter.body}</p>
          <Link
            to={chapter.to}
            search={chapter.search}
            className="eyebrow link-underline pb-1 inline-block"
          >
            Explore the edit →
          </Link>
        </Reveal>

      </div>
    </div>
  );
}
