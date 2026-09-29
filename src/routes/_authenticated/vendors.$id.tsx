import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/hire/app-shell";
import { EmptyState, fmtDate, LoadingRows, PageHeader, Panel, ScoreBadge, ScoreBar, StatusBadge, TrendArrow } from "@/components/hire/bits";
import { DataTable, Td } from "@/components/hire/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { applicationsQuery, candidatesQuery, vendorHistoryQuery, vendorPerformanceQuery, vendorQuery, vendorSkillsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/vendors/$id")({
  head: () => ({
    meta: [
      { title: "Vendor profile — HireFlow AI" },
      { name: "description", content: "Vendor skills, performance, candidates and score history." },
      { property: "og:title", content: "Vendor profile — HireFlow AI" },
      { property: "og:description", content: "Vendor skills, performance, candidates and score history." },
    ],
  }),
  component: VendorDetail,
});

function VendorDetail() {
  const { id } = Route.useParams();
  const vendor = useQuery(vendorQuery(id));
  const skills = useQuery(vendorSkillsQuery(id));
  const perf = useQuery(vendorPerformanceQuery(id));
  const hist = useQuery(vendorHistoryQuery(id));
  const cands = useQuery(candidatesQuery());
  const apps = useQuery(applicationsQuery());

  if (vendor.isLoading) return <AppShell><LoadingRows /></AppShell>;
  const v = vendor.data;
  if (!v) return <AppShell><EmptyState title="Vendor not found" /></AppShell>;
  const myCands = (cands.data ?? []).filter((c) => c.vendor_id === v.id);

  return (
    <AppShell breadcrumbs={[{ label: "Vendors", to: "/vendors" }, { label: v.vendor_name }]}>
      <PageHeader title={v.vendor_name} subtitle={`${v.specialisations.join(", ")} · ${v.locations.join(", ")}`} actions={<><StatusBadge status={v.status} /><ScoreBadge value={v.overall_score} /></>} />
      <Tabs defaultValue="skills">
        <TabsList>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="history">Score history</TabsTrigger>
        </TabsList>
        <TabsContent value="skills">
          <Panel>
            <DataTable head={["Skill", "Score", "Recent", "Historical", "Samples", "Trend"]}>
              {(skills.data ?? []).map((s) => (
                <tr key={s.id}><Td>{s.skill_id ? (s as unknown as { skill?: string }).skill ?? s.skill_id : "—"}</Td><Td><div className="w-28"><ScoreBar value={s.score} /></div></Td><Td>{s.recent_score ?? "—"}</Td><Td>{s.historical_score ?? "—"}</Td><Td>{s.sample_size < 3 ? <span className="text-amber">{s.sample_size} · Limited data</span> : s.sample_size}</Td><Td><TrendArrow trend={s.trend} /></Td></tr>
              ))}
            </DataTable>
          </Panel>
        </TabsContent>
        <TabsContent value="performance">
          <Panel>
            {(perf.data ?? []).length === 0 ? <EmptyState title="Limited historical data" description="No completed requirements yet for this vendor." /> : (
              <DataTable head={["Recorded", "Submitted", "Shortlisted", "Interviews", "Offers", "Hires"]}>
                {(perf.data ?? []).map((p) => (
                  <tr key={p.id}><Td>{fmtDate(p.recorded_at)}</Td><Td>{p.candidates_submitted}</Td><Td>{p.candidates_shortlisted}</Td><Td>{p.interviews}</Td><Td>{p.offers}</Td><Td>{p.hires}</Td></tr>
                ))}
              </DataTable>
            )}
          </Panel>
        </TabsContent>
        <TabsContent value="candidates">
          <Panel>
            <DataTable head={["Candidate", "Experience", "Status", "Match"]}>
              {myCands.map((c) => <tr key={c.id}><Td>{c.name}</Td><Td>{c.total_experience} yrs</Td><Td><StatusBadge status={c.status} /></Td><Td>{apps.data?.find((a) => a.candidate_id === c.id)?.match_score ?? "—"}</Td></tr>)}
            </DataTable>
          </Panel>
        </TabsContent>
        <TabsContent value="history">
          <Panel>
            <DataTable head={["When", "Previous", "New", "Reason"]}>
              {(hist.data ?? []).map((h) => <tr key={h.id}><Td>{fmtDate(h.created_at)}</Td><Td>{h.previous_score}</Td><Td>{h.new_score}</Td><Td className="text-xs text-muted-foreground">{h.reason}</Td></tr>)}
            </DataTable>
          </Panel>
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}
