import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, FileSpreadsheet } from "lucide-react";
import { exportOrdersCsv } from "@/lib/admin.functions";

const istDate = (d: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(d);
const daysAgo = (n: number) => istDate(new Date(Date.now() - n * 86400000));

const STAGES = [
  ["all", "All order stages"],
  ["pending", "Order placed"],
  ["confirmed", "Confirmed"],
  ["packed", "Packed"],
  ["shipped", "Shipped"],
  ["out_for_delivery", "Out for delivery"],
  ["delivered", "Delivered"],
  ["cancelled", "Cancelled"],
  ["returned", "Returned"],
] as const;

const field = "w-full border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-foreground";

export function ExportOrders() {
  const exportFn = useServerFn(exportOrdersCsv);
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [paymentMode, setPaymentMode] = useState<"all" | "online" | "cod">("all");
  const [paymentStatus, setPaymentStatus] = useState<"all" | "created" | "paid" | "failed" | "refunded">("all");
  const [fulfillment, setFulfillment] = useState<(typeof STAGES)[number][0]>("all");
  const [layout, setLayout] = useState<"items" | "orders">("items");

  const m = useMutation({
    mutationFn: () => exportFn({ data: { from, to, paymentMode, paymentStatus, fulfillment, layout } }),
    onSuccess: (r) => {
      if (r.orderCount === 0) {
        toast.info("No orders match these filters.");
        return;
      }
      const blob = new Blob([r.csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const range = from || to ? `${from || "start"}_to_${to || "today"}` : istDate(new Date());
      a.href = url;
      a.download = `versatile-orders-${range}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      toast.success(`Downloaded ${r.orderCount} order${r.orderCount === 1 ? "" : "s"} (${r.rowCount} rows)`);
    },
    onError: (e: Error) => toast.error(e.message || "Export failed"),
  });

  const preset = (f: string, t: string) => {
    setFrom(f);
    setTo(t);
  };

  return (
    <div className="border border-border">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-accent"
      >
        <span className="flex items-center gap-2 eyebrow">
          <FileSpreadsheet className="size-4" strokeWidth={1.5} />
          Export orders to CSV
        </span>
        <span className="text-xs text-foreground/50">{open ? "Hide" : "Customer, product, payment, delivery and more"}</span>
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              ["Today", () => preset(daysAgo(0), daysAgo(0))],
              ["Last 7 days", () => preset(daysAgo(6), daysAgo(0))],
              ["Last 30 days", () => preset(daysAgo(29), daysAgo(0))],
              ["This month", () => preset(`${daysAgo(0).slice(0, 7)}-01`, daysAgo(0))],
              ["All time", () => preset("", "")],
            ].map(([label, fn]) => (
              <button
                key={label as string}
                type="button"
                onClick={fn as () => void}
                className="eyebrow border border-border px-3 py-1.5 hover:bg-accent"
              >
                {label as string}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block">
              <span className="eyebrow text-foreground/60">From date</span>
              <input type="date" value={from} max={to || undefined} onChange={(e) => setFrom(e.target.value)} className={`${field} mt-2`} />
            </label>
            <label className="block">
              <span className="eyebrow text-foreground/60">To date</span>
              <input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={`${field} mt-2`} />
            </label>
            <label className="block">
              <span className="eyebrow text-foreground/60">Payment mode</span>
              <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as typeof paymentMode)} className={`${field} mt-2`}>
                <option value="all">Online and Cash on delivery</option>
                <option value="online">Online (Razorpay) only</option>
                <option value="cod">Cash on delivery only</option>
              </select>
            </label>
            <label className="block">
              <span className="eyebrow text-foreground/60">Payment status</span>
              <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value as typeof paymentStatus)} className={`${field} mt-2`}>
                <option value="all">Any payment status</option>
                <option value="paid">Paid</option>
                <option value="created">Awaiting payment / COD pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </label>
            <label className="block">
              <span className="eyebrow text-foreground/60">Order status</span>
              <select value={fulfillment} onChange={(e) => setFulfillment(e.target.value as typeof fulfillment)} className={`${field} mt-2`}>
                {STAGES.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="eyebrow text-foreground/60">Rows</span>
              <select value={layout} onChange={(e) => setLayout(e.target.value as typeof layout)} className={`${field} mt-2`}>
                <option value="items">One row per product</option>
                <option value="orders">One row per order</option>
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => m.mutate()}
              disabled={m.isPending}
              className="inline-flex items-center gap-2 eyebrow bg-foreground text-background px-5 py-3 disabled:opacity-50"
            >
              <Download className="size-4" />
              {m.isPending ? "Preparing…" : "Download CSV"}
            </button>
            <p className="text-xs text-foreground/50 max-w-xl">
              Opens in Excel or Google Sheets. Dates and times are in Indian time. Leave the dates empty to export every order.
              Includes customer name, email, phone, address, product, size, colour, quantity, prices, GST, payment mode and
              status, Razorpay IDs, courier, tracking and delivery dates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
