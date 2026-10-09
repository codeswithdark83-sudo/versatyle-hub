import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Banknote, Check, CreditCard } from "lucide-react";
import { useEffect, useState } from "react";
import { formatPrice, useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { PHONE_ERROR, PHONE_HINT, normalizePhone } from "@/lib/phone";
import { GST_PERCENT, RETURN_WINDOW_DAYS, gstIncluded } from "@/lib/pricing";
import { supabase } from "@/integrations/supabase/client";
import { useAddresses, type Address } from "@/components/AddressBook";
import {
  createCodOrder,
  createRazorpayOrder,
  getRazorpayPublicConfig,
} from "@/lib/checkout.functions";

export const Route = createFileRoute("/checkout")({
  // /checkout?buy=1 => "Buy now" mode: only the single item chosen on the product page.
  validateSearch: (search: Record<string, unknown>): { buy?: 1 } =>
    search.buy === 1 || search.buy === "1" || search.buy === true ? { buy: 1 } : {},
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
type RazorpayFailure = {
  error?: { code?: string; description?: string; reason?: string; metadata?: { payment_id?: string } };
};
type RazorpayCtor = new (opts: RazorpayOptions) => {
  open: () => void;
  on: (event: "payment.failed", cb: (r: RazorpayFailure) => void) => void;
};
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
  const { items: bagItems, subtotal: bagSubtotal, itemCount: bagCount, clear: clearBag, buyNowItem, clearBuyNow } = useCart();
  const { buy } = Route.useSearch();
  const buyNowMode = buy === 1;
  // In Buy now mode the order is just that one item and the bag stays untouched.
  const items = buyNowMode ? (buyNowItem ? [buyNowItem] : []) : bagItems;
  const subtotal = buyNowMode ? (buyNowItem ? buyNowItem.price * buyNowItem.quantity : 0) : bagSubtotal;
  const itemCount = buyNowMode ? (buyNowItem ? buyNowItem.quantity : 0) : bagCount;
  const clear = buyNowMode ? clearBuyNow : clearBag;
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
  const [payMethod, setPayMethod] = useState<"online" | "cod">("online");
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

  // Prefill the phone saved on the user's profile (if they have ordered before).
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("phone")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const saved = data?.phone;
        if (saved) setForm((f) => (f.phone ? f : { ...f, phone: saved }));
      });
  }, [user]);

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

  // Free shipping, GST (5%) already included in the selling price, no extra fees.
  const total = subtotal;
  const gst = gstIncluded(total);

  // After the popup reports success, prove to our server that the payment is genuine
  // (HMAC signature check) before showing the confirmation page.
  async function confirmPayment(
    resp: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string },
    orderId: string,
  ) {
    try {
      const res = await fetch("/api/public/razorpay/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resp),
      });
      if (res.status === 400 || res.status === 404 || res.status === 409) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(
          `We couldn't verify your payment (${body.error ?? "verification failed"}). ` +
            `If money was deducted, please contact us with payment ID ${resp.razorpay_payment_id}.`,
        );
        setSubmitting(false);
        return;
      }
      // 200 = verified. A network/server hiccup (5xx) falls through on purpose:
      // the Razorpay webhook can still confirm, and the confirmation page keeps checking.
    } catch {
      /* same as above */
    }
    clear();
    navigate({ to: "/order/success", search: { orderId } });
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (items.length === 0) return;
    const normalizedPhone = normalizePhone(form.phone, form.country);
    if (!normalizedPhone) {
      setError(PHONE_ERROR);
      document.getElementById("checkout-phone")?.focus();
      return;
    }
    const phone: string = normalizedPhone;
    setSubmitting(true);
    try {
      const payload = {
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
          phone,
        },
      };

      async function persistAddress() {
        if (user && saveAddress && !selectedAddressId) {
          await supabase.from("addresses").insert({
            user_id: user.id,
            full_name: form.fullName,
            phone,
            line1: form.line1,
            line2: form.line2 || null,
            city: form.city,
            state: form.state,
            postal_code: form.postalCode,
            country: form.country,
            is_default: addresses.length === 0,
          });
        }
      }

      if (payMethod === "cod") {
        const codOrder = await createCodOrder({ data: payload });
        await persistAddress();
        clear();
        navigate({ to: "/order/success", search: { orderId: codOrder.orderId } });
        return;
      }

      const ok = await loadRazorpay();
      if (!ok) throw new Error("Could not load payment gateway.");

      const order = await createRazorpayOrder({ data: payload });

      await persistAddress();

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
          contact: phone,
        },
        notes: { orderId: order.orderId },
        theme: { color: "#1a1a1a" },
        modal: {
          // User closed the popup without paying.
          ondismiss: () => {
            setError("Payment cancelled. You can try again whenever you're ready.");
            setSubmitting(false);
          },
        },
        handler: (resp) => {
          void confirmPayment(resp, order.orderId);
        },
      });
      // Card declined, UPI failed, etc. The popup stays open so the customer can retry.
      rzp.on("payment.failed", (r) => {
        setError(
          r.error?.description ||
            "Payment failed. Please try again or use a different payment method.",
        );
        setSubmitting(false);
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
        <p className="font-serif text-3xl mb-3">{buyNowMode ? "Nothing to check out." : "Your bag is empty."}</p>
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
              id="checkout-phone"
              label="Phone number"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="98765 43210"
              required
              hint={`${PHONE_HINT} We use it to confirm your order and for delivery updates${user ? " and save it to your profile" : ""}.`}
              value={form.phone}
              onChange={(v) => setForm({ ...form, phone: v })}
            />
            {user && !selectedAddressId && (
              <label className="flex items-center gap-2 text-sm text-foreground/70 pt-2">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                />
                Save this address for future orders
              </label>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl">Payment Method</h2>
            <div className="grid sm:grid-cols-2 gap-4" role="radiogroup" aria-label="Payment method">
              {(
                [
                  {
                    id: "online" as const,
                    title: "Pay online",
                    note: "UPI, cards, netbanking and wallets — secured by Razorpay.",
                    Icon: CreditCard,
                  },
                  {
                    id: "cod" as const,
                    title: "Cash on delivery",
                    note: "Pay in cash to the courier when your order arrives.",
                    Icon: Banknote,
                  },
                ]
              ).map(({ id, title, note, Icon }) => {
                const on = payMethod === id;
                return (
                  <label
                    key={id}
                    className={`relative flex gap-4 items-start p-5 cursor-pointer border-2 transition-colors ${
                      on
                        ? "border-foreground bg-foreground text-background shadow-lg"
                        : "border-foreground/30 bg-card hover:border-foreground"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payMethod"
                      className="sr-only"
                      checked={on}
                      onChange={() => setPayMethod(id)}
                    />
                    <Icon className="size-7 shrink-0 mt-0.5" strokeWidth={1.5} />
                    <span className="flex-1">
                      <span className="block text-base font-semibold mb-1">{title}</span>
                      <span className={`block text-sm ${on ? "text-background/80" : "text-foreground/65"}`}>
                        {note}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`size-6 shrink-0 rounded-full border-2 grid place-items-center ${
                        on ? "border-background bg-background text-foreground" : "border-foreground/40"
                      }`}
                    >
                      {on && <Check className="size-4" strokeWidth={3} />}
                    </span>
                  </label>
                );
              })}
            </div>
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
              <Row label="Shipping" value="Free" />
              <div className="pt-3 mt-3 border-t border-border">
                <Row label="Total" value={formatPrice(total)} bold />
                <p className="mt-1 text-right text-[11px] text-foreground/50">
                  Inclusive of all taxes · includes {formatPrice(gst)} GST ({GST_PERCENT}%)
                </p>
              </div>
            </dl>
            {error ? (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}
            <label className="flex gap-3 items-start text-[12px] text-foreground/70 leading-relaxed">
              <input type="checkbox" required className="mt-0.5 accent-current" />
              <span>
                I agree to the{" "}
                <Link to="/terms" className="underline underline-offset-2">Terms &amp; Conditions</Link>,{" "}
                <Link to="/privacy" className="underline underline-offset-2">Privacy Policy</Link>,{" "}
                <Link to="/shipping" className="underline underline-offset-2">Shipping Policy</Link> and{" "}
                <Link to="/returns" className="underline underline-offset-2">Return &amp; Refund Policy</Link>.
              </span>
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-foreground text-background eyebrow py-4 hover:bg-foreground/90 transition-colors disabled:opacity-60"
            >
              {submitting
                ? "Processing…"
                : payMethod === "cod"
                  ? `Place order · ${formatPrice(total)}`
                  : `Pay ${formatPrice(total)}`}
            </button>
            <p className="text-[11px] text-foreground/50 leading-relaxed">
              {payMethod === "cod"
                ? `Pay ${formatPrice(total)} in cash when your order is delivered. Please keep the exact amount ready for the courier.`
                : "Payments are securely processed by Razorpay. You'll be redirected to a confirmation page once your payment is captured."}{" "}
              Free shipping on every order · Easy {RETURN_WINDOW_DAYS}-day returns on unworn
              items with tags.
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
  id?: string;
  inputMode?: "tel" | "text" | "email" | "numeric";
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow text-foreground/60 mb-2 block">{props.label}</span>
      <input
        id={props.id}
        type={props.type ?? "text"}
        inputMode={props.inputMode}
        autoComplete={props.autoComplete}
        placeholder={props.placeholder}
        required={props.required}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        className="w-full border border-border bg-background px-4 py-3 focus:outline-none focus:border-foreground"
      />
      {props.hint && (
        <span className="mt-1.5 block text-[11px] leading-relaxed text-foreground/50">
          {props.hint}
        </span>
      )}
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
