import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/hire/app-shell";
import { EmptyState, fmtDate, HumanBadge, LoadingRows, PageHeader, Panel, StatusBadge } from "@/components/hire/bits";
import { DataTable, Td } from "@/components/hire/table";
import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import * as api from "@/lib/api";
import { candidatesQuery, offersQuery } from "@/lib/queries";
import { offerTransitions, type OfferStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/offers")({
  head: () => ({
    meta: [
      { title: "Offers — HireFlow AI" },
      { name: "description", content: "Offer drafts, approvals and candidate responses." },
      { property: "og:title", content: "Offers — HireFlow AI" },
      { property: "og:description", content: "Offer drafts, approvals and candidate responses." },
    ],
  }),
  component: OffersPage,
});

function OffersPage() {
  const offers = useQuery(offersQuery());
  const cands = useQuery(candidatesQuery());
  const { actor, run } = useActor();

  return (
    <AppShell breadcrumbs={[{ label: "Offers" }]}>
      <PageHeader title="Offers" subtitle="AI drafts offers; a human approves and sends every one." actions={<HumanBadge />} />
      <Panel>
        {offers.isLoading ? <LoadingRows /> : (offers.data ?? []).length === 0 ? <EmptyState title="No offers yet" /> : (
          <DataTable head={["Candidate", "Position", "Compensation", "Start", "Status", "Actions"]}>
            {(offers.data ?? []).map((o) => {
              const c = cands.data?.find((x) => x.id === o.candidate_id);
              const next = (offerTransitions[o.status as OfferStatus] ?? []).filter((s) => s !== "ACCEPTED" && s !== "CLARIFICATION_REQUESTED");
              return (
                <tr key={o.id}>
                  <Td>{c?.name}</Td><Td>{o.position_title}</Td><Td>{o.compensation_band}</Td><Td>{fmtDate(o.start_date)}</Td>
                  <Td><StatusBadge status={o.status} />{o.clarification_note && <p className="mt-1 text-xs text-amber">{o.clarification_note}</p>}</Td>
                  <Td><div className="flex flex-wrap gap-1">{next.map((s) => (
                    <Button key={s} size="sm" variant={s === "REJECTED" ? "ghost" : "outline"} onClick={() => run(() => api.updateOfferStatus({ offer: o, status: s, actor, candidateUserId: c?.user_id ?? null, candidateName: c?.name }), `Offer ${s.toLowerCase()}`)}>
                      {s === "PENDING_APPROVAL" ? "Submit for approval" : s === "APPROVED" ? "Approve" : s === "SENT" ? "Send to candidate" : "Reject"}
                    </Button>
                  ))}</div></Td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </Panel>
    </AppShell>
  );
}
