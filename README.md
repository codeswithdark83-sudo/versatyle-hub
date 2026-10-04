<div align="center">

<img src="public/images/logo-mark.png" alt="Versatile logo" width="96" />

# VERSATILE

**Own Your Story.**

A full-stack clothing e-commerce store with online payments, order tracking, returns, invoices and a complete admin panel.

🌐 **Live site:** [www.versatilehub.in](https://www.versatilehub.in)

</div>

---

## Table of contents

1. [About the project](#1-about-the-project)
2. [Feature overview](#2-feature-overview)
3. [Tech stack](#3-tech-stack)
4. [Architecture](#4-architecture)
5. [Project structure](#5-project-structure)
6. [Pages & routes](#6-pages--routes)
7. [Server functions & API endpoints](#7-server-functions--api-endpoints)
8. [Database](#8-database)
9. [Payments (Razorpay)](#9-payments-razorpay)
10. [Order lifecycle](#10-order-lifecycle)
11. [Pricing, tax & policy rules](#11-pricing-tax--policy-rules)
12. [Security](#12-security)
13. [Local setup](#13-local-setup)
14. [Environment variables](#14-environment-variables)
15. [Supabase setup](#15-supabase-setup)
16. [Deployment (Vercel)](#16-deployment-vercel)
17. [Admin guide](#17-admin-guide)
18. [Customising the store](#18-customising-the-store)
19. [Troubleshooting](#19-troubleshooting)
20. [Known limitations](#20-known-limitations)
21. [About the developer](#21-about-the-developer)
22. [Contact](#22-contact)

---

## 1. About the project

**Versatile** is a premium fashion brand for the modern individual. This repository contains its complete online store: a fast, server-rendered storefront where customers browse products, pay online (UPI, cards, netbanking, wallets) or choose Cash on Delivery, track their orders, cancel before shipping, raise returns, and download GST-style invoices — plus a private admin panel where the owner manages inventory, orders, customers and returns.

It was designed and built as a **freelance project** for the Versatile brand, taking it from an initial template to a production store running on its own domain, its own database and live payments.

### What was built, end to end

- Own Supabase backend (database, auth, storage) replacing the original template's hosted backend
- Google + email/password sign-in on the custom domain
- Brand identity: logo mark, favicon, welcome splash animation, moving announcement ticker
- Indian-market commerce: ₹ pricing everywhere, GST-inclusive pricing, free shipping, 7-day returns
- Razorpay Standard Checkout with server-side order creation, signature verification and webhooks
- Cash on Delivery with stock handling
- Customer self-service: order history, tracking, cancellation, returns/replacements, invoices
- Admin panel with analytics, order fulfilment, contact tools, inventory with multi-photo upload
- Policy pages (shipping, returns, terms, privacy, care, size guide)

---

## 2. Feature overview

### 🛍️ Storefront

| Feature | Details |
| --- | --- |
| Home page | Hero, category collections, featured products, moving brand ticker ("We are Versatile · Crafted in Limited Runs · New Arrival") |
| Welcome splash | Branded intro animation shown once per browser session, then the site |
| Shop | Category filter (All / Men / Women / Accessories) and sorting (featured, price low→high, price high→low) |
| Product page | Multi-photo gallery with thumbnails and arrows, price with MRP strike-through, GST-inclusive note, colour and size selectors, live stock messages ("Only 3 left in XS"), sold-out handling, reviews |
| Product cards | Cover photo, second photo on hover, sold-out badge, MRP strike-through |
| Cart | Slide-out cart drawer and full cart page; persisted in the browser between visits |
| Light / dark theme | Toggle in the navigation, follows brand palette |
| Responsive | Designed mobile-first; works on phones, tablets and desktops |
| SEO | Per-page titles and descriptions, Open Graph / Twitter tags, generated `sitemap.xml` |
| Policy & info pages | Shipping, Returns & Refunds, Terms, Privacy, Size & Fit Guide, Care Instructions, Nature Healing Initiative |
| Footer | Navigation, policies and a **Contact us** column with tap-to-open WhatsApp, Instagram and support e-mail |

### 👤 Customer accounts

- Sign up / sign in with **e-mail + password** or **Google**
- **Profile** with saved **phone number** (mandatory at checkout, saved to profile)
- **Address book** (save, edit, reuse shipping addresses)
- **Order history** with a visual tracker: *Order placed → Payment received → Packed → Shipped → Out for delivery → Delivered*
- Courier name, tracking number / link and estimated delivery shown once shipped
- **Cancel order** button — available **only before the order is shipped**; automatically restocks items and refunds prepaid orders through Razorpay
- **Returns & replacements** within 7 days of delivery, with status updates and notes from the store
- **Invoice download** (PDF) from the order confirmation page and from order history
- **Product reviews** with star rating, title, text and photo/video upload

### 💳 Checkout & payments

- Shipping form with validation (name, address, city, state, PIN code, phone)
- **Phone number mandatory** (10-digit Indian mobile, or `+` country code for international), normalised and saved to the customer's profile
- Two clearly highlighted payment options: **Pay online** and **Cash on delivery**
- **Razorpay Standard Checkout** (UPI, cards, netbanking, wallets)
- Server-side verification of every payment (HMAC-SHA256 signature) before an order is marked paid
- Handles failed payments, closed payment popups and slow confirmations gracefully
- Order confirmation page with order number, estimated delivery window and invoice button
- Cash on Delivery orders are confirmed instantly and reserve stock immediately

### 🧾 Invoices

- Branded one-page invoice: logo, brand name, invoice & order numbers and dates
- Seller, bill-to and ship-to blocks, item table with per-line GST, taxable value, GST split, shipping, total
- Amount in words (Indian numbering — lakh / crore)
- Payment method, transaction ID, PAID / COD badge, terms, signature block, thank-you footer
- Opens print-to-PDF directly (file named after the invoice number); issued only for confirmed orders

### 🛠️ Admin panel (`/admin`, admin role only)

| Section | What the owner can do |
| --- | --- |
| **Overview** | Revenue, orders, paid orders, average order value, conversion, customers; 14-day revenue chart; orders by status |
| **Orders** | See every order with items, shipping address and payment details; update payment & fulfilment stage; add courier, tracking number/link, estimated delivery and internal notes; full audit trail of changes |
| **Contact tools** | One-tap **Call**, **E-mail** (pre-filled), **WhatsApp** and **Copy number** for each customer, right inside orders and returns |
| **Returns** | Review return/replacement requests, change status (approved, pickup scheduled, received, refunded…), write a note to the customer, and optionally put returned pieces back into stock |
| **Inventory** | Create / edit / hide / delete products; set price in ₹, compare-at (MRP) price, category, colours, tags, material, description, sort order; **sizes with stock per size**; quick stock updates; **upload up to 12 photos from the device** (drag & drop, reorder, set cover) |
| **Customers** | Customer list with order counts and spend |

### 🔐 Reliability & safety features

- Stock is reduced **once** per order (guarded against double webhook/verify calls) and restored on cancellation
- Prices are always taken from the database on the server — the browser can never set its own price
- Razorpay webhook as a backup confirmation path (paid / failed / refunded)
- Minimum-amount and authentication checks with clear error messages
- Cancellation is atomic — two simultaneous requests cannot double-refund or double-restock

---

## 3. Tech stack

### Frontend

| Technology | Purpose |
| --- | --- |
| **React 19** | UI library |
| **TypeScript 5** | Type safety across client and server |
| **TanStack Start** | Full-stack React framework (SSR, server functions, server routes) |
| **TanStack Router** | Type-safe file-based routing |
| **TanStack Query** | Data fetching, caching, mutations |
| **Tailwind CSS 4** | Styling (design tokens, dark mode, print styles) |
| **Radix UI** + shadcn/ui pattern | Accessible UI primitives in `src/components/ui` |
| **Motion** (Framer Motion successor) | Animations (splash, page transitions, hover effects) |
| **Lucide React** | Icon set |
| **Sonner** | Toast notifications |
| **React Hook Form** + **Zod** | Forms and validation |
| **Recharts**, **date-fns**, **Embla Carousel**, **cmdk**, **Vaul** | Charts, dates, carousels, command menu, drawers |

### Backend & data

| Technology | Purpose |
| --- | --- |
| **TanStack Start server functions** (`createServerFn`) | Type-safe backend endpoints called directly from React |
| **Supabase** | PostgreSQL database, Row-Level Security, Auth (email + Google OAuth), Storage |
| **PostgreSQL** (SECURITY DEFINER functions) | Stock consumption / restock logic, role checks |
| **Zod** | Server-side input validation |
| **Node `crypto`** | HMAC signature verification for Razorpay |

### Payments

| Technology | Purpose |
| --- | --- |
| **Razorpay** Standard Checkout | Online payments (UPI, cards, netbanking, wallets) |
| Razorpay Orders, Payments & Refunds APIs | Order creation, verification, refunds |
| Razorpay Webhooks | Backup payment confirmation |

### Tooling & hosting

| Technology | Purpose |
| --- | --- |
| **Vite 8** | Build tool and dev server |
| **Nitro** | Server runtime / deployment output |
| **Vercel** | Hosting, automatic deploys from GitHub, environment variables |
| **GitHub** | Source control |
| **ESLint**, **Prettier** | Linting and formatting |
| **npm** | Package manager |

> The project was scaffolded from a Lovable TanStack Start template (its Vite preset is still used for build configuration). Hosting, database, authentication, storage and payments all run on the owner's own Vercel, Supabase and Razorpay accounts.

---

## 4. Architecture

```
                         ┌────────────────────────────┐
   Customer / Admin ───▶ │  Vercel (Nitro server)     │
   (browser)             │  TanStack Start            │
                         │   • SSR pages              │
                         │   • Server functions       │
                         │   • /api/public/razorpay/* │
                         └──────┬───────────┬─────────┘
                                │           │
              anon key + user JWT│           │ service-role key (server only)
                                ▼           ▼
                         ┌────────────────────────────┐        ┌──────────────┐
                         │  Supabase                  │        │  Razorpay    │
                         │   • Postgres + RLS         │◀──────▶│  Orders API  │
                         │   • Auth (email, Google)   │ webhook│  Payments    │
                         │   • Storage buckets        │        │  Refunds     │
                         └────────────────────────────┘        └──────────────┘
```

**How the pieces cooperate**

1. The browser talks to server functions; each one validates input with Zod and authenticates the caller with the Supabase session token (`requireSupabaseAuth` middleware).
2. Reads of public data (products) use the Supabase **publishable** key under Row-Level Security.
3. Privileged work (creating orders, marking paid, consuming stock, refunds, admin lists) runs only on the server with the **service-role** key, which never reaches the browser.
4. Razorpay secrets live only in server environment variables.
5. Admin-only actions additionally check the `admin` role in the `user_roles` table.

---

## 5. Project structure

```
versatyle-hub/
├── public/
│   └── images/                  # Logo mark, hero, collection and product images
├── src/
│   ├── components/
│   │   ├── admin/               # ContactActions, ImageUploader
│   │   ├── layout/              # Nav, Footer
│   │   ├── motion/              # Page transitions and animation helpers
│   │   ├── ui/                  # shadcn/Radix UI primitives
│   │   ├── AddressBook.tsx
│   │   ├── CartDrawer.tsx
│   │   ├── InvoiceButton.tsx
│   │   ├── LogoMark.tsx
│   │   ├── OrderHistory.tsx     # Tracker, cancel, returns, invoice
│   │   ├── PolicyPage.tsx
│   │   ├── ProductCard.tsx
│   │   ├── ProductGallery.tsx
│   │   ├── ReviewsSection.tsx
│   │   ├── ThemeToggle.tsx
│   │   └── WelcomeSplash.tsx
│   ├── data/products.ts         # Product types and categories
│   ├── integrations/supabase/   # Browser client, server client, auth middleware, generated types
│   ├── lib/
│   │   ├── admin.functions.ts       # Admin stats, orders, customers
│   │   ├── catalog.functions.ts     # Public product queries
│   │   ├── catalog.server.ts        # Supabase → Product mapping
│   │   ├── checkout.functions.ts    # Razorpay + COD order creation
│   │   ├── inventory.functions.ts   # Admin product CRUD, stock
│   │   ├── orders.functions.ts      # My orders, cancel order, invoice data
│   │   ├── returns.functions.ts     # Customer + admin returns
│   │   ├── reviews.functions.ts
│   │   ├── razorpay-signature.ts    # HMAC verification
│   │   ├── pricing.ts               # GST, return window — single source of truth
│   │   ├── phone.ts                 # Phone normalisation + call/WhatsApp links
│   │   ├── order-cancel.ts          # Cancellation eligibility rule
│   │   ├── number-words.ts          # Amount in words (₹)
│   │   ├── business.ts              # Seller & contact details used on invoices/footer
│   │   ├── cart.tsx                 # Cart state + ₹ formatter
│   │   └── auth.tsx                 # Auth context
│   ├── routes/                  # File-based routes (see next section)
│   ├── styles.css               # Tailwind theme, splash, ticker, print styles
│   └── server.ts                # SSR error wrapper
├── supabase/
│   ├── config.toml
│   └── migrations/              # Ordered SQL migrations (schema, RLS, functions, storage)
├── .env.example                 # Template for server-side secrets
├── vite.config.ts
├── package.json
└── README.md
```

---

## 6. Pages & routes

| URL | Page | Access |
| --- | --- | --- |
| `/` | Home | Public |
| `/shop` | Shop with filters and sorting | Public |
| `/product/:slug` | Product detail, gallery, reviews | Public |
| `/cart` | Bag | Public |
| `/checkout` | Shipping details + payment | Public (signing in saves the phone number to the profile and links the order to the account) |
| `/order/success?orderId=…` | Order confirmation; invoice button for the signed-in owner | Anyone with the order link |
| `/auth` | Sign in / sign up / Google | Public |
| `/account` | Profile, addresses, order history, returns | Signed in |
| `/invoice/:orderId` | Printable invoice | Order owner |
| `/shipping`, `/returns`, `/terms`, `/privacy`, `/care`, `/size-guide`, `/nature-initiative` | Policy / info pages | Public |
| `/sitemap.xml` | Generated sitemap | Public |
| `/admin` | Overview dashboard | Admin |
| `/admin/orders` | Order management | Admin |
| `/admin/returns` | Returns management | Admin |
| `/admin/inventory` | Products & stock | Admin |
| `/admin/customers` | Customers | Admin |

---

## 7. Server functions & API endpoints

### Server functions (called from React)

| Module | Functions |
| --- | --- |
| `catalog.functions` | `listProducts`, `getProductBySlug` |
| `checkout.functions` | `getRazorpayPublicConfig`, `createRazorpayOrder`, `createCodOrder`, `getOrderStatus` |
| `orders.functions` | `listMyOrders`, `cancelMyOrder`, `getMyInvoice` |
| `returns.functions` | `listMyReturnRequests`, `createReturnRequest`, `listAdminReturnRequests`, `updateReturnRequest` |
| `reviews.functions` | `getReviewAuthorNames` |
| `inventory.functions` *(admin)* | `listInventory`, `saveProduct`, `setProductActive`, `setVariantStock`, `deleteProduct` |
| `admin.functions` *(admin)* | `checkIsAdmin`, `getAdminStats`, `listAdminOrders`, `updateOrderStatus`, `listOrderEvents`, `listAdminCustomers` |

### HTTP endpoints

| Method & path | Purpose |
| --- | --- |
| `POST /api/public/razorpay/verify` | Receives `order_id`, `payment_id`, `signature` from the browser after payment; verifies the HMAC signature and marks the order paid (once), consuming stock |
| `POST /api/public/razorpay/webhook` | Razorpay → server notifications (`payment.captured`, `payment.authorized`, `order.paid`, `payment.failed`, `refund.processed`, `refund.created`); verified with `x-razorpay-signature` |

---

## 8. Database

PostgreSQL on Supabase, with Row-Level Security on every table.

| Table | Purpose |
| --- | --- |
| `profiles` | Customer profile (name, phone, …), created on sign-up |
| `user_roles` | Role assignments (`admin`) used by `has_role()` |
| `products` | Catalogue: slug, name, price (₹), compare-at price, category, tags, colours, material, description, cover `image_url`, `images[]` gallery, active flag, sort order |
| `product_variants` | Size, stock and optional price override per product |
| `orders` | Orders: items (JSON), shipping address, amount (paise), payment status, fulfilment status, payment method, Razorpay IDs, courier & tracking, notes, timestamps |
| `order_events` | Audit trail of every status change, cancellation and request |
| `return_requests` | Return / replacement requests with reason, status and admin note |
| `reviews` | Ratings, text and media references |
| `addresses` | Saved customer addresses |

**Enums:** `order_status` (created, paid, failed, refunded) · `fulfillment_status` (pending, confirmed, packed, shipped, out_for_delivery, delivered, cancelled, returned) · `return_kind` (return, replace) · `return_status` (requested, approved, rejected, pickup_scheduled, received, refunded, replacement_shipped, completed, cancelled)

**Database functions (service-role only):**

- `consume_order_stock(order_id)` — reduces stock for each item in an order
- `restock_return_request(request_id)` — returns stock when a return completes
- `restock_order_stock(order_id)` — returns stock when a customer cancels
- `has_role(user_id, role)` — role check used by policies

**Storage buckets:** `review-media` (private, review photos/videos) · `product-images` (public read, admin-only write, product photos)

> Money is stored in **paise** (`amount_cents`) on orders; product prices are stored in **whole rupees**.

---

## 9. Payments (Razorpay)

```
Browser                         Server                              Razorpay
   │  createRazorpayOrder ───────▶ validates cart + phone,           │
   │                               prices from DB, POST /v1/orders ─▶│
   │◀──────── order_id, key_id ────│                                 │
   │  open Checkout popup ─────────────────────────────────────────▶│
   │◀──────────────── payment_id, signature ────────────────────────│
   │  POST /api/public/razorpay/verify ─▶ HMAC-SHA256(order|payment) │
   │                               == signature ? mark paid,         │
   │                               consume stock                     │
   │                                                                 │
   │                               webhook (backup) ◀────────────────│
```

- **Test vs live:** keys beginning `rzp_test_` run in test mode; `rzp_live_` keys charge real money. Use test keys on Vercel *Preview/Development* and live keys on *Production* only.
- The **key secret** and **webhook secret** exist only in server environment variables.
- Refunds for cancelled prepaid orders call `POST /v1/payments/{id}/refund`. If the API call fails, the order is still cancelled and an audit note tells the admin to refund manually from the Razorpay dashboard.
- Test-mode UPI QR codes are dummy; in test mode use `success@razorpay` or Razorpay's test cards.

---

## 10. Order lifecycle

```
ONLINE   created ──pay──▶ paid ──▶ confirmed ─▶ packed ─▶ shipped ─▶ out for delivery ─▶ delivered
                  └fail─▶ failed                  ▲ cancellable until here ▲   (no cancel after)

COD      confirmed (stock reserved) ─▶ packed ─▶ shipped ─▶ out for delivery ─▶ delivered
```

| Event | Effect |
| --- | --- |
| Online payment verified | `status = paid`, stock reduced once |
| COD order placed | `fulfillment_status = confirmed`, stock reduced immediately |
| Customer cancels (before shipped) | `fulfillment_status = cancelled`, stock restored, Razorpay refund for paid orders, audit event |
| Admin updates stage / tracking | Order patched, `shipped_at` / `delivered_at` set, audit event written |
| Return received (admin chooses *restock*) | Stock restored once via `restock_return_request` |

---

## 11. Pricing, tax & policy rules

All of these are enforced in code (`src/lib/pricing.ts`) and described on the policy pages.

| Rule | Value |
| --- | --- |
| Currency | Indian Rupee (₹) everywhere, including newly added inventory |
| Price shown | Final selling price (MRP strike-through is for display only) |
| GST | **5% included** in the price — nothing added at checkout; shown as "includes ₹X GST" |
| Shipping | **Free** on every order |
| Handling fee | **None** |
| Returns | **7 days** from delivery, free return shipping, unworn items with tags |
| Cancellation | Customer can cancel **only before the order is shipped**; prepaid orders refunded in full in 5–7 business days |
| Refund timing | 5–7 business days to the original payment method |

---

## 12. Security

- **Secrets never ship to the browser.** Only the Supabase publishable key and Razorpay *key id* are public; the service-role key, Razorpay key secret and webhook secret are server-only.
- **Server-side pricing.** Totals are calculated on the server from database prices.
- **Payment integrity.** Every online payment is verified with a constant-time HMAC-SHA256 comparison before an order is marked paid; the webhook is signature-verified too.
- **Row-Level Security** on all tables; customers can only read their own data.
- **Role-based admin.** Admin functions check the `admin` role on the server; storage writes for product images require the admin role.
- **Ownership checks** on cancellation, returns and invoices.
- **Idempotent stock and money handling** — guarded state transitions prevent double stock changes or double refunds.
- **Input validation** with Zod on every server function.
- `.env` in this repository holds **public values only**. Real secrets go in Vercel's environment variables (or `.env.local` for local work, which is git-ignored).

---

## 13. Local setup

**Requirements:** Node.js 20+ and npm.

```bash
# 1. Clone
git clone https://github.com/codeswithdark83-sudo/versatyle-hub.git
cd versatyle-hub

# 2. Install
npm install

# 3. Configure environment (see section 14)
cp .env.example .env.local
# then fill in the values

# 4. Run the dev server
npm run dev

# 5. Production build
npm run build
```

Other scripts: `npm run lint` · `npm run format` · `npm run preview`.

---

## 14. Environment variables

**Public values** (already in the committed `.env`, safe to expose):

| Variable | Description |
| --- | --- |
| `SUPABASE_URL` / `VITE_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_PUBLISHABLE_KEY` / `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase publishable (anon) key |
| `SUPABASE_PROJECT_ID` / `VITE_SUPABASE_PROJECT_ID` | Supabase project reference |

**Secrets** (set in Vercel → Project → Settings → Environment Variables, or `.env.local` locally — **never commit these**):

| Variable | Description |
| --- | --- |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase secret / service-role key (server only) |
| `RAZORPAY_KEY_ID` | Razorpay key id (`rzp_test_…` or `rzp_live_…`) |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret (server only) |
| `RAZORPAY_WEBHOOK_SECRET` | Secret configured on the Razorpay webhook (use a value different from the API secret) |

---

## 15. Supabase setup

1. Create a Supabase project and copy its URL and publishable key into the environment.
2. Apply the SQL files in `supabase/migrations/` **in filename order** (Supabase CLI `supabase db push`, or paste them into the SQL Editor one by one). They create the tables, enums, RLS policies, functions and storage buckets (`review-media`, `product-images`).
3. **Authentication → URL Configuration:** set the **Site URL** to `https://www.versatilehub.in` and add these Redirect URLs: `https://www.versatilehub.in/**` (and `http://localhost:3000/**` for local work).
4. **Authentication → Providers → Google:** enable it and paste the Google OAuth client ID and secret. In Google Cloud Console add the Supabase callback URL (`https://<project-ref>.supabase.co/auth/v1/callback`) as an authorised redirect URI.
5. Make yourself an admin (after you have signed up once):

   ```sql
   insert into public.user_roles (user_id, role)
   select id, 'admin' from auth.users where email = 'owner@example.com';
   ```

---

## 16. Deployment (Vercel)

1. Import the GitHub repository into Vercel (framework: auto-detected).
2. Add the environment variables from section 14 — use **live Razorpay keys for Production only**.
3. Attach the custom domain (`www.versatilehub.in`).
4. Every push / merge to `main` redeploys automatically.
5. In the **Razorpay Dashboard → Webhooks**, create a **Live-mode** webhook:
   - URL: `https://www.versatilehub.in/api/public/razorpay/webhook`
   - Secret: the value of `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.authorized`, `payment.captured`, `payment.failed`, `order.paid`, `refund.processed` (and `refund.created`)
6. Place a small live order and refund it from the Razorpay dashboard to confirm the full flow.

---

## 17. Admin guide

**Add a product** — Admin → Inventory → *Add product*: name, URL slug, price (₹), optional compare-at price, category, colours, tags, material, description. Under **Product photos** pick images from your phone or computer (select several at once or drag them in). The first photo is the cover; use the arrows to reorder. Set sizes and stock per size, then save.

**Photo tips** — Best size is **1200 × 1600 px** (3:4 portrait). Up to 12 photos, 10 MB each (JPG, PNG, WebP, AVIF). Large photos are resized automatically in the browser before upload. Use a clean product shot as the cover and detail/infographic images afterwards.

**Fulfil an order** — Admin → Orders → open an order: move it through *Packed → Shipped → Out for delivery → Delivered*, add courier, tracking number/link and an estimated delivery date. Customers see the update in their order history instantly. Use the **Call / E-mail / WhatsApp** buttons to contact the customer.

**Handle returns** — Admin → Returns: approve, schedule pickup, mark received and refund, with a note to the customer at each step.

**Refund manually** (only if an automatic refund failed) — Razorpay Dashboard → Transactions → Payments → select the payment → *Refund*.

---

## 18. Customising the store

| I want to change… | Edit |
| --- | --- |
| Seller name, GSTIN, address, support e-mail, WhatsApp, Instagram | `src/lib/business.ts` |
| GST %, return window | `src/lib/pricing.ts` |
| Ticker text | `TICKER_ITEMS` in `src/routes/index.tsx` |
| Logo / favicon | `public/images/logo-mark.png` and favicon files in `public/` |
| Brand colours, fonts, theme | `src/styles.css` |
| Policy wording | `src/routes/returns.tsx`, `shipping.tsx`, `terms.tsx`, `privacy.tsx` |
| Categories | `src/data/products.ts` |

> **GST invoices:** add your GSTIN and registered address in `src/lib/business.ts` — once a GSTIN is set the document is titled "TAX INVOICE". Please confirm the exact invoice requirements with your accountant.

---

## 19. Troubleshooting

| Problem | Fix |
| --- | --- |
| Google sign-in goes to the wrong site / `bad_oauth_state` | Set Supabase **Site URL** and **Redirect URLs** to your real domain |
| "Unsupported provider: provider is not enabled" | Enable Google in Supabase → Authentication → Providers |
| Payment succeeds but order stays "Awaiting payment" | Check `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` in Vercel (Production scope) and redeploy |
| Checkout says server not configured | A required environment variable is missing for that Vercel environment |
| "Bucket not found" when uploading product photos | Run the `product_image_gallery` migration (creates the `product-images` bucket) |
| Cannot upload photos / permission error | The signed-in account must have the `admin` role in `user_roles` |
| `npm install` fails fetching from a private registry | Delete `bun.lock` / `bunfig.toml` and use `npm install` |
| UPI QR "Incorrect beneficiary details" in test mode | Test-mode QR codes are dummy; use `success@razorpay` or a test card |
| Automatic refund failed on cancellation | Refund the payment manually from the Razorpay dashboard (the order's history notes it) |

---

## 20. Known limitations

- Order e-mails / SMS notifications are not automated yet — customers see updates in their account and the admin can contact them directly.
- Courier tracking is entered manually by the admin; there is no live courier API integration.
- Invoices are produced with the browser's *Save as PDF* (print) rather than a server-generated PDF file.
- Payments are INR only.

---

## 21. About the developer

This store was designed, developed and deployed as a **freelance project** for the **Versatile** brand.

**Developer:** Jatin Kr. Koli ([@codeswithdark83](https://github.com/codeswithdark83-sudo)) — freelance full-stack web developer. Portfolio and links: [linktr.ee/codeswithjatin](https://linktr.ee/codeswithjatin).

**Scope of work delivered:** UI/UX and branding integration, React + TanStack Start application, Supabase database design with security policies, authentication, Razorpay payment integration, admin dashboard and operations tools, policy content, deployment on Vercel with a custom domain, and go-live support.

Interested in a similar store or custom web application? Get in touch through [linktr.ee/codeswithjatin](https://linktr.ee/codeswithjatin).

---

## 22. Contact

**Versatile — customer support**

| Channel | Link |
| --- | --- |
| WhatsApp | [+91 92057 73248](https://wa.me/919205773248) |
| Instagram | [@we.are.versatile](https://www.instagram.com/we.are.versatile) |
| Support e-mail | [support.versatilehub@gmail.com](mailto:support.versatilehub@gmail.com) |
| Website | [www.versatilehub.in](https://www.versatilehub.in) |

---

<div align="center">

© Versatile Studio · Own Your Story.

</div>
