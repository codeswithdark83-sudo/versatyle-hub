import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { listAdminOrders, updateOrderStatus } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/orders")({
  component: OrdersPage,
});

const STATUSES = ["all", "created", "paid", "failed", "refunded"] as const;
type Status = (typeof STATUSES)[number];

function fmt(cents: number, currency: string) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency || "INR",
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

function OrdersPage() {
  const [status, setStatus] = useState<Status>("all");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const listFn = useServerFn(listAdminOrders);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", status, search],
    queryFn: () => listFn({ data: { status, search, limit: 100 } }),
  });

  const updateFn = useServerFn(updateOrderStatus);
  const mutation = useMutation({
    mutationFn: (v: { orderId: string; status: Exclude<Status, "all"> }) =>
      updateFn({ data: v }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "stats"] });
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 border border-border p-1">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`eyebrow px-3 py-1.5 capitalize ${
                status === s ? "bg-foreground text-background" : "text-foreground/60 hover:text-foreground"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by email"
          className="flex-1 min-w-[200px] border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground"
        />
      </div>

      <div className="border border-border">
        <div className="grid grid-cols-[1fr_2fr_1fr_1fr_1fr_120px] gap-4 px-4 py-3 border-b border-border bg-muted/40 eyebrow text-foreground/60">
          <span>Date</span>
          <span>Customer</span>
          <span>Amount</span>
          <span>Status</span>
          <span>Payment</span>
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
                  className="w-full grid grid-cols-[1fr_2fr_1fr_1fr_1fr_120px] gap-4 px-4 py-3 text-left text-sm hover:bg-muted/30"
                >
                  <span className="text-foreground/70 tabular-nums">
                    {new Date(o.created_at).toLocaleDateString()}
                  </span>
                  <span className="truncate">{o.email}</span>
                  <span className="tabular-nums">{fmt(o.amount_cents, o.currency)}</span>
                  <span>
                    <StatusBadge status={o.status} />
                  </span>
                  <span className="text-xs text-foreground/50 truncate">
                    {o.razorpay_payment_id ?? "—"}
                  </span>
                  <span className="text-xs text-foreground/50 text-right">
                    {isOpen ? "Hide" : "View"}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-6 pt-2 bg-muted/20 grid md:grid-cols-2 gap-6 text-sm">
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
                    </div>
                    <div>
                      <p className="eyebrow text-foreground/50 mb-2">Shipping</p>
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
                      <div className="mt-4 flex items-center gap-2">
                        <label className="eyebrow text-foreground/50">Set status</label>
                        <select
                          defaultValue={o.status}
                          disabled={mutation.isPending}
                          onChange={(e) =>
                            mutation.mutate({
                              orderId: o.id,
                              status: e.target.value as Exclude<Status, "all">,
                            })
                          }
                          className="border border-border bg-background px-2 py-1 text-sm"
                        >
                          {(["created", "paid", "failed", "refunded"] as const).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-3 text-xs text-foreground/40">
                        Order ID: {o.id}
                        <br />
                        Razorpay: {o.razorpay_order_id ?? "—"}
                      </p>
                    </div>
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
