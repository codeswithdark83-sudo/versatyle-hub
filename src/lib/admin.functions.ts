import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { TablesUpdate } from "@/integrations/supabase/types";

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

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    return { isAdmin: !!data };
  });

export const getAdminStats = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("id, amount_cents, status, fulfillment_status, created_at, user_id, email");
    const list = orders ?? [];
    const paid = list.filter((o) => o.status === "paid");
    const revenue = paid.reduce((s, o) => s + (o.amount_cents ?? 0), 0);
    const aov = paid.length ? Math.round(revenue / paid.length) : 0;
    const conversion = list.length ? paid.length / list.length : 0;

    const { count: customerCount } = await supabaseAdmin
      .from("profiles")
      .select("id", { count: "exact", head: true });

    // last 14 days revenue series (paid)
    const days: { date: string; revenue: number; orders: number }[] = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setUTCDate(now.getUTCDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key, revenue: 0, orders: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    for (const o of paid) {
      const k = (o.created_at as string).slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) {
        days[i].revenue += o.amount_cents ?? 0;
        days[i].orders += 1;
      }
    }

    const statusBreakdown = list.reduce<Record<string, number>>((acc, o) => {
      acc[o.status] = (acc[o.status] ?? 0) + 1;
      return acc;
    }, {});

    const fulfillmentBreakdown = list.reduce<Record<string, number>>((acc, o) => {
      const k = (o as { fulfillment_status?: string }).fulfillment_status ?? "pending";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {});

    return {
      totals: {
        revenueCents: revenue,
        orders: list.length,
        paidOrders: paid.length,
        aovCents: aov,
        conversion,
        customers: customerCount ?? 0,
      },
      series: days,
      statusBreakdown,
      fulfillmentBreakdown,
    };
  });

export const listAdminOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z.enum(["all", "created", "paid", "failed", "refunded"]).default("all"),
        fulfillment: z
          .enum([
            "all",
            "pending",
            "confirmed",
            "packed",
            "shipped",
            "out_for_delivery",
            "delivered",
            "cancelled",
            "returned",
          ])
          .default("all"),
        search: z.string().max(120).default(""),
        limit: z.number().int().min(1).max(200).default(100),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("orders")
      .select(
        "id, email, amount_cents, currency, status, payment_method, fulfillment_status, carrier, tracking_number, tracking_url, estimated_delivery, admin_note, shipped_at, delivered_at, razorpay_order_id, razorpay_payment_id, items, shipping_address, user_id, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(data.limit);
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.fulfillment !== "all") q = q.eq("fulfillment_status", data.fulfillment);
    // Search by email, customer name or phone number.
    const term = data.search.replace(/[,()"\\*%]/g, " ").trim();
    if (term) {
      const digits = term.replace(/\D/g, "");
      const conds = [
        `email.ilike.%${term}%`,
        `shipping_address->>fullName.ilike.%${term}%`,
        `shipping_address->>phone.ilike.%${term}%`,
      ];
      if (digits.length >= 4) conds.push(`shipping_address->>phone.ilike.%${digits}%`);
      q = q.or(conds.join(","));
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const fulfillmentEnum = z.enum([
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
]);

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        status: z.enum(["created", "paid", "failed", "refunded"]).optional(),
        fulfillmentStatus: fulfillmentEnum.optional(),
        carrier: z.string().max(80).nullish(),
        trackingNumber: z.string().max(120).nullish(),
        trackingUrl: z.string().url().max(500).nullish().or(z.literal("")),
        estimatedDelivery: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullish().or(z.literal("")),
        adminNote: z.string().max(1000).nullish(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const patch: TablesUpdate<"orders"> = {};
    if (data.status !== undefined) patch.status = data.status;
    if (data.fulfillmentStatus !== undefined) {
      patch.fulfillment_status = data.fulfillmentStatus;
      if (data.fulfillmentStatus === "shipped" || data.fulfillmentStatus === "out_for_delivery") {
        patch.shipped_at = new Date().toISOString();
      }
      if (data.fulfillmentStatus === "delivered") {
        patch.delivered_at = new Date().toISOString();
        if (!patch.shipped_at) patch.shipped_at = new Date().toISOString();
      }
    }
    if (data.carrier !== undefined) patch.carrier = data.carrier || null;
    if (data.trackingNumber !== undefined) patch.tracking_number = data.trackingNumber || null;
    if (data.trackingUrl !== undefined) patch.tracking_url = data.trackingUrl || null;
    if (data.estimatedDelivery !== undefined)
      patch.estimated_delivery = data.estimatedDelivery || null;
    if (data.adminNote !== undefined) patch.admin_note = data.adminNote || null;

    if (Object.keys(patch).length === 0) return { ok: true };

    const { error } = await supabaseAdmin.from("orders").update(patch).eq("id", data.orderId);
    if (error) throw new Error(error.message);

    const { error: evErr } = await supabaseAdmin.from("order_events").insert({
      order_id: data.orderId,
      actor_id: context.userId,
      event_type: "admin_update",
      fulfillment_status: data.fulfillmentStatus ?? null,
      payment_status: data.status ?? null,
      note:
        data.adminNote ||
        [
          data.status ? `payment: ${data.status}` : null,
          data.fulfillmentStatus ? `stage: ${data.fulfillmentStatus}` : null,
          data.trackingNumber ? `tracking: ${data.trackingNumber}` : null,
        ]
          .filter(Boolean)
          .join(" · ") ||
        null,
    });
    if (evErr) console.error("order_events insert failed", evErr);

    return { ok: true };
  });

export const listOrderEvents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ orderId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin
      .from("order_events")
      .select("id, event_type, fulfillment_status, payment_status, note, created_at")
      .eq("order_id", data.orderId)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const listAdminCustomers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, phone, avatar_url, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);

    const ids = (profiles ?? []).map((p) => p.id);
    const emailMap = new Map<string, string>();
    if (ids.length) {
      // fetch emails via auth admin
      const { data: usersRes } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });
      for (const u of usersRes?.users ?? []) {
        if (u.email) emailMap.set(u.id, u.email);
      }
    }

    // aggregate order stats per user
    const statsMap = new Map<
      string,
      { orders: number; spentCents: number; orderPhone: string | null }
    >();
    if (ids.length) {
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("user_id, amount_cents, status, shipping_address, created_at")
        .in("user_id", ids)
        .order("created_at", { ascending: false });
      for (const o of orders ?? []) {
        if (!o.user_id) continue;
        const s = statsMap.get(o.user_id) ?? { orders: 0, spentCents: 0, orderPhone: null };
        s.orders += 1;
        if (o.status === "paid") s.spentCents += o.amount_cents ?? 0;
        // newest first, so the first phone we meet is the most recent one
        const ph = (o.shipping_address as { phone?: string } | null)?.phone;
        if (!s.orderPhone && ph) s.orderPhone = ph;
        statsMap.set(o.user_id, s);
      }
    }

    return (profiles ?? []).map((p) => ({
      id: p.id,
      email: emailMap.get(p.id) ?? null,
      fullName: p.full_name,
      phone: p.phone || statsMap.get(p.id)?.orderPhone || null,
      avatarUrl: p.avatar_url,
      createdAt: p.created_at,
      orders: statsMap.get(p.id)?.orders ?? 0,
      spentCents: statsMap.get(p.id)?.spentCents ?? 0,
    }));
  });
