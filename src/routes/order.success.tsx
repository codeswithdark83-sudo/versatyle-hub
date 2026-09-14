import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { getOrderStatus } from "@/lib/checkout.functions";
import { formatPrice } from "@/lib/cart";

const searchSchema = z.object({ orderId: z.string().uuid() });

export const Route = createFileRoute("/order/success")({
  validateSearch: (s) => searchSchema.parse(s),
  head: () => ({
    meta: [
      { title: "Order Confirmation — Versatile" },
      {
        name: "description",
        content: "Your Versatile order confirmation: order number, items, total and estimated delivery.",
      },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Order Confirmation — Versatile" },
      { property: "og:description", content: "Your Versatile order confirmation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OrderSuccessPage,
});

type OrderView = Awaited<ReturnType<typeof getOrderStatus>>;

const dateFmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function OrderSuccessPage() {
  const { orderId } = Route.useSearch();
  const [order, setOrder] = useState<OrderView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attempts = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const row = await getOrderStatus({ data: { orderId } });
        if (cancelled) return;
        setOrder(row);
        if (row.payment_method === "cod") return;
        if (row.status === "paid" || row.status === "failed") return;
        if (attempts.current++ < 20) setTimeout(poll, 1500);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load order.");
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (error) {
    return (
      <div className="max-w-[720px] mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-4xl mb-3">Something went wrong</h1>
        <p className="text-foreground/60 mb-8">{error}</p>
        <Link to="/shop" className="eyebrow border-b border-foreground pb-1">
          Continue shopping
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-[720px] mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-4xl mb-3">Loading your order…</h1>
        <p className="text-foreground/60">This usually takes just a few seconds.</p>
      </div>
    );
  }

  const isCod = order.payment_method === "cod";
  const failed = !isCod && order.status === "failed";
  const pending = !isCod && order.status === "created";

  if (failed) {
    return (
      <div className="max-w-[720px] mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-4xl mb-3">Payment failed</h1>
        <p className="text-foreground/60 mb-8">
          Your payment could not be completed. You can try again from your bag.
        </p>
        <Link to="/cart" className="eyebrow border-b border-foreground pb-1">
          Return to bag
        </Link>
      </div>
    );
  }

  const total = order.amountCents / 100;

  return (
    <div className="max-w-[760px] mx-auto px-6 py-20">
      <header className="text-center mb-14">
        <p className="eyebrow text-foreground/50 mb-3">
          {pending ? "Confirming Payment" : isCod ? "Order Placed" : "Order Confirmed"}
        </p>
        <h1 className="font-serif text-5xl mb-4">Thank you.</h1>
        <p className="text-foreground/60">
          {pending
            ? "We're confirming your payment — this usually takes a few seconds."
            : isCod
              ? "Your cash-on-delivery order is confirmed. Please keep the exact amount ready for the courier."
              : "Your payment was received and your order is being prepared."}
        </p>
      </header>

      <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6 border-y border-foreground/10 py-6 mb-12">
        <div>
          <dt className="eyebrow text-foreground/45 mb-1">Order number</dt>
          <dd className="text-sm tabular-nums">#{order.id.slice(0, 8).toUpperCase()}</dd>
        </div>
        <div>
          <dt className="eyebrow text-foreground/45 mb-1">Placed</dt>
          <dd className="text-sm">{dateFmt(order.createdAt)}</dd>
        </div>
        <div>
          <dt className="eyebrow text-foreground/45 mb-1">Payment</dt>
          <dd className="text-sm">{isCod ? "Cash on delivery" : "Paid online"}</dd>
        </div>
        <div>
          <dt className="eyebrow text-foreground/45 mb-1">Estimated delivery</dt>
          <dd className="text-sm">
            {order.estimatedDeliveryExact
              ? dateFmt(order.estimatedDeliveryTo)
              : `${dateFmt(order.estimatedDeliveryFrom)} – ${dateFmt(order.estimatedDeliveryTo)}`}
          </dd>
        </div>
      </dl>

      <section className="mb-12">
        <h2 className="font-serif text-2xl mb-6">Your items</h2>
        <ul className="divide-y divide-foreground/10">
          {order.items.map((item, i) => (
            <li key={`${item.slug}-${item.size}-${i}`} className="flex justify-between gap-6 py-4">
              <div>
                <Link
                  to="/product/$slug"
                  params={{ slug: item.slug }}
                  className="text-sm hover:underline"
                >
                  {item.name ?? item.slug}
                </Link>
                <p className="text-xs text-foreground/50 mt-1">
                  {item.color} · Size {item.size} · Qty {item.quantity}
                </p>
              </div>
              <span className="text-sm tabular-nums shrink-0">
                {item.price != null ? formatPrice(item.price * item.quantity) : "—"}
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-foreground/20 mt-4 pt-4">
          <span className="eyebrow">Total paid</span>
          <span className="font-serif text-xl tabular-nums">{formatPrice(total)}</span>
        </div>
        <p className="text-xs text-foreground/45 mt-2">
          Includes shipping and taxes. {isCod ? "Payable in cash on delivery." : ""}
        </p>
      </section>

      {order.shipping ? (
        <section className="mb-12">
          <h2 className="font-serif text-2xl mb-4">Shipping to</h2>
          <address className="text-sm not-italic text-foreground/70 leading-relaxed">
            {order.shipping.fullName}
            <br />
            {order.shipping.line1}
            {order.shipping.line2 ? (
              <>
                <br />
                {order.shipping.line2}
              </>
            ) : null}
            <br />
            {order.shipping.city}, {order.shipping.state} {order.shipping.postalCode}
            <br />
            {order.shipping.country}
          </address>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-6 border-t border-foreground/10 pt-8">
        <Link to="/account" className="eyebrow border-b border-foreground pb-1">
          Track this order
        </Link>
        <Link to="/shop" className="eyebrow border-b border-foreground/30 pb-1">
          Continue shopping
        </Link>
      </div>
      <p className="text-xs text-foreground/45 mt-6">
        A copy of this confirmation is tied to {order.email}.
      </p>
    </div>
  );
}
