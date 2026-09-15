import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Product } from "@/data/products";

export function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const PRODUCT_SELECT =
  "id, slug, name, price, compare_at_price, category, tags, colors, description, material, image_url, sort_order, product_variants(size, stock, price, sort_order)";

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  price: number;
  compare_at_price: number | null;
  category: string;
  tags: string[] | null;
  colors: string[] | null;
  description: string | null;
  material: string | null;
  image_url: string | null;
  sort_order: number;
  product_variants: { size: string; stock: number; price: number | null; sort_order: number }[] | null;
};

function resolveProductImageUrl(imageUrl: string | null): string {
  if (!imageUrl) return "";
  if (!imageUrl.startsWith("/__l5e/assets-v1/")) return imageUrl;
  const filename = imageUrl.split("/").pop();
  return filename ? `/images/${filename}` : imageUrl;
}

export function toProduct(row: ProductRow): Product {
  const variants = [...(row.product_variants ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order || a.size.localeCompare(b.size))
    .map((v) => ({ size: v.size, stock: v.stock, price: v.price }));
  const totalStock = variants.reduce((n, v) => n + v.stock, 0);
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    price: row.price,
    compareAtPrice: row.compare_at_price,
    category: row.category,
    tags: row.tags ?? [],
    colors: row.colors ?? [],
    description: row.description ?? "",
    material: row.material ?? "",
    // Existing Supabase rows use Lovable-only /__l5e asset paths.
    // Map those legacy paths to the identical files committed in public/images.
    image: resolveProductImageUrl(row.image_url),
    sizes: variants.map((v) => v.size),
    variants,
    totalStock,
    inStock: totalStock > 0,
  };
}

export async function fetchActiveProducts(): Promise<Product[]> {
  const { data, error } = await publicClient()
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("fetchActiveProducts failed", error);
    return [];
  }
  return (data as unknown as ProductRow[]).map(toProduct);
}
