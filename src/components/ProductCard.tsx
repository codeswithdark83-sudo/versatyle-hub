import { Link } from "@tanstack/react-router";
import type { Product } from "@/data/products";
import { formatPrice } from "@/lib/cart";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <div className="aspect-[3/4] bg-brand-muted overflow-hidden mb-4 outline outline-1 -outline-offset-1 outline-black/5">
        <img
          src={product.image}
          alt={product.name}
          width={900}
          height={1200}
          loading={priority ? "eager" : "lazy"}
          className="w-full h-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.04]"
        />
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-medium">{product.name}</p>
        <p className="text-sm tabular-nums text-foreground/70">{formatPrice(product.price)}</p>
      </div>
      <p className="eyebrow mt-1 text-foreground/50 !font-medium">{product.category}</p>
    </Link>
  );
}
