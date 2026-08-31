import { createFileRoute } from "@tanstack/react-router";
import { PolicyList, PolicyPage, PolicySection } from "@/components/PolicyPage";

export const Route = createFileRoute("/care")({
  head: () => ({
    meta: [
      { title: "Care Instructions — Versatile" },
      {
        name: "description",
        content:
          "How to wash, dry and care for your Versatile pieces: cold gentle wash, mild detergent, air dry, no bleach and no dry cleaning.",
      },
      { property: "og:title", content: "Care Instructions — Versatile" },
      {
        property: "og:description",
        content: "Washing and drying guidance to keep your Versatile pieces looking new.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CarePage,
});

function CarePage() {
  return (
    <PolicyPage
      eyebrow="Section 06"
      title="Care Instructions"
      intro="Proper care keeps your Versatile pieces fresh for years. Here's how."
    >
      <PolicySection title="Washing">
        <PolicyList
          items={[
            "Temperature: cold water (max 30°C / 86°F)",
            "Cycle: gentle, or hand wash preferred",
            "Detergent: mild and colour-safe",
            "Turn inside out to protect the colour",
            "Do NOT bleach or use fabric softener",
            "Wash colours separately the first time",
          ]}
        />
      </PolicySection>

      <PolicySection title="Drying">
        <PolicyList
          items={[
            "Air dry preferred — lay flat or hang",
            "Avoid direct sunlight",
            "Machine dry on low heat only",
            "Do NOT over-dry",
          ]}
        />
      </PolicySection>

      <PolicySection title="Do not">
        <PolicyList
          items={["Do NOT dry clean", "Do NOT bleach", "Do NOT wring harshly", "Do NOT tumble dry on high heat"]}
        />
      </PolicySection>
    </PolicyPage>
  );
}
