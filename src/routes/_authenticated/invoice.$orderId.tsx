import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Download } from "lucide-react";
import { getMyInvoice } from "@/lib/orders.functions";
import { BUSINESS } from "@/lib/business";
import { GST_PERCENT, RETURN_WINDOW_DAYS, gstIncluded } from "@/lib/pricing";
import { rupeesInWords } from "@/lib/number-words";

export const Route = createFileRoute("/_authenticated/invoice/$orderId")({
  validateSearch: (s) => z.object({ download: z.coerce.number().optional() }).parse(s),
  head: () => ({ meta: [{ title: "Invoice — Versatile" }, { name: "robots", content: "noindex" }] }),
  component: InvoicePage,
});

const inr = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }).format(n);

function InvoicePage() {
  const { orderId } = Route.useParams();
  const { download } = Route.useSearch();
  const fetchInvoice = useServerFn(getMyInvoice);
  const { data, error, isLoading } = useQuery({
    queryKey: ["invoice", orderId],
    queryFn: () => fetchInvoice({ data: { orderId } }),
    retry: false,
  });
  const autoPrinted = useRef(false);
  const invoiceNo = data ? `VH-${data.id.slice(0, 8).toUpperCase()}` : "";

  useEffect(() => {
    if (!data) return;
    const prev = document.title;
    document.title = `Invoice-${invoiceNo}`; // becomes the PDF file name
    if (download && !autoPrinted.current) {
      autoPrinted.current = true;
      setTimeout(() => window.print(), 600);
    }
    return () => {
      document.title = prev;
    };
  }, [data, download, invoiceNo]);

  if (isLoading) return <p className="max-w-[820px] mx-auto px-6 py-24 text-center">Preparing your invoice…</p>;
  if (error || !data) {
    return (
      <div className="max-w-[720px] mx-auto px-6 py-24 text-center">
        <h1 className="font-serif text-4xl mb-3">Invoice unavailable</h1>
        <p className="text-foreground/60 mb-8">{error instanceof Error ? error.message : "Could not load invoice."}</p>
        <Link to="/account" className="eyebrow border-b border-foreground pb-1">
          Back to my orders
        </Link>
      </div>
    );
  }

  const gst = gstIncluded(data.totalRupees);
  const taxable = Math.round((data.totalRupees - gst) * 100) / 100;
  const a = data.address;
  const date = (iso: string) =>
    new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  const itemsQty = data.items.reduce((n, i) => n + i.quantity, 0);
  const addressLines = [
    a.line1 + (a.line2 ? `, ${a.line2}` : ""),
    `${a.city}, ${a.state} ${a.postalCode}`,
    a.country,
  ];

  return (
    <div className="invoice-wrap max-w-[860px] mx-auto px-4 sm:px-6 py-10">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-4">
        <Link to="/account" className="eyebrow border-b border-foreground/40 pb-1">
          ← My orders
        </Link>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 eyebrow border border-foreground bg-foreground text-background px-5 py-3"
        >
          <Download className="size-4" /> Download PDF
        </button>
      </div>
      <p className="no-print mb-4 text-xs text-foreground/50">
        In the print window choose <strong>Save as PDF</strong> as the destination (turn on “Background graphics” for
        the best look).
      </p>

      <div className="overflow-x-auto">
        <article className="invoice-sheet min-w-[680px] bg-white text-neutral-900 border border-neutral-300">
          <div className="h-2 bg-neutral-900" />

          <div className="px-8 pt-7 pb-6 flex justify-between items-start gap-6">
            <div className="flex items-center gap-4">
              <img src="/images/logo-mark.png" alt="" className="h-12 w-auto" />
              <div>
                <p className="font-serif text-3xl tracking-[0.18em] leading-none">VERSATILE</p>
                <p className="mt-1.5 text-[10px] uppercase tracking-[0.35em] text-neutral-500">Own Your Story</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-serif text-3xl tracking-wide leading-none">
                {BUSINESS.gstin ? "TAX INVOICE" : "INVOICE"}
              </p>
              <span
                className={`inline-block mt-2 border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] ${
                  data.paid ? "border-emerald-700 text-emerald-700" : "border-amber-700 text-amber-700"
                }`}
              >
                {data.paid ? "Paid" : "Cash on delivery"}
              </span>
            </div>
          </div>

          <div className="mx-8 grid grid-cols-4 border border-neutral-300 text-sm">
            {[
              ["Invoice No.", invoiceNo],
              ["Invoice date", date(data.createdAt)],
              ["Order No.", `#${data.id.slice(0, 8).toUpperCase()}`],
              ["Order date", date(data.createdAt)],
            ].map(([k, v], i) => (
              <div key={k} className={`px-4 py-3 ${i > 0 ? "border-l border-neutral-300" : ""}`}>
                <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500">{k}</p>
                <p className="mt-1 font-medium tabular-nums">{v}</p>
              </div>
            ))}
          </div>

          <div className="mx-8 mt-5 grid grid-cols-3 gap-5 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Sold by</p>
              <p className="font-medium">{BUSINESS.name}</p>
              {BUSINESS.address && <p className="text-neutral-600">{BUSINESS.address}</p>}
              {BUSINESS.gstin && <p className="text-neutral-600">GSTIN: {BUSINESS.gstin}</p>}
              <p className="text-neutral-600">{BUSINESS.website}</p>
              <p className="text-neutral-600">{BUSINESS.email}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Bill to</p>
              <address className="not-italic leading-relaxed">
                <span className="font-medium">{a.fullName}</span>
                {addressLines.map((l) => (
                  <span key={l} className="block text-neutral-700">
                    {l}
                  </span>
                ))}
                {a.phone && <span className="block text-neutral-700">Phone: {a.phone}</span>}
                <span className="block text-neutral-700">{data.email}</span>
              </address>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Ship to</p>
              <address className="not-italic leading-relaxed">
                <span className="font-medium">{a.fullName}</span>
                {addressLines.map((l) => (
                  <span key={l} className="block text-neutral-700">
                    {l}
                  </span>
                ))}
                {a.state && <span className="block text-neutral-500 text-xs mt-1">Place of supply: {a.state}</span>}
              </address>
            </div>
          </div>

          <div className="mx-8 mt-6">
            <table className="w-full text-sm border border-neutral-300">
              <thead>
                <tr className="bg-neutral-100 text-left text-[10px] uppercase tracking-[0.15em] text-neutral-600">
                  <th className="px-3 py-2.5 font-semibold w-8">#</th>
                  <th className="px-3 py-2.5 font-semibold">Description</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Qty</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Unit price</th>
                  <th className="px-3 py-2.5 font-semibold text-right">GST ({GST_PERCENT}%) incl.</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((i, idx) => {
                  const line = i.price != null ? i.price * i.quantity : null;
                  return (
                    <tr key={idx} className="border-t border-neutral-200 align-top">
                      <td className="px-3 py-3 text-neutral-500">{idx + 1}</td>
                      <td className="px-3 py-3">
                        <span className="font-medium">{i.name}</span>
                        <span className="block text-xs text-neutral-500">
                          {[i.color && `Colour: ${i.color}`, i.size && `Size: ${i.size}`].filter(Boolean).join("  ·  ")}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right tabular-nums">{i.quantity}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{i.price != null ? inr(i.price) : "—"}</td>
                      <td className="px-3 py-3 text-right tabular-nums">{line != null ? inr(gstIncluded(line)) : "—"}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-medium">{line != null ? inr(line) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mx-8 mt-5 grid grid-cols-2 gap-8 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-2">Payment</p>
              <p>{data.paid ? "Paid online (Razorpay)" : "Cash on delivery — pay the courier on arrival"}</p>
              {data.paymentRef && <p className="text-xs text-neutral-500">Transaction ID: {data.paymentRef}</p>}
              <p className="text-xs text-neutral-500 mt-1">
                {itemsQty} item{itemsQty === 1 ? "" : "s"} · Free shipping
              </p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mt-4 mb-1">Amount in words</p>
              <p className="text-xs italic text-neutral-700">{rupeesInWords(data.totalRupees)}</p>
            </div>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-neutral-600">Subtotal (incl. GST)</dt>
                <dd className="tabular-nums">{inr(data.totalRupees)}</dd>
              </div>
              <div className="flex justify-between text-neutral-600">
                <dt className="pl-3">of which taxable value</dt>
                <dd className="tabular-nums">{inr(taxable)}</dd>
              </div>
              <div className="flex justify-between text-neutral-600">
                <dt className="pl-3">of which GST @ {GST_PERCENT}%</dt>
                <dd className="tabular-nums">{inr(gst)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-neutral-600">Shipping & handling</dt>
                <dd>₹0.00 (Free)</dd>
              </div>
              <div className="flex justify-between border-y-2 border-neutral-900 py-2.5 text-base font-semibold">
                <dt>{data.paid ? "Total paid" : "Total payable"}</dt>
                <dd className="tabular-nums">{inr(data.totalRupees)}</dd>
              </div>
            </dl>
          </div>

          <div className="mx-8 mt-6 grid grid-cols-2 gap-8 items-end">
            <div className="text-[11px] text-neutral-600 leading-relaxed">
              <p className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 mb-1.5">Terms</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>All prices are in Indian Rupees (INR) and inclusive of {GST_PERCENT}% GST.</li>
                <li>
                  Easy {RETURN_WINDOW_DAYS}-day returns on unworn items with tags, at no return charge.
                </li>
                <li>Orders can be cancelled only before they are shipped.</li>
                <li>Full policies: versatilehub.in/returns · /shipping · /terms</li>
              </ul>
            </div>
            <div className="text-right text-xs text-neutral-600">
              <div className="ml-auto w-48 border-b border-neutral-400 h-9" />
              <p className="mt-1.5 font-medium text-neutral-800">Authorised signatory</p>
              <p>For {BUSINESS.name}</p>
            </div>
          </div>

          <div className="mt-6 border-t border-neutral-300 bg-neutral-100 px-8 py-4 text-center">
            <p className="font-serif text-lg tracking-wide">Thank you for choosing Versatile.</p>
            <p className="mt-1 text-[11px] text-neutral-600">
              Questions about your order? {BUSINESS.email} · Instagram @we.are.versatile · {BUSINESS.website}
            </p>
            <p className="mt-1 text-[10px] text-neutral-400">
              This is a computer-generated invoice and does not require a physical signature.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
}
