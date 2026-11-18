import { createFileRoute, Link } from "@tanstack/react-router";

import { MarketingPage, PageIntro } from "@/components/marketing/site-chrome";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — ReviewLift" },
      {
        name: "description",
        content:
          "Customers scan a QR, describe the visit, edit a draft, and post on Google themselves. You set the page up once.",
      },
      { property: "og:title", content: "How ReviewLift works" },
      {
        property: "og:description",
        content: "The customer journey and the one-time business setup.",
      },
    ],
  }),
  component: HowItWorks,
});

const CUSTOMER = [
  ["Scan the QR", "It opens a permanent link such as /r/your-business. No app and no login."],
  ["Choose services", "Only the services that business has turned on, grouped by category."],
  ["Describe the experience", "Excellent, Good, Average, or Not Good, plus what stood out."],
  ["Edit the draft", "The suggestion is composed from those answers, in the language they pick."],
  ["Continue to Google", "They copy the text and publish it on Google themselves."],
];

const OWNER = [
  ["Create your account", "Email and password, then a short onboarding flow."],
  ["Add services", "The categories and services customers will actually see."],
  ["Set the experience", "Headlines, languages, draft length, and standout attributes."],
  ["Place the QR", "Download PNG or SVG and put it where the visit ends."],
  ["Watch the activity", "Visits, sessions, drafts, copies, and Google review page clicks."],
];

function HowItWorks() {
  return (
    <MarketingPage>
      <PageIntro eyebrow="The journey" title="From a scan to a review the customer posts.">
        Two sides: what a customer does on their phone, and what you set up once.
      </PageIntro>
      <div className="rl-wrap grid gap-12 py-14 lg:grid-cols-2">
        <StepList title="For the customer" steps={CUSTOMER} />
        <StepList title="For the business" steps={OWNER} />
      </div>
      <section className="border-t border-[#E8E8E5] bg-white">
        <div className="rl-wrap py-14">
          <h2 className="text-3xl font-semibold">How a draft is written</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {[
              ["Pieces, not one template", "The opening, the service, the experience, attributes, the customer's note, and a closing are assembled for that visit."],
              ["Another draft reads differently", "A regenerate changes structure, not just a couple of synonyms."],
              ["The rating sets the tone", "Average stays balanced. Not Good stays dissatisfied."],
              ["Composed in the product", "This flow does not call a paid AI provider."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-[24px] bg-[#FAFAF8] p-6">
                <h3 className="font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#555]">{body}</p>
              </article>
            ))}
          </div>
          <Link to="/signup" className="rl-btn rl-btn-primary mt-8">
            Get Started
          </Link>
        </div>
      </section>
    </MarketingPage>
  );
}

function StepList({ title, steps }: { title: string; steps: string[][] }) {
  return (
    <section>
      <h2 className="text-2xl font-semibold">{title}</h2>
      <ol className="mt-5 space-y-3">
        {steps.map(([name, body], index) => (
          <li key={name} className="flex gap-4 rounded-[24px] bg-white p-5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary)] text-sm font-semibold text-white">
              {index + 1}
            </span>
            <div>
              <h3 className="font-semibold">{name}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#555]">{body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
