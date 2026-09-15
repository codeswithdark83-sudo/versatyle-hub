import { createFileRoute, Link } from "@tanstack/react-router";
import heroAsset from "@/assets/hero.jpg.asset.json";
import collectionMenAsset from "@/assets/collection-men.jpg.asset.json";
import collectionWomenAsset from "@/assets/collection-women.jpg.asset.json";

const hero = heroAsset.url;
const collectionMen = collectionMenAsset.url;
const collectionWomen = collectionWomenAsset.url;
import { ProductCard } from "@/components/ProductCard";
import { listProducts } from "@/lib/catalog.functions";

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
      {/* HERO — editorial split */}
      <section className="relative border-b border-border">
        <div className="max-w-[1440px] mx-auto grid md:grid-cols-12 gap-8 md:gap-12 px-6 md:px-10 pt-20 md:pt-28 pb-16 md:pb-24">
          <div className="md:col-span-6 flex flex-col justify-center order-2 md:order-1 animate-fade-up">
            <p className="eyebrow text-foreground/60 mb-8">Autumn / Winter — Volume 07</p>
            <h1 className="font-serif text-6xl md:text-7xl lg:text-[8.5rem] leading-[0.92] tracking-tight mb-8">
              Wear
              <br />
              your <span className="italic font-light">style</span>.
            </h1>
            <p className="max-w-md text-base md:text-lg text-foreground/70 leading-relaxed mb-10">
              A quiet manifesto in cloth and cut. Versatile is a study of the modern wardrobe — considered, unhurried, made to last.
            </p>
            <div className="flex items-center gap-8">
              <Link
                to="/shop"
                className="eyebrow bg-foreground text-background px-8 py-4 hover:bg-foreground/85 transition-colors"
              >
                Shop the Collection
              </Link>
              <Link to="/shop" className="eyebrow link-underline pb-1">
                The Journal →
              </Link>
            </div>
          </div>
          <div className="md:col-span-6 order-1 md:order-2 relative animate-fade-in-slow">
            <div className="aspect-[4/5] overflow-hidden bg-muted">
              <img
                src={hero}
                alt="Model in a minimalist wool coat"
                width={1200}
                height={1500}
                className="w-full h-full object-cover animate-ken-burns"
              />
            </div>
            <div className="hidden md:flex absolute -left-6 top-6 flex-col gap-2 items-start">
              <span className="eyebrow text-foreground/60 [writing-mode:vertical-rl] rotate-180">
                Est. Versatile — MMXXV
              </span>
            </div>
            <div className="absolute -bottom-4 right-4 bg-background px-4 py-2 border border-border">
              <p className="eyebrow">N° 001 / Coat</p>
            </div>
          </div>
        </div>

        {/* Continuously looping benefits ticker */}
        <div className="ticker border-t border-border bg-background">
          <div className="ticker__track eyebrow text-foreground/50">
            <div className="ticker__content">
              <span>Free shipping over ₹4,000</span>
              <span aria-hidden="true">·</span>
              <span>30-day returns</span>
              <span aria-hidden="true">·</span>
              <span>Crafted in limited runs</span>
              <span aria-hidden="true">·</span>
              <span>New arrivals every Friday</span>
              <span aria-hidden="true">·</span>
            </div>
            <div className="ticker__content" aria-hidden="true">
              <span>Free shipping over ₹4,000</span>
              <span>·</span>
              <span>30-day returns</span>
              <span>·</span>
              <span>Crafted in limited runs</span>
              <span>·</span>
              <span>New arrivals every Friday</span>
              <span>·</span>
            </div>
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
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
            <div>
              <p className="eyebrow text-foreground/60 mb-4">Just In</p>
              <h2 className="font-serif text-5xl md:text-6xl leading-[0.95]">
                New <span className="italic">Arrivals</span>
              </h2>
            </div>
            <Link to="/shop" className="eyebrow link-underline pb-1 self-start md:self-auto">
              View all pieces →
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 md:gap-x-8 gap-y-12">
            {newArrivals.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* MANIFESTO / TESTIMONIAL */}
      <section className="py-32 md:py-40 border-t border-border bg-card">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 grid md:grid-cols-12 gap-8">
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
        </div>
      </section>

      {/* SALE STRIP */}
      <section className="py-20 border-t border-border">
        <div className="max-w-[1280px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="eyebrow text-foreground/60 mb-2">Seasonal Archive</p>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight">
              Up to <span className="italic">40% off</span> essentials.
            </h2>
          </div>
          <Link
            to="/shop"
            className="eyebrow bg-foreground text-background px-10 py-4 hover:bg-foreground/85 transition-colors"
          >
            Shop the Sale
          </Link>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-24 border-t border-border">
        <div className="max-w-2xl mx-auto px-6 text-center">
          <p className="eyebrow text-foreground/60 mb-4">The Circle</p>
          <h2 className="font-serif text-4xl md:text-5xl mb-4">
            Correspondence, <span className="italic">quietly</span>.
          </h2>
          <p className="text-sm text-foreground/60 mb-10">
            Occasional letters on new pieces, editorial notes, and private previews.
          </p>
          <form
            className="flex flex-col md:flex-row gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value = "";
            }}
          >
            <input
              type="email"
              name="email"
              required
              placeholder="Your email address"
              className="flex-1 bg-transparent border-b border-foreground/25 py-3 px-2 text-sm focus:outline-none focus:border-foreground transition-colors"
            />
            <button
              type="submit"
              className="eyebrow py-3 px-8 border border-foreground hover:bg-foreground hover:text-background transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
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
      <div
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
      </div>
      <div className={`md:col-span-5 ${reverse ? "md:order-1 md:pr-8" : "md:pl-8"}`}>
        <p className="eyebrow text-foreground/60 mb-6">{chapter.eyebrow}</p>
        <h3 className="font-serif text-5xl md:text-6xl leading-[0.95] tracking-tight mb-6">
          {chapter.title.split(" ").map((w, i) =>
            i === chapter.title.split(" ").length - 1 ? (
              <span key={i} className="italic font-light">
                {" "}
                {w}
              </span>
            ) : i === 0 ? (
              <span key={i}>{w}</span>
            ) : (
              <span key={i}> {w}</span>
            ),
          )}
        </h3>
        <p className="text-base text-foreground/70 leading-relaxed mb-8 max-w-md">{chapter.body}</p>
        <Link
          to={chapter.to}
          search={chapter.search}
          className="eyebrow link-underline pb-1 inline-block"
        >
          Explore the edit →
        </Link>
      </div>
    </div>
  );
}
