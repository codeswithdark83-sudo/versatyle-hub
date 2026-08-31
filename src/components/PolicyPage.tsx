import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";

export const POLICY_LINKS = [
  { label: "Return & Refund", to: "/returns" },
  { label: "Shipping", to: "/shipping" },
  { label: "Terms & Conditions", to: "/terms" },
  { label: "Privacy", to: "/privacy" },
  { label: "Size & Fit", to: "/size-guide" },
  { label: "Care Instructions", to: "/care" },
  { label: "Nature Healing", to: "/nature-initiative" },
] as const;

export function PolicyPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="max-w-[1200px] mx-auto px-6 md:px-10 py-16 md:py-24 grid lg:grid-cols-[220px_1fr] gap-12 lg:gap-20">
      <nav aria-label="Policies" className="lg:sticky lg:top-24 self-start">
        <p className="eyebrow text-foreground/40 mb-5">Policies</p>
        <ul className="space-y-3">
          {POLICY_LINKS.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                className="text-sm text-foreground/70 hover:text-foreground transition-colors"
                activeProps={{ className: "text-sm text-foreground font-medium" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <article className="policy-body max-w-3xl">
        <p className="eyebrow text-foreground/50 mb-4">{eyebrow}</p>
        <h1 className="font-serif text-5xl md:text-6xl leading-[0.95] tracking-tight mb-6">{title}</h1>
        {intro ? <p className="text-lg text-foreground/70 leading-relaxed mb-12">{intro}</p> : null}
        <div className="space-y-12">{children}</div>
        <p className="mt-16 pt-8 border-t border-border text-xs text-foreground/50">
          Last updated: September 2026 · Questions? hello@versatile.in · Instagram @we.are.versatile
        </p>
      </article>
    </div>
  );
}

export function PolicySection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-serif text-3xl md:text-4xl tracking-tight mb-5">{title}</h2>
      <div className="space-y-4 text-foreground/75 leading-relaxed">{children}</div>
    </section>
  );
}

export function PolicyList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3">
          <span className="mt-2.5 w-1 h-1 rounded-full bg-foreground/40 shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function PolicyTable({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="border-t border-border">
      {rows.map(([k, v]) => (
        <div key={k} className="grid sm:grid-cols-[200px_1fr] gap-2 sm:gap-6 py-4 border-b border-border">
          <dt className="eyebrow text-foreground/50">{k}</dt>
          <dd className="text-foreground/80">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
