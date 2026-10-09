import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LogoMark } from "@/components/LogoMark";

const CATEGORIES = [
  { label: "Men", to: "/shop", params: { category: "men" } },
  { label: "Women", to: "/shop", params: { category: "women" } },
  { label: "Accessories", to: "/shop", params: { category: "accessories" } },
  { label: "All", to: "/shop", params: {} },
] as const;

export function Nav() {
  const { itemCount, setOpen } = useCart();
  const { session } = useAuth();
  const isHome = useRouterState({ select: (s) => s.location.pathname === "/" });
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // On the home page the bar floats transparently over the hero until the visitor scrolls.
  const overlay = isHome && !scrolled;
  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
        overlay
          ? "-mb-16 bg-transparent border-transparent text-[#f5f3ee]"
          : `bg-background/95 md:bg-background/85 md:backdrop-blur-md border-border ${isHome ? "-mb-16" : ""}`
      }`}
    >
      <div className="max-w-[1440px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-10 min-w-0">
          <Link
            to="/"
            className="flex items-center gap-2 min-[360px]:gap-2.5 font-serif text-lg min-[360px]:text-xl tracking-tight uppercase font-normal"
          >
            <LogoMark />
            Versatile
          </Link>
          <div className="hidden md:flex gap-7">
            {CATEGORIES.map((c) => (
              <Link
                key={c.label}
                to={c.to}
                search={c.params}
                className={`eyebrow link-underline ${
                  overlay
                    ? "text-[#f5f3ee]/85 hover:text-[#f5f3ee]"
                    : "text-foreground/80 hover:text-foreground"
                }`}
              >
                {c.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2.5 min-[360px]:gap-5">
          <button
            type="button"
            aria-label="Search"
            className="p-1.5 hover:opacity-60 transition-opacity"
          >
            <Search className="size-4" strokeWidth={1.5} />
          </button>
          <ThemeToggle />
          <Link
            to={session ? "/account" : "/auth"}
            search={session ? undefined : { mode: "signin" }}
            aria-label={session ? "Account" : "Sign in"}
            className="p-1.5 hover:opacity-60 transition-opacity"
          >
            <User className="size-4" strokeWidth={1.5} />
          </Link>
          <button
            type="button"
            aria-label={`Cart, ${itemCount} items`}
            onClick={() => setOpen(true)}
            className="p-1.5 hover:opacity-60 transition-opacity relative"
          >
            <ShoppingBag className="size-4" strokeWidth={1.5} />
            {itemCount > 0 && (
              <span className={`absolute -top-1 -right-1 ${overlay ? "bg-[#f5f3ee] text-[#141414]" : "bg-foreground text-background"} text-[9px] font-medium rounded-full size-4 flex items-center justify-center tabular-nums`}>
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
