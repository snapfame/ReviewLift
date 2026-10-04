import { createFileRoute, Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { MarketingPage } from "@/components/marketing/site-chrome";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ReviewLift" },
      {
        name: "description",
        content:
          "Simple plans for local businesses. Online billing is not enabled yet — plans are assigned manually during early access.",
      },
      { property: "og:title", content: "ReviewLift pricing" },
      {
        property: "og:description",
        content: "Starter, Growth and Pro plans for businesses collecting honest Google reviews.",
      },
    ],
  }),
  component: Pricing,
});

const PLANS = [
  {
    name: "Starter",
    price: "₹0",
    note: "Early access",
    features: ["1 business", "Permanent QR code", "Up to 200 drafts / month", "Core analytics"],
  },
  {
    name: "Growth",
    price: "₹—",
    note: "Pricing being finalised",
    highlight: true,
    features: [
      "Up to 3 businesses",
      "Up to 2,000 drafts / month",
      "Full funnel analytics",
      "Branding and custom wording",
    ],
  },
  {
    name: "Pro",
    price: "₹—",
    note: "Pricing being finalised",
    features: [
      "Up to 10 businesses",
      "Unlimited drafts",
      "Priority support",
      "Early access to Google Business Profile tools",
    ],
  },
];

function Pricing() {
  return (
    <MarketingPage>
      <section className="hero-gradient border-b border-border">
        <div className="container-page py-16 text-center">
          <h1 className="text-4xl font-semibold sm:text-5xl">Pricing</h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            Online checkout is not live yet. During early access we activate plans for you manually —
            create an account and we will set it up.
          </p>
        </div>
      </section>
      <div className="container-page grid gap-6 py-14 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`panel flex flex-col p-6 ${plan.highlight ? "ring-2 ring-primary" : ""}`}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              {plan.highlight ? <Badge>Most popular</Badge> : null}
            </div>
            <p className="mt-4 text-3xl font-semibold">{plan.price}</p>
            <p className="text-sm text-muted-foreground">{plan.note}</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
                  {feature}
                </li>
              ))}
            </ul>
            <Button asChild className="mt-6" variant={plan.highlight ? "default" : "outline"}>
              <Link to="/signup">Create account</Link>
            </Button>
          </div>
        ))}
      </div>
      <div className="container-page pb-16">
        <p className="panel p-6 text-sm text-muted-foreground">
          Billing integration is intentionally not shipped yet: there are no fake checkout flows in
          this product. Plan and subscription records already exist in the database, so payments can
          be switched on later without any data migration.
        </p>
      </div>
    </MarketingPage>
  );
}
