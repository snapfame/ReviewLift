import { createFileRoute, Link } from "@tanstack/react-router";

import { MarketingPage, PageIntro } from "@/components/marketing/site-chrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — ReviewLift" },
      {
        name: "description",
        content:
          "ReviewLift helps local businesses make it easier for genuine customers to write and publish their own Google reviews.",
      },
      { property: "og:title", content: "About ReviewLift" },
      {
        property: "og:description",
        content: "A review page, a permanent QR code, and a dashboard. The customer still publishes the review.",
      },
    ],
  }),
  component: About,
});

function About() {
  return (
    <MarketingPage>
      <PageIntro eyebrow="Company" title="Reviews should be easy to finish, and still be the customer's.">
        ReviewLift is built for local businesses that already earn good experiences and lose them because asking for a Google review takes too many steps.
      </PageIntro>
      <div className="rl-wrap max-w-3xl space-y-5 py-14 text-base leading-relaxed text-[#444]">
        <p>
          The product gives each business a permanent QR code, a short phone flow, and an editable suggestion composed from what the customer actually selects. The customer posts on Google. ReviewLift does not.
        </p>
        <p>
          We do not hide the Google step from a poor rating, and we do not invent ratings, review counts, or customer stories on this site.
        </p>
        <p>The company is based in Mandsaur, Madhya Pradesh.</p>
        <Link to="/contact" className="rl-btn rl-btn-primary mt-4">
          Contact
        </Link>
      </div>
    </MarketingPage>
  );
}
