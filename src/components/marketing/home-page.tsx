import { Link } from "@tanstack/react-router";
import {
  Activity,
  Briefcase,
  Building2,
  Car,
  Dumbbell,
  Hotel,
  Languages,
  LayoutDashboard,
  PenLine,
  QrCode,
  Scissors,
  ShoppingBag,
  Stethoscope,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const STEPS = [
  {
    n: "01",
    title: "Create your business profile",
    body: "Add your business details and configure the review experience customers will see.",
  },
  {
    n: "02",
    title: "Generate your QR code",
    body: "Get a permanent QR for the counter, reception, packaging, or any customer touchpoint.",
  },
  {
    n: "03",
    title: "Let customers share their experience",
    body: "They choose a rating and describe what actually happened. No app and no account.",
  },
  {
    n: "04",
    title: "Help them find the right words",
    body: "An editable suggestion is composed from their answers, in English, Hindi, or Hinglish.",
  },
  {
    n: "05",
    title: "Continue to Google",
    body: "They review the text, change anything they want, and choose whether to publish it on Google.",
  },
  {
    n: "06",
    title: "Monitor activity",
    body: "Your dashboard records visits, drafts, copies, and Google review page clicks. It does not invent review counts.",
  },
];

const INDUSTRIES: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "Restaurants & Cafes", body: "A QR on the bill or table tent, so guests can share the meal before they leave.", icon: UtensilsCrossed },
  { title: "Salons & Spas", body: "A card at the mirror after the appointment, when the result is still fresh.", icon: Scissors },
  { title: "Clinics & Healthcare", body: "A quiet way for patients to describe a visit, without staff walking them through Google.", icon: Stethoscope },
  { title: "Gyms & Fitness", body: "A code at reception for members who just finished a session.", icon: Dumbbell },
  { title: "Retail Stores", body: "A counter card for shoppers who found what they came in for.", icon: ShoppingBag },
  { title: "Hotels & Hospitality", body: "A room card or checkout note for stays guests would otherwise forget to mention.", icon: Hotel },
  { title: "Automobile Services", body: "A code with the keys, after detailing, coating, or a service visit.", icon: Car },
  { title: "Professional Services", body: "A follow-up link for clients who are happy to recommend the work.", icon: Briefcase },
];

const FAQS: [string, string][] = [
  [
    "What is ReviewLift?",
    "ReviewLift helps a business make it easier for genuine customers to write a Google review. Customers scan a QR code, describe their experience, edit a suggested draft, and publish it themselves on Google.",
  ],
  [
    "How does ReviewLift work?",
    "You set up your business, services, and Google review link once. Customers open your permanent link, pick what they came in for, choose how the visit felt, and get a draft they can rewrite before continuing to Google.",
  ],
  [
    "Do customers need to download an app?",
    "No. The review page opens in the phone browser. Customers do not create a ReviewLift account.",
  ],
  [
    "Does ReviewLift post reviews automatically?",
    "No. ReviewLift never publishes a review. The customer copies or continues with their own text and submits it through Google.",
  ],
  [
    "Can customers edit the suggested review?",
    "Yes. The draft is fully editable. They can also ask for another draft. The suggestion is a starting point, not the review that gets posted.",
  ],
  [
    "Can customers leave negative feedback?",
    "Yes. Every customer sees the same path to Google. A weaker experience is not rewritten as praise, and unhappy customers are not hidden from the review button.",
  ],
  [
    "Does ReviewLift work with Google Business Profile?",
    "You add your own Google review link. ReviewLift sends the customer there. It is not a Google product, and it does not post through Google on your behalf.",
  ],
  [
    "Can I use ReviewLift for multiple locations?",
    "Each business gets its own profile, QR code, services, and activity. Early-access plan notes describe one business on Starter, up to three on Growth, and up to ten on Pro. Billing is not switched on yet, so those limits are assigned manually.",
  ],
  [
    "What languages are supported?",
    "English, Hindi, and Hinglish. Each business chooses which languages to offer. The phrase libraries are written separately so they do not read like a direct translation.",
  ],
  [
    "How much does ReviewLift cost?",
    "Online checkout is not live. Starter is shown as ₹0 during early access. Growth and Pro prices are not finalised. Create an account and a plan is assigned manually, or contact us if you need more than one business.",
  ],
];

const SERVICES = ["Filter coffee", "Breakfast", "Pastry"];

function draftFor(rating: number, service: string) {
  if (rating <= 2) {
    return `I visited The Daily Brew Café for ${service.toLowerCase()}. The experience did not meet what I expected, and I would have liked it to be better.`;
  }
  if (rating === 3) {
    return `I stopped by The Daily Brew Café for ${service.toLowerCase()}. It was an average visit overall — fine, with a few things that could be better.`;
  }
  return `I visited The Daily Brew Café for ${service.toLowerCase()}. I was happy with the visit and liked how it was served. A good experience.`;
}

export function HomePage() {
  const [activeStep, setActiveStep] = useState(0);
  const [demoStep, setDemoStep] = useState(0);
  const [rating, setRating] = useState<number | null>(null);
  const [service, setService] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  return (
    <>
      <section className="rl-wrap grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
        <div className="rl-rise max-w-xl">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#737373] uppercase">Google reviews, made simple</p>
          <h1 className="mt-4 text-[2.7rem] leading-[0.98] font-semibold sm:text-6xl lg:text-[4.4rem]">
            More customer reviews.
            <br />
            Less effort.
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-[#4d4d4d]">
            Make it easy for customers to share their experiences. With a simple QR code, editable review suggestions, and a clear dashboard, ReviewLift helps your business build its online reputation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="rl-btn rl-btn-primary">
              Get Started
            </Link>
            <a href="#journey" className="rl-btn rl-btn-ghost">
              See How It Works
            </a>
          </div>
          <p className="mt-6 text-sm text-[#737373]">Built for restaurants, salons, clinics, retail stores and growing businesses.</p>
        </div>

        <HeroVideo />
      </section>

      <section id="problem" className="scroll-mt-28 bg-[#101010] text-white">
        <div className="rl-wrap py-24 sm:py-32 lg:py-40">
          <p className="text-xs font-semibold tracking-[0.2em] text-[var(--brand-bright)] uppercase">01 / The problem</p>
          <h2 className="mt-6 max-w-5xl text-4xl leading-[1.02] font-semibold sm:text-6xl lg:text-7xl">
            Your best customers love your business. But most leave without writing a review.
          </h2>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/70">
            Customers are busy. Some forget. Others do not know what to write. Even after a great experience, leaving a Google review can feel like extra work.
          </p>
          <p className="mt-8 text-2xl font-medium tracking-tight sm:text-3xl">Great experiences deserve to be heard.</p>
        </div>
      </section>

      <section id="solution" className="scroll-mt-28 border-b border-[#E8E8E5]">
        <div className="rl-wrap py-20">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#737373] uppercase">02 / The solution</p>
          <h2 className="mt-4 max-w-3xl text-4xl leading-[1.05] font-semibold sm:text-6xl">
            One simple scan. A smoother way to get reviewed.
          </h2>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[#555]">
            ReviewLift makes sharing feedback easier. Customers scan your business QR code, describe their experience, get help drafting a review, and choose whether to share it on Google.
          </p>
          <div className="mt-12 grid gap-4 lg:grid-cols-3">
            {[
              ["01", "Scan a QR code", "One permanent link per business. Print it once. It still works when your services or wording change."],
              ["02", "Share the experience", "Customers pick the service and how the visit felt. Happy and unhappy customers follow the same path."],
              ["03", "Edit and post on Google", "They rewrite the suggestion if they want, then continue to your Google review link and publish it themselves."],
            ].map(([n, title, body]) => (
              <article key={n} className="flex min-h-64 flex-col justify-between rounded-[28px] bg-white p-6">
                <p className="text-sm font-semibold text-[var(--brand-primary)]">{n}</p>
                <div>
                  <h3 className="text-2xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[#555]">{body}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="journey" className="scroll-mt-28 bg-white">
        <div className="rl-wrap grid gap-10 py-20 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="text-4xl leading-[1.05] font-semibold sm:text-5xl">From a quick scan to a customer review.</h2>
            <p className="mt-4 text-[#555]">Six steps. The customer always decides what gets published.</p>
            <ol className="mt-8 space-y-2">
              {STEPS.map((step, index) => (
                <li key={step.n}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(index)}
                    className={`w-full rounded-2xl px-4 py-3 text-left transition-colors ${
                      activeStep === index ? "bg-[var(--brand-primary)] text-white" : "hover:bg-[var(--brand-light)]"
                    }`}
                  >
                    <span className="text-xs tracking-[0.14em] uppercase opacity-70">Step {step.n}</span>
                    <span className="mt-1 block text-base font-semibold">{step.title}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex min-h-[320px] items-end rounded-[32px] bg-[#FAFAF8] p-8 sm:p-12">
            <div>
              <p className="text-sm font-semibold tracking-[0.16em] text-[#737373] uppercase">Step {STEPS[activeStep]?.n}</p>
              <h3 className="mt-3 text-3xl font-semibold sm:text-4xl">{STEPS[activeStep]?.title}</h3>
              <p className="mt-4 max-w-md text-lg leading-relaxed text-[#444]">{STEPS[activeStep]?.body}</p>
            </div>
          </div>
        </div>
      </section>

      <section id="platform" className="scroll-mt-28">
        <div className="rl-wrap py-20">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#737373] uppercase">03 / The platform</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-6xl">Everything you need to make reviews easier.</h2>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
            <Feature className="lg:col-span-3" icon={QrCode} title="Smart QR codes" body="A permanent code customers can scan. The destination stays the same when you change services, logo, or links." />
            <Feature className="lg:col-span-3" icon={PenLine} title="Editable review suggestions" body="Drafts are composed from the customer's own answers. They can rewrite every word before anything is copied." />
            <Feature className="lg:col-span-2" icon={Languages} title="Multiple languages" body="English, Hindi, and Hinglish, each with its own phrasing. A business turns on the languages it wants." />
            <Feature className="lg:col-span-2" icon={LayoutDashboard} title="Business dashboard" body="Services, review wording, links, branding, and the QR live in one place for that business." />
            <Feature className="lg:col-span-2" icon={Activity} title="Review activity" body="Visits, sessions, generated drafts, copies, and Google review page clicks — only from recorded events." />
            <Feature className="lg:col-span-6" icon={Building2} title="More than one business" body="Each business has its own QR, services, and activity. This is separate businesses, not a shared branch map." />
          </div>
        </div>
      </section>

      <section className="bg-[#101010] text-white">
        <div className="rl-wrap grid items-center gap-8 py-12 lg:grid-cols-[1fr_auto] lg:py-14">
          <div>
            <h2 className="text-3xl font-semibold sm:text-4xl">Your reputation, in one clear view.</h2>
            <p className="mt-3 max-w-md text-base leading-relaxed text-white/70">
              See review activity, manage your QR code, configure the customer journey, and keep each business organized.
            </p>
          </div>
          <img
            src="/brand/gbp-performance.jpg"
            alt="Google Business Profile performance view, with visits and how people discovered the business"
            className="mx-auto w-full max-w-sm rounded-2xl bg-white"
          />
        </div>
      </section>

      <section id="industries" className="scroll-mt-28">
        <div className="rl-wrap py-20">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#737373] uppercase">Built for local businesses</p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold sm:text-6xl">Your business deserves to be discovered.</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {INDUSTRIES.map(({ title, body, icon: Icon }) => (
              <article key={title} className="rounded-[24px] bg-white p-5">
                <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--brand-light)] text-[var(--brand-primary)]">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#555]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#E8E8E5] bg-white">
        <div className="rl-wrap py-20">
          <h2 className="max-w-3xl text-4xl font-semibold sm:text-5xl">From asking for reviews to making it easy.</h2>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <Compare title="Without ReviewLift" items={["Customers forget to leave a review", "Staff keep explaining where to tap", "The review link is hard to find", "The journey is difficult to see"]} />
            <Compare title="With ReviewLift" items={["A QR code at the moment of the visit", "A short guided experience on the phone", "An editable suggestion in their words", "Activity in one business dashboard"]} accent />
          </div>
        </div>
      </section>

      <section id="demo" className="scroll-mt-28">
        <div className="rl-wrap grid gap-10 py-20 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-4xl font-semibold sm:text-5xl">See how easy it can be.</h2>
            <p className="mt-4 text-lg leading-relaxed text-[#555]">
              This walkthrough stays in your browser. It does not create a review session. To try the real page, open the Jangid Carwala demo.
            </p>
            <a href="/r/jangid-carwala" className="rl-btn rl-btn-dark mt-6">
              Open the live demo
            </a>
          </div>
          <Demo
            step={demoStep}
            rating={rating}
            service={service}
            draft={draft}
            onRate={(value) => {
              setRating(value);
              setDemoStep(1);
            }}
            onService={(value) => {
              setService(value);
              if (rating) setDraft(draftFor(rating, value));
              setDemoStep(2);
            }}
            onDraft={setDraft}
            onContinue={() => setDemoStep(3)}
            onReset={() => {
              setDemoStep(0);
              setRating(null);
              setService(null);
              setDraft("");
            }}
          />
        </div>
      </section>

      <section>
        <div className="rl-wrap py-8 pb-20">
          <div className="rounded-[32px] bg-[#111] px-6 py-12 text-white sm:px-10">
            <p className="text-xs font-semibold tracking-[0.18em] text-[var(--brand-bright)] uppercase">Simple pricing</p>
            <h2 className="mt-4 max-w-2xl text-4xl font-semibold sm:text-5xl">Start collecting customer feedback with confidence.</h2>
            <p className="mt-4 max-w-xl text-white/70">Checkout is not live. Starter is early access. Growth and Pro prices are still being finalised.</p>
            <Link to="/pricing" className="rl-btn rl-btn-primary mt-8">
              View pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-[#E8E8E5] bg-white">
        <div className="rl-wrap py-20">
          <h2 className="max-w-3xl text-4xl font-semibold sm:text-5xl">Built around the businesses customers trust.</h2>
          <p className="mt-4 max-w-2xl text-[#555]">Customer stories will sit here after a business approves them. Until then, these are the product rules, not claims about results.</p>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              ["The customer publishes", "ReviewLift drafts a suggestion. Google only receives what the customer chooses to post."],
              ["Same path for every rating", "There is no gate that hides the Google button from an unhappy customer."],
              ["Your data stays with your business", "Services, drafts, and activity are scoped to that business in the database."],
            ].map(([title, body]) => (
              <article key={title} className="rounded-[24px] bg-[#FAFAF8] p-6">
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#555]">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="faqs" className="scroll-mt-28">
        <div className="rl-wrap max-w-3xl py-20">
          <h2 className="text-4xl font-semibold sm:text-5xl">Questions, answered plainly.</h2>
          <Accordion type="single" collapsible className="mt-8">
            {FAQS.map(([question, answer]) => (
              <AccordionItem key={question} value={question} className="border-[#E8E8E5]">
                <AccordionTrigger className="text-base font-medium text-[#111] hover:no-underline">{question}</AccordionTrigger>
                <AccordionContent className="text-[#555]">{answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      <section className="pb-20">
        <div className="rl-wrap">
          <div className="overflow-hidden rounded-[36px] bg-[var(--brand-primary)] px-6 py-16 text-white sm:px-12 sm:py-20">
            <h2 className="max-w-3xl text-4xl leading-[1.02] font-semibold text-white sm:text-6xl">
              Great service deserves to be talked about.
            </h2>
            <p className="mt-5 max-w-xl text-lg text-white/90">Make it easier for customers to share their experiences and help your business build a stronger online reputation.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup" className="rl-btn rl-btn-on-brand">
                Get Started
              </Link>
              <Link to="/features" className="rl-btn rl-btn-ghost-light">
                Explore Features
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
    }
  }, []);

  return (
    <video
      ref={ref}
      className="aspect-video w-full rounded-[28px] border border-[#E8E8E5] bg-[#101010] object-cover shadow-[0_24px_60px_rgb(17_17_17/0.06)]"
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label="ReviewLift walkthrough"
    >
      <source src="/brand/reviewlift-hero.mp4" type="video/mp4" />
    </video>
  );
}

function Feature({ title, body, icon: Icon, className }: { title: string; body: string; icon: LucideIcon; className?: string }) {
  return (
    <article className={`rounded-[28px] bg-white p-6 ${className ?? ""}`}>
      <span className="inline-flex size-10 items-center justify-center rounded-2xl bg-[var(--brand-light)] text-[var(--brand-primary)]">
        <Icon className="size-5" aria-hidden />
      </span>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-[#555]">{body}</p>
    </article>
  );
}

function Compare({ title, items, accent = false }: { title: string; items: string[]; accent?: boolean }) {
  return (
    <article className={`rounded-[28px] p-6 ${accent ? "bg-[#101010] text-white" : "bg-[#FAFAF8]"}`}>
      <h3 className="text-xl font-semibold">{title}</h3>
      <ul className="mt-5 space-y-3 text-sm">
        {items.map((item) => (
          <li key={item} className="flex gap-3">
            <span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${accent ? "bg-[var(--brand-bright)]" : "bg-[#101010]"}`} />
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

function Demo({
  step,
  rating,
  service,
  draft,
  onRate,
  onService,
  onDraft,
  onContinue,
  onReset,
}: {
  step: number;
  rating: number | null;
  service: string | null;
  draft: string;
  onRate: (value: number) => void;
  onService: (value: string) => void;
  onDraft: (value: string) => void;
  onContinue: () => void;
  onReset: () => void;
}) {
  return (
    <div className="rounded-[28px] bg-white p-6">
      <p className="text-xs font-semibold tracking-[0.16em] text-[#737373] uppercase">The Daily Brew Café · local preview</p>
      {step === 0 ? (
        <div className="mt-6">
          <h3 className="text-2xl font-semibold">How was your visit?</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button key={value} type="button" onClick={() => onRate(value)} className="rl-btn rl-btn-ghost min-w-12">
                {value}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {step === 1 ? (
        <div className="mt-6">
          <h3 className="text-2xl font-semibold">What did you come in for?</h3>
          <p className="mt-2 text-sm text-[#737373]">Rating {rating} of 5. This preview does not save anything.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {SERVICES.map((item) => (
              <button key={item} type="button" onClick={() => onService(item)} className="rl-btn rl-btn-ghost">
                {item}
              </button>
            ))}
          </div>
        </div>
      ) : null}
      {step === 2 ? (
        <div className="mt-6">
          <h3 className="text-2xl font-semibold">Edit the suggestion</h3>
          <p className="mt-2 text-sm text-[#737373]">
            {service}. Change the words. Nothing is sent to Google from this preview.
          </p>
          <label className="mt-4 block text-sm font-medium" htmlFor="demo-draft">
            Your draft
          </label>
          <textarea
            id="demo-draft"
            value={draft}
            onChange={(event) => onDraft(event.target.value)}
            rows={5}
            className="mt-2 w-full rounded-2xl border border-[#E8E8E5] bg-[#FAFAF8] p-4 text-sm leading-relaxed"
          />
          <button type="button" onClick={onContinue} className="rl-btn rl-btn-primary mt-4">
            See the Google handoff
          </button>
        </div>
      ) : null}
      {step === 3 ? (
        <div className="mt-6">
          <h3 className="text-2xl font-semibold">The customer publishes on Google.</h3>
          <p className="mt-3 text-sm leading-relaxed text-[#555]">
            On a real review page, the customer copies this text and opens the business’s Google review link. ReviewLift does not submit the review, and this preview does not either.
          </p>
          <button type="button" onClick={onReset} className="rl-btn rl-btn-ghost mt-5">
            Start the preview again
          </button>
        </div>
      ) : null}
    </div>
  );
}
