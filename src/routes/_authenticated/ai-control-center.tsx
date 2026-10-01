import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AiAssist } from "@/components/hire/ai-assist";
import { AppShell } from "@/components/hire/app-shell";
import { AiBadge, fmtDateTime, HumanBadge, LoadingRows, PageHeader, Panel, StatusBadge } from "@/components/hire/bits";
import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import * as api from "@/lib/api";
import { agentsQuery, applicationsQuery, candidatesQuery, requirementsQuery } from "@/lib/queries";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/ai-control-center")({
  head: () => ({
    meta: [
      { title: "AI Control Center — HireFlow AI" },
      { name: "description", content: "Every AI agent, what it does, and the human approval it requires." },
      { property: "og:title", content: "AI Control Center — HireFlow AI" },
      { property: "og:description", content: "Every AI agent and the human approval it requires." },
    ],
  }),
  component: AiCenter,
});

function AiCenter() {
  const agents = useQuery(agentsQuery());
  const { run } = useActor();
  const reqs = useQuery(requirementsQuery());
  const cands = useQuery(candidatesQuery());
  const apps = useQuery(applicationsQuery());
  const [q, setQ] = useState("Which open requirement is most at risk and why?");
  return (
    <AppShell breadcrumbs={[{ label: "AI Control Center" }]}>
      <PageHeader title="AI Control Center" subtitle="Live AI assistant plus the workflow agents.  None can make a final hiring decision." />
      <div className="mb-6 space-y-2">
        <Textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask HireFlow AI about your pipeline…" />
        <AiAssist key={q} task="ask" question={q} label="Ask AI" context={{ requirements: (reqs.data ?? []).map((r) => ({ id: r.requirement_id, title: r.position_title, status: r.status, contract: r.contract_status, openings: r.number_of_openings })), candidates: (cands.data ?? []).map((c) => ({ name: c.name, status: c.status, exp: c.total_experience, skills: c.skills })), applications: (apps.data ?? []).map((a) => ({ id: a.application_id, stage: a.stage, score: a.match_score })) }} />
      </div>
      {agents.isLoading ? <LoadingRows /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(agents.data ?? []).map((a) => (
            <Panel key={a.id}>
              <div className="flex items-center gap-2"><AiBadge>Simulated</AiBadge><StatusBadge status={a.status} /></div>
              <h3 className="mt-3 text-lg">{a.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{a.purpose}</p>
              <p className="mt-3 text-xs text-muted-foreground">{a.executions} runs · last {fmtDateTime(a.last_execution)}</p>
              <div className="mt-3 flex items-center justify-between">
                {a.requires_human_approval && <HumanBadge />}
                <Button size="sm" variant="outline" onClick={() => run(() => api.recordAgentRun(a.agent_key), "Test run recorded")}>Test run</Button>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </AppShell>
  );
}
