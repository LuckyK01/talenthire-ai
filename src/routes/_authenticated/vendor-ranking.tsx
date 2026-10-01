import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/hire/app-shell";
import { AiRecommendationCard, EmptyState, HumanBadge, LoadingRows, PageHeader, Panel, ScoreBadge, ScoreBar, StatusBadge, TrendArrow } from "@/components/hire/bits";
import { DataTable, Td } from "@/components/hire/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActor } from "@/hooks/useActor";
import * as api from "@/lib/api";
import { aiSettingsQuery, requirementsQuery, vendorInputsQuery } from "@/lib/queries";
import { rankVendors, recommendationLabel, sortOptions, sortVendors, type RankedVendor, type SortKey } from "@/lib/services/vendorRanking";

export const Route = createFileRoute("/_authenticated/vendor-ranking")({
  validateSearch: (s: Record<string, unknown>): { req?: string } => (typeof s["req"] === "string" ? { req: s["req"] } : {}),
  head: () => ({
    meta: [
      { title: "Vendor Ranking — HireFlow AI" },
      { name: "description", content: "Explainable AI ranking of staffing vendors for each requirement." },
      { property: "og:title", content: "Vendor Ranking — HireFlow AI" },
      { property: "og:description", content: "Explainable AI ranking of staffing vendors for each requirement." },
    ],
  }),
  component: VendorRankingPage,
});

function VendorRankingPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const reqs = useQuery(requirementsQuery());
  const inputs = useQuery(vendorInputsQuery());
  const settings = useQuery(aiSettingsQuery());
  const { actor, run } = useActor();
  const [sort, setSort] = useState<SortKey>("OVERALL");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [compare, setCompare] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [sourcingFor, setSourcingFor] = useState<RankedVendor[] | null>(null);
  const [count, setCount] = useState(5);

  const reqId = search.req ?? reqs.data?.find((r) => r.requirement_id === "REQ-2091")?.id ?? reqs.data?.[0]?.id;
  const requirement = reqs.data?.find((r) => r.id === reqId);

  const ranked = useMemo(() => {
    if (!requirement || !inputs.data || !settings.data) return [];
    const list = rankVendors(inputs.data, requirement, settings.data);
    const f = q.trim().toLowerCase();
    return sortVendors(f ? list.filter((v) => v.vendor.vendor_name.toLowerCase().includes(f)) : list, sort);
  }, [requirement, inputs.data, settings.data, sort, q]);

  const loading = reqs.isLoading || inputs.isLoading || settings.isLoading;
  const compared = ranked.filter((r) => compare.includes(r.vendor.id));

  return (
    <AppShell breadcrumbs={[{ label: "Vendor Ranking" }]}>
      <PageHeader
        title="Vendor Ranking"
        subtitle="AI ranks vendors using configurable weights and recency-weighted history. You choose who to engage."
        actions={<HumanBadge />}
      />
      <Panel className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={reqId ?? ""} onValueChange={(v) => navigate({ to: "/vendor-ranking", search: { req: v } })}>
            <SelectTrigger className="w-80"><SelectValue placeholder="Select requirement" /></SelectTrigger>
            <SelectContent>
              {(reqs.data ?? []).map((r) => <SelectItem key={r.id} value={r.id}>{r.requirement_id} · {r.position_title}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>{sortOptions.map((o) => <SelectItem key={o.key} value={o.key}>{o.label}</SelectItem>)}</SelectContent>
          </Select>
          <Input placeholder="Filter vendors…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" disabled={compare.length < 2} onClick={() => setShowCompare(true)}>Compare ({compare.length})</Button>
            <Button size="sm" disabled={compare.length === 0} onClick={() => setSourcingFor(compared)}>Request sourcing</Button>
          </div>
        </div>
        {requirement && <p className="mt-3 text-xs text-muted-foreground">Required: {requirement.required_skills.join(", ")} · {requirement.location}</p>}
      </Panel>

      {loading ? <LoadingRows /> : ranked.length === 0 ? <EmptyState title="No vendors to rank" /> : (
        <Panel>
          <DataTable head={["", "Rank", "Vendor", "Overall", "Skill fit", "Quality", "Recent vs hist.", "Shortlist", "Interview", "Hire", "Trend", "AI view", ""]}>
            {ranked.map((r) => (
              <>
                <tr key={r.vendor.id}>
                  <Td><Checkbox checked={compare.includes(r.vendor.id)} onCheckedChange={(c) => setCompare((p) => (c ? [...p, r.vendor.id] : p.filter((x) => x !== r.vendor.id)))} /></Td>
                  <Td className="font-mono">#{r.rank}</Td>
                  <Td><Link to="/vendors/$id" params={{ id: r.vendor.id }} className="font-medium hover:underline">{r.vendor.vendor_name}</Link>{r.limitedHistory && <p className="text-xs text-amber">Limited historical data</p>}</Td>
                  <Td><ScoreBadge value={r.overallScore} /></Td>
                  <Td><div className="w-20"><ScoreBar value={r.components.find((c) => c.key === "skillFit")?.value ?? 0} /></div></Td>
                  <Td>{r.limitedHistory ? "—" : `${Math.round(r.candidateQuality)}%`}</Td>
                  <Td className="text-xs">{r.limitedHistory ? "—" : `${Math.round(r.recentPerformance)} / ${Math.round(r.historicalPerformance)}`}</Td>
                  <Td>{r.limitedHistory ? "—" : `${Math.round(r.shortlistRate)}%`}</Td>
                  <Td>{r.limitedHistory ? "—" : `${Math.round(r.interviewRate)}%`}</Td>
                  <Td>{r.limitedHistory ? "—" : `${Math.round(r.hiringRate)}%`}</Td>
                  <Td><TrendArrow trend={r.trend} /></Td>
                  <Td className="text-xs">{recommendationLabel[r.aiRecommendation]}</Td>
                  <Td><Button variant="ghost" size="sm" onClick={() => setOpen(open === r.vendor.id ? null : r.vendor.id)}>Why?</Button></Td>
                </tr>
                {open === r.vendor.id && (
                  <tr key={`${r.vendor.id}-x`}><td colSpan={13} className="p-3">
                    <AiRecommendationCard
                      recommendation={recommendationLabel[r.aiRecommendation]}
                      score={r.overallScore}
                      confidence={r.confidence}
                      explanation={r.explanation}
                      factors={r.components.map((c) => ({ label: `${c.label} (${c.weight}%)`, value: `${Math.round(c.value)} → +${c.contribution.toFixed(1)}` }))}
                    />
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" disabled={!requirement} onClick={() => requirement && run(() => api.selectVendorForRequirement({ vendorId: r.vendor.id, vendorName: r.vendor.vendor_name, requirement, score: r.overallScore, explanation: r.explanation, confidence: r.confidence, actor }), "Sent for approval")}>Select vendor (needs approval)</Button>
                      <Button size="sm" variant="outline" onClick={() => setSourcingFor([r])}>Request sourcing</Button>
                    </div>
                  </td></tr>
                )}
              </>
            ))}
          </DataTable>
        </Panel>
      )}

      <Dialog open={showCompare} onOpenChange={setShowCompare}>
        <DialogContent className="max-w-3xl">
          <DialogHeader><DialogTitle>Compare vendors</DialogTitle></DialogHeader>
          <DataTable head={["Metric", ...compared.map((c) => c.vendor.vendor_name)]}>
            {[
              ["Overall", (r: RankedVendor) => `${r.overallScore}`],
              ["Candidate quality", (r: RankedVendor) => (r.limitedHistory ? "Limited data" : `${Math.round(r.candidateQuality)}%`)],
              ["Recent performance", (r: RankedVendor) => (r.limitedHistory ? "Limited data" : `${Math.round(r.recentPerformance)}`)],
              ["Shortlist rate", (r: RankedVendor) => (r.limitedHistory ? "Limited data" : `${Math.round(r.shortlistRate)}%`)],
              ["Hiring rate", (r: RankedVendor) => (r.limitedHistory ? "Limited data" : `${Math.round(r.hiringRate)}%`)],
              ["Confidence", (r: RankedVendor) => `${Math.round(r.confidence * 100)}%`],
            ].map(([label, fn]) => (
              <tr key={label as string}><Td>{label as string}</Td>{compared.map((c) => <Td key={c.vendor.id}>{(fn as (r: RankedVendor) => string)(c)}</Td>)}</tr>
            ))}
          </DataTable>
          <p className="text-xs text-muted-foreground">Simulated AI summary: {compared[0]?.vendor.vendor_name} leads on overall score. Final choice is yours.</p>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sourcingFor} onOpenChange={(o) => !o && setSourcingFor(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request candidate sourcing</DialogTitle></DialogHeader>
          <p className="text-sm">{sourcingFor?.map((s) => s.vendor.vendor_name).join(", ")}</p>
          <label className="text-sm">Candidates per vendor <Input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} /></label>
          <Button disabled={!requirement} onClick={async () => {
            if (!requirement || !sourcingFor) return;
            await run(() => api.requestSourcing({ vendorIds: sourcingFor.map((s) => s.vendor.id), requirement, candidates_requested: count, deadline: null, notes: "", actor }), "Sourcing requested");
            setSourcingFor(null);
          }}>Send request</Button>
          <StatusBadge status="HUMAN_APPROVED" />
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
