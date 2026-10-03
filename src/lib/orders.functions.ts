import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const listMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const email = (context.claims as { email?: string } | null)?.email ?? null;

    const filter = email
      ? `user_id.eq.${context.userId},email.eq.${email}`
      : `user_id.eq.${context.userId}`;

    const { data, error } = await supabaseAdmin
      .from("orders")
      .select(
        "id, email, amount_cents, currency, status, payment_method, fulfillment_status, carrier, tracking_number, tracking_url, estimated_delivery, admin_note, shipped_at, delivered_at, items, shipping_address, razorpay_order_id, razorpay_payment_id, created_at, updated_at",
      )
      .or(filter)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const cancelMyOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { orderId: string }) => {
    if (!d || typeof d.orderId !== "string" || !/^[0-9a-f-]{36}$/i.test(d.orderId)) {
      throw new Error("Invalid order.");
    }
    return d;
  })
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { canCancelOrder, CANCELLABLE_STAGES } = await import("./order-cancel");
    const email = (context.claims as { email?: string } | null)?.email ?? null;

    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, email, status, payment_method, fulfillment_status, amount_cents, razorpay_payment_id")
      .eq("id", data.orderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order || (order.user_id !== context.userId && !(email && order.email === email))) {
      throw new Error("Order not found.");
    }
    if (order.fulfillment_status === "cancelled") return { ok: true, refunded: order.status === "refunded" };
    if (!canCancelOrder(order)) {
      throw new Error(
        "This order has already been shipped or can no longer be cancelled. Please use our returns process after delivery.",
      );
    }

    // Atomic claim: only one request can move the order to cancelled, and only while unshipped.
    const { data: claimed, error: claimErr } = await supabaseAdmin
      .from("orders")
      .update({ fulfillment_status: "cancelled" })
      .eq("id", order.id)
      .in("fulfillment_status", [...CANCELLABLE_STAGES])
      .select("id")
      .maybeSingle();
    if (claimErr) throw new Error(claimErr.message);
    if (!claimed) throw new Error("This order has just been shipped and can no longer be cancelled.");

    // Stock was consumed for COD at order time and for online orders once paid.
    const { error: stockErr } = await supabaseAdmin.rpc("restock_order_stock", { _order_id: order.id });
    if (stockErr) console.error("restock failed", order.id, stockErr.message);

    let refunded = false;
    let note = "Customer cancelled before shipping.";
    if (order.payment_method !== "cod" && order.status === "paid" && order.razorpay_payment_id) {
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      try {
        if (!keyId || !keySecret) throw new Error("Razorpay not configured");
        const res = await fetch(
          `https://api.razorpay.com/v1/payments/${order.razorpay_payment_id}/refund`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
            },
            body: JSON.stringify({
              amount: order.amount_cents,
              speed: "normal",
              notes: { reason: "Customer cancelled before shipping", order_id: order.id },
            }),
          },
        );
        if (!res.ok) throw new Error(`Razorpay refund HTTP ${res.status}`);
        refunded = true;
        await supabaseAdmin.from("orders").update({ status: "refunded" }).eq("id", order.id);
        note += " Refund initiated automatically.";
      } catch (e) {
        console.error("refund failed", order.id, e);
        note += " AUTOMATIC REFUND FAILED — refund manually from the Razorpay dashboard.";
      }
    }

    await supabaseAdmin.from("order_events").insert({
      order_id: order.id,
      actor_id: context.userId,
      event_type: "customer_cancelled",
      note,
    });

    return { ok: true, refunded };
  });
