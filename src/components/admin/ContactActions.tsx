import { useState } from "react";
import { Copy, Mail, MessageCircle, Phone } from "lucide-react";
import { formatPhone, telHref, whatsappHref } from "@/lib/phone";

const btn =
  "eyebrow inline-flex items-center gap-2 border border-border px-3 py-2 text-[11px] hover:border-foreground transition-colors";

/** Call / email / WhatsApp buttons for a customer, used across the admin panel. */
export function ContactActions({
  name,
  email,
  phone,
  orderRef,
}: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  orderRef?: string;
}) {
  const [copied, setCopied] = useState(false);
  const greeting = `Hi ${name?.trim() || "there"},`;
  const subject = orderRef ? `Your Versatile order #${orderRef}` : "Regarding your Versatile order";
  const mail = email
    ? `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${greeting}\n\n`)}`
    : null;
  const tel = telHref(phone);
  const wa = whatsappHref(phone, `${greeting} this is Versatile`);

  async function copy() {
    if (!phone) return;
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable */
    }
  }

  return (
    <div className="space-y-2">
      <div className="text-sm space-y-0.5">
        <p>
          {phone ? (
            <a href={tel ?? undefined} className="underline underline-offset-2 tabular-nums">
              {formatPhone(phone)}
            </a>
          ) : (
            <span className="text-foreground/50">No phone number</span>
          )}
        </p>
        <p>
          {email ? (
            <a href={mail ?? undefined} className="underline underline-offset-2 break-all">
              {email}
            </a>
          ) : (
            <span className="text-foreground/50">No email</span>
          )}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {tel && (
          <a href={tel} className={btn}>
            <Phone className="size-3.5" strokeWidth={1.5} /> Call
          </a>
        )}
        {mail && (
          <a href={mail} className={btn}>
            <Mail className="size-3.5" strokeWidth={1.5} /> Email
          </a>
        )}
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className={btn}>
            <MessageCircle className="size-3.5" strokeWidth={1.5} /> WhatsApp
          </a>
        )}
        {phone && (
          <button type="button" onClick={copy} className={btn}>
            <Copy className="size-3.5" strokeWidth={1.5} /> {copied ? "Copied" : "Copy number"}
          </button>
        )}
      </div>
    </div>
  );
}
