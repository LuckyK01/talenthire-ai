import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/hire/app-shell";
import { KpiCard, PageHeader, Panel, ScoreBar, SectionTitle } from "@/components/hire/bits";
import { applicationsQuery, offersQuery, requirementsQuery, vendorsQuery } from "@/lib/queries";
import { CANDIDATE_STATES } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — HireFlow AI" },
      { name: "description", content: "Hiring funnel, vendor scores and offer outcomes." },
      { property: "og:title", content: "Reports — HireFlow AI" },
      { property: "og:description", content: "Hiring funnel, vendor scores and offer outcomes." },
    ],
  }),
  component: Reports,
});

function Reports() {
  const apps = useQuery(applicationsQuery()).data ?? [];
  const reqs = useQuery(requirementsQuery()).data ?? [];
  const offers = useQuery(offersQuery()).data ?? [];
  const vendors = useQuery(vendorsQuery()).data ?? [];
  const max = Math.max(1, ...CANDIDATE_STATES.map((s) => apps.filter((a) => a.stage === s).length));
  return (
    <AppShell breadcrumbs={[{ label: "Reports" }]}>
      <PageHeader title="Reports" subtitle="Live numbers from the demo data." />
      <div className="mb-5 grid gap-4 sm:grid-cols-4">
        <KpiCard label="Open requirements" value={reqs.filter((r) => r.status !== "COMPLETED").length} />
        <KpiCard label="Applications" value={apps.length} />
        <KpiCard label="Offers" value={offers.length} />
        <KpiCard label="Accepted" value={offers.filter((o) => o.status === "ACCEPTED").length} tone="good" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionTitle>Candidate funnel</SectionTitle>
          <div className="mt-3 space-y-2">{CANDIDATE_STATES.map((s) => { const n = apps.filter((a) => a.stage === s).length; return (
            <div key={s} className="flex items-center gap-3 text-sm"><span className="w-40 text-xs">{s.replace(/_/g, " ")}</span><div className="flex-1"><ScoreBar value={(n / max) * 100} /></div><span className="w-6 font-mono">{n}</span></div>); })}</div>
        </Panel>
        <Panel>
          <SectionTitle>Vendor scores</SectionTitle>
          <div className="mt-3 space-y-2">{vendors.map((v) => (
            <div key={v.id} className="flex items-center gap-3 text-sm"><span className="w-44">{v.vendor_name}</span><div className="flex-1"><ScoreBar value={v.overall_score} /></div><span className="w-8 font-mono">{v.overall_score}</span></div>))}</div>
        </Panel>
      </div>
    </AppShell>
  );
}
