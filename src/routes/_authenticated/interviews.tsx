import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AiAssist } from "@/components/hire/ai-assist";
import { AppShell } from "@/components/hire/app-shell";
import { AiRecommendationCard, fmtDateTime, LoadingRows, PageHeader, Panel, StatusBadge } from "@/components/hire/bits";
import { DataTable, Td } from "@/components/hire/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useActor } from "@/hooks/useActor";
import * as api from "@/lib/api";
import { applicationsQuery, candidatesQuery, interviewFeedbackQuery, interviewsQuery, requirementsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/interviews")({
  head: () => ({
    meta: [
      { title: "Interviews — HireFlow AI" },
      { name: "description", content: "Scheduled Teams interviews, feedback and simulated AI summaries." },
      { property: "og:title", content: "Interviews — HireFlow AI" },
      { property: "og:description", content: "Scheduled Teams interviews, feedback and AI summaries." },
    ],
  }),
  component: InterviewsPage,
});

const RATINGS = ["STRONG", "ADEQUATE", "WEAK"];

function InterviewsPage() {
  const ivs = useQuery(interviewsQuery());
  const fb = useQuery(interviewFeedbackQuery());
  const cands = useQuery(candidatesQuery());
  const apps = useQuery(applicationsQuery());
  const reqs = useQuery(requirementsQuery());
  const { actor, run, role } = useActor();
  const [openId, setOpenId] = useState<string | null>(null);
  const [f, setF] = useState({ technical_capability: "STRONG", communication: "STRONG", problem_solving: "ADEQUATE", strengths: "", concerns: "", overall_recommendation: "PROCEED" });
  const [offer, setOffer] = useState({ band: "₹18–22 LPA", start: "" });

  const cur = ivs.data?.find((i) => i.id === openId);
  const curFb = fb.data?.find((x) => x.interview_id === openId);
  const name = (id: string) => cands.data?.find((c) => c.id === id)?.name ?? "—";

  return (
    <AppShell breadcrumbs={[{ label: "Interviews" }]}>
      <PageHeader title="Interviews" subtitle="Microsoft Teams meetings (simulated adapter). Interviewers submit structured feedback; AI summarises it." />
      <Panel>
        {ivs.isLoading ? <LoadingRows /> : (
          <DataTable head={["Candidate", "Round", "Interviewer", "When", "Mode", "Status", ""]}>
            {(ivs.data ?? []).map((i) => (
              <tr key={i.id}>
                <Td>{name(i.candidate_id)}</Td><Td>{i.round}</Td><Td>{i.interviewer_name}</Td><Td>{fmtDateTime(i.scheduled_at)}</Td>
                <Td>{i.meeting_link ? <a className="text-teal underline" href={i.meeting_link} target="_blank" rel="noreferrer">Teams link</a> : i.mode}</Td>
                <Td><StatusBadge status={i.status} /></Td>
                <Td><Button size="sm" variant="outline" onClick={() => setOpenId(i.id)}>{fb.data?.some((x) => x.interview_id === i.id) ? "View feedback" : "Feedback"}</Button></Td>
              </tr>
            ))}
          </DataTable>
        )}
      </Panel>

      <Dialog open={!!cur} onOpenChange={(o) => !o && setOpenId(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>{cur && name(cur.candidate_id)} · {cur?.round}</DialogTitle></DialogHeader>
          {curFb ? (
            <>
              <AiRecommendationCard recommendation={curFb.ai_recommendation ?? "—"} explanation={curFb.ai_summary ?? ""} factors={[
                { label: "Technical", value: curFb.technical_capability }, { label: "Communication", value: curFb.communication },
                { label: "Problem solving", value: curFb.problem_solving }, { label: "Interviewer says", value: curFb.overall_recommendation },
              ]} />
              <AiAssist className="mt-3" task="feedback" label="AI feedback summary" context={{ round: cur?.round, feedback: curFb }} />
              {role === "HR_ADMIN" && cur && (() => {
                const app = apps.data?.find((a) => a.id === cur.application_id);
                const cand = cands.data?.find((c) => c.id === cur.candidate_id);
                const req = reqs.data?.find((r) => r.id === cur.requirement_id);
                if (!app || !cand || !req) return null;
                return (
                  <div className="grid gap-2 border-t pt-3 sm:grid-cols-3">
                    <Input value={offer.band} onChange={(e) => setOffer({ ...offer, band: e.target.value })} placeholder="Compensation band" />
                    <Input type="date" value={offer.start} onChange={(e) => setOffer({ ...offer, start: e.target.value })} />
                    <Button size="sm" disabled={!offer.start} onClick={() => { void run(() => api.createOffer({ application: app, candidate: cand, requirement: req, start_date: offer.start, compensation_band: offer.band, location: req.location ?? "", employment_type: req.employment_type ?? "Full-time", actor }), "Offer drafted — sent for approval"); setOpenId(null); }}>Draft offer</Button>
                  </div>
                );
              })()}
            </>
          ) : (
            <div className="grid gap-3">
              {(["technical_capability", "communication", "problem_solving"] as const).map((k) => (
                <label key={k} className="flex items-center justify-between gap-3 text-sm capitalize">{k.replace(/_/g, " ")}
                  <Select value={f[k]} onValueChange={(v) => setF({ ...f, [k]: v })}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{RATINGS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                </label>
              ))}
              <Textarea placeholder="Strengths" value={f.strengths} onChange={(e) => setF({ ...f, strengths: e.target.value })} />
              <Textarea placeholder="Concerns" value={f.concerns} onChange={(e) => setF({ ...f, concerns: e.target.value })} />
              <Select value={f.overall_recommendation} onValueChange={(v) => setF({ ...f, overall_recommendation: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["PROCEED", "DISCUSS", "DO_NOT_PROCEED"].map((r) => <SelectItem key={r} value={r}>{r.replace(/_/g, " ")}</SelectItem>)}</SelectContent></Select>
              <Button onClick={() => { if (!cur) return; void run(() => api.submitInterviewFeedback({ interview: cur, candidateName: name(cur.candidate_id), ...f, actor }), "Feedback submitted"); setOpenId(null); }}>Submit feedback</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
