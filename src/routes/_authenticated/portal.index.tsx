import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/hire/app-shell";
import { PortalBody } from "@/components/hire/portal-pages";

export const Route = createFileRoute("/_authenticated/portal/")({
  head: () => ({
    meta: [
      { title: "My Portal — HireFlow AI" },
      { name: "description", content: "Your application journey at a glance." },
      { property: "og:title", content: "My Portal — HireFlow AI" },
      { property: "og:description", content: "Your application journey at a glance." },
    ],
  }),
  component: () => (
    <AppShell breadcrumbs={[{ label: "My Portal" }]}>
      <PortalBody page="home" />
    </AppShell>
  ),
});
