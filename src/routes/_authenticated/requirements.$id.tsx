import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/hire/app-shell";
import { AiRecommendationCard, EmptyState, fmtDate, LoadingRows, PageHeader, Panel, SectionTitle, StatusBadge } from "@/components/hire/bits";
import { DataTable, Td } from "@/components/hire/table";
import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import * as api from "@/lib/api";
import { applicationsQuery, candidatesQuery, requirementQuery, sourcingQuery, vendorsQuery } from "@/lib/queries";
import { requirementTransitions, type RequirementStatus } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/requirements/$id")({
  head: () => ({
    meta: [
      { title: "Requirement — HireFlow AI" },
      { name: "description", content: "Requirement detail, contract validation, sourcing and candidate pipeline." },
      { property: "og:title", content: "Requirement — HireFlow AI" },
      { property: "og:description", content: "Requirement detail, contract validation, sourcing and pipeline." },
    ],
  }),
  component: RequirementDetail,
});

function RequirementDetail() {
  const { id } = Route.useParams();
  const req = useQuery(requirementQuery(id));
  const apps = useQuery(applicationsQuery());
  const cands = useQuery(candidatesQuery());
  const sourcing = useQuery(sourcingQuery());
  const vendors = useQuery(vendorsQuery());
  const { actor, run, role } = useActor();

  if (req.isLoading) return <AppShell><LoadingRows /></AppShell>;
  const r = req.data;
  if (!r) return <AppShell><EmptyState title="Requirement not found" /></AppShell>;

  const findings = Array.isArray(r.contract_findings) ? (r.contract_findings as { label?: string; value?: string; issue?: string }[]) : [];
  const next = requirementTransitions[r.status as RequirementStatus] ?? [];
  const myApps = (apps.data ?? []).filter((a) => a.requirement_id === r.id);
  const candName = (cid: string) => cands.data?.find((c) => c.id === cid)?.name ?? "—";
  const vendorName = (vid: string | null) => vendors.data?.find((v) => v.id === vid)?.vendor_name ?? "—";
  const isHr = role === "HR_ADMIN";

  return (
    <AppShell breadcrumbs={[{ label: "Requirements", to: "/requirements" }, { label: r.requirement_id }]}>
      <PageHeader
        title={`${r.requirement_id} · ${r.position_title}`}
        subtitle={`${r.department ?? ""} · ${r.location ?? ""} · ${r.experience_level ?? ""} · ${r.number_of_openings} opening(s)`}
        actions={
          <>
            <StatusBadge status={r.status} />
            {isHr && (
              <Button asChild size="sm">
                <Link to="/vendor-ranking" search={{ req: r.id }}>Rank vendors</Link>
              </Button>
            )}
          </>
        }
      />
      <div className="grid gap-5 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <SectionTitle>Job details</SectionTitle>
          <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{r.job_description || "No description."}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {r.required_skills.map((s) => <span key={s} className="rounded-full border px-2 py-0.5 text-xs">{s}</span>)}
            {r.preferred_skills.map((s) => <span key={s} className="rounded-full border border-dashed px-2 py-0.5 text-xs text-muted-foreground">{s} (preferred)</span>)}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Hiring manager: {r.hiring_manager_name ?? "—"} · Priority {r.priority} · Timeline {r.target_hiring_timeline ?? "—"}</p>
        </Panel>
        <Panel>
          <SectionTitle hint="Mock AI — simulated">Contract validation</SectionTitle>
          <div className="mt-2"><StatusBadge status={r.contract_status} /></div>
          <AiRecommendationCard
            className="mt-3"
            recommendation={r.contract_status === "FLAGGED" ? "Needs human review" : "Contract looks complete"}
            explanation={r.contract_status === "FLAGGED" ? "Simulated AI found issues in the contract. A human must approve, reject or request correction." : "No blocking issues found by the simulated check."}
            factors={findings.map((f, i) => ({ label: f.label ?? `Finding ${i + 1}`, value: f.value ?? f.issue ?? "" }))}
          />
          {isHr && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => run(() => api.setContractDecision(r, "APPROVED", actor), "Contract approved")}>Approve</Button>
              <Button size="sm" variant="outline" onClick={() => run(() => api.setContractDecision(r, "CORRECTION_REQUESTED", actor), "Correction requested")}>Request correction</Button>
              <Button size="sm" variant="ghost" onClick={() => run(() => api.setContractDecision(r, "REJECTED", actor), "Contract rejected")}>Reject</Button>
            </div>
          )}
        </Panel>
      </div>

      {isHr && next.length > 0 && (
        <Panel className="mt-5">
          <SectionTitle hint="Only allowed transitions are offered">Move requirement</SectionTitle>
          <div className="mt-3 flex flex-wrap gap-2">
            {next.map((s) => (
              <Button key={s} size="sm" variant="outline" onClick={() => run(() => api.setRequirementStatus(r, s, actor), `Moved to ${s}`)}>
                → {s.replace(/_/g, " ")}
              </Button>
            ))}
          </div>
        </Panel>
      )}

      <Panel className="mt-5">
        <SectionTitle>Sourcing requests</SectionTitle>
        {(sourcing.data ?? []).filter((s) => s.requirement_id === r.id).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No sourcing requested yet.</p>
        ) : (
          <DataTable head={["Vendor", "Requested", "Deadline", "Status"]}>
            {(sourcing.data ?? []).filter((s) => s.requirement_id === r.id).map((s) => (
              <tr key={s.id}><Td>{vendorName(s.vendor_id)}</Td><Td>{s.candidates_requested}</Td><Td>{fmtDate(s.deadline)}</Td><Td><StatusBadge status={s.status} /></Td></tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Panel className="mt-5">
        <SectionTitle>Candidate pipeline</SectionTitle>
        <DataTable head={["Application", "Candidate", "Vendor", "Match", "Stage"]}>
          {myApps.map((a) => (
            <tr key={a.id}><Td className="font-mono text-xs">{a.application_id}</Td><Td>{candName(a.candidate_id)}</Td><Td>{vendorName(a.vendor_id)}</Td><Td>{a.match_score != null ? `${a.match_score}%` : "—"}</Td><Td><StatusBadge status={a.stage} /></Td></tr>
          ))}
        </DataTable>
      </Panel>
    </AppShell>
  );
}
