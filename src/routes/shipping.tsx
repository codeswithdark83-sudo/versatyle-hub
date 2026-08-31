import { createFileRoute } from "@tanstack/react-router";
import { PolicyList, PolicyPage, PolicySection, PolicyTable } from "@/components/PolicyPage";

export const Route = createFileRoute("/shipping")({
  head: () => ({
    meta: [
      { title: "Shipping Policy — Versatile" },
      {
        name: "description",
        content:
          "Free shipping in India on orders ₹499+, 2-7 day delivery, and worldwide shipping to the USA, UK, EU, Canada, Australia, Singapore and UAE.",
      },
      { property: "og:title", content: "Shipping Policy — Versatile" },
      {
        property: "og:description",
        content: "Delivery times, shipping costs, carriers and customs information for India and worldwide.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ShippingPage,
});

function ShippingPage() {
  return (
    <PolicyPage
      eyebrow="Section 02"
      title="Shipping Policy"
      intro="We ship fast and carefully. Every order is packed with care and tracked at each step."
    >
      <PolicySection title="Shipping within India">
        <PolicyTable
          rows={[
            ["Order processing", "1–2 business days (Mon–Fri)"],
            [
              "Delivery time",
              <span key="d">
                Metro cities: 2–3 days
                <br />
                Tier 2 cities: 3–5 days
                <br />
                Remote areas: 5–7 days
              </span>,
            ],
            ["Shipping cost", "Free for orders ₹499 and above · ₹50 for orders below ₹499"],
            ["Carriers", "Delhivery, India Post, Shiprocket"],
            ["Tracking", "Tracking link sent by SMS and email"],
          ]}
        />
      </PolicySection>

      <PolicySection title="International shipping">
        <PolicyTable
          rows={[
            ["Regions", "USA, UK, Canada, Australia, EU, Singapore, UAE"],
            [
              "Delivery time",
              <span key="d">
                USA / Canada: 7–10 days
                <br />
                UK / EU: 10–14 days
                <br />
                Australia: 12–16 days
              </span>,
            ],
            [
              "Shipping cost",
              "USA $8 · UK £6 · EU €7 · Australia AUD$12 — free over $80 USD equivalent",
            ],
            [
              "Customs",
              "Customers are responsible for import duties. We provide all necessary documentation.",
            ],
          ]}
        />
      </PolicySection>

      <PolicySection title="Important restrictions">
        <PolicyList
          items={[
            "No P.O. boxes or APO/FPO addresses",
            "A correct, complete address is required at checkout",
            "We are not responsible for customs delays",
          ]}
        />
      </PolicySection>
    </PolicyPage>
  );
}
