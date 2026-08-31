import { createFileRoute } from "@tanstack/react-router";
import { PolicyList, PolicyPage, PolicySection } from "@/components/PolicyPage";

export const Route = createFileRoute("/nature-initiative")({
  head: () => ({
    meta: [
      { title: "Nature Healing Initiative — Versatile" },
      {
        name: "description",
        content:
          "Every Versatile order plants a native tree seed in India. Learn how planting, monitoring and verification work across a three-year programme.",
      },
      { property: "og:title", content: "Nature Healing Initiative — Versatile" },
      {
        property: "og:description",
        content: "One native tree seed planted for every order, tracked and verified for three years.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NaturePage,
});

function NaturePage() {
  return (
    <PolicyPage
      eyebrow="Section 07"
      title="Nature Healing Initiative"
      intro="Every Versatile purchase plants a seed. We're committed to healing our Earth."
    >
      <PolicySection title="Our commitment">
        <PolicyList
          items={[
            "For every order: one native tree seed planted in India",
            "Planted within 30 days of your order, through our verified NGO partner",
            "100% of the allocated proceeds go to planting",
          ]}
        />
      </PolicySection>

      <PolicySection title="Planting details">
        <PolicyList
          items={[
            "Species: native trees — Neem, Gulmohar, Sal, Teak",
            "Regions: Delhi, Rajasthan, Madhya Pradesh",
            "Monitoring: tracked for three years",
            "Transparency: monthly reports and photos",
          ]}
        />
      </PolicySection>

      <PolicySection title="How to verify your tree">
        <PolicyList
          items={[
            "Receive a unique tracking code in your order confirmation",
            "View your tree on the partner NGO website",
            "Receive monthly updates and photos",
            "A printable certificate is included",
          ]}
        />
      </PolicySection>

      <PolicySection title="Disclaimers">
        <PolicyList
          items={[
            "We cannot guarantee 100% survival",
            "Average survival is 85–90% over three years",
            "Planting is cancelled if a refund is processed",
          ]}
        />
      </PolicySection>
    </PolicyPage>
  );
}
