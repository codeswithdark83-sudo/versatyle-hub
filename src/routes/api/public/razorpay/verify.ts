import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });

/**
 * POST /api/public/razorpay/verify
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 *
 * Called by the browser right after the Razorpay popup reports success.
 *  - missing fields            -> 400
 *  - signature does not match  -> 400 (order is NOT marked paid)
 *  - unknown order             -> 404
 *  - valid                     -> 200, order marked paid + stock consumed once
 * The webhook (./webhook) stays as a backup; both only flip an order to "paid"
 * once, so stock can never be deducted twice.
 */
export const Route = createFileRoute("/api/public/razorpay/verify")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!secret) {
          console.error("RAZORPAY_KEY_SECRET is not configured");
          return json({ success: false, error: "Payments are not configured." }, 500);
        }

        let body: Record<string, unknown>;
        try {
          body = (await request.json()) as Record<string, unknown>;
        } catch {
          return json({ success: false, error: "Invalid request body." }, 400);
        }
        const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
        const orderId = str(body.razorpay_order_id);
        const paymentId = str(body.razorpay_payment_id);
        const signature = str(body.razorpay_signature);
        if (!orderId || !paymentId || !signature) {
          return json({ success: false, error: "Missing payment details." }, 400);
        }

        const { verifyRazorpaySignature } = await import("@/lib/razorpay-signature");
        if (!verifyRazorpaySignature({ orderId, paymentId, signature, secret })) {
          console.warn("Razorpay signature mismatch for order", orderId);
          return json({ success: false, error: "Payment signature mismatch." }, 400);
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Flip created/failed -> paid exactly once (a retry after a failed attempt is allowed).
        const { data: updated, error: updateError } = await supabaseAdmin
          .from("orders")
          .update({ status: "paid", razorpay_payment_id: paymentId, razorpay_signature: signature })
          .eq("razorpay_order_id", orderId)
          .in("status", ["created", "failed"])
          .select("id");
        if (updateError) {
          console.error("Could not mark order paid", updateError);
          return json({ success: false, error: "Could not record the payment." }, 500);
        }
        for (const row of updated ?? []) {
          const { error: stockError } = await supabaseAdmin.rpc("consume_order_stock", {
            _order_id: row.id,
          });
          if (stockError) console.error("consume_order_stock failed", stockError);
        }

        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("id, status")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();
        if (!order) return json({ success: false, error: "Order not found." }, 404);
        if (order.status !== "paid") {
          return json({ success: false, error: "Order cannot be marked as paid." }, 409);
        }
        return json({ success: true, orderId: order.id });
      },
    },
  },
});
