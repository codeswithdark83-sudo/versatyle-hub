import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { getProductBySlug } from "@/lib/catalog.functions";
import { ProductCard } from "@/components/ProductCard";
import { ReviewsSection } from "@/components/ReviewsSection";
import { formatPrice, useCart } from "@/lib/cart";
import { GST_PERCENT, RETURN_WINDOW_DAYS } from "@/lib/pricing";
import { Heart, Truck, RotateCcw, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ params }) => {
    const { product, related } = await getProductBySlug({ data: { slug: params.slug } });
    if (!product) throw notFound();
    return { product, related };
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
        { property: "og:type", content: "product" },
      ],
    };
  },
  component: ProductPage,
  errorComponent: () => (
    <div className="max-w-xl mx-auto py-32 text-center px-6">
      <h1 className="font-serif text-3xl mb-3">Could not load this piece</h1>
      <Link to="/shop" className="eyebrow border-b border-foreground pb-1">
        Back to shop
      </Link>
    </div>
  ),
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
  const { product, related } = Route.useLoaderData();
  const { addItem } = useCart();
  const firstAvailable = product.variants.find((v) => v.stock > 0);
  const [size, setSize] = useState(firstAvailable?.size ?? product.sizes[0] ?? "");
  const [color, setColor] = useState(product.colors[0] ?? "");

  const selected = product.variants.find((v) => v.size === size);
  const unitPrice = selected?.price ?? product.price;
  const canBuy = (selected?.stock ?? 0) > 0;

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
        <div className="bg-muted aspect-[3/4] overflow-hidden outline outline-1 -outline-offset-1 outline-border">
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
          <p className="text-2xl tabular-nums mb-2">
            {formatPrice(unitPrice)}
            {product.compareAtPrice ? (
              <span className="ml-3 text-base text-foreground/40 line-through">
                {formatPrice(product.compareAtPrice)}
              </span>
            ) : null}
          </p>
          <p className="-mt-1 mb-3 text-[11px] text-foreground/50">
            Inclusive of all taxes (incl. {GST_PERCENT}% GST) · Free shipping
          </p>
          <p className="eyebrow mb-8 text-foreground/50">
            {product.inStock
              ? canBuy
                ? selected!.stock <= 3
                  ? `Only ${selected!.stock} left in ${size}`
                  : "In stock — ships in 1–2 days"
                : `Size ${size} is sold out`
              : "Sold out"}
          </p>

          <p className="text-foreground/70 leading-relaxed mb-10 max-w-md">
            {product.description}
          </p>

          {product.colors.length > 0 && (
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
          )}

          {/* Size */}
          <div className="mb-10">
            <div className="flex justify-between eyebrow mb-3">
              <span>Size</span>
              <Link to="/size-guide" className="text-foreground/60 underline underline-offset-4">
                Size guide
              </Link>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {product.variants.map((v) => {
                const soldOut = v.stock === 0;
                return (
                  <button
                    key={v.size}
                    disabled={soldOut}
                    onClick={() => setSize(v.size)}
                    title={soldOut ? "Out of stock" : `${v.stock} in stock`}
                    className={`py-3 text-sm border transition-colors ${
                      v.size === size
                        ? "border-foreground bg-foreground text-background"
                        : soldOut
                          ? "border-border/60 text-foreground/30 line-through cursor-not-allowed"
                          : "border-border hover:border-foreground/40"
                    }`}
                  >
                    {v.size}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              disabled={!canBuy}
              onClick={() =>
                addItem({
                  slug: product.slug,
                  name: product.name,
                  price: unitPrice,
                  image: product.image,
                  size,
                  color,
                })
              }
              className="flex-1 eyebrow bg-foreground text-background py-4 hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {canBuy ? `Add to Bag — ${formatPrice(unitPrice)}` : "Sold out"}
            </button>
            <button
              aria-label="Add to wishlist"
              className="w-14 border border-foreground flex items-center justify-center hover:bg-foreground hover:text-background transition-colors"
            >
              <Heart className="size-4" strokeWidth={1.5} />
            </button>
          </div>

          <ul className="mt-10 pt-8 border-t border-border grid grid-cols-3 gap-4 text-center">
            <Feature icon={<Truck className="size-4" strokeWidth={1.5} />} label="Free shipping on every order" />
            <Feature icon={<RotateCcw className="size-4" strokeWidth={1.5} />} label={`Easy ${RETURN_WINDOW_DAYS}-day returns`} />
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

      <ReviewsSection productSlug={product.slug} />

      {related.length > 0 && (
        <section className="max-w-[1440px] mx-auto px-6 py-24 border-t border-border">
          <h2 className="text-3xl md:text-4xl mb-10">You may also like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
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
