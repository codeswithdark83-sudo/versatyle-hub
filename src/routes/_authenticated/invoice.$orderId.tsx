import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { Download } from "lucide-react";
import { getMyInvoice } from "@/lib/orders.functions";
import { BUSINESS } from "@/lib/business";
import { GST_PERCENT, gstIncluded } from "@/lib/pricing";

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

  return (
    <div className="max-w-[820px] mx-auto px-4 sm:px-6 py-10">
      <div className="no-print flex flex-wrap items-center justify-between gap-3 mb-6">
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
        In the print window choose <strong>Save as PDF</strong> as the destination to download your invoice.
      </p>

      <article className="invoice-sheet bg-white text-neutral-900 p-6 sm:p-10 border border-neutral-300">
        <header className="flex flex-wrap justify-between gap-6 border-b border-neutral-300 pb-6">
          <div>
            <h1 className="font-serif text-3xl tracking-wide">VERSATILE</h1>
            <p className="text-xs text-neutral-600 mt-1">{BUSINESS.name}</p>
            {BUSINESS.address && <p className="text-xs text-neutral-600 max-w-[260px]">{BUSINESS.address}</p>}
            {BUSINESS.gstin && <p className="text-xs text-neutral-600">GSTIN: {BUSINESS.gstin}</p>}
            <p className="text-xs text-neutral-600">
              {BUSINESS.website} · {BUSINESS.email}
            </p>
          </div>
          <div className="text-right text-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500">{BUSINESS.gstin ? "Tax Invoice" : "Invoice"}</p>
            <p className="font-medium tabular-nums">{invoiceNo}</p>
            <p className="text-neutral-600">
              {new Date(data.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="text-xs text-neutral-600 mt-1">
              {data.paid ? "Paid online" : "Cash on delivery — payable on delivery"}
            </p>
            {data.paymentRef && <p className="text-[11px] text-neutral-500">Ref: {data.paymentRef}</p>}
          </div>
        </header>

        <section className="grid sm:grid-cols-2 gap-6 py-6 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 mb-2">Billed & shipped to</p>
            <address className="not-italic leading-relaxed">
              {a.fullName}
              <br />
              {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}
              <br />
              {a.city}, {a.state} {a.postalCode}
              <br />
              {a.country}
              {a.phone && (
                <>
                  <br />
                  Phone: {a.phone}
                </>
              )}
              <br />
              {data.email}
            </address>
          </div>
        </section>

        <table className="w-full text-sm border-t border-neutral-300">
          <thead>
            <tr className="text-left text-xs uppercase tracking-[0.15em] text-neutral-500">
              <th className="py-3 font-normal">Item</th>
              <th className="py-3 font-normal text-right">Qty</th>
              <th className="py-3 font-normal text-right">Price</th>
              <th className="py-3 font-normal text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((i, idx) => (
              <tr key={idx} className="border-t border-neutral-200 align-top">
                <td className="py-3 pr-3">
                  {i.name}
                  <span className="block text-xs text-neutral-500">
                    {[i.color, i.size && `Size ${i.size}`].filter(Boolean).join(" · ")}
                  </span>
                </td>
                <td className="py-3 text-right tabular-nums">{i.quantity}</td>
                <td className="py-3 text-right tabular-nums">{i.price != null ? inr(i.price) : "—"}</td>
                <td className="py-3 text-right tabular-nums">{i.price != null ? inr(i.price * i.quantity) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto mt-4 w-full sm:w-[320px] text-sm space-y-2 border-t border-neutral-300 pt-4">
          <div className="flex justify-between">
            <dt className="text-neutral-600">Taxable value</dt>
            <dd className="tabular-nums">{inr(taxable)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">GST @ {GST_PERCENT}% (included)</dt>
            <dd className="tabular-nums">{inr(gst)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-neutral-600">Shipping</dt>
            <dd>Free</dd>
          </div>
          <div className="flex justify-between border-t border-neutral-300 pt-2 text-base font-medium">
            <dt>{data.paid ? "Total paid" : "Total payable"}</dt>
            <dd className="tabular-nums">{inr(data.totalRupees)}</dd>
          </div>
        </dl>

        <p className="mt-10 text-[11px] text-neutral-500 leading-relaxed">
          All prices are in Indian Rupees and inclusive of {GST_PERCENT}% GST. Easy 7-day returns on unworn items with
          no return charges — see versatilehub.in/returns. This is a computer-generated invoice and does not require a
          signature. Thank you for shopping with Versatile.
        </p>
      </article>
    </div>
  );
}
