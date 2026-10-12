import { createFileRoute } from "@tanstack/react-router";
import { PolicyPage, PolicySection } from "@/components/PolicyPage";

export const Route = createFileRoute("/size-guide")({
  head: () => ({
    meta: [
      { title: "Size & Fit Guide — Versatile" },
      {
        name: "description",
        content:
          "Oversize T-shirt size chart with chest and length in inches for sizes S to XXL.",
      },
      { property: "og:title", content: "Size & Fit Guide — Versatile" },
      {
        property: "og:description",
        content: "Oversize T-shirt sizing from S to XXL with chest and length in inches.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SizeGuidePage,
});

function SizeGuidePage() {
  return (
    <PolicyPage
      eyebrow="Section 05"
      title="Size & Fit Guide"
      intro="Versatile oversize T-shirts have a relaxed fit. Measurements are in inches."
    >
      <PolicySection title="Oversize T-shirt size chart">
        <img
          src="/images/size-chart.jpg"
          alt="Oversize T-shirt size chart in inches. Size S: chest 40, length 27. M: chest 42, length 28. L: chest 44, length 29. XL: chest 46, length 30. XXL: chest 48, length 31."
          width={1122}
          height={1402}
          loading="lazy"
          decoding="async"
          className="w-full max-w-xl h-auto border border-border"
        />
</PolicySection>
    </PolicyPage>
  );
}
