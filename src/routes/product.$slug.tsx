import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { getProduct, products } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";
import { formatPrice, useCart } from "@/lib/cart";
import { Heart, Truck, RotateCcw, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Product not found — Versatile" }, { name: "robots", content: "noindex" }] };
    }
    const { product } = loaderData;
    return {
      meta: [
        { title: `${product.name} — Versatile` },
        { name: "description", content: product.description },
        { property: "og:title", content: `${product.name} — Versatile` },
        { property: "og:description", content: product.description },
        { property: "og:image", content: product.image },
        { property: "og:type", content: "product" },
      ],
    };
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="max-w-xl mx-auto py-32 text-center px-6">
      <h1 className="font-serif text-4xl mb-4">Piece not found</h1>
      <p className="text-foreground/60 mb-8">
        This piece may have been retired from the collection.
      </p>
      <Link to="/shop" className="eyebrow border-b border-foreground pb-1">
        Back to shop
      </Link>
    </div>
  ),
});

function ProductPage() {
  const { product } = Route.useLoaderData();
  const { addItem } = useCart();
  const [size, setSize] = useState(product.sizes[Math.floor(product.sizes.length / 2)]);
  const [color, setColor] = useState(product.colors[0]);

  const related = products.filter((p) => p.slug !== product.slug).slice(0, 4);

  return (
    <>
      <nav aria-label="Breadcrumb" className="max-w-[1440px] mx-auto px-6 pt-8 eyebrow text-foreground/50">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span className="mx-2">/</span>
        <Link to="/shop" className="hover:text-foreground">Shop</Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <section className="max-w-[1440px] mx-auto px-6 py-12 grid md:grid-cols-2 gap-12 md:gap-20">
        <div className="bg-brand-muted aspect-[3/4] overflow-hidden outline outline-1 -outline-offset-1 outline-black/5">
          <img
            src={product.image}
            alt={product.name}
            width={900}
            height={1200}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex flex-col md:pt-8">
          <p className="eyebrow text-foreground/50 mb-3">{product.category}</p>
          <h1 className="font-serif text-4xl md:text-5xl mb-4">{product.name}</h1>
          <p className="text-2xl tabular-nums mb-8">{formatPrice(product.price)}</p>

          <p className="text-foreground/70 leading-relaxed mb-10 max-w-md">
            {product.description}
          </p>

          {/* Color */}
          <div className="mb-8">
            <div className="flex justify-between eyebrow mb-3">
              <span>Color</span>
              <span className="text-foreground/60">{color}</span>
            </div>
            <div className="flex gap-3">
              {product.colors.map((c: string) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`px-4 py-2 text-sm border transition-colors ${
                    c === color ? "border-foreground bg-foreground text-background" : "border-border hover:border-foreground/40"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="mb-10">
            <div className="flex justify-between eyebrow mb-3">
              <span>Size</span>
              <a href="#" className="text-foreground/60 underline underline-offset-4">Size guide</a>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {product.sizes.map((s: string) => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`py-3 text-sm border transition-colors ${
                    s === size
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground/40"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                addItem({
                  slug: product.slug,
                  name: product.name,
                  price: product.price,
                  image: product.image,
                  size,
                  color,
                })
              }
              className="flex-1 eyebrow bg-foreground text-background py-4 hover:bg-foreground/90 transition-colors"
            >
              Add to Bag — {formatPrice(product.price)}
            </button>
            <button
              aria-label="Add to wishlist"
              className="w-14 border border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
            >
              <Heart className="size-4" strokeWidth={1.5} />
            </button>
          </div>

          <ul className="mt-10 pt-8 border-t border-border grid grid-cols-3 gap-4 text-center">
            <Feature icon={<Truck className="size-4" strokeWidth={1.5} />} label="Free shipping over $150" />
            <Feature icon={<RotateCcw className="size-4" strokeWidth={1.5} />} label="30-day returns" />
            <Feature icon={<ShieldCheck className="size-4" strokeWidth={1.5} />} label="Authenticity guaranteed" />
          </ul>

          <dl className="mt-10 pt-8 border-t border-border space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-foreground/60">Material</dt>
              <dd>{product.material}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-foreground/60">Category</dt>
              <dd>{product.category}</dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-6 py-24 border-t border-border">
        <h2 className="text-3xl md:text-4xl mb-10">You may also like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {related.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>
    </>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <li className="flex flex-col items-center gap-2">
      <span className="text-foreground/70">{icon}</span>
      <span className="text-[11px] text-foreground/60 leading-tight">{label}</span>
    </li>
  );
}
