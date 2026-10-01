import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { TablesUpdate } from "@/integrations/supabase/types";

const RETURN_STATUSES = [
  "requested",
  "approved",
  "rejected",
  "pickup_scheduled",
  "received",
  "refunded",
  "replacement_shipped",
  "completed",
  "cancelled",
] as const;

const itemSchema = z.object({
  slug: z.string().min(1),
  name: z.string().max(200).optional(),
  size: z.string().min(1),
  color: z.string().max(60).optional(),
  quantity: z.number().int().min(1).max(20),
});

const SELECT =
  "id, order_id, user_id, email, kind, status, items, reason, comment, admin_note, restocked, resolved_at, created_at, updated_at";

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

export const listMyReturnRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin
      .from("return_requests")
      .select(SELECT)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createReturnRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        kind: z.enum(["return", "replace"]),
        reason: z.string().min(1).max(120),
        comment: z.string().max(1000).optional().default(""),
        items: z.array(itemSchema).min(1).max(50),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, email, status, fulfillment_status, delivered_at")
      .eq("id", data.orderId)
      .maybeSingle();
    if (orderError) throw new Error(orderError.message);
    if (!order || order.user_id !== context.userId) throw new Error("Order not found.");
    if (order.status !== "paid") {
      throw new Error("Only paid orders can be returned or replaced.");
    }
    if (order.fulfillment_status !== "delivered") {
      throw new Error("You can raise a return or replacement once the order is delivered.");
    }
    if (order.delivered_at) {
      const days = (Date.now() - new Date(order.delivered_at).getTime()) / 86_400_000;
      if (days > 7) {
        throw new Error("The 7-day return window for this order has closed.");
      }
    }

    const { data: existing } = await supabaseAdmin
      .from("return_requests")
      .select("id, status")
      .eq("order_id", data.orderId)
      .not("status", "in", '("rejected","cancelled")')
      .limit(1);
    if (existing?.length) {
      throw new Error("A request is already open for this order.");
    }

    const { data: inserted, error } = await supabaseAdmin
      .from("return_requests")
      .insert({
        order_id: data.orderId,
        user_id: context.userId,
        email: order.email,
        kind: data.kind,
        reason: data.reason,
        comment: data.comment || null,
        items: data.items,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    await supabaseAdmin.from("order_events").insert({
      order_id: data.orderId,
      actor_id: context.userId,
      event_type: data.kind === "return" ? "return_requested" : "replacement_requested",
      note: `${data.kind === "return" ? "Return" : "Replacement"} requested · ${data.reason}`,
    });

    return { id: inserted.id };
  });

export const listAdminReturnRequests = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        status: z.enum(["all", ...RETURN_STATUSES]).default("all"),
        kind: z.enum(["all", "return", "replace"]).default("all"),
        search: z.string().max(120).default(""),
      })
      .parse(d ?? {}),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let q = supabaseAdmin
      .from("return_requests")
      .select(SELECT)
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.status !== "all") q = q.eq("status", data.status);
    if (data.kind !== "all") q = q.eq("kind", data.kind);
    if (data.search) q = q.ilike("email", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // Attach the customer's name + phone from the original order so admin can call them.
    const orderIds = Array.from(new Set((rows ?? []).map((r) => r.order_id)));
    const contact = new Map<string, { phone: string | null; customerName: string | null }>();
    if (orderIds.length) {
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("id, shipping_address")
        .in("id", orderIds);
      for (const o of orders ?? []) {
        const ship = o.shipping_address as { phone?: string; fullName?: string } | null;
        contact.set(o.id, { phone: ship?.phone ?? null, customerName: ship?.fullName ?? null });
      }
    }
    return (rows ?? []).map((r) => ({
      ...r,
      phone: contact.get(r.order_id)?.phone ?? null,
      customerName: contact.get(r.order_id)?.customerName ?? null,
    }));
  });

export const updateReturnRequest = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        requestId: z.string().uuid(),
        status: z.enum(RETURN_STATUSES).optional(),
        adminNote: z.string().max(1000).nullish(),
        restock: z.boolean().optional(),
      })
      .parse(d),
  )
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: current, error: readError } = await supabaseAdmin
      .from("return_requests")
      .select("id, order_id, kind, status, restocked")
      .eq("id", data.requestId)
      .maybeSingle();
    if (readError) throw new Error(readError.message);
    if (!current) throw new Error("Request not found.");

    const patch: TablesUpdate<"return_requests"> = {};
    if (data.status !== undefined) {
      patch.status = data.status;
      if (
        data.status === "completed" ||
        data.status === "refunded" ||
        data.status === "rejected" ||
        data.status === "cancelled"
      ) {
        patch.resolved_at = new Date().toISOString();
      }
    }
    if (data.adminNote !== undefined) patch.admin_note = data.adminNote || null;

    if (Object.keys(patch).length) {
      const { error } = await supabaseAdmin
        .from("return_requests")
        .update(patch)
        .eq("id", data.requestId);
      if (error) throw new Error(error.message);
    }

    // Put the returned pieces back into supplier inventory (once).
    if (data.restock && !current.restocked) {
      const { error: rpcError } = await supabaseAdmin.rpc("restock_return_request", {
        _request_id: data.requestId,
      });
      if (rpcError) throw new Error(rpcError.message);
      await supabaseAdmin
        .from("return_requests")
        .update({ restocked: true })
        .eq("id", data.requestId);
    }

    // Reflect the outcome on the order itself.
    const nextStatus = data.status ?? current.status;
    const orderPatch: TablesUpdate<"orders"> = {};
    if (nextStatus === "received" || nextStatus === "refunded" || nextStatus === "completed") {
      if (current.kind === "return") orderPatch.fulfillment_status = "returned";
    }
    if (nextStatus === "refunded") orderPatch.status = "refunded";
    if (Object.keys(orderPatch).length) {
      await supabaseAdmin.from("orders").update(orderPatch).eq("id", current.order_id);
    }

    if (data.status) {
      await supabaseAdmin.from("order_events").insert({
        order_id: current.order_id,
        actor_id: context.userId,
        event_type: current.kind === "return" ? "return_update" : "replacement_update",
        note: `${current.kind === "return" ? "Return" : "Replacement"}: ${data.status}${
          data.adminNote ? ` · ${data.adminNote}` : ""
        }`,
      });
    }

    return { ok: true };
  });
