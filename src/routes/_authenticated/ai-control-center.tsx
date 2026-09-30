import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/hire/app-shell";
import { AiBadge, fmtDateTime, HumanBadge, LoadingRows, PageHeader, Panel, StatusBadge } from "@/components/hire/bits";
import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import * as api from "@/lib/api";
import { agentsQuery } from "@/lib/queries";

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
  return (
    <AppShell breadcrumbs={[{ label: "AI Control Center" }]}>
      <PageHeader title="AI Control Center" subtitle="All agents in this demo are simulated. None can make a final hiring decision." />
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
