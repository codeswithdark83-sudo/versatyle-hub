import { Link } from "@tanstack/react-router";
import { Instagram, Mail, MessageCircle, RefreshCw } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { BUSINESS } from "@/lib/business";

/** Shown to every visitor while admin has maintenance mode switched on. Fixed dark colours. */
export function MaintenancePage({
  message,
  onRetry,
  checking,
}: {
  message: string;
  onRetry: () => void;
  checking: boolean;
}) {
  const wa = `https://wa.me/${BUSINESS.whatsappNumber}`;
  return (
    <main className="min-h-screen bg-[#0b0b0c] text-[#f5f3ee] flex flex-col items-center justify-center px-6 py-16 text-center">
      <LogoMark className="h-10 text-[#f5f3ee]" />
      <p className="eyebrow mt-8 text-[#f5f3ee]/60">Versatile</p>
      <h1 className="mt-4 font-serif text-5xl sm:text-6xl leading-[1.02] tracking-tight">
        Under <span className="italic">maintenance</span>.
      </h1>
      <p className="mt-6 max-w-md text-base sm:text-lg leading-relaxed text-[#f5f3ee]/75">
        {message}
      </p>
      <p className="mt-3 max-w-md text-sm text-[#f5f3ee]/50">
        Shopping and payments are paused for now. Nothing has been charged and your existing orders
        are safe.
      </p>

      <button
        type="button"
        onClick={onRetry}
        disabled={checking}
        className="mt-10 inline-flex items-center gap-3 bg-[#f5f3ee] text-[#141414] px-8 py-4 eyebrow hover:bg-white transition-colors disabled:opacity-60"
      >
        <RefreshCw className={`size-4 ${checking ? "animate-spin" : ""}`} aria-hidden />
        {checking ? "Checking…" : "Check again"}
      </button>
      <p className="mt-3 text-xs text-[#f5f3ee]/40">This page refreshes automatically.</p>

      <div className="mt-12 flex items-center gap-4">
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="WhatsApp"
          className="grid size-11 place-items-center rounded-full border border-[#f5f3ee]/25 hover:border-[#f5f3ee] transition-colors"
        >
          <MessageCircle className="size-5" strokeWidth={1.5} />
        </a>
        <a
          href={BUSINESS.instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="grid size-11 place-items-center rounded-full border border-[#f5f3ee]/25 hover:border-[#f5f3ee] transition-colors"
        >
          <Instagram className="size-5" strokeWidth={1.5} />
        </a>
        <a
          href={`mailto:${BUSINESS.email}`}
          aria-label="Email support"
          className="grid size-11 place-items-center rounded-full border border-[#f5f3ee]/25 hover:border-[#f5f3ee] transition-colors"
        >
          <Mail className="size-5" strokeWidth={1.5} />
        </a>
      </div>

      <Link
        to="/auth"
        search={{ mode: "signin" }}
        className="mt-14 text-[11px] tracking-[0.2em] uppercase text-[#f5f3ee]/30 hover:text-[#f5f3ee]/70 transition-colors"
      >
        Staff sign in
      </Link>
    </main>
  );
}
