import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/hire/app-shell";
import { PortalBody } from "@/components/hire/portal-pages";

export const Route = createFileRoute("/_authenticated/portal/interview")({
  head: () => ({
    meta: [
      { title: "My Interview — HireFlow AI" },
      { name: "description", content: "Your interview schedule and meeting links." },
      { property: "og:title", content: "My Interview — HireFlow AI" },
      { property: "og:description", content: "Your interview schedule and meeting links." },
    ],
  }),
  component: () => (
    <AppShell breadcrumbs={[{ label: "My Interview" }]}>
      <PortalBody page="interview" />
    </AppShell>
  ),
});
