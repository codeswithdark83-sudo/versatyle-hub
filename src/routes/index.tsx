import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import collectionMen from "@/assets/collection-men.jpg";
import collectionWomen from "@/assets/collection-women.jpg";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const newArrivals = products.slice(0, 4);
  return (
    <>
      {/* HERO */}
      <section className="relative h-[88vh] min-h-[560px] w-full overflow-hidden">
        <img
          src={hero}
          alt="Model in a minimalist beige wool coat against a concrete wall"
          width={1920}
          height={1200}
          className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
        />
        <div className="absolute inset-0 bg-black/25" />
        <div className="relative h-full flex flex-col items-center justify-center text-center px-6 text-brand-offwhite">
          <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl italic leading-[1.05] mb-6 animate-fade-up">
            Wear Your Style
          </h1>
          <p className="eyebrow text-brand-offwhite/85 mb-10 animate-fade-up [animation-delay:120ms]">
            Curated essentials for the modern silhouette
          </p>
          <Link
            to="/shop"
            className="animate-fade-up [animation-delay:240ms] bg-brand-offwhite text-brand-charcoal eyebrow px-10 py-4 hover:bg-accent hover:text-brand-charcoal transition-colors duration-500"
          >
            Shop the Collection
          </Link>
        </div>
      </section>

      {/* FEATURED COLLECTIONS */}
      <section className="py-24 md:py-32 px-6">
        <div className="max-w-[1440px] mx-auto grid md:grid-cols-2 gap-12 md:gap-16">
          <CollectionCard
            title="The Winter Edit"
            eyebrow="Explore Men's Basics"
            image={collectionMen}
            to="/shop"
            search={{ category: "men" }}
          />
          <div className="md:mt-24">
            <CollectionCard
              title="Fluid Silhouettes"
              eyebrow="Explore Women's Essentials"
              image={collectionWomen}
              to="/shop"
              search={{ category: "women" }}
            />
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="py-24 bg-card">
        <div className="max-w-[1440px] mx-auto px-6">
          <div className="flex justify-between items-end mb-12">
            <h2 className="text-4xl md:text-5xl">New Arrivals</h2>
            <Link
              to="/shop"
              className="eyebrow border-b border-foreground pb-1 hover:text-accent-foreground/70"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {newArrivals.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* SALE BANNER */}
      <section className="py-24 bg-accent/20">
        <div className="max-w-3xl mx-auto text-center px-6">
          <p className="eyebrow mb-4">Seasonal Archive</p>
          <h2 className="text-4xl md:text-5xl mb-8">Up to 40% Off Essentials</h2>
          <Link
            to="/shop"
            className="inline-block bg-foreground text-background eyebrow px-12 py-4 hover:scale-[1.03] transition-transform duration-500"
          >
            Shop the Sale
          </Link>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="py-32 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <blockquote className="font-serif italic text-2xl md:text-3xl leading-[1.4] text-foreground/85 mb-8">
            &ldquo;The quality of the fabrics and the precision of the cuts are unmatched. Versatile has become the backbone of my everyday wardrobe.&rdquo;
          </blockquote>
          <div className="flex items-center justify-center gap-4">
            <span className="w-8 h-px bg-foreground/25" />
            <span className="eyebrow">Elena V. — Creative Director</span>
            <span className="w-8 h-px bg-foreground/25" />
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="py-24 border-t border-border">
        <div className="max-w-xl mx-auto px-6 text-center">
          <h2 className="text-3xl mb-3">Join the Circle</h2>
          <p className="text-sm text-foreground/60 mb-10">
            Early access to collections and exclusive editorial content.
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
              className="flex-1 bg-transparent border-b border-foreground/20 py-3 px-2 text-sm focus:outline-none focus:border-foreground transition-colors"
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

function CollectionCard({
  title,
  eyebrow,
  image,
  to,
  search,
}: {
  title: string;
  eyebrow: string;
  image: string;
  to: string;
  search?: Record<string, string>;
}) {
  return (
    <Link to={to} search={search} className="group block">
      <div className="aspect-[4/5] bg-brand-muted overflow-hidden mb-6 outline outline-1 -outline-offset-1 outline-black/5">
        <img
          src={image}
          alt={title}
          width={1200}
          height={1500}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
        />
      </div>
      <h3 className="font-serif text-2xl md:text-3xl mb-2">{title}</h3>
      <p className="eyebrow text-foreground/60 !font-medium">{eyebrow}</p>
    </Link>
  );
}
