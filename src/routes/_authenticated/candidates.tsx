import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/hire/app-shell";
import { AiRecommendationCard, HumanBadge, LoadingRows, PageHeader, Panel, ScoreBadge, StatusBadge } from "@/components/hire/bits";
import { DataTable, Td } from "@/components/hire/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import * as api from "@/lib/api";
import { applicationsQuery, candidateScoresQuery, candidatesQuery, requirementsQuery, vendorsQuery } from "@/lib/queries";
import { screeningLabel } from "@/lib/services/candidateScreening";

export const Route = createFileRoute("/_authenticated/candidates")({
  head: () => ({
    meta: [
      { title: "Candidates — HireFlow AI" },
      { name: "description", content: "Candidate pipeline, AI screening scores and recruiter review." },
      { property: "og:title", content: "Candidates — HireFlow AI" },
      { property: "og:description", content: "Candidate pipeline, AI screening scores and recruiter review." },
    ],
  }),
  component: CandidatesPage,
});

function CandidatesPage() {
  const apps = useQuery(applicationsQuery());
  const cands = useQuery(candidatesQuery());
  const scores = useQuery(candidateScoresQuery());
  const reqs = useQuery(requirementsQuery());
  const vendors = useQuery(vendorsQuery());
  const { actor, run, role } = useActor();
  const [openId, setOpenId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [sched, setSched] = useState({ name: "Rohan Verma", email: "manager@hireflow.demo", when: "" });

  const rows = (apps.data ?? []).map((a) => ({
    a,
    c: cands.data?.find((c) => c.id === a.candidate_id),
    r: reqs.data?.find((r) => r.id === a.requirement_id),
    s: scores.data?.find((s) => s.candidate_id === a.candidate_id && s.requirement_id === a.requirement_id),
    v: vendors.data?.find((v) => v.id === a.vendor_id),
  })).sort((x, y) => (y.a.match_score ?? 0) - (x.a.match_score ?? 0));
  const cur = rows.find((x) => x.a.id === openId);
  const isHr = role === "HR_ADMIN";

  const decide = (decision: "SHORTLIST" | "REJECT" | "REVIEW") => {
    if (!cur?.c || !cur.r) return;
    const { a, c, r } = cur;
    void run(async () => {
      await api.recordRecruiterDecision({ application: a, candidate: c, requirement: r, decision, reason, matchScore: a.match_score ?? 0, actor });
    }, `Decision recorded: ${decision}`);
    setOpenId(null);
  };

  return (
    <AppShell breadcrumbs={[{ label: "Candidates" }]}>
      <PageHeader title="Candidates" subtitle="AI screens resumes and scores the match. A recruiter makes every shortlist or reject decision." actions={<HumanBadge />} />
      <Panel>
        {apps.isLoading ? <LoadingRows /> : (
          <DataTable head={["Candidate", "Requirement", "Vendor", "Experience", "AI match", "AI view", "Stage", ""]}>
            {rows.map(({ a, c, r, s, v }) => (
              <tr key={a.id}>
                <Td><p className="font-medium">{c?.name}</p><p className="font-mono text-xs text-muted-foreground">{a.application_id}</p></Td>
                <Td className="text-xs">{r?.requirement_id}</Td>
                <Td className="text-xs">{v?.vendor_name ?? "Direct"}</Td>
                <Td>{c?.total_experience} yrs</Td>
                <Td>{a.match_score != null ? <ScoreBadge value={a.match_score} /> : "—"}</Td>
                <Td className="text-xs">{s ? screeningLabel[s.ai_recommendation as keyof typeof screeningLabel] ?? s.ai_recommendation : "Not screened"}</Td>
                <Td><StatusBadge status={a.stage} /></Td>
                <Td><Button size="sm" variant="outline" onClick={() => { setOpenId(a.id); setReason(""); }}>Review</Button></Td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Dialog open={!!cur} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{cur?.c?.name} · {cur?.r?.position_title}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{cur?.c?.location} · {cur?.c?.current_company} · {cur?.c?.education}</p>
          <div className="flex flex-wrap gap-1">{cur?.c?.skills.map((s) => <span key={s} className="rounded-full border px-2 py-0.5 text-xs">{s}</span>)}</div>
          {cur?.s ? (
            <AiRecommendationCard
              recommendation={screeningLabel[cur.s.ai_recommendation as keyof typeof screeningLabel] ?? cur.s.ai_recommendation}
              score={cur.s.overall_score}
              confidence={cur.s.confidence}
              explanation={cur.s.explanation ?? ""}
              factors={[
                { label: "Experience", value: `${cur.s.experience_score}` },
                { label: "Location", value: `${cur.s.location_score}` },
                { label: "Education", value: `${cur.s.education_score}` },
                { label: "Strengths", value: cur.s.strengths.join(", ") || "—" },
                { label: "Gaps", value: cur.s.gaps.join(", ") || "—" },
              ]}
            />
          ) : <p className="text-sm">Not screened yet.</p>}
          {isHr && cur?.c && cur.r && (
            <Button size="sm" variant="outline" onClick={() => run(() => api.runScreening({ candidate: cur.c!, requirement: cur.r!, actor }), "AI screening complete")}>Run AI screening (simulated)</Button>
          )}
          {isHr && (
            <>
              <Textarea placeholder="Reason for your decision" value={reason} onChange={(e) => setReason(e.target.value)} />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => decide("SHORTLIST")}>Shortlist</Button>
                <Button size="sm" variant="outline" onClick={() => decide("REVIEW")}>Needs review</Button>
                <Button size="sm" variant="ghost" onClick={() => decide("REJECT")}>Reject</Button>
              </div>
              {cur?.a.stage === "SHORTLISTED" && cur.c && cur.r && (
                <div className="grid gap-2 border-t pt-3 sm:grid-cols-3">
                  <Input placeholder="Interviewer" value={sched.name} onChange={(e) => setSched({ ...sched, name: e.target.value })} />
                  <Input placeholder="Email" value={sched.email} onChange={(e) => setSched({ ...sched, email: e.target.value })} />
                  <Input type="datetime-local" value={sched.when} onChange={(e) => setSched({ ...sched, when: e.target.value })} />
                  <Button size="sm" className="sm:col-span-3" disabled={!sched.when} onClick={() => {
                    const { a, c, r } = cur;
                    void run(() => api.scheduleInterview({ application: a, candidate: c!, requirement: r!, interviewer_name: sched.name, interviewer_email: sched.email, scheduled_at: new Date(sched.when).toISOString(), duration_minutes: 45, mode: "MS_TEAMS", round: "Technical", actor }), "Interview scheduled");
                    setOpenId(null);
                  }}>Schedule Teams interview</Button>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
