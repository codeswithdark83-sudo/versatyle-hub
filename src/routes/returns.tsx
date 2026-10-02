import { createFileRoute } from "@tanstack/react-router";
import { PolicyList, PolicyPage, PolicySection, PolicyTable } from "@/components/PolicyPage";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Return & Refund Policy — Versatile" },
      {
        name: "description",
        content:
          "30-day returns on unworn Versatile pieces. Free return shipping on defects, refunds in 5-7 business days, plus international return terms.",
      },
      { property: "og:title", content: "Return & Refund Policy — Versatile" },
      {
        property: "og:description",
        content: "30-day returns, free returns on defects, and refunds within 5-7 business days.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <PolicyPage
      eyebrow="Section 01"
      title="Return & Refund Policy"
      intro="Your satisfaction is our priority. If a piece isn't right, we've got you covered."
    >
      <PolicySection title="For India customers">
        <PolicyTable
          rows={[
            ["Return window", "30 days from the delivery date."],
            [
              "Condition required",
              <PolicyList
                key="c"
                items={[
                  "Unworn, unwashed, unaltered",
                  "All tags & labels attached and intact",
                  "Original packaging / polybag intact",
                  "No smell, stains, or damage",
                ]}
              />,
            ],
            [
              "Return shipping",
              "Free for defective items or our mistakes. Change of mind is ₹80–150, paid by the customer.",
            ],
            [
              "Refund timing",
              "5–7 business days after we receive and inspect the item. Full refund to the original payment method.",
            ],
          ]}
        />
      </PolicySection>

      <PolicySection title="Final sale items (non-refundable)">
        <PolicyList items={["Clearance items marked “FINAL SALE”", "Custom made-to-order products"]} />
      </PolicySection>

      <PolicySection title="For international customers">
        <PolicyTable
          rows={[
            ["Return window", "30 days standard · 60 days for loyalty members"],
            ["Return shipping", "Free for defective items · ₹500 fee for change of mind"],
            ["Refund method", "Original payment method, or store credit with a 5% bonus (optional)"],
          ]}
        />
      </PolicySection>

      <PolicySection title="What we cannot accept">
        <PolicyList
          items={[
            "Worn, washed, or altered items",
            "Items without original tags",
            "Items outside the return window",
            "Custom / made-to-order products",
          ]}
        />
      </PolicySection>
    </PolicyPage>
  );
}
