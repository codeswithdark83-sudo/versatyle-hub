import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ProductCard } from "@/components/ProductCard";
import { listProducts } from "@/lib/catalog.functions";

const searchSchema = z.object({
  category: z.enum(["men", "women", "accessories", "kids", "all"]).optional(),
  sort: z.enum(["featured", "price-asc", "price-desc"]).optional(),
});

export const Route = createFileRoute("/shop")({
  validateSearch: searchSchema,
  loader: () => listProducts(),
  head: () => ({
    meta: [
      { title: "Shop — Versatile" },
      {
        name: "description",
        content: "Browse the full Versatile collection — outerwear, tailoring, knitwear, footwear, and accessories.",
      },
      { property: "og:title", content: "Shop — Versatile" },
      { property: "og:description", content: "Considered essentials, curated for the modern silhouette." },
    ],
  }),
  component: Shop,
  errorComponent: () => (
    <div className="max-w-xl mx-auto py-32 text-center px-6">
      <h1 className="font-serif text-3xl mb-3">The collection is unavailable</h1>
      <p className="text-foreground/60 text-sm">Please refresh in a moment.</p>
    </div>
  ),
});

const FILTERS = ["All", "Men", "Women", "Accessories"] as const;

function Shop() {
  const all = Route.useLoaderData();
  const { category = "all", sort = "featured" } = Route.useSearch();
  const navigate = Route.useNavigate();

  let list =
    category === "all" ? all : all.filter((p) => p.category.toLowerCase() === category);
  if (sort === "price-asc") list = [...list].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list = [...list].sort((a, b) => b.price - a.price);

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-16 md:py-24">
      <header className="mb-14 md:mb-20 max-w-2xl">
        <p className="eyebrow text-foreground/50 mb-4">Autumn / Winter Collection</p>
        <h1 className="text-5xl md:text-6xl mb-4">The Collection</h1>
        <p className="text-foreground/60 text-lg leading-relaxed">
          {list.length} pieces — considered essentials, sourced and made to last.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-6 mb-12 pb-6 border-b border-border">
        <div className="flex gap-6 flex-wrap">
          {FILTERS.map((f) => {
            const value = f.toLowerCase() as typeof category;
            const active = category === value;
            return (
              <button
                key={f}
                onClick={() =>
                  navigate({ search: (prev: Record<string, string>) => ({ ...prev, category: value }) })
                }
                className={`eyebrow pb-1 border-b transition-colors ${
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-foreground/50 hover:text-foreground"
                }`}
              >
                {f}
              </button>
            );
          })}
        </div>
        <select
          value={sort}
          onChange={(e) =>
            navigate({
              search: (prev: Record<string, string>) => ({ ...prev, sort: e.target.value as typeof sort }),
            })
          }
          className="eyebrow bg-transparent border-b border-foreground pb-1 focus:outline-none cursor-pointer"
        >
          <option value="featured">Sort: Featured</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
        </select>
      </div>

      {list.length === 0 ? (
        <p className="text-center py-24 text-foreground/60">No pieces in this category yet.</p>
      ) : (
        <Stagger
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-10 gap-y-14"
          step={0.06}
        >
          {list.map((p) => (
            <StaggerItem key={p.slug}>
              <ProductCard product={p} />
            </StaggerItem>
          ))}
        </Stagger>

      )}
    </div>
  );
}
