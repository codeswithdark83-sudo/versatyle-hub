import { createFileRoute } from "@tanstack/react-router";
import { PolicyList, PolicyPage, PolicySection } from "@/components/PolicyPage";

export const Route = createFileRoute("/size-guide")({
  head: () => ({
    meta: [
      { title: "Size & Fit Guide — Versatile" },
      {
        name: "description",
        content:
          "Unisex hoodie size chart with chest, length, shoulder, weight and height ranges from XS to XXL, plus fabric and fit details.",
      },
      { property: "og:title", content: "Size & Fit Guide — Versatile" },
      {
        property: "og:description",
        content: "Unisex sizing from XS to XXL with chest, length and shoulder measurements in cm.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SizeGuidePage,
});

const ROWS = [
  ["XS", "38–42", "60–62", "35–36", "40–50 kg", "5'0–5'3"],
  ["S", "44–48", "64–66", "37–38", "50–60 kg", "5'3–5'6"],
  ["M", "50–54", "68–70", "39–40", "60–75 kg", "5'6–5'9"],
  ["L", "56–60", "72–74", "41–42", "75–90 kg", "5'9–6'0"],
  ["XL", "62–66", "76–78", "43–44", "90–105 kg", "6'0–6'3"],
  ["XXL", "68–72", "80–82", "45–46", "105+ kg", "6'3+"],
];

function SizeGuidePage() {
  return (
    <PolicyPage
      eyebrow="Section 05"
      title="Size & Fit Guide"
      intro="Versatile hoodies are unisex with a relaxed fit. Measurements are in centimetres."
    >
      <PolicySection title="Unisex hoodie size chart">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-y border-border">
                {["Size", "Chest", "Length", "Shoulder", "Weight", "Height"].map((h) => (
                  <th key={h} className="eyebrow text-left text-foreground/50 py-3 pr-4 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r) => (
                <tr key={r[0]} className="border-b border-border">
                  {r.map((cell, i) => (
                    <td
                      key={i}
                      className={`py-3 pr-4 whitespace-nowrap ${i === 0 ? "font-medium" : "text-foreground/75"}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </PolicySection>

      <PolicySection title="Fit details">
        <PolicyList
          items={[
            "Fabric: 350 GSM premium cotton blend",
            "Fit: relaxed unisex",
            "Shrinkage: under 2% with proper care",
            "Hood: deep and comfortable, with drawstring",
          ]}
        />
      </PolicySection>
    </PolicyPage>
  );
}
