import { createFileRoute } from "@tanstack/react-router";

import { AppShell } from "@/components/hire/app-shell";
import { PortalBody } from "@/components/hire/portal-pages";

export const Route = createFileRoute("/_authenticated/portal/offer")({
  head: () => ({
    meta: [
      { title: "My Offer — HireFlow AI" },
      { name: "description", content: "Review and respond to your offer." },
      { property: "og:title", content: "My Offer — HireFlow AI" },
      { property: "og:description", content: "Review and respond to your offer." },
    ],
  }),
  component: () => (
    <AppShell breadcrumbs={[{ label: "My Offer" }]}>
      <PortalBody page="offer" />
    </AppShell>
  ),
});
