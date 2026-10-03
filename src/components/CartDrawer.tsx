import { Link } from "@tanstack/react-router";
import { X, Minus, Plus } from "lucide-react";
import { useCart, formatPrice } from "@/lib/cart";
import { useEffect } from "react";

export function CartDrawer() {
  const { isOpen, setOpen, items, subtotal, updateQuantity, removeItem, itemCount } = useCart();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-[60] bg-black/40 transition-opacity duration-500 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />
      {/* Drawer */}
      <aside
        aria-label="Shopping bag"
        className={`fixed top-0 right-0 z-[70] h-full w-full sm:w-[440px] bg-background flex flex-col transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-border">
          <h2 className="font-serif text-xl">Your Bag <span className="text-foreground/40 text-sm ml-2">({itemCount})</span></h2>
          <button onClick={() => setOpen(false)} aria-label="Close cart">
            <X className="size-5" strokeWidth={1.5} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
              <p className="font-serif text-2xl">Your bag is empty.</p>
              <p className="text-sm text-foreground/60 max-w-xs">
                Start with the new arrivals — thoughtfully sourced and made to last.
              </p>
              <Link
                to="/shop"
                onClick={() => setOpen(false)}
                className="eyebrow border-b border-foreground pb-1 mt-4"
              >
                Shop the collection
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={`${item.slug}-${item.size}-${item.color}`} className="py-5 flex gap-4">
                  <div className="w-20 aspect-[3/4] bg-brand-muted overflow-hidden shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" width={120} height={160} />
                  </div>
                  <div className="flex-1 flex flex-col">
                    <div className="flex justify-between gap-4">
                      <div>
                        <h3 className="text-sm font-medium">{item.name}</h3>
                        <p className="text-xs text-foreground/60 mt-1">
                          {item.size} · {item.color}
                        </p>
                      </div>
                      <p className="text-sm tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <div className="flex items-center border border-border">
                        <button
                          aria-label="Decrease quantity"
                          className="p-2 hover:bg-brand-muted"
                          onClick={() => updateQuantity(item.slug, item.size, item.color, item.quantity - 1)}
                        >
                          <Minus className="size-3" strokeWidth={1.5} />
                        </button>
                        <span className="px-3 text-xs tabular-nums w-8 text-center">{item.quantity}</span>
                        <button
                          aria-label="Increase quantity"
                          className="p-2 hover:bg-brand-muted"
                          onClick={() => updateQuantity(item.slug, item.size, item.color, item.quantity + 1)}
                        >
                          <Plus className="size-3" strokeWidth={1.5} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.slug, item.size, item.color)}
                        className="text-[11px] uppercase tracking-widest text-foreground/50 hover:text-foreground"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-6 py-6 space-y-4">
            <div className="flex justify-between text-sm">
              <span className="text-foreground/60">Subtotal</span>
              <span className="tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-[11px] text-foreground/50">Free shipping · inclusive of all taxes.</p>
            <Link
              to="/cart"
              onClick={() => setOpen(false)}
              className="block w-full text-center bg-foreground text-background py-4 eyebrow hover:bg-foreground/90 transition-colors"
            >
              View bag & checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
