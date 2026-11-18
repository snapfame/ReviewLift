import { createFileRoute, Link } from "@tanstack/react-router";

import { MarketingPage, PageIntro } from "@/components/marketing/site-chrome";

export const Route = createFileRoute("/features")({
  head: () => ({
    meta: [
      { title: "Features — ReviewLift" },
      {
        name: "description",
        content:
          "Permanent QR codes, editable review drafts in English, Hindi and Hinglish, equal Google access, and activity from real events.",
      },
      { property: "og:title", content: "Features — ReviewLift" },
      {
        property: "og:description",
        content: "What ReviewLift includes for businesses collecting honest Google reviews.",
      },
    ],
  }),
  component: FeaturesPage,
});

const GROUPS = [
  {
    title: "For your customers",
    items: [
      ["A short phone flow", "Service, experience, then an editable draft. No app and no account."],
      ["English, Hindi, Hinglish", "Separate phrase libraries, offered only when the business turns them on."],
      ["Fully editable draft", "The customer can rewrite anything, or ask for another draft."],
      ["Equal Google access", "Every customer sees the same Google step, including a weaker experience."],
    ],
  },
  {
    title: "For your business",
    items: [
      ["Permanent QR code", "Download PNG or SVG. The link stays put when services or branding change."],
      ["Services you control", "Categories, names, order, and which services are active."],
      ["Review experience", "Headlines, languages, length, attributes, and the wording of the call to action."],
      ["Links you can check", "Google review, Instagram, and website links, with a way to test them."],
      ["Branding", "Your logo and accent colour on the customer page."],
      ["Recorded activity", "Visits, sessions, drafts, copies, and Google review page clicks. No estimated review totals."],
    ],
  },
  {
    title: "How drafts stay honest",
    items: [
      ["Composed, not invented", "Openings, the service, the experience, and the customer's note are assembled into a suggestion."],
      ["Tone follows the rating", "An average visit stays balanced. A poor visit stays dissatisfied."],
      ["Duplicate checks", "Exact and near-duplicate drafts are checked per business."],
      ["No paid model", "Drafts are composed in the product. There is no external AI provider in this flow."],
    ],
  },
];

function FeaturesPage() {
  return (
    <MarketingPage>
      <PageIntro eyebrow="The platform" title="Everything that makes the review easier.">
        ReviewLift does not write a review on a customer's behalf, does not publish to Google, and does not hide the Google step from an unhappy customer.
      </PageIntro>
      <div className="rl-wrap space-y-14 py-14">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="text-3xl font-semibold">{group.title}</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {group.items.map(([title, body]) => (
                <article key={title} className="rounded-[24px] bg-white p-6">
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#555]">{body}</p>
                </article>
              ))}
            </div>
          </section>
        ))}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-[#111] p-8 text-white">
          <p className="text-xl font-medium">Set up the page your customers will actually finish.</p>
          <Link to="/signup" className="rl-btn rl-btn-primary">
            Get Started
          </Link>
        </div>
      </div>
    </MarketingPage>
  );
}
