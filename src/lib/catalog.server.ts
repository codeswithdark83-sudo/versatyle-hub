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
  "id, slug, name, price, compare_at_price, category, tags, colors, description, material, image_url, images, sort_order, product_variants(size, stock, price, sort_order)";

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
  images: string[] | null;
  sort_order: number;
  product_variants: { size: string; stock: number; price: number | null; sort_order: number }[] | null;
};

export function toProduct(row: ProductRow): Product {
  const variants = [...(row.product_variants ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order || a.size.localeCompare(b.size))
    .map((v) => ({ size: v.size, stock: v.stock, price: v.price }));
  const gallery = (row.images ?? []).filter(Boolean);
  const images = gallery.length ? gallery : row.image_url ? [row.image_url] : [];
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
    image: images[0] ?? "",
    images,
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

// Short in-memory cache for the public product listing only. Checkout and admin always use
// fetchActiveProducts() (live prices and stock). Worst case a browse page is ~30s behind.
let listCache: { at: number; data: Product[] } | null = null;
const LIST_TTL_MS = 30_000;

export async function fetchActiveProductsCached(): Promise<Product[]> {
  const now = Date.now();
  if (listCache && now - listCache.at < LIST_TTL_MS) return listCache.data;
  const data = await fetchActiveProducts();
  // Don't cache an empty result: it is usually a failed/slow query, retry next time.
  if (data.length > 0) listCache = { at: now, data };
  return data;
}
