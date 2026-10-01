import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/hire/app-shell";
import { PortalBody } from "@/components/hire/portal-pages";

export const Route = createFileRoute("/_authenticated/portal/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — HireFlow AI" },
      { name: "description", content: "Updates about your application." },
      { property: "og:title", content: "Notifications — HireFlow AI" },
      { property: "og:description", content: "Updates about your application." },
    ],
  }),
  component: () => (
    <AppShell breadcrumbs={[{ label: "Notifications" }]}>
      <PortalBody page="notifications" />
    </AppShell>
  ),
});
