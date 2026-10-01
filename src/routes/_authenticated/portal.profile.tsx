import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/hire/app-shell";
import { PortalBody } from "@/components/hire/portal-pages";

export const Route = createFileRoute("/_authenticated/portal/profile")({
  head: () => ({
    meta: [
      { title: "Profile — HireFlow AI" },
      { name: "description", content: "Your candidate profile details." },
      { property: "og:title", content: "Profile — HireFlow AI" },
      { property: "og:description", content: "Your candidate profile details." },
    ],
  }),
  component: () => (
    <AppShell breadcrumbs={[{ label: "Profile" }]}>
      <PortalBody page="profile" />
    </AppShell>
  ),
});
