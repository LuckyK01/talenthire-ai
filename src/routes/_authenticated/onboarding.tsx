import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { AppShell } from "@/components/hire/app-shell";
import { EmptyState, fmtDate, LoadingRows, PageHeader, Panel, ScoreBar, StatusBadge } from "@/components/hire/bits";
import { DataTable, Td } from "@/components/hire/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useActor } from "@/hooks/useActor";
import * as api from "@/lib/api";
import { candidatesQuery, onboardingQuery } from "@/lib/queries";
import { ONBOARDING_STATES } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Onboarding — HireFlow AI" },
      { name: "description", content: "Onboarding checklists for new hires." },
      { property: "og:title", content: "Onboarding — HireFlow AI" },
      { property: "og:description", content: "Onboarding checklists for new hires." },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const tasks = useQuery(onboardingQuery());
  const cands = useQuery(candidatesQuery());
  const { actor, run } = useActor();
  const byCand = new Map<string, NonNullable<typeof tasks.data>>();
  for (const t of tasks.data ?? []) byCand.set(t.candidate_id, [...(byCand.get(t.candidate_id) ?? []), t]);

  return (
    <AppShell breadcrumbs={[{ label: "Onboarding" }]}>
      <PageHeader title="Onboarding" subtitle="Starts automatically when a candidate accepts an offer." />
      {tasks.isLoading ? <LoadingRows /> : byCand.size === 0 ? <EmptyState title="No one is onboarding yet" description="Accepted offers create a checklist here." /> : (
        [...byCand.entries()].map(([cid, list]) => {
          const done = list.filter((t) => t.status === "COMPLETED").length;
          return (
            <Panel key={cid} className="mb-5">
              <div className="mb-3 flex items-center gap-3"><h2 className="text-lg">{cands.data?.find((c) => c.id === cid)?.name}</h2><div className="w-40"><ScoreBar value={(done / list.length) * 100} /></div><span className="text-xs text-muted-foreground">{done}/{list.length}</span></div>
              <DataTable head={["Task", "Owner", "Due", "Status"]}>
                {list.map((t) => (
                  <tr key={t.id}><Td><p>{t.task}</p><p className="text-xs text-muted-foreground">{t.description}</p></Td><Td>{t.owner}</Td><Td>{fmtDate(t.due_date)}</Td>
                    <Td><Select value={t.status} onValueChange={(v) => run(() => api.updateOnboardingTask({ task: t, status: v, actor } as never), "Task updated")}><SelectTrigger className="w-36"><SelectValue><StatusBadge status={t.status} /></SelectValue></SelectTrigger><SelectContent>{ONBOARDING_STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></Td>
                  </tr>
                ))}
              </DataTable>
            </Panel>
          );
        })
      )}
    </AppShell>
  );
}
