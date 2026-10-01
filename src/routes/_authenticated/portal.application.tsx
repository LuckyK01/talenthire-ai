import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/hire/app-shell";
import { PortalBody } from "@/components/hire/portal-pages";

export const Route = createFileRoute("/_authenticated/portal/application")({
  head: () => ({
    meta: [
      { title: "My Application — HireFlow AI" },
      { name: "description", content: "Track your application stage and timeline." },
      { property: "og:title", content: "My Application — HireFlow AI" },
      { property: "og:description", content: "Track your application stage and timeline." },
    ],
  }),
  component: () => (
    <AppShell breadcrumbs={[{ label: "My Application" }]}>
      <PortalBody page="application" />
    </AppShell>
  ),
});
