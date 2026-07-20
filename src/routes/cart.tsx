import { createFileRoute, Link } from "@tanstack/react-router";
import { Minus, Plus } from "lucide-react";
import { formatPrice, useCart } from "@/lib/cart";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — Versatile" },
      { name: "description", content: "Review the pieces in your shopping bag." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, subtotal, updateQuantity, removeItem, itemCount } = useCart();
  const shipping = items.length === 0 || subtotal >= 150 ? 0 : 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
      <header className="mb-12">
        <p className="eyebrow text-foreground/50 mb-3">Shopping Bag</p>
        <h1 className="text-5xl">Your Bag</h1>
      </header>

      {items.length === 0 ? (
        <div className="py-24 text-center">
          <p className="font-serif text-3xl mb-3">Your bag is empty.</p>
          <p className="text-foreground/60 mb-8">Discover the latest arrivals.</p>
          <Link to="/shop" className="eyebrow border-b border-foreground pb-1">
            Shop the collection
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_380px] gap-16">
          <ul className="divide-y divide-border border-y border-border">
            {items.map((item) => (
              <li key={`${item.slug}-${item.size}-${item.color}`} className="py-8 flex gap-6">
                <div className="w-28 md:w-32 aspect-[3/4] bg-brand-muted overflow-hidden shrink-0">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" width={200} height={266} />
                </div>
                <div className="flex-1 flex flex-col">
                  <div className="flex justify-between gap-4">
                    <div>
                      <Link to="/product/$slug" params={{ slug: item.slug }} className="font-medium hover:text-accent-foreground/70">
                        {item.name}
                      </Link>
                      <p className="text-sm text-foreground/60 mt-1">Size {item.size} · {item.color}</p>
                    </div>
                    <p className="tabular-nums">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                  <div className="mt-auto pt-4 flex items-end justify-between">
                    <div className="flex items-center border border-border">
                      <button
                        aria-label="Decrease"
                        className="p-2 hover:bg-brand-muted"
                        onClick={() => updateQuantity(item.slug, item.size, item.color, item.quantity - 1)}
                      >
                        <Minus className="size-3" strokeWidth={1.5} />
                      </button>
                      <span className="px-4 text-sm tabular-nums w-10 text-center">{item.quantity}</span>
                      <button
                        aria-label="Increase"
                        className="p-2 hover:bg-brand-muted"
                        onClick={() => updateQuantity(item.slug, item.size, item.color, item.quantity + 1)}
                      >
                        <Plus className="size-3" strokeWidth={1.5} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(item.slug, item.size, item.color)}
                      className="eyebrow text-foreground/50 hover:text-foreground"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <aside className="lg:sticky lg:top-24 self-start">
            <div className="border border-border p-8 space-y-6">
              <h2 className="font-serif text-2xl">Order Summary</h2>
              <dl className="space-y-3 text-sm">
                <Row label={`Subtotal (${itemCount} items)`} value={formatPrice(subtotal)} />
                <Row label="Shipping" value={shipping === 0 ? "Free" : formatPrice(shipping)} />
                <Row label="Estimated tax" value={formatPrice(tax)} />
                <div className="pt-3 mt-3 border-t border-border">
                  <Row label="Total" value={formatPrice(total)} bold />
                </div>
              </dl>
              <Link
                to="/checkout"
                className="block w-full text-center bg-foreground text-background eyebrow py-4 hover:bg-foreground/90 transition-colors"
              >
                Proceed to Checkout
              </Link>
              <p className="text-[11px] text-foreground/50 leading-relaxed">
                Free shipping on orders over {formatPrice(150)}. Taxes calculated at checkout.
              </p>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-medium text-base" : "text-foreground/70"}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
