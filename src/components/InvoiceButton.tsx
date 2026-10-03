import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";

/** Opens the invoice and starts the PDF download (Save as PDF) dialog. */
export function InvoiceButton({ orderId, className = "" }: { orderId: string; className?: string }) {
  return (
    <Link
      to="/invoice/$orderId"
      params={{ orderId }}
      search={{ download: 1 }}
      className={`inline-flex items-center justify-center gap-2 eyebrow border border-foreground bg-foreground text-background px-4 py-2.5 hover:opacity-90 ${className}`}
    >
      <Download className="size-4" strokeWidth={1.75} />
      Download invoice
    </Link>
  );
}
