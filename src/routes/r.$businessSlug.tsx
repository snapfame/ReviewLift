import { createFileRoute } from "@tanstack/react-router";

import { ReviewFlow } from "@/components/review/review-flow";

export const Route = createFileRoute("/r/$businessSlug")({
  validateSearch: (search: Record<string, unknown>) => {
    if (typeof search["src"] === "string") return { src: search["src"] };
    return {};
  },
  head: ({ params }) => ({
    meta: [
      { title: `Share your experience — ${params.businessSlug}` },
      {
        name: "description",
        content: "Answer a few quick questions and get an editable review draft to post on Google.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PublicReviewPage,
});

function PublicReviewPage() {
  const { businessSlug } = Route.useParams();
  const search = Route.useSearch();
  return <ReviewFlow slug={businessSlug} fromQr={search.src === "qr"} />;
}
