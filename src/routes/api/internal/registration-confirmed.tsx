import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/internal/registration-confirmed")({
  server: {
    handlers: {
      GET: async () => new Response("Not found", { status: 404 }),
      POST: async ({ request }) => {
        const { handleRegistrationConfirmed } = await import("@/lib/registration-email.server");
        return handleRegistrationConfirmed(request);
      },
    },
  },
});
