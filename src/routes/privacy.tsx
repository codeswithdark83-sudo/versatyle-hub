import { createFileRoute } from "@tanstack/react-router";
import { PolicyList, PolicyPage, PolicySection } from "@/components/PolicyPage";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Versatile" },
      {
        name: "description",
        content:
          "What data Versatile collects, how we use it, who we share it with, and how to access, correct, or delete your information.",
      },
      { property: "og:title", content: "Privacy Policy — Versatile" },
      {
        property: "og:description",
        content: "Data we collect, how we use it, our partners, and your privacy rights.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <PolicyPage
      eyebrow="Section 04"
      title="Privacy Policy"
      intro="Your privacy matters. We collect only the data we need to serve you. Data controller: Versatile India — privacy@versatile.in"
    >
      <PolicySection title="1. What data we collect">
        <PolicyList
          items={[
            "Name, email, phone, shipping address",
            "Payment details are NOT stored — they are processed securely by Razorpay / PayPal",
            "Order history and product preferences",
            "IP address, browser type, device information",
          ]}
        />
      </PolicySection>

      <PolicySection title="2. How we use your data">
        <PolicyList
          items={[
            "Process orders and shipments",
            "Send tracking and delivery updates",
            "Marketing emails (unsubscribe any time)",
            "Prevent fraud and improve security",
          ]}
        />
      </PolicySection>

      <PolicySection title="3. Who we share data with">
        <PolicyList
          items={[
            "Shipping partners: Delhivery, India Post, DHL, FedEx",
            "Payment partners: Razorpay, PayPal",
            "We do NOT sell your data to third parties",
          ]}
        />
      </PolicySection>

      <PolicySection title="4. Your rights">
        <PolicyList
          items={[
            "Access: request a copy of your data",
            "Correction: ask us to fix your data",
            "Deletion: request that we delete your data",
            "Opt-out: unsubscribe from marketing emails",
            "Contact: privacy@versatile.in",
          ]}
        />
      </PolicySection>
    </PolicyPage>
  );
}
