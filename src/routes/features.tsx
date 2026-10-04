import { createFileRoute, Link } from "@tanstack/react-router";

import { MarketingPage } from "@/components/marketing/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — ReviewLift review draft platform" },
      {
        name: "description",
        content:
          "Permanent QR codes, custom services, three languages, duplicate prevention, real analytics and business branding.",
      },
      { property: "og:title", content: "Features — ReviewLift" },
      {
        property: "og:description",
        content: "Everything included in ReviewLift for collecting honest Google reviews.",
      },
    ],
  }),
  component: FeaturesPage,
});

const GROUPS = [
  {
    title: "For your customers",
    items: [
      ["Three-step flow", "Service, experience, draft. Nothing else to fill in."],
      ["Mobile-first", "Designed for 360–430px screens with large tap targets."],
      ["English, Hindi, Hinglish", "Separate natural phrase libraries per language."],
      ["Fully editable draft", "The customer can rewrite anything before posting."],
      ["Generate another", "A materially different draft, not a synonym swap."],
      ["Equal Google access", "Every customer sees the same Google CTA, happy or not."],
    ],
  },
  {
    title: "For your business",
    items: [
      ["Permanent QR code", "Download PNG or SVG; the destination never changes."],
      ["Service management", "Categories, services, ordering, activation — all self-serve."],
      ["Review experience settings", "Headlines, languages, length, attributes, CTA text."],
      ["Links with testing", "Google review, Instagram and website links you can test."],
      ["Branding", "Logo and accent colour, no arbitrary code injection."],
      ["Real analytics", "Every number comes from recorded events, never a placeholder."],
    ],
  },
  {
    title: "Under the hood",
    items: [
      ["Zero-cost generation", "No OpenAI, Gemini or Anthropic. ₹0 per generated draft."],
      ["Duplicate prevention", "SHA-256 hash of the normalised text, unique per business."],
      ["Near-duplicate checks", "Jaccard similarity against the last 300 drafts."],
      ["Anti-repetition", "Fragments are weighted by usage count and recency."],
      ["Tenant isolation", "Row level security scopes every read and write."],
      ["Super admin panel", "Create and manage businesses without code changes."],
    ],
  },
];

function FeaturesPage() {
  return (
    <MarketingPage>
      <section className="hero-gradient border-b border-border">
        <div className="container-page py-16">
          <h1 className="max-w-3xl text-4xl font-semibold sm:text-5xl">
            Built for honest reviews, not review farming
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            ReviewLift never writes a review on your customer's behalf, never publishes to Google, and
            never hides unhappy customers from the review button.
          </p>
        </div>
      </section>
      <div className="container-page space-y-12 py-14">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="text-2xl font-semibold">{group.title}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.items.map(([title, body]) => (
                <div key={title} className="panel p-5">
                  <h3 className="text-base font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
                </div>
              ))}
            </div>
          </section>
        ))}
        <div className="panel flex flex-wrap items-center justify-between gap-4 p-8">
          <p className="text-lg font-medium">Set it up for your business in a few minutes.</p>
          <Button asChild size="lg">
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </div>
    </MarketingPage>
  );
}
