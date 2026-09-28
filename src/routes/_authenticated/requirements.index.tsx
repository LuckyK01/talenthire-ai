import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/hire/app-shell";
import {
  EmptyState,
  ErrorState,
  fmtDate,
  LoadingRows,
  PageHeader,
  Panel,
  StatusBadge,
} from "@/components/hire/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/hooks/useAuth";
import { requirementsQuery } from "@/lib/queries";
import { REQUIREMENT_STATES } from "@/lib/types";

export const Route = createFileRoute("/_authenticated/requirements/")({
  head: () => ({
    meta: [
      { title: "Requirements — HireFlow AI" },
      { name: "description", content: "Browse open and past hiring requirements across the organisation." },
      { property: "og:title", content: "Requirements — HireFlow AI" },
      { property: "og:description", content: "Browse open and past hiring requirements across the organisation." },
    ],
  }),
  component: RequirementsIndexPage,
});

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

function RequirementsIndexPage() {
  const { role } = useAuth();
  const isHr = role === "HR_ADMIN";
  const requirements = useQuery(requirementsQuery());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("ALL");
  const [priority, setPriority] = useState<string>("ALL");

  const filtered = useMemo(() => {
    const list = requirements.data ?? [];
    return list.filter((r) => {
      if (status !== "ALL" && r.status !== status) return false;
      if (priority !== "ALL" && r.priority !== priority) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !r.requirement_id.toLowerCase().includes(q) &&
          !r.position_title.toLowerCase().includes(q) &&
          !(r.department ?? "").toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [requirements.data, search, status, priority]);

  return (
    <AppShell breadcrumbs={[{ label: "Requirements" }]}>
      <PageHeader
        title="Requirements"
        subtitle="Every open role, its workflow stage and the human owner accountable for it."
        actions={
          isHr ? (
            <Button asChild size="sm">
              <Link to="/requirements/new">New requirement</Link>
            </Button>
          ) : undefined
        }
      />

      <Panel>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search by ID, title or department…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {REQUIREMENT_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All priorities</SelectItem>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {requirements.isLoading ? (
          <LoadingRows rows={6} />
        ) : requirements.isError ? (
          <ErrorState message="Could not load requirements." onRetry={() => requirements.refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No requirements match your filters."
            description="Try clearing the search or filters, or create a new requirement."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Requirement</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Openings</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hiring manager</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer">
                    <TableCell className="font-mono text-xs">
                      <Link to="/requirements/$id" params={{ id: r.id }} className="hover:underline">
                        {r.requirement_id}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link to="/requirements/$id" params={{ id: r.id }} className="hover:underline">
                        {r.position_title}
                      </Link>
                    </TableCell>
                    <TableCell>{r.department ?? "—"}</TableCell>
                    <TableCell className="tnum">{r.number_of_openings}</TableCell>
                    <TableCell>{r.location ?? "—"}</TableCell>
                    <TableCell>{r.priority}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell>{r.hiring_manager_name ?? "—"}</TableCell>
                    <TableCell className="label-mono">{fmtDate(r.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
