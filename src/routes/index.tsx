import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  Building2,
  Check,
  Languages,
  Link2,
  PenLine,
  QrCode,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import { MarketingPage } from "@/components/marketing/site-chrome";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ReviewLift — turn real experiences into better Google reviews" },
      {
        name: "description",
        content:
          "Customers scan your QR, answer a few quick questions and get an editable review draft they can post on Google. Multi-tenant, permanent QR, real analytics.",
      },
      { property: "og:title", content: "ReviewLift — better Google reviews from real customers" },
      {
        property: "og:description",
        content:
          "A permanent QR code that helps genuine customers write and publish honest Google reviews.",
      },
    ],
  }),
  component: Home,
});

const STEPS = [
  { icon: QrCode, title: "Customer scans your QR", body: "One permanent link per business, printed once." },
  { icon: Wrench, title: "Picks service and experience", body: "Only the services you actually offer." },
  { icon: Sparkles, title: "Gets a review draft", body: "Composed locally from their own answers." },
  { icon: PenLine, title: "Edits and posts on Google", body: "The customer always publishes it themselves." },
];

const FEATURES = [
  { icon: QrCode, title: "Permanent QR code", body: "Print once. The destination never changes when your services, logo or links do." },
  { icon: Wrench, title: "Custom services", body: "Categories and services you manage yourself — no developer needed." },
  { icon: Languages, title: "English, Hindi, Hinglish", body: "Three separate phrase libraries written to sound natural, not translated." },
  { icon: Sparkles, title: "Unique review drafts", body: "Every draft is composed from fragments, structures and the customer's own input." },
  { icon: ShieldCheck, title: "Duplicate prevention", body: "Exact-hash and near-duplicate similarity checks per business." },
  { icon: Building2, title: "Business dashboard", body: "Services, settings, links, branding and QR in one place." },
  { icon: BarChart3, title: "Conversion analytics", body: "Real funnel from page visits to Google review page clicks." },
  { icon: PenLine, title: "Custom branding", body: "Your logo, accent colour and customer-facing wording." },
  { icon: Link2, title: "Google review link", body: "Send customers straight to your Google review box." },
  { icon: Link2, title: "Instagram link", body: "Optional secondary CTA after the review is copied." },
];

function Home() {
  return (
    <MarketingPage>
      <section className="hero-gradient">
        <div className="container-page grid gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="size-3.5 text-accent" aria-hidden /> No paid AI. No fake reviews.
              No gating.
            </span>
            <h1 className="mt-5 text-4xl leading-tight font-semibold sm:text-5xl lg:text-6xl">
              Turn real customer experiences into better Google reviews.
            </h1>
            <p className="mt-5 text-lg text-muted-foreground">
              Customers scan your QR, answer a few quick questions, get an editable review draft, and
              continue to Google. They write it. They publish it. You just make it easy.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link to="/signup">Get Started</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/how-it-works">See How It Works</Link>
              </Button>
            </div>
            <ul className="mt-8 grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
              {[
                "Every customer gets the same Google CTA",
                "Works on any phone, no app needed",
                "Set up your business in minutes",
                "Analytics from real events only",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="size-4 text-success" aria-hidden /> {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="panel mx-auto w-full max-w-sm p-5">
            <div className="rounded-xl bg-surface-strong p-4 text-center text-primary-foreground">
              <p className="font-display text-sm opacity-80">reviewlift.app/r/your-business</p>
            </div>
            <div className="mt-5 space-y-4">
              <p className="text-sm font-semibold">What did you visit us for?</p>
              <div className="flex flex-wrap gap-2">
                {["Ceramic Coating", "PPF", "Alloy Wheels"].map((s, i) => (
                  <span
                    key={s}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      i === 0 ? "border-primary bg-primary/10 text-primary" : "border-border"
                    }`}
                  >
                    {s}
                  </span>
                ))}
              </div>
              <p className="text-sm font-semibold">Your review draft</p>
              <p className="rounded-lg border border-border bg-muted/40 p-3 text-sm leading-relaxed text-muted-foreground">
                “Recently visited Jangid Carwala for ceramic coating. I was happy with the overall
                quality of the work and especially liked the final finish. The team was helpful
                throughout the process. Overall, a good experience.”
              </p>
              <Button className="w-full">Copy &amp; Continue to Google</Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="container-page py-16">
          <h2 className="text-3xl font-semibold">How it works</h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => (
              <div key={step.title} className="panel p-5">
                <div className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <step.icon className="size-4.5" aria-hidden />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Step {index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-16">
        <h2 className="text-3xl font-semibold">Everything a local business needs</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Built as real multi-tenant software: one account per business, isolated data, and settings
          you control without touching code.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="panel p-5">
              <feature.icon className="size-5 text-primary" aria-hidden />
              <h3 className="mt-3 text-base font-semibold">{feature.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-20">
        <div className="panel hero-gradient flex flex-col items-start gap-6 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-semibold">Ready to make reviews effortless?</h2>
            <p className="mt-3 text-muted-foreground">
              Create your account, add your services, print your QR code. Your customers do the rest —
              honestly, in their own words.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild size="lg">
              <Link to="/signup">Get Started</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
