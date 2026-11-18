import { createFileRoute, Link } from "@tanstack/react-router";

import { MarketingPage, PageIntro } from "@/components/marketing/site-chrome";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — ReviewLift" },
      {
        name: "description",
        content:
          "Early-access plans for ReviewLift. Online billing is not enabled. Growth and Pro prices are not finalised.",
      },
      { property: "og:title", content: "ReviewLift pricing" },
      {
        property: "og:description",
        content: "Starter, Growth, and Pro. Checkout is not live yet.",
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
    cta: "Create account",
    href: "/signup" as const,
    features: ["1 business", "Permanent QR code", "Up to 200 drafts / month", "Core activity"],
  },
  {
    name: "Growth",
    price: "Price not final",
    note: "Assigned manually",
    highlight: true,
    cta: "Contact us",
    href: "/contact" as const,
    features: ["Up to 3 businesses", "Up to 2,000 drafts / month", "Full activity funnel", "Branding and custom wording"],
  },
  {
    name: "Pro",
    price: "Price not final",
    note: "Assigned manually",
    cta: "Contact us",
    href: "/contact" as const,
    features: ["Up to 10 businesses", "Unlimited drafts", "Priority support during early access"],
  },
];

function Pricing() {
  return (
    <MarketingPage>
      <PageIntro eyebrow="Simple pricing" title="Start with a plan we can actually honour.">
        Online checkout is not live. During early access, plans are activated manually. Growth and Pro do not have a published price yet.
      </PageIntro>
      <div className="rl-wrap grid gap-4 py-14 lg:grid-cols-3">
        {PLANS.map((plan) => (
          <article
            key={plan.name}
            className={`flex flex-col rounded-[28px] bg-white p-6 ${plan.highlight ? "ring-2 ring-[var(--brand-primary)]" : ""}`}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold">{plan.name}</h2>
              {plan.highlight ? (
                <span className="rounded-full bg-[var(--brand-primary)] px-2.5 py-1 text-xs font-semibold text-white">Recommended to discuss</span>
              ) : null}
            </div>
            <p className="mt-6 text-3xl font-semibold tracking-tight">{plan.price}</p>
            <p className="text-sm text-[#737373]">{plan.note}</p>
            <ul className="mt-6 flex-1 space-y-2 text-sm text-[#333]">
              {plan.features.map((feature) => (
                <li key={feature}>{feature}</li>
              ))}
            </ul>
            <Link to={plan.href} className={`rl-btn mt-8 ${plan.highlight ? "rl-btn-primary" : "rl-btn-ghost"}`}>
              {plan.cta}
            </Link>
          </article>
        ))}
      </div>
      <div className="rl-wrap pb-16">
        <p className="max-w-3xl text-sm leading-relaxed text-[#555]">
          There is no card checkout in the product yet. Creating an account does not charge you. Plan limits above describe the catalog used for manual assignment, not a live subscription.
        </p>
      </div>
    </MarketingPage>
  );
}
