import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/hire/app-shell";
import { PortalBody } from "@/components/hire/portal-pages";

export const Route = createFileRoute("/_authenticated/portal/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — HireFlow AI" },
      { name: "description", content: "Your onboarding checklist before day one." },
      { property: "og:title", content: "Onboarding — HireFlow AI" },
      { property: "og:description", content: "Your onboarding checklist before day one." },
    ],
  }),
  component: () => (
    <AppShell breadcrumbs={[{ label: "Onboarding" }]}>
      <PortalBody page="onboarding" />
    </AppShell>
  ),
});
