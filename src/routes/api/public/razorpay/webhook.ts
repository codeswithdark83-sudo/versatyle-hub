import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

export const Route = createFileRoute("/api/public/razorpay/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) {
          console.error("RAZORPAY_WEBHOOK_SECRET is not configured");
          return new Response("Server misconfigured", { status: 500 });
        }
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const raw = await request.text();
        const expected = createHmac("sha256", secret).update(raw).digest("hex");

        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expected);
        if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: {
          event?: string;
          payload?: {
            payment?: { entity?: { id?: string; order_id?: string; status?: string } };
            order?: { entity?: { id?: string; status?: string } };
          };
        };
        try {
          event = JSON.parse(raw);
        } catch {
          return new Response("Invalid JSON", { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const payment = event.payload?.payment?.entity;
        const orderEntity = event.payload?.order?.entity;
        const razorpayOrderId = payment?.order_id ?? orderEntity?.id;
        if (!razorpayOrderId) {
          return new Response("ok"); // acknowledge unrelated events
        }

        const type = event.event ?? "";
        if (
          type === "payment.captured" ||
          type === "payment.authorized" ||
          type === "order.paid"
        ) {
          const { data: paidRows } = await supabaseAdmin
            .from("orders")
            .update({
              status: "paid",
              razorpay_payment_id: payment?.id ?? null,
              razorpay_signature: signature,
            })
            .eq("razorpay_order_id", razorpayOrderId)
            .neq("status", "paid")
            .select("id");
          // Reduce supplier stock once, for orders that were not already paid.
          for (const row of paidRows ?? []) {
            const { error: stockError } = await supabaseAdmin.rpc("consume_order_stock", {
              _order_id: row.id,
            });
            if (stockError) console.error("consume_order_stock failed", stockError);
          }
        } else if (type === "payment.failed") {
          await supabaseAdmin
            .from("orders")
            .update({ status: "failed", razorpay_payment_id: payment?.id ?? null })
            .eq("razorpay_order_id", razorpayOrderId);
        } else if (type === "refund.processed" || type === "refund.created") {
          await supabaseAdmin
            .from("orders")
            .update({ status: "refunded" })
            .eq("razorpay_order_id", razorpayOrderId);
        }

        return new Response("ok");
      },
    },
  },
});
