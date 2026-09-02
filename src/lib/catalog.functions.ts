import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";
import type { Product } from "@/data/products";

function publicClient() {
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

const SELECT =
  "id, slug, name, price, compare_at_price, category, tags, colors, description, material, image_url, sort_order, product_variants(size, stock, price, sort_order)";

type Row = {
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

function toProduct(row: Row): Product {
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
    image: row.image_url ?? "",
    sizes: variants.map((v) => v.size),
    variants,
    totalStock,
    inStock: totalStock > 0,
  };
}

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("products")
    .select(SELECT)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  if (error) {
    console.error("listProducts failed", error);
    return [] as Product[];
  }
  return (data as unknown as Row[]).map(toProduct);
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const client = publicClient();
    const { data: row, error } = await client
      .from("products")
      .select(SELECT)
      .eq("slug", data.slug)
      .eq("is_active", true)
      .maybeSingle();
    if (error) {
      console.error("getProductBySlug failed", error);
      return { product: null, related: [] as Product[] };
    }
    if (!row) return { product: null, related: [] as Product[] };

    const { data: others } = await client
      .from("products")
      .select(SELECT)
      .eq("is_active", true)
      .neq("slug", data.slug)
      .order("sort_order", { ascending: true })
      .limit(4);

    return {
      product: toProduct(row as unknown as Row),
      related: ((others ?? []) as unknown as Row[]).map(toProduct),
    };
  });
