import { createFileRoute } from "@tanstack/react-router";

import { DashboardShell } from "@/components/dashboard/app-shell";

export const Route = createFileRoute("/dashboard")({
  component: DashboardShell,
});
