import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { formatPrice, useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useAddresses, type Address } from "@/components/AddressBook";
import {
  createRazorpayOrder,
  getRazorpayPublicConfig,
} from "@/lib/checkout.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout — Versatile" },
      { name: "description", content: "Complete your purchase securely." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: CheckoutPage,
});

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (r: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
};
type RazorpayCtor = new (opts: RazorpayOptions) => { open: () => void };
declare global {
  interface Window {
    Razorpay?: RazorpayCtor;
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

function CheckoutPage() {
  const { items, subtotal, itemCount, clear } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveAddress, setSaveAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const { addresses } = useAddresses(user?.id);

  useEffect(() => {
    if (user?.email && !form.email) {
      setForm((f) => ({ ...f, email: user.email as string }));
    }
  }, [user, form.email]);

  useEffect(() => {
    if (!selectedAddressId && addresses.length > 0) {
      const def = addresses.find((a) => a.is_default) ?? addresses[0];
      applyAddress(def);
      setSelectedAddressId(def.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses]);

  function applyAddress(a: Address) {
    setForm((f) => ({
      ...f,
      fullName: a.full_name,
      line1: a.line1,
      line2: a.line2 ?? "",
      city: a.city,
      state: a.state,
      postalCode: a.postal_code,
      country: a.country,
      phone: a.phone,
    }));
  }

  const shipping = items.length === 0 || subtotal >= 150 ? 0 : 15;
  const tax = Math.round(subtotal * 0.08 * 100) / 100;
  const total = subtotal + shipping + tax;

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) return;
    setSubmitting(true);
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Could not load payment gateway.");

      const order = await createRazorpayOrder({
        data: {
          email: form.email,
          items: items.map((i) => ({
            slug: i.slug,
            size: i.size,
            color: i.color,
            quantity: i.quantity,
          })),
          shipping: {
            fullName: form.fullName,
            line1: form.line1,
            line2: form.line2,
            city: form.city,
            state: form.state,
            postalCode: form.postalCode,
            country: form.country,
            phone: form.phone,
          },
        },
      });

      if (user && saveAddress && !selectedAddressId) {
        await supabase.from("addresses").insert({
          user_id: user.id,
          full_name: form.fullName,
          phone: form.phone,
          line1: form.line1,
          line2: form.line2 || null,
          city: form.city,
          state: form.state,
          postal_code: form.postalCode,
          country: form.country,
          is_default: addresses.length === 0,
        });
      }

      // Fallback key (Razorpay key id is public/publishable).
      const cfg = order.keyId
        ? { keyId: order.keyId }
        : await getRazorpayPublicConfig();
      if (!cfg.keyId) throw new Error("Payment gateway not configured.");

      const rzp = new window.Razorpay!({
        key: cfg.keyId,
        amount: order.amount,
        currency: order.currency,
        name: "Versatile",
        description: `Order ${order.orderId.slice(0, 8)}`,
        order_id: order.razorpayOrderId,
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone,
        },
        notes: { orderId: order.orderId },
        theme: { color: "#1a1a1a" },
        modal: {
          ondismiss: () => setSubmitting(false),
        },
        handler: () => {
          clear();
          navigate({
            to: "/order/success",
            search: { orderId: order.orderId },
          });
        },
      });
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="max-w-[900px] mx-auto px-6 py-24 text-center">
        <p className="font-serif text-3xl mb-3">Your bag is empty.</p>
        <Link to="/shop" className="eyebrow border-b border-foreground pb-1">
          Shop the collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
      <header className="mb-12">
        <p className="eyebrow text-foreground/50 mb-3">Checkout</p>
        <h1 className="text-5xl">Shipping & Payment</h1>
      </header>

      <form
        onSubmit={handlePay}
        className="grid lg:grid-cols-[1fr_380px] gap-16"
      >
        <div className="space-y-8">
          <section className="space-y-4">
            <h2 className="font-serif text-2xl">Contact</h2>
            <Field
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
            />
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl">Shipping Address</h2>
            {user && addresses.length > 0 && (
              <div className="border border-border p-4 space-y-3">
                <p className="eyebrow text-foreground/60">Use a saved address</p>
                <div className="grid sm:grid-cols-2 gap-2">
                  {addresses.map((a) => (
                    <label
                      key={a.id}
                      className={`border p-3 cursor-pointer text-sm ${selectedAddressId === a.id ? "border-foreground" : "border-border hover:border-foreground/40"}`}
                    >
                      <input
                        type="radio"
                        name="savedAddress"
                        className="sr-only"
                        checked={selectedAddressId === a.id}
                        onChange={() => {
                          setSelectedAddressId(a.id);
                          applyAddress(a);
                        }}
                      />
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{a.full_name}</span>
                        {a.is_default && (
                          <span className="eyebrow text-[10px] border border-foreground px-1.5">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-foreground/70">
                        {a.line1}, {a.city}, {a.state} {a.postal_code}
                      </p>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setSelectedAddressId("")}
                    className={`border p-3 text-sm text-left ${selectedAddressId === "" ? "border-foreground" : "border-border hover:border-foreground/40"}`}
                  >
                    + Use a new address
                  </button>
                </div>
              </div>
            )}
            <Field
              label="Full name"
              required
              value={form.fullName}
              onChange={(v) => setForm({ ...form, fullName: v })}
            />
            <Field
              label="Address line 1"
              required
              value={form.line1}
              onChange={(v) => setForm({ ...form, line1: v })}
            />
            <Field
              label="Address line 2 (optional)"
              value={form.line2}
              onChange={(v) => setForm({ ...form, line2: v })}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field
                label="City"
                required
                value={form.city}
                onChange={(v) => setForm({ ...form, city: v })}
              />
              <Field
                label="State / Region"
                required
                value={form.state}
                onChange={(v) => setForm({ ...form, state: v })}
              />
              <Field
                label="Postal code"
                required
                value={form.postalCode}
                onChange={(v) => setForm({ ...form, postalCode: v })}
              />
              <Field
                label="Country"
                required
                value={form.country}
                onChange={(v) => setForm({ ...form, country: v })}
              />
            </div>
            <Field
              label="Phone"
              required
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          <div className="border border-border p-8 space-y-6">
            <h2 className="font-serif text-2xl">Order Summary</h2>
            <ul className="space-y-3 text-sm max-h-64 overflow-auto pr-2">
              {items.map((i) => (
                <li
                  key={`${i.slug}-${i.size}-${i.color}`}
                  className="flex justify-between gap-3"
                >
                  <span className="text-foreground/70">
                    {i.name}{" "}
                    <span className="text-foreground/40">
                      · {i.size} / {i.color} × {i.quantity}
                    </span>
                  </span>
                  <span className="tabular-nums">
                    {formatPrice(i.price * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="space-y-3 text-sm border-t border-border pt-4">
              <Row label={`Subtotal (${itemCount})`} value={formatPrice(subtotal)} />
              <Row
                label="Shipping"
                value={shipping === 0 ? "Free" : formatPrice(shipping)}
              />
              <Row label="Estimated tax" value={formatPrice(tax)} />
              <div className="pt-3 mt-3 border-t border-border">
                <Row label="Total" value={formatPrice(total)} bold />
              </div>
            </dl>
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-foreground text-background eyebrow py-4 hover:bg-foreground/90 transition-colors disabled:opacity-60"
            >
              {submitting ? "Processing…" : `Pay ${formatPrice(total)}`}
            </button>
            <p className="text-[11px] text-foreground/50 leading-relaxed">
              Payments are securely processed by Razorpay. You'll be redirected
              to a confirmation page once your payment is captured.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field(props: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-foreground/60 mb-2 block">{props.label}</span>
      <input
        type={props.type ?? "text"}
        required={props.required}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full border border-border bg-background px-4 py-3 focus:outline-none focus:border-foreground"
      />
    </label>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div
      className={`flex justify-between ${bold ? "font-medium text-base" : "text-foreground/70"}`}
    >
      <dt>{label}</dt>
      <dd className="tabular-nums text-foreground">{value}</dd>
    </div>
  );
}
