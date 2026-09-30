import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/hire/app-shell";
import { LoadingRows, PageHeader, Panel, SectionTitle } from "@/components/hire/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActor } from "@/hooks/useActor";
import * as api from "@/lib/api";
import { aiSettingsQuery } from "@/lib/queries";
import { weightLabels, type AiSettings, type RankingWeights } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — HireFlow AI" },
      { name: "description", content: "Configure vendor ranking weights and recency rules." },
      { property: "og:title", content: "Settings — HireFlow AI" },
      { property: "og:description", content: "Configure vendor ranking weights and recency rules." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const q = useQuery(aiSettingsQuery());
  const { actor, run, role } = useActor();
  const [s, setS] = useState<AiSettings | null>(null);
  useEffect(() => { if (q.data) setS(q.data); }, [q.data]);
  if (!s) return <AppShell><LoadingRows /></AppShell>;
  const total = Object.values(s.weights).reduce((a, b) => a + b, 0);
  const canEdit = role === "HR_ADMIN";

  return (
    <AppShell breadcrumbs={[{ label: "Settings" }]}>
      <PageHeader title="Settings" subtitle="Vendor ranking weights and recency. Changes apply to every ranking immediately." />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel>
          <SectionTitle hint={`Total ${total}% (must be 100)`}>Ranking weights</SectionTitle>
          <div className="mt-3 space-y-2">{(Object.keys(s.weights) as (keyof RankingWeights)[]).map((k) => (
            <label key={k} className="flex items-center justify-between gap-3 text-sm">{weightLabels[k]}
              <Input type="number" className="w-24" disabled={!canEdit} value={s.weights[k]} onChange={(e) => setS({ ...s, weights: { ...s.weights, [k]: Number(e.target.value) } })} />
            </label>))}</div>
        </Panel>
        <Panel>
          <SectionTitle>Recency weighting</SectionTitle>
          <div className="mt-3 space-y-2">{(Object.keys(s.recency) as (keyof AiSettings["recency"])[]).map((k) => (
            <label key={k} className="flex items-center justify-between gap-3 text-sm">{k}
              <Input type="number" step="0.1" className="w-24" disabled={!canEdit} value={s.recency[k]} onChange={(e) => setS({ ...s, recency: { ...s.recency, [k]: Number(e.target.value) } })} />
            </label>))}</div>
        </Panel>
      </div>
      {canEdit && <Button className="mt-5" disabled={total !== 100} onClick={() => run(() => api.saveAiSettings(s, actor), "Settings saved")}>Save settings</Button>}
    </AppShell>
  );
}
