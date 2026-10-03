import { createFileRoute } from "@tanstack/react-router";
import { PolicyList, PolicyPage, PolicySection, PolicyTable } from "@/components/PolicyPage";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Return & Refund Policy — Versatile" },
      {
        name: "description",
        content:
          "Easy 7-day returns on unworn Versatile pieces with no return charges. Refunds in 5-7 business days.",
      },
      { property: "og:title", content: "Return & Refund Policy — Versatile" },
      {
        property: "og:description",
        content: "Easy 7-day returns with no return charges, and refunds within 5-7 business days.",
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
            ["Return window", "7 days from the delivery date."],
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
              "Free. No return charges, whatever the reason for the return.",
            ],
            [
              "Refund timing",
              "5–7 business days after we receive and inspect the item. Full refund to the original payment method.",
            ],
          ]}
        />
      </PolicySection>

      <PolicySection title="Order cancellation">
        <PolicyTable
          rows={[
            [
              "Before shipping",
              "You can cancel your order yourself from Profile → Your orders using the “Cancel order” button, any time before it is shipped.",
            ],
            [
              "After shipping",
              "Once an order has been shipped, it can no longer be cancelled. You can still return it under our 7-day return policy after delivery.",
            ],
            [
              "Refund on cancellation",
              "Prepaid orders are refunded in full to the original payment method within 5–7 business days. Cash on delivery orders involve no payment, so nothing is charged.",
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
            ["Return window", "7 days from the delivery date"],
            ["Return shipping", "Free. No return charges"],
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
