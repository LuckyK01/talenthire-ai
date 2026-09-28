import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AppShell } from "@/components/hire/app-shell";
import {
  EmptyState,
  ErrorState,
  LoadingRows,
  PageHeader,
  Panel,
  ScoreBadge,
  ScoreBar,
  StatusBadge,
  TrendArrow,
} from "@/components/hire/bits";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { vendorInputsQuery, vendorsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/vendors/")({
  head: () => ({
    meta: [
      { title: "Vendors — HireFlow AI" },
      { name: "description", content: "Browse recruitment vendors, their specialisations, scores and status." },
      { property: "og:title", content: "Vendors — HireFlow AI" },
      { property: "og:description", content: "Browse recruitment vendors, their specialisations, scores and status." },
    ],
  }),
  component: VendorsIndexPage,
});

function VendorsIndexPage() {
  const vendors = useQuery(vendorsQuery());
  const vendorInputs = useQuery(vendorInputsQuery());
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [specialisation, setSpecialisation] = useState("ALL");

  const specialisations = useMemo(() => {
    const set = new Set<string>();
    for (const v of vendors.data ?? []) for (const s of v.specialisations) set.add(s);
    return Array.from(set).sort();
  }, [vendors.data]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const v of vendors.data ?? []) set.add(v.status);
    return Array.from(set).sort();
  }, [vendors.data]);

  const trendByVendor = useMemo(() => {
    const map = new Map<string, string>();
    for (const v of vendorInputs.data ?? []) {
      const counts: Record<string, number> = { UP: 0, DOWN: 0, FLAT: 0 };
      for (const s of v.skillScores) counts[s.trend] = (counts[s.trend] ?? 0) + 1;
      const trend = counts.UP > counts.DOWN ? "UP" : counts.DOWN > counts.UP ? "DOWN" : "FLAT";
      map.set(v.id, trend);
    }
    return map;
  }, [vendorInputs.data]);

  const filtered = useMemo(() => {
    return (vendors.data ?? []).filter((v) => {
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        const hay = `${v.vendor_name} ${v.specialisations.join(" ")} ${v.locations.join(" ")}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status !== "ALL" && v.status !== status) return false;
      if (specialisation !== "ALL" && !v.specialisations.includes(specialisation)) return false;
      return true;
    });
  }, [vendors.data, search, status, specialisation]);

  return (
    <AppShell breadcrumbs={[{ label: "Vendors" }]}>
      <PageHeader
        title="Vendors"
        subtitle="Every staffing vendor with their overall AI-tracked score. Open a vendor to see the full picture."
      />

      <Panel className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search vendors, specialisations, locations…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-xs"
          />
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={specialisation} onValueChange={setSpecialisation}>
            <SelectTrigger className="w-52"><SelectValue placeholder="Specialisation" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All specialisations</SelectItem>
              {specialisations.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="label-mono ml-auto">{filtered.length} vendor(s)</span>
        </div>
      </Panel>

      <Panel>
        {vendors.isLoading ? (
          <LoadingRows rows={6} />
        ) : vendors.isError ? (
          <ErrorState message="Could not load vendors." onRetry={() => void vendors.refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState title="No vendors match your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3">Vendor</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">Specialisations</th>
                  <th className="py-2 pr-3">Locations</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Overall score</th>
                  <th className="py-2 pr-3">Trend</th>
                  <th className="py-2 pr-3">Contact</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((v) => (
                  <tr key={v.id} className="border-b last:border-0 hover:bg-white/40">
                    <td className="py-2.5 pr-3">
                      <Link to="/vendors/$id" params={{ id: v.id }} className="font-medium hover:underline">
                        {v.vendor_name}
                      </Link>
                    </td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">{v.vendor_type}</td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">{v.specialisations.join(", ") || "—"}</td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">{v.locations.join(", ") || "—"}</td>
                    <td className="py-2.5 pr-3"><StatusBadge status={v.status} /></td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <ScoreBadge value={v.overall_score} />
                        <ScoreBar value={v.overall_score} className="w-16" />
                      </div>
                    </td>
                    <td className="py-2.5 pr-3"><TrendArrow trend={trendByVendor.get(v.id) ?? "FLAT"} /></td>
                    <td className="py-2.5 pr-3 text-xs text-muted-foreground">
                      {v.contact_name ?? "—"}
                      {v.contact_email ? <div>{v.contact_email}</div> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </AppShell>
  );
}
