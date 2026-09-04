import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Product } from "@/data/products";

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const { fetchActiveProducts } = await import("./catalog.server");
  return fetchActiveProducts();
});

export const getProductBySlug = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ slug: z.string().min(1) }).parse(data))
  .handler(async ({ data }) => {
    const { publicClient, PRODUCT_SELECT, toProduct } = await import("./catalog.server");
    const client = publicClient();
    const { data: row, error } = await client
      .from("products")
      .select(PRODUCT_SELECT)
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
      .select(PRODUCT_SELECT)
      .eq("is_active", true)
      .neq("slug", data.slug)
      .order("sort_order", { ascending: true })
      .limit(4);

    return {
      product: toProduct(row as never),
      related: ((others ?? []) as never[]).map((r) => toProduct(r as never)),
    };
  });
