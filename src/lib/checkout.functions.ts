import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { normalizePhone } from "@/lib/phone";

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

// Orders must carry a valid phone number (admin calls customers about deliveries).
// `shippingSchema` stays lenient because it is also used to read older orders.
const shippingInputSchema = shippingSchema.transform((s, ctx) => {
  const phone = normalizePhone(s.phone, s.country);
  if (!phone) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["phone"],
      message: "Please enter a valid phone number.",
    });
    return z.NEVER;
  }
  return { ...s, phone };
});

const inputSchema = z.object({
  email: z.string().email(),
  items: z.array(itemSchema).min(1).max(50),
  shipping: shippingInputSchema,
});

// Save the customer's phone (and name, if their profile has none) to their profile.
async function saveContactToProfile(userId: string | null, phone: string, fullName: string) {
  if (!userId) return;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ phone }).eq("id", userId);
    if (error) console.error("Saving phone to profile failed", error);
    await supabaseAdmin
      .from("profiles")
      .update({ full_name: fullName })
      .eq("id", userId)
      .or("full_name.is.null,full_name.eq.");
  } catch (e) {
    console.error("saveContactToProfile failed", e);
  }
}

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
    const { assertStoreOpen } = await import("./maintenance.server");
    await assertStoreOpen();
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
    // Selling price is final: shipping is free and 5% GST is already included.
    const totalUnits = subtotalUnits;
    const amountMinor = Math.round(totalUnits * 100); // paise
    const currency = "INR";
    // Razorpay rejects anything below 100 paise (₹1).
    if (amountMinor < 100) {
      throw new Error("Order total is below the minimum payable amount of ₹1.");
    }

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
      if (rzpRes.status === 401) {
        // Wrong / mismatched key id + secret (e.g. a test key with a live secret).
        throw new Error("Payment gateway authentication failed. Please contact support.");
      }
      throw new Error("Could not create payment order. Please try again.");
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
    await saveContactToProfile(userId, data.shipping.phone, data.shipping.fullName);

    return {
      orderId: inserted.id,
      razorpayOrderId: rzpOrder.id,
      amount: amountMinor,
      currency,
      keyId,
    };
  });

// Cash on delivery: no gateway involved. We price the cart server-side,
// check stock, save the order and reserve stock immediately.
export const createCodOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }) => {
    const { assertStoreOpen } = await import("./maintenance.server");
    await assertStoreOpen();
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
    // Selling price is final: shipping is free and 5% GST is already included.
    const totalUnits = subtotalUnits;
    const amountMinor = Math.round(totalUnits * 100);

    let userId: string | null = null;
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
      // guest checkout still allowed
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: inserted, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: userId,
        email: data.email,
        amount_cents: amountMinor,
        currency: "INR",
        status: "created",
        payment_method: "cod",
        fulfillment_status: "confirmed",
        items: priced,
        shipping_address: data.shipping,
      })
      .select("id")
      .single();
    if (error) {
      console.error("Insert COD order failed", error);
      throw new Error("Could not save your order.");
    }
    await saveContactToProfile(userId, data.shipping.phone, data.shipping.fullName);

    const { error: stockError } = await supabaseAdmin.rpc("consume_order_stock", {
      _order_id: inserted.id,
    });
    if (stockError) console.error("consume_order_stock failed", stockError);

    return { orderId: inserted.id, amount: amountMinor, currency: "INR" };
  });

const orderItemSchema = z.object({
  slug: z.string(),
  size: z.string(),
  color: z.string(),
  quantity: z.number(),
  name: z.string().optional(),
  price: z.number().optional(),
});

export const getOrderStatus = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) => z.object({ orderId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, status, amount_cents, currency, email, payment_method, razorpay_payment_id, items, fulfillment_status, estimated_delivery, created_at, shipping_address",
      )
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Order not found.");

    const items = z.array(orderItemSchema).safeParse(row.items).data ?? [];
    const shipping = shippingSchema.partial().safeParse(row.shipping_address).data ?? null;

    // Fall back to a 5-7 business-day window from the order date.
    const placedAt = new Date(row.created_at);
    const windowFrom = row.estimated_delivery
      ? new Date(row.estimated_delivery)
      : new Date(placedAt.getTime() + 5 * 86400000);
    const windowTo = row.estimated_delivery
      ? new Date(row.estimated_delivery)
      : new Date(placedAt.getTime() + 7 * 86400000);

    return {
      id: row.id,
      status: row.status,
      amountCents: row.amount_cents,
      currency: row.currency,
      email: row.email,
      payment_method: row.payment_method,
      razorpay_payment_id: row.razorpay_payment_id,
      fulfillmentStatus: row.fulfillment_status,
      createdAt: row.created_at,
      items,
      shipping: shipping
        ? {
            fullName: shipping.fullName ?? "",
            line1: shipping.line1 ?? "",
            line2: shipping.line2 ?? "",
            city: shipping.city ?? "",
            state: shipping.state ?? "",
            postalCode: shipping.postalCode ?? "",
            country: shipping.country ?? "",
          }
        : null,
      estimatedDeliveryFrom: windowFrom.toISOString(),
      estimatedDeliveryTo: windowTo.toISOString(),
      estimatedDeliveryExact: Boolean(row.estimated_delivery),
    };
  });

