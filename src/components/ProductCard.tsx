import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import type { Product } from "@/data/products";
import { formatPrice } from "@/lib/cart";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const soldOut = product.inStock === false;
  const reduced = useReducedMotion();
  return (
    <Link
      to="/product/$slug"
      params={{ slug: product.slug }}
      className="group block"
    >
      <motion.div
        className="relative aspect-[3/4] bg-muted overflow-hidden mb-4 outline outline-1 -outline-offset-1 outline-border"
        whileHover={reduced ? undefined : { y: -6 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <img
          src={product.image}
          alt={product.name}
          width={900}
          height={1200}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.06]"
        />
        {product.images?.[1] && (
          <img
            src={product.images[1]}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] bg-background/90 backdrop-blur px-4 py-3 eyebrow text-center">
          {soldOut ? "Sold out" : "View piece"}
        </span>
        {soldOut && (
          <span className="absolute top-3 left-3 eyebrow bg-background/90 backdrop-blur px-3 py-1">
            Sold out
          </span>
        )}
      </motion.div>
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm font-medium leading-snug break-words">{product.name}</p>
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm tabular-nums text-foreground/70">
          <span>{formatPrice(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price ? (
            <span className="text-xs text-foreground/40 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          ) : null}
        </p>
      </div>
      <p className="eyebrow mt-1 text-foreground/50 !font-medium">{product.category}</p>
    </Link>
  );
}
