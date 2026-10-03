import { createFileRoute } from "@tanstack/react-router";
import { PolicyList, PolicyPage, PolicySection } from "@/components/PolicyPage";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms & Conditions — Versatile" },
      {
        name: "description",
        content:
          "The terms that govern purchases from Versatile: website use, product accuracy, pricing and payment, intellectual property and liability.",
      },
      { property: "og:title", content: "Terms & Conditions — Versatile" },
      {
        property: "og:description",
        content: "Website use, product accuracy, payment, intellectual property and liability terms.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <PolicyPage
      eyebrow="Section 03"
      title="Terms & Conditions"
      intro="By purchasing from Versatile you agree to these terms. Please read them carefully. Questions: hello@versatile.in"
    >
      <PolicySection title="1. Use of website">
        <PolicyList
          items={[
            "You agree not to use this website for illegal purposes",
            "You will not harass, threaten, or defame others",
            "You will not reproduce our designs without permission",
            "You will not use bots to scrape our content",
          ]}
        />
      </PolicySection>

      <PolicySection title="2. Product information & accuracy">
        <PolicyList
          items={[
            "We describe our products as accurately as possible",
            "Colours may vary depending on your screen settings",
            "Fabric quality matches stated GSM standards (350 GSM for hoodies)",
            "If a product differs significantly from its description, we offer a full refund",
          ]}
        />
      </PolicySection>

      <PolicySection title="3. Price & payment">
        <PolicyList
          items={[
            "All prices are in Indian Rupees (₹ INR) and inclusive of all taxes (5% GST included). No shipping or handling fees are added at checkout",
            "We accept cards, UPI, wallets, bank transfer, and COD (India only)",
            "Payment must be completed before an order is processed",
          ]}
        />
      </PolicySection>

      <PolicySection title="4. Intellectual property">
        <PolicyList
          items={[
            "The Versatile logo, designs, and “Own Your Story” are our property",
            "You may not reproduce them without written permission",
            "Violations may result in legal action",
          ]}
        />
      </PolicySection>

      <PolicySection title="5. Liability">
        <PolicyList
          items={[
            "Versatile is not liable for indirect damages",
            "Our liability is limited to the purchase price",
            "Follow the care instructions to maintain garment quality",
          ]}
        />
      </PolicySection>
    </PolicyPage>
  );
}
