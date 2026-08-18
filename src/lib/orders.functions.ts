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
        "id, email, amount_cents, currency, status, fulfillment_status, carrier, tracking_number, tracking_url, estimated_delivery, admin_note, shipped_at, delivered_at, items, shipping_address, razorpay_order_id, razorpay_payment_id, created_at, updated_at",
      )
      .or(filter)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return data ?? [];
  });
