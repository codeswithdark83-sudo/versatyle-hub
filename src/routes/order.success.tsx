import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { getOrderStatus } from "@/lib/checkout.functions";

const searchSchema = z.object({ orderId: z.string().uuid() });

export const Route = createFileRoute("/order/success")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Order Confirmed — Versatile" },
      { name: "description", content: "Thank you for your order." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderSuccessPage,
});

function OrderSuccessPage() {
  const { orderId } = Route.useSearch();
  const [status, setStatus] = useState<string>("created");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [method, setMethod] = useState<string>("razorpay");
  const [error, setError] = useState<string | null>(null);
  const attempts = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const row = await getOrderStatus({ data: { orderId } });
        if (cancelled) return;
        setStatus(row.status);
        setPaymentId(row.razorpay_payment_id);
        setMethod(row.payment_method);
        if (row.payment_method === "cod") return;
        if (row.status === "paid" || row.status === "failed") return;
        if (attempts.current++ < 20) {
          setTimeout(poll, 1500);
        }
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Could not load order.");
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return (
    <div className="max-w-[720px] mx-auto px-6 py-24 text-center">
      {error ? (
        <>
          <h1 className="font-serif text-4xl mb-3">Something went wrong</h1>
          <p className="text-foreground/60 mb-8">{error}</p>
        </>
      ) : method === "cod" ? (
        <>
          <p className="eyebrow text-foreground/50 mb-3">Order Placed</p>
          <h1 className="font-serif text-5xl mb-4">Thank you.</h1>
          <p className="text-foreground/60 mb-2">
            Your cash-on-delivery order is confirmed. Please keep the exact
            amount ready for the courier on delivery.
          </p>
          <p className="text-sm text-foreground/50 mb-8 tabular-nums">
            Order #{orderId.slice(0, 8)} · Cash on delivery
          </p>
          <Link to="/shop" className="eyebrow border-b border-foreground pb-1">
            Continue shopping
          </Link>
        </>
      ) : status === "paid" ? (
        <>
          <p className="eyebrow text-foreground/50 mb-3">Order Confirmed</p>
          <h1 className="font-serif text-5xl mb-4">Thank you.</h1>
          <p className="text-foreground/60 mb-2">
            Your payment was received and your order is being prepared.
          </p>
          <p className="text-sm text-foreground/50 mb-8 tabular-nums">
            Order #{orderId.slice(0, 8)}
            {paymentId ? ` · Payment ${paymentId}` : ""}
          </p>
          <Link to="/shop" className="eyebrow border-b border-foreground pb-1">
            Continue shopping
          </Link>
        </>
      ) : status === "failed" ? (
        <>
          <h1 className="font-serif text-4xl mb-3">Payment failed</h1>
          <p className="text-foreground/60 mb-8">
            Your payment could not be completed. You can try again from your bag.
          </p>
          <Link to="/cart" className="eyebrow border-b border-foreground pb-1">
            Return to bag
          </Link>
        </>
      ) : (
        <>
          <h1 className="font-serif text-4xl mb-3">Confirming your payment…</h1>
          <p className="text-foreground/60">
            This usually takes just a few seconds.
          </p>
        </>
      )}
    </div>
  );
}
