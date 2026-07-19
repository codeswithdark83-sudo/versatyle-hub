import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-brand-charcoal text-brand-offwhite pt-20 pb-12 px-6">
      <div className="max-w-[1440px] mx-auto grid md:grid-cols-4 gap-12 mb-20">
        <div>
          <h4 className="font-serif text-xl tracking-tight uppercase mb-6">Versatile</h4>
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
            { label: "Shipping & Returns", to: "/" },
            { label: "Sizing Guide", to: "/" },
            { label: "Contact", to: "/" },
          ]}
        />
        <FooterCol
          title="Social"
          links={[
            { label: "Instagram", to: "/" },
            { label: "Pinterest", to: "/" },
            { label: "TikTok", to: "/" },
          ]}
        />
      </div>
      <div className="max-w-[1440px] mx-auto pt-8 border-t border-brand-offwhite/10 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="eyebrow text-brand-offwhite/40 !font-medium">
          © {new Date().getFullYear()} Versatile Studio.
        </p>
        <div className="flex gap-8 eyebrow text-brand-offwhite/40 !font-medium">
          <a href="/">Privacy</a>
          <a href="/">Terms</a>
        </div>
      </div>
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
