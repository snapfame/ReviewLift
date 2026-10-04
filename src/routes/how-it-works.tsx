import { createFileRoute, Link } from "@tanstack/react-router";

import { MarketingPage } from "@/components/marketing/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — ReviewLift" },
      {
        name: "description",
        content:
          "From QR scan to posted Google review in four steps, plus how the zero-cost review draft engine works.",
      },
      { property: "og:title", content: "How ReviewLift works" },
      {
        property: "og:description",
        content: "Scan, choose services, describe the experience, edit the draft, post on Google.",
      },
    ],
  }),
  component: HowItWorks,
});

const CUSTOMER = [
  ["Scan the QR", "The QR points at a permanent link like /r/your-business. No app, no login."],
  ["Choose services", "Only the services you have configured show up, grouped by category."],
  ["Describe the experience", "Excellent, Good, Average or Not Good, plus what stood out."],
  ["Get an editable draft", "Composed instantly from their own answers, in their chosen language."],
  ["Copy and continue", "The customer copies the text and posts it on Google themselves."],
];

const OWNER = [
  ["Create your account", "Email and password, then a five-step onboarding wizard."],
  ["Add services", "Categories and services with per-service vocabulary."],
  ["Configure the experience", "Headlines, languages, draft length, standout attributes."],
  ["Print the QR", "Download PNG or SVG and place it at your counter."],
  ["Watch the funnel", "Visits, sessions, drafts, copies and Google review page clicks."],
];

function HowItWorks() {
  return (
    <MarketingPage>
      <section className="hero-gradient border-b border-border">
        <div className="container-page py-16">
          <h1 className="text-4xl font-semibold sm:text-5xl">How it works</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
            Two sides: what your customer sees in under a minute, and what you set up once.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-10 py-14 lg:grid-cols-2">
        <section>
          <h2 className="text-2xl font-semibold">For the customer</h2>
          <ol className="mt-5 space-y-4">
            {CUSTOMER.map(([title, body], i) => (
              <li key={title} className="panel flex gap-4 p-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h2 className="text-2xl font-semibold">For the business</h2>
          <ol className="mt-5 space-y-4">
            {OWNER.map(([title, body], i) => (
              <li key={title} className="panel flex gap-4 p-5">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="border-t border-border bg-card">
        <div className="container-page py-14">
          <h2 className="text-2xl font-semibold">How the drafts are written</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Composition, not templates", "Openings, service context, experience, attributes, the customer's note and closings are assembled per draft."],
              ["Structure variation", "Several sentence structures with different orderings, so a regenerate reads differently."],
              ["Honest tone mapping", "Average stays balanced and Not Good stays dissatisfied — never rewritten as praise."],
              ["Zero API cost", "Everything runs on your own backend. No paid AI provider is involved."],
            ].map(([title, body]) => (
              <div key={title} className="panel p-5">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>
          <Button asChild size="lg" className="mt-8">
            <Link to="/signup">Get Started</Link>
          </Button>
        </div>
      </section>
    </MarketingPage>
  );
}
