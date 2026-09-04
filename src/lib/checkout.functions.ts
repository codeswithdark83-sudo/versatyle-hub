import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

const itemSchema = z.object({
  slug: z.string().min(1),
  size: z.string().min(1),
  color: z.string().min(1),
  quantity: z.number().int().min(1).max(20),
});

const shippingSchema = z.object({
  fullName: z.string().min(1).max(120),
  line1: z.string().min(1).max(200),
  line2: z.string().max(200).optional().default(""),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().min(1).max(60),
  phone: z.string().min(4).max(30),
});

const inputSchema = z.object({
  email: z.string().email(),
  items: z.array(itemSchema).min(1).max(50),
  shipping: shippingSchema,
});

// Public info the browser needs to open the Razorpay Checkout popup.
export const getRazorpayPublicConfig = createServerFn({ method: "GET" }).handler(
  async () => ({
    keyId: process.env.RAZORPAY_KEY_ID ?? "",
    currency: "INR",
  }),
);

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw new Error("Payments are not configured yet.");
    }

    // Re-price and stock-check server-side against the supplier inventory.
    const { fetchActiveProducts } = await import("./catalog.server");
    const catalog = new Map((await fetchActiveProducts()).map((p) => [p.slug, p]));
    let subtotalUnits = 0;
    const priced = data.items.map((i) => {
      const p = catalog.get(i.slug);
      if (!p) throw new Error(`This piece is no longer available: ${i.slug}`);
      const variant = p.variants.find((v) => v.size === i.size);
      if (!variant) throw new Error(`${p.name} is no longer offered in size ${i.size}.`);
      if (variant.stock < i.quantity) {
        throw new Error(
          variant.stock === 0
            ? `${p.name} (size ${i.size}) is sold out.`
            : `Only ${variant.stock} left of ${p.name} in size ${i.size}.`,
        );
      }
      const unit = variant.price ?? p.price;
      subtotalUnits += unit * i.quantity;
      return { ...i, name: p.name, price: unit };
    });
    const shippingUnits = subtotalUnits >= 150 ? 0 : 15;
    const taxUnits = Math.round(subtotalUnits * 0.08 * 100) / 100;
    const totalUnits = subtotalUnits + shippingUnits + taxUnits;
    const amountMinor = Math.round(totalUnits * 100); // paise
    const currency = "INR";

    // Get authenticated user (if any) using publishable client + bearer header.
    let userId: string | null = null;
    const authHeader =
      (globalThis as unknown as { Headers?: unknown }).Headers &&
      typeof Request !== "undefined"
        ? undefined
        : undefined;
    // Read bearer via request headers using getRequestHeader
    try {
      const { getRequestHeader } = await import("@tanstack/react-start/server");
      const raw = getRequestHeader("authorization");
      const token = raw?.startsWith("Bearer ") ? raw.slice(7) : undefined;
      if (token) {
        const authClient = createClient<Database>(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_PUBLISHABLE_KEY!,
          { auth: { persistSession: false, autoRefreshToken: false } },
        );
        const { data: u } = await authClient.auth.getUser(token);
        userId = u.user?.id ?? null;
      }
    } catch {
      // best-effort — guest checkout still allowed
    }
    void authHeader;

    // Create Razorpay order
    const rzpRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      },
      body: JSON.stringify({
        amount: amountMinor,
        currency,
        receipt: `rcpt_${Date.now()}`,
        notes: { email: data.email },
      }),
    });
    if (!rzpRes.ok) {
      const body = await rzpRes.text();
      console.error("Razorpay order creation failed", rzpRes.status, body);
      throw new Error("Could not create payment order.");
    }
    const rzpOrder = (await rzpRes.json()) as {
      id: string;
      amount: number;
      currency: string;
    };

    // Insert our order row. Use admin client so RLS doesn't block guest inserts
    // and so we can persist the razorpay_order_id server-side.
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inserted, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        email: data.email,
        amount_cents: amountMinor,
        currency,
        status: "created",
        razorpay_order_id: rzpOrder.id,
        items: priced,
        shipping_address: data.shipping,
      })
      .select("id")
      .single();
    if (error) {
      console.error("Insert order failed", error);
      throw new Error("Could not save your order.");
    }

    return {
      orderId: inserted.id,
      razorpayOrderId: rzpOrder.id,
      amount: amountMinor,
      currency,
      keyId,
    };
  });

export const getOrderStatus = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, amount_cents, currency, email, razorpay_payment_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Order not found.");
    return row;
  });
