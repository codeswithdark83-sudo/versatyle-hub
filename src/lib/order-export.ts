import { toCsv } from "./csv";
import { gstIncluded } from "./pricing";

export type ExportOrder = {
  id: string;
  email: string;
  amount_cents: number;
  status: string;
  payment_method: string;
  fulfillment_status: string | null;
  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  estimated_delivery: string | null;
  admin_note: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  items: unknown;
  shipping_address: unknown;
  created_at: string;
};

export type ExportLayout = "items" | "orders";

const IST = "Asia/Kolkata";
const dateIST = (iso: string) => new Intl.DateTimeFormat("en-CA", { timeZone: IST }).format(new Date(iso)); // YYYY-MM-DD
const timeIST = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: IST, hour: "2-digit", minute: "2-digit", hour12: false }).format(
    new Date(iso),
  );

const STAGE: Record<string, string> = {
  pending: "Order placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

function paymentStatus(o: ExportOrder) {
  if (o.status === "paid") return "Paid";
  if (o.status === "failed") return "Failed";
  if (o.status === "refunded") return "Refunded";
  return o.payment_method === "cod" ? "Pending (pay on delivery)" : "Awaiting payment";
}

const money = (n: number) => n.toFixed(2);

const SHARED_TAIL = [
  "Payment Mode",
  "Payment Status",
  "Razorpay Payment ID",
  "Razorpay Order ID",
  "Order Status",
  "Courier",
  "Tracking Number",
  "Tracking URL",
  "Estimated Delivery",
  "Shipped On",
  "Delivered On",
  "Admin Note",
];

const CUSTOMER_HEAD = [
  "Invoice No",
  "Order No",
  "Order Date",
  "Order Time (IST)",
  "Customer Name",
  "Email",
  "Phone",
  "Address Line 1",
  "Address Line 2",
  "City",
  "State",
  "PIN Code",
  "Country",
];

export function buildOrdersCsv(orders: ExportOrder[], layout: ExportLayout): { csv: string; rows: number } {
  const header =
    layout === "items"
      ? [
          ...CUSTOMER_HEAD,
          "Product",
          "Colour",
          "Size",
          "Qty",
          "Unit Price (INR)",
          "Line Total (INR)",
          "Order Total (INR)",
          "GST Included (INR)",
          "Shipping (INR)",
          ...SHARED_TAIL,
        ]
      : [
          ...CUSTOMER_HEAD,
          "Products",
          "Total Qty",
          "Order Total (INR)",
          "GST Included (INR)",
          "Shipping (INR)",
          ...SHARED_TAIL,
        ];

  const out: unknown[][] = [header];

  for (const o of orders) {
    const a = (o.shipping_address ?? {}) as Record<string, string>;
    const items = (Array.isArray(o.items) ? o.items : []) as Array<Record<string, unknown>>;
    const total = o.amount_cents / 100;
    const orderNo = o.id.slice(0, 8).toUpperCase();
    const head = [
      `VH-${orderNo}`,
      `#${orderNo}`,
      dateIST(o.created_at),
      timeIST(o.created_at),
      a.fullName ?? "",
      o.email,
      a.phone ?? "",
      a.line1 ?? "",
      a.line2 ?? "",
      a.city ?? "",
      a.state ?? "",
      a.postalCode ?? "",
      a.country ?? "",
    ];
    const tail = [
      o.payment_method === "cod" ? "Cash on Delivery" : "Online (Razorpay)",
      paymentStatus(o),
      o.razorpay_payment_id ?? "",
      o.razorpay_order_id ?? "",
      STAGE[o.fulfillment_status ?? "pending"] ?? o.fulfillment_status ?? "",
      o.carrier ?? "",
      o.tracking_number ?? "",
      o.tracking_url ?? "",
      o.estimated_delivery ?? "",
      o.shipped_at ? dateIST(o.shipped_at) : "",
      o.delivered_at ? dateIST(o.delivered_at) : "",
      o.admin_note ?? "",
    ];
    const gst = money(gstIncluded(total));

    if (layout === "orders") {
      const products = items
        .map(
          (i) =>
            `${i.name ?? i.slug ?? "Item"} (${[i.color, i.size].filter(Boolean).join(", ")}) x${Number(i.quantity ?? 1)}`,
        )
        .join("; ");
      const qty = items.reduce((n, i) => n + Number(i.quantity ?? 1), 0);
      out.push([...head, products, qty, money(total), gst, "0.00", ...tail]);
    } else {
      const list = items.length ? items : [{}];
      list.forEach((i, idx) => {
        const qty = Number(i.quantity ?? 1);
        const price = typeof i.price === "number" ? i.price : null;
        out.push([
          ...head,
          i.name ?? i.slug ?? "",
          i.color ?? "",
          i.size ?? "",
          items.length ? qty : "",
          price != null ? money(price) : "",
          price != null ? money(price * qty) : "",
          // Order-level amounts only on an order's first row, so column totals are never double-counted.
          idx === 0 ? money(total) : "",
          idx === 0 ? gst : "",
          idx === 0 ? "0.00" : "",
          ...tail,
        ]);
      });
    }
  }
  return { csv: toCsv(out), rows: out.length - 1 };
}
