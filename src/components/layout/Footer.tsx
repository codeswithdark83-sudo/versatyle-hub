import { Link } from "@tanstack/react-router";
import { Mail } from "lucide-react";
import { LogoMark } from "@/components/LogoMark";
import { BUSINESS } from "@/lib/business";

function WhatsAppIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.14-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.43 9.43 0 0 1-4.81-1.32l-.35-.2-3.57.94.95-3.48-.22-.36a9.44 9.44 0 0 1-1.45-5.03c0-5.2 4.24-9.44 9.46-9.44 2.52 0 4.9.99 6.68 2.77a9.37 9.37 0 0 1 2.76 6.68c0 5.2-4.24 9.44-9.44 9.44zM20.5 3.5A11.4 11.4 0 0 0 12.05.1C5.76.1.64 5.22.64 11.5c0 2.01.53 3.97 1.52 5.7L.55 23.9l6.84-1.79a11.4 11.4 0 0 0 5.45 1.39h.01c6.29 0 11.41-5.12 11.41-11.4 0-3.05-1.19-5.91-3.34-8.06z" />
    </svg>
  );
}

function InstagramIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className} aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="bg-brand-charcoal text-brand-offwhite pt-20 pb-12 px-6">
      <div className="max-w-[1440px] mx-auto grid md:grid-cols-[1.2fr_0.8fr_0.8fr_0.9fr_1.6fr] gap-12 mb-20">
        <div>
          <h4 className="flex items-center gap-2.5 font-serif text-xl tracking-tight uppercase mb-6">
            <LogoMark />
            Versatile
          </h4>
          <p className="text-xs leading-relaxed text-brand-offwhite/50 max-w-xs">
            Premium fashion for the modern individual. Wear your style with confidence and timeless sophistication.
          </p>
        </div>
        <FooterCol
          title="Shop"
          links={[
            { label: "All Products", to: "/shop" },
            { label: "Men", to: "/shop", search: { category: "men" } },
            { label: "Women", to: "/shop", search: { category: "women" } },
            { label: "Accessories", to: "/shop", search: { category: "accessories" } },
          ]}
        />
        <FooterCol
          title="Support"
          links={[
            { label: "Shipping Policy", to: "/shipping" },
            { label: "Returns & Refunds", to: "/returns" },
            { label: "Size & Fit Guide", to: "/size-guide" },
            { label: "Care Instructions", to: "/care" },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { label: "Terms & Conditions", to: "/terms" },
            { label: "Privacy Policy", to: "/privacy" },
            { label: "Nature Healing Initiative", to: "/nature-initiative" },
          ]}
        />
        <div>
          <h5 className="eyebrow mb-6 text-brand-offwhite/40 !font-bold">Contact us</h5>
          <ul className="space-y-4">
            {[
              {
                label: "WhatsApp",
                value: BUSINESS.whatsappDisplay,
                href: `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent("Hi Versatile, I need help with ")}`,
                Icon: WhatsAppIcon,
                external: true,
              },
              {
                label: "Instagram",
                value: BUSINESS.instagramHandle,
                href: BUSINESS.instagramUrl,
                Icon: InstagramIcon,
                external: true,
              },
              {
                label: "Support email",
                value: BUSINESS.email,
                href: `mailto:${BUSINESS.email}`,
                Icon: Mail,
                external: false,
              },
            ].map(({ label, value, href, Icon, external }) => (
              <li key={label}>
                <a
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="group flex items-center gap-3"
                  aria-label={`${label}: ${value}`}
                >
                  <span className="size-10 shrink-0 grid place-items-center rounded-full border border-brand-offwhite/25 text-brand-offwhite group-hover:bg-brand-offwhite group-hover:text-brand-charcoal transition-colors">
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block eyebrow text-brand-offwhite/40 !font-medium">{label}</span>
                    <span className="block text-sm text-brand-offwhite/90 group-hover:text-accent transition-colors break-words">
                      {value}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>

      </div>
      <div className="max-w-[1440px] mx-auto pt-8 border-t border-brand-offwhite/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="eyebrow text-brand-offwhite/40 !font-medium">
          © {new Date().getFullYear()} Versatile Studio. Own Your Story. · {BUSINESS.email}
        </p>
        <div className="flex gap-8 eyebrow text-brand-offwhite/40 !font-medium">
          <Link to="/privacy" className="hover:text-accent transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-accent transition-colors">Terms</Link>
          <Link to="/returns" className="hover:text-accent transition-colors">Returns</Link>
        </div>
      </div>
      <p className="max-w-[1440px] mx-auto mt-6 text-center text-xs text-brand-offwhite/40">
        Website designed &amp; developed by{" "}
        <a
          href={BUSINESS.developerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-offwhite/70 underline underline-offset-4 decoration-brand-offwhite/30 hover:text-accent hover:decoration-accent transition-colors"
        >
          {BUSINESS.developerName}
        </a>
      </p>
    </footer>
  );
}


type FooterLink = { label: string; to: string; search?: Record<string, string> };

function FooterCol({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div>
      <h5 className="eyebrow mb-6 text-brand-offwhite/40 !font-bold">{title}</h5>
      <ul className="space-y-3">
        {links.map((l) => (
          <li key={l.label}>
            <Link
              to={l.to}
              search={l.search}
              className="text-sm text-brand-offwhite/80 hover:text-accent transition-colors"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
