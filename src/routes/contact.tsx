import { createFileRoute } from "@tanstack/react-router";

import { MarketingPage, PageIntro } from "@/components/marketing/site-chrome";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact — ReviewLift" },
      {
        name: "description",
        content: "Talk to ReviewLift about onboarding a business, plans, or support.",
      },
      { property: "og:title", content: "Contact ReviewLift" },
      { property: "og:description", content: "Email or call about onboarding and early-access plans." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <MarketingPage>
      <PageIntro eyebrow="Company" title="Tell us about the business.">
        Early access is onboarded personally. Write or call, and we will help get the QR page ready.
      </PageIntro>
      <div className="rl-wrap grid gap-4 py-14 sm:grid-cols-3">
        <a href="mailto:hello@reviewlift.app" className="rounded-[24px] bg-white p-6">
          <h2 className="font-semibold">Email</h2>
          <p className="mt-2 text-sm text-[#555]">hello@reviewlift.app</p>
        </a>
        <a href="tel:+917987310828" className="rounded-[24px] bg-white p-6">
          <h2 className="font-semibold">Phone</h2>
          <p className="mt-2 text-sm text-[#555]">+91 79873 10828</p>
        </a>
        <div className="rounded-[24px] bg-white p-6">
          <h2 className="font-semibold">Based in</h2>
          <p className="mt-2 text-sm text-[#555]">Mandsaur, Madhya Pradesh, India</p>
        </div>
      </div>
    </MarketingPage>
  );
}
