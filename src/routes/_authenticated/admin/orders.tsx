import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listAdminOrders, listOrderEvents, updateOrderStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersPage,
  head: () => ({
    meta: [
      { title: "Orders · Versatile Admin" },
      {
        name: "description",
        content:
          "Manage Versatile orders: update payment status, fulfilment stage, courier and tracking details.",
      },
      { property: "og:title", content: "Orders · Versatile Admin" },
      {
        property: "og:description",
        content: "Track and update every Versatile order from placed to delivered.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const PAY_STATUSES = ["all", "created", "paid", "failed", "refunded"] as const;
type PayStatus = (typeof PAY_STATUSES)[number];

const FULFILMENT = [
  "pending",
  "confirmed",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
] as const;
type Fulfilment = (typeof FULFILMENT)[number];

const FULFILMENT_LABEL: Record<Fulfilment, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function OrdersPage() {
  const [status, setStatus] = useState<PayStatus>("all");
  const [fulfillment, setFulfillment] = useState<"all" | Fulfilment>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const listFn = useServerFn(listAdminOrders);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", status, fulfillment, search],
    queryFn: () => listFn({ data: { status, fulfillment, search, limit: 100 } }),
  });

  const updateFn = useServerFn(updateOrderStatus);
  const mutation = useMutation({
    mutationFn: (v: Parameters<typeof updateFn>[0]["data"]) => updateFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
      qc.invalidateQueries({ queryKey: ["admin", "order-events"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1 border border-border p-1">
          {PAY_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`eyebrow px-3 py-1.5 capitalize ${
                status === s
                  ? "bg-foreground text-background"
                  : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {s === "all" ? "All payments" : s}
            </button>
          ))}
        </div>
        <select
          value={fulfillment}
          onChange={(e) => setFulfillment(e.target.value as "all" | Fulfilment)}
          className="border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="all">All stages</option>
          {FULFILMENT.map((f) => (
            <option key={f} value={f}>
              {FULFILMENT_LABEL[f]}
            </option>
          ))}
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email"
          className="flex-1 min-w-[200px] border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground"
        />
      </div>

      <div className="border border-border">
        <div className="hidden md:grid grid-cols-[1fr_2fr_1fr_1fr_1.2fr_100px] gap-4 px-4 py-3 border-b border-border bg-muted/40 eyebrow text-foreground/60">
          <span>Date</span>
          <span>Customer</span>
          <span>Amount</span>
          <span>Payment</span>
          <span>Stage</span>
          <span></span>
        </div>
        {isLoading ? (
          <p className="p-6 text-sm text-foreground/50">Loading…</p>
        ) : !data?.length ? (
          <p className="p-6 text-sm text-foreground/50">No orders.</p>
        ) : (
          data.map((o) => {
            const isOpen = expanded === o.id;
            const items = Array.isArray(o.items) ? (o.items as any[]) : [];
            const ship = o.shipping_address as any;
            return (
              <div key={o.id} className="border-b border-border last:border-0">
                <button
                  onClick={() => setExpanded(isOpen ? null : o.id)}
                  className="w-full grid md:grid-cols-[1fr_2fr_1fr_1fr_1.2fr_100px] gap-2 md:gap-4 px-4 py-3 text-left text-sm hover:bg-muted/30"
                >
                  <span className="text-foreground/70 tabular-nums">
                    {new Date(o.created_at).toLocaleDateString()}
                  </span>
                  <span className="truncate">{o.email}</span>
                  <span className="tabular-nums">{fmt(o.amount_cents, o.currency)}</span>
                  <span>
                    <StatusBadge status={o.status} />
                  </span>
                  <span>
                    <StageBadge stage={(o.fulfillment_status ?? "pending") as Fulfilment} />
                  </span>
                  <span className="text-xs text-foreground/50 md:text-right">
                    {isOpen ? "Hide" : "Manage"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-6 pt-2 bg-muted/20 grid lg:grid-cols-3 gap-6 text-sm">
                    <div>
                      <p className="eyebrow text-foreground/50 mb-2">Items</p>
                      <ul className="space-y-1">
                        {items.map((it, i) => (
                          <li key={i} className="flex justify-between gap-4">
                            <span>
                              {it.name ?? it.slug} · {it.size} / {it.color} × {it.quantity}
                            </span>
                            {typeof it.price === "number" && (
                              <span className="tabular-nums text-foreground/60">
                                ₹{(it.price * it.quantity).toFixed(0)}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>

                      <p className="eyebrow text-foreground/50 mt-5 mb-2">Shipping</p>
                      {ship ? (
                        <address className="not-italic text-foreground/80 leading-relaxed">
                          {ship.fullName}
                          <br />
                          {ship.line1}
                          {ship.line2 ? `, ${ship.line2}` : ""}
                          <br />
                          {ship.city}, {ship.state} {ship.postalCode}
                          <br />
                          {ship.country} · {ship.phone}
                        </address>
                      ) : (
                        <p className="text-foreground/50">No address.</p>
                      )}
                      <p className="mt-4 text-xs text-foreground/40">
                        Order ID: {o.id}
                        <br />
                        Razorpay order: {o.razorpay_order_id ?? "—"}
                        <br />
                        Payment ref: {o.razorpay_payment_id ?? "—"}
                      </p>
                    </div>

                    <OrderEditor
                      order={o}
                      pending={mutation.isPending}
                      onSave={(patch) => mutation.mutate({ orderId: o.id, ...patch })}
                    />

                    <OrderTimeline orderId={o.id} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

type OrderRow = Awaited<ReturnType<typeof listAdminOrders>>[number];

function OrderEditor({
  order,
  pending,
  onSave,
}: {
  order: OrderRow;
  pending: boolean;
  onSave: (patch: Record<string, unknown>) => void;
}) {
  const [payment, setPayment] = useState(order.status);
  const [stage, setStage] = useState<Fulfilment>(
    (order.fulfillment_status ?? "pending") as Fulfilment,
  );
  const [carrier, setCarrier] = useState(order.carrier ?? "");
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url ?? "");
  const [eta, setEta] = useState(order.estimated_delivery ?? "");
  const [note, setNote] = useState(order.admin_note ?? "");

  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow text-foreground/50 mb-2">Quick stage</p>
        <div className="flex flex-wrap gap-1">
          {(["confirmed", "packed", "shipped", "out_for_delivery", "delivered"] as const).map(
            (f) => (
              <button
                key={f}
                disabled={pending}
                onClick={() => {
                  setStage(f);
                  onSave({ fulfillmentStatus: f });
                }}
                className={`eyebrow border px-2 py-1 text-[10px] ${
                  stage === f
                    ? "bg-foreground text-background border-foreground"
                    : "border-border hover:border-foreground"
                }`}
              >
                {FULFILMENT_LABEL[f]}
              </button>
            ),
          )}
        </div>
      </div>

      <label className="block">
        <span className="eyebrow text-foreground/50">Payment status</span>
        <select
          value={payment}
          onChange={(e) => setPayment(e.target.value as OrderRow["status"])}
          className="mt-1 w-full border border-border bg-background px-2 py-1.5 text-sm"
        >
          {(["created", "paid", "failed", "refunded"] as const).map((s) => (
            <option key={s} value={s}>
              {s === "paid" ? "paid (payment received)" : s}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="eyebrow text-foreground/50">Fulfilment stage</span>
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as Fulfilment)}
          className="mt-1 w-full border border-border bg-background px-2 py-1.5 text-sm"
        >
          {FULFILMENT.map((f) => (
            <option key={f} value={f}>
              {FULFILMENT_LABEL[f]}
            </option>
          ))}
        </select>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="eyebrow text-foreground/50">Courier</span>
          <input
            value={carrier}
            onChange={(e) => setCarrier(e.target.value)}
            placeholder="Delhivery"
            className="mt-1 w-full border border-border bg-transparent px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block">
          <span className="eyebrow text-foreground/50">Tracking no.</span>
          <input
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            className="mt-1 w-full border border-border bg-transparent px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      <label className="block">
        <span className="eyebrow text-foreground/50">Tracking link</span>
        <input
          value={trackingUrl}
          onChange={(e) => setTrackingUrl(e.target.value)}
          placeholder="https://…"
          className="mt-1 w-full border border-border bg-transparent px-2 py-1.5 text-sm"
        />
      </label>

      <label className="block">
        <span className="eyebrow text-foreground/50">Estimated delivery</span>
        <input
          type="date"
          value={eta}
          onChange={(e) => setEta(e.target.value)}
          className="mt-1 w-full border border-border bg-transparent px-2 py-1.5 text-sm"
        />
      </label>

      <label className="block">
        <span className="eyebrow text-foreground/50">Note to customer</span>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          className="mt-1 w-full border border-border bg-transparent px-2 py-1.5 text-sm"
        />
      </label>

      <button
        disabled={pending}
        onClick={() =>
          onSave({
            status: payment,
            fulfillmentStatus: stage,
            carrier,
            trackingNumber: tracking,
            trackingUrl,
            estimatedDelivery: eta,
            adminNote: note,
          })
        }
        className="eyebrow w-full bg-foreground text-background px-4 py-2.5 disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save order updates"}
      </button>

      <p className="text-xs text-foreground/40">
        Shipped: {order.shipped_at ? new Date(order.shipped_at).toLocaleString() : "—"}
        <br />
        Delivered: {order.delivered_at ? new Date(order.delivered_at).toLocaleString() : "—"}
      </p>
    </div>
  );
}

function OrderTimeline({ orderId }: { orderId: string }) {
  const eventsFn = useServerFn(listOrderEvents);
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "order-events", orderId],
    queryFn: () => eventsFn({ data: { orderId } }),
  });

  return (
    <div>
      <p className="eyebrow text-foreground/50 mb-2">Update history</p>
      {isLoading ? (
        <p className="text-xs text-foreground/50">Loading…</p>
      ) : !data?.length ? (
        <p className="text-xs text-foreground/50">No updates yet.</p>
      ) : (
        <ol className="space-y-3 border-l border-border pl-4">
          {data.map((e) => (
            <li key={e.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-1.5 w-1.5 rounded-full bg-foreground" />
              <p className="text-xs text-foreground/50 tabular-nums">
                {new Date(e.created_at).toLocaleString()}
              </p>
              <p className="text-sm">
                {e.fulfillment_status
                  ? FULFILMENT_LABEL[e.fulfillment_status as Fulfilment]
                  : e.payment_status
                    ? `Payment ${e.payment_status}`
                    : e.event_type}
              </p>
              {e.note && <p className="text-xs text-foreground/60">{e.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const color =
    status === "paid"
      ? "bg-green-100 text-green-800"
      : status === "failed"
        ? "bg-red-100 text-red-800"
        : status === "refunded"
          ? "bg-amber-100 text-amber-800"
          : "bg-muted text-foreground/70";
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider ${color}`}>
      {status}
    </span>
  );
}

function StageBadge({ stage }: { stage: Fulfilment }) {
  const color =
    stage === "delivered"
      ? "bg-green-100 text-green-800"
      : stage === "cancelled" || stage === "returned"
        ? "bg-red-100 text-red-800"
        : stage === "shipped" || stage === "out_for_delivery"
          ? "bg-blue-100 text-blue-800"
          : "bg-muted text-foreground/70";
  return (
    <span className={`inline-block px-2 py-0.5 text-[10px] uppercase tracking-wider ${color}`}>
      {FULFILMENT_LABEL[stage]}
    </span>
  );
}
