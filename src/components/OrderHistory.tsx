import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Package, Check, X, RotateCcw, Clock, ChevronDown, Truck, Home } from "lucide-react";
import { toast } from "sonner";
import { listMyOrders } from "@/lib/orders.functions";
import { createReturnRequest, listMyReturnRequests } from "@/lib/returns.functions";


type Item = {
  slug: string;
  name?: string;
  size: string;
  color: string;
  quantity: number;
  price?: number;
};

const STEPS = [
  { key: "pending", label: "Order placed", icon: Clock },
  { key: "confirmed", label: "Payment received", icon: Check },
  { key: "packed", label: "Packed", icon: Package },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Home },
] as const;

const STAGE_INDEX: Record<string, number> = {
  pending: 0,
  confirmed: 1,
  packed: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
};

function stageFor(status: string, fulfillment?: string | null) {
  if (status === "failed" || status === "refunded") return -1;
  if (fulfillment === "cancelled" || fulfillment === "returned") return -1;
  const idx = STAGE_INDEX[fulfillment ?? "pending"];
  if (idx !== undefined) return status === "paid" ? Math.max(idx, 1) : idx;
  return status === "paid" ? 1 : 0;
}

function money(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function StatusBadge({
  status,
  fulfillment,
}: {
  status: string;
  fulfillment?: string | null;
}) {
  const map: Record<string, string> = {
    paid: "border-foreground text-foreground",
    created: "border-border text-foreground/60",
    failed: "border-destructive text-destructive",
    refunded: "border-border text-foreground/60",
  };
  const label: Record<string, string> = {
    paid: "In progress",
    created: "Awaiting payment",
    failed: "Payment failed",
    refunded: "Refunded",
  };
  const stageLabel: Record<string, string> = {
    packed: "Packed",
    shipped: "Shipped",
    out_for_delivery: "Out for delivery",
    delivered: "Delivered",
    cancelled: "Cancelled",
    returned: "Returned",
  };
  const text =
    (fulfillment && stageLabel[fulfillment]) ?? undefined;
  return (
    <span className={`eyebrow border px-2.5 py-1 ${map[status] ?? map.created}`}>
      {text ?? label[status] ?? status}
    </span>
  );
}

function Tracker({ status, fulfillment }: { status: string; fulfillment?: string | null }) {
  const stage = stageFor(status, fulfillment);
  if (stage < 0) {
    const Icon = status === "refunded" || fulfillment === "returned" ? RotateCcw : X;
    return (
      <div className="flex items-center gap-2 text-sm text-foreground/60">
        <Icon className="h-4 w-4" />
        {status === "refunded"
          ? "This order was refunded."
          : fulfillment === "cancelled"
            ? "This order was cancelled."
            : fulfillment === "returned"
              ? "This order was returned."
              : "Payment did not go through. Nothing was charged."}
      </div>
    );
  }
  return (
    <ol className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-0">
      {STEPS.map((s, i) => {
        const done = i <= stage;
        const Icon = s.icon;
        return (
          <li key={s.key} className="flex sm:flex-col sm:flex-1 items-center gap-3 sm:gap-2">
            <div className="flex items-center w-full sm:justify-center">
              <div
                className={`h-7 w-7 shrink-0 rounded-full border flex items-center justify-center ${
                  done
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-foreground/40"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              {i < STEPS.length - 1 && (
                <span
                  className={`hidden sm:block h-px flex-1 ${
                    i < stage ? "bg-foreground" : "bg-border"
                  }`}
                />
              )}
            </div>
            <span
              className={`text-xs sm:text-center ${
                done ? "text-foreground" : "text-foreground/45"
              }`}
            >
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const RETURN_STATUS_LABEL: Record<string, string> = {
  requested: "Awaiting review",
  approved: "Approved",
  rejected: "Declined",
  pickup_scheduled: "Pickup scheduled",
  received: "Item received",
  refunded: "Refunded",
  replacement_shipped: "Replacement shipped",
  completed: "Completed",
  cancelled: "Cancelled",
};

const REASONS = [
  "Wrong size / fit",
  "Not as described",
  "Damaged or defective",
  "Received wrong item",
  "Changed my mind",
  "Other",
] as const;

function ReturnPanel({
  orderId,
  items,
  eligible,
  request,
}: {
  orderId: string;
  items: Item[];
  eligible: boolean;
  request?: { kind: string; status: string; reason: string; admin_note: string | null };
}) {
  const qc = useQueryClient();
  const submitFn = useServerFn(createReturnRequest);
  const [form, setForm] = useState(false);
  const [kind, setKind] = useState<"return" | "replace">("return");
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      submitFn({ data: { orderId, kind, reason, comment, items } }),
    onSuccess: () => {
      toast.success(
        kind === "return" ? "Return request sent" : "Replacement request sent",
      );
      setForm(false);
      setComment("");
      qc.invalidateQueries({ queryKey: ["returns", "mine"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (request) {
    return (
      <div className="border-t border-border px-5 py-4">
        <p className="eyebrow text-foreground/50">
          {request.kind === "return" ? "Return" : "Replacement"} ·{" "}
          {RETURN_STATUS_LABEL[request.status] ?? request.status}
        </p>
        <p className="mt-1 text-sm text-foreground/70">{request.reason}</p>
        {request.admin_note && (
          <p className="mt-1 text-xs text-foreground/60">{request.admin_note}</p>
        )}
      </div>
    );
  }

  if (!eligible) return null;

  return (
    <div className="border-t border-border px-5 py-4">
      {!form ? (
        <button
          onClick={() => setForm(true)}
          className="eyebrow inline-flex items-center gap-2 border border-border px-3 py-2 hover:border-foreground"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Return or replace
        </button>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-1 border border-border p-1 w-fit">
            {(["return", "replace"] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`eyebrow px-3 py-1.5 ${
                  kind === k
                    ? "bg-foreground text-background"
                    : "text-foreground/60 hover:text-foreground"
                }`}
              >
                {k === "return" ? "Return for refund" : "Replace item"}
              </button>
            ))}
          </div>
          <label className="block">
            <span className="eyebrow text-foreground/50">Reason</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="mt-1 w-full border border-border bg-background px-3 py-2 text-sm"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="eyebrow text-foreground/50">Anything else?</span>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="mt-1 w-full border border-border bg-transparent px-3 py-2 text-sm"
            />
          </label>
          <div className="flex gap-2">
            <button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate()}
              className="eyebrow bg-foreground text-background px-4 py-2.5 disabled:opacity-50"
            >
              {mutation.isPending ? "Sending…" : "Submit request"}
            </button>
            <button
              onClick={() => setForm(false)}
              className="eyebrow border border-border px-4 py-2.5"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-foreground/50">
            Requests can be raised within 7 days of delivery. See our returns policy for
            details.
          </p>
        </div>
      )}
    </div>
  );
}

export function OrderHistory() {
  const fetchOrders = useServerFn(listMyOrders);
  const fetchReturns = useServerFn(listMyReturnRequests);
  const [open, setOpen] = useState<string | null>(null);
  const { data, isLoading, error } = useQuery({
    queryKey: ["orders", "mine"],
    queryFn: () => fetchOrders({}),
    retry: false,
  });
  const { data: returns } = useQuery({
    queryKey: ["returns", "mine"],
    queryFn: () => fetchReturns({}),
    retry: false,
  });
  const requestByOrder = new Map(
    (returns ?? [])
      .filter((r) => r.status !== "rejected" && r.status !== "cancelled")
      .map((r) => [r.order_id, r]),
  );


  return (
    <section className="mt-16 border-t border-border pt-10">
      <p className="eyebrow text-foreground/50">Orders</p>
      <h2 className="mt-2 font-serif text-3xl">Order history &amp; tracking</h2>

      {isLoading ? (
        <p className="mt-6 text-sm text-foreground/50">Loading your orders…</p>
      ) : error ? (
        <p className="mt-6 text-sm text-destructive">
          Could not load your orders. Please refresh.
        </p>
      ) : !data?.length ? (
        <div className="mt-6 border border-border p-8 text-center">
          <p className="text-sm text-foreground/60">You haven’t placed an order yet.</p>
          <Link to="/shop" className="mt-4 inline-block eyebrow border-b border-foreground pb-1">
            Start shopping →
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {data.map((o) => {
            const items = (Array.isArray(o.items) ? o.items : []) as unknown as Item[];
            const expanded = open === o.id;
            return (
              <li key={o.id} className="border border-border">
                <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                  <div>
                    <p className="eyebrow text-foreground/50">
                      #{o.id.slice(0, 8)} ·{" "}
                      {new Date(o.created_at).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="mt-1 text-sm text-foreground/70">
                      {items.reduce((s, i) => s + (i.quantity ?? 0), 0)} item(s) ·{" "}
                      <span className="tabular-nums">
                        {money(o.amount_cents, o.currency)}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={o.status} />
                    <button
                      onClick={() => setOpen(expanded ? null : o.id)}
                      aria-label={expanded ? "Hide details" : "Show details"}
                      className="p-1.5 hover:bg-accent"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <Tracker status={o.status} />
                </div>

                {expanded && (
                  <div className="border-t border-border px-5 py-5 grid gap-6 sm:grid-cols-2">
                    <div>
                      <p className="eyebrow text-foreground/50 mb-3">Items</p>
                      <ul className="space-y-2 text-sm">
                        {items.map((i, idx) => (
                          <li key={idx} className="flex justify-between gap-4">
                            <span>
                              {i.name ?? i.slug}
                              <span className="text-foreground/50">
                                {" "}
                                · {i.size} / {i.color} × {i.quantity}
                              </span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-4 text-xs text-foreground/50">
                        {o.payment_method === "cod"
                          ? "Cash on delivery"
                          : "Paid online"}
                      </p>
                      {o.razorpay_payment_id && (
                        <p className="mt-4 text-xs text-foreground/50">
                          Payment ref: {o.razorpay_payment_id}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="eyebrow text-foreground/50 mb-3">Shipping to</p>
                      {o.shipping_address ? (
                        (() => {
                          const a = o.shipping_address as Record<string, string>;
                          return (
                            <address className="text-sm not-italic text-foreground/70 leading-relaxed">
                              {a.fullName}
                              <br />
                              {a.line1}
                              {a.line2 ? `, ${a.line2}` : ""}
                              <br />
                              {a.city}, {a.state} {a.postalCode}
                              <br />
                              {a.country}
                              <br />
                              {a.phone}
                            </address>
                          );
                        })()
                      ) : (
                        <p className="text-sm text-foreground/50">—</p>
                      )}
                    </div>
                  </div>
                )}

                <ReturnPanel
                  orderId={o.id}
                  items={items}
                  eligible={o.status === "paid" && o.fulfillment_status === "delivered"}
                  request={requestByOrder.get(o.id)}
                />
              </li>

            );
          })}
        </ul>
      )}
    </section>
  );
}
