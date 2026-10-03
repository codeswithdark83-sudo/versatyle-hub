import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data, error } = await ctx.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", ctx.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

const variantSchema = z.object({
  size: z.string().min(1).max(20),
  stock: z.number().int().min(0).max(100000),
  price: z.number().int().min(0).nullable().optional(),
});

const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and hyphens only"),
  name: z.string().min(1).max(140),
  price: z.number().int().min(0),
  compareAtPrice: z.number().int().min(0).nullable().optional(),
  category: z.string().min(1).max(40),
  tags: z.array(z.string().max(40)).max(10).default([]),
  colors: z.array(z.string().max(40)).max(20).default([]),
  description: z.string().max(4000).default(""),
  material: z.string().max(200).default(""),
  images: z.array(z.string().url().max(600)).max(12).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(9999).default(0),
  variants: z.array(variantSchema).min(1).max(30),
});

export const listInventory = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("products")
      .select(
        "id, slug, name, price, compare_at_price, category, tags, colors, description, material, image_url, images, is_active, sort_order, product_variants(id, size, stock, price, sort_order)",
      )
      .order("sort_order", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map((p: any) => ({
      id: p.id as string,
      slug: p.slug as string,
      name: p.name as string,
      price: p.price as number,
      compareAtPrice: p.compare_at_price as number | null,
      category: p.category as string,
      tags: (p.tags ?? []) as string[],
      colors: (p.colors ?? []) as string[],
      description: (p.description ?? "") as string,
      material: (p.material ?? "") as string,
      images: ((p.images?.length ? p.images : p.image_url ? [p.image_url] : []) ?? []) as string[],
      isActive: p.is_active as boolean,
      sortOrder: p.sort_order as number,
      variants: [...((p.product_variants ?? []) as any[])]
        .sort((a, b) => a.sort_order - b.sort_order || String(a.size).localeCompare(String(b.size)))
        .map((v) => ({
          size: v.size as string,
          stock: v.stock as number,
          price: (v.price ?? null) as number | null,
        })),
    }));
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => productSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const row = {
      slug: data.slug,
      name: data.name,
      price: data.price,
      compare_at_price: data.compareAtPrice ?? null,
      category: data.category,
      tags: data.tags,
      colors: data.colors,
      description: data.description,
      material: data.material,
      image_url: data.images[0] ?? "",
      images: data.images,
      is_active: data.isActive,
      sort_order: data.sortOrder,
    };

    let productId = data.id;
    if (productId) {
      const { error } = await context.supabase.from("products").update(row).eq("id", productId);
      if (error) throw new Error(error.message);
    } else {
      const { data: inserted, error } = await context.supabase
        .from("products")
        .insert(row)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      productId = inserted.id as string;
    }

    // Replace the size/stock rows with what was submitted.
    const keepSizes = data.variants.map((v) => v.size);
    const { error: delErr } = await context.supabase
      .from("product_variants")
      .delete()
      .eq("product_id", productId)
      .not("size", "in", `(${keepSizes.map((s) => `"${s}"`).join(",")})`);
    if (delErr) throw new Error(delErr.message);

    const { error: upErr } = await context.supabase.from("product_variants").upsert(
      data.variants.map((v, i) => ({
        product_id: productId,
        size: v.size,
        stock: v.stock,
        price: v.price ?? null,
        sort_order: i,
      })),
      { onConflict: "product_id,size" },
    );
    if (upErr) throw new Error(upErr.message);

    return { id: productId };
  });

export const setProductActive = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid(), isActive: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("products")
      .update({ is_active: data.isActive })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setVariantStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        size: z.string().min(1),
        stock: z.number().int().min(0).max(100000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase
      .from("product_variants")
      .update({ stock: data.stock })
      .eq("product_id", data.productId)
      .eq("size", data.size);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { error } = await context.supabase.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
