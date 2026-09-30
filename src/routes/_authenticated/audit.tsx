import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { AppShell } from "@/components/hire/app-shell";
import { fmtDateTime, LoadingRows, PageHeader, Panel, StatusBadge } from "@/components/hire/bits";
import { DataTable, Td } from "@/components/hire/table";
import { Input } from "@/components/ui/input";
import { auditQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/audit")({
  head: () => ({
    meta: [
      { title: "Audit Trail — HireFlow AI" },
      { name: "description", content: "Every AI suggestion and human decision, recorded." },
      { property: "og:title", content: "Audit Trail — HireFlow AI" },
      { property: "og:description", content: "Every AI suggestion and human decision, recorded." },
    ],
  }),
  component: AuditPage,
});

function AuditPage() {
  const audit = useQuery(auditQuery());
  const [q, setQ] = useState("");
  const rows = (audit.data ?? []).filter((e) => `${e.action} ${e.entity_label} ${e.actor_name}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <AppShell breadcrumbs={[{ label: "Audit Trail" }]}>
      <PageHeader title="Audit Trail" subtitle="Immutable log of AI outputs and human decisions." />
      <Panel>
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} className="mb-3 max-w-xs" />
        {audit.isLoading ? <LoadingRows /> : (
          <DataTable head={["When", "Source", "Actor", "Action", "Entity", "Reason"]}>
            {rows.map((e) => <tr key={e.id}><Td className="text-xs">{fmtDateTime(e.created_at)}</Td><Td><StatusBadge status={e.source} /></Td><Td>{e.actor_name ?? "System"}</Td><Td>{e.action}</Td><Td className="text-xs">{e.entity_label}</Td><Td className="text-xs text-muted-foreground">{e.reason ?? ""}</Td></tr>)}
          </DataTable>
        )}
      </Panel>
    </AppShell>
  );
}
