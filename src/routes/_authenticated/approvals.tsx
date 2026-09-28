import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/hire/app-shell";
import {
  AiRecommendationCard,
  EmptyState,
  ErrorState,
  fmtDateTime,
  KpiCard,
  LabelMono,
  LoadingRows,
  PageHeader,
  Panel,
  SectionTitle,
  StatusBadge,
} from "@/components/hire/bits";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { decideApproval, type Approval } from "@/lib/api";
import { approvalsQuery, qk } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/approvals")({
  head: () => ({
    meta: [
      { title: "Approval Center — HireFlow AI" },
      { name: "description", content: "Every AI recommendation awaiting an explicit human approve, reject or review decision." },
      { property: "og:title", content: "Approval Center — HireFlow AI" },
      { property: "og:description", content: "Every AI recommendation awaiting an explicit human approve, reject or review decision." },
    ],
  }),
  component: ApprovalsPage,
});

const CATEGORIES: { key: string; label: string }[] = [
  { key: "CONTRACT_EXCEPTION", label: "Contract exceptions" },
  { key: "VENDOR_SELECTION", label: "Vendor selection" },
  { key: "CANDIDATE_SHORTLIST", label: "Candidate shortlist" },
  { key: "INTERVIEW_OUTCOME", label: "Interview outcome" },
  { key: "OFFER_APPROVAL", label: "Offer approval" },
  { key: "ONBOARDING_TRIGGER", label: "Onboarding trigger" },
];

function categoryLabel(cat: string): string {
  return CATEGORIES.find((c) => c.key === cat)?.label ?? cat.replace(/_/g, " ").toLowerCase();
}

function ApprovalsPage() {
  const { profile, role, user } = useAuth();
  const isManager = role === "MANAGER";
  const queryClient = useQueryClient();
  const approvals = useQuery(approvalsQuery());

  const [tab, setTab] = useState<"PENDING" | "DECIDED">("PENDING");
  const [category, setCategory] = useState<string>("ALL");

  const visible = useMemo(() => {
    const list = approvals.data ?? [];
    return list.filter((a) => !isManager || a.assigned_role === "MANAGER");
  }, [approvals.data, isManager]);

  const pending = visible.filter((a) => a.status === "PENDING");
  const decided = visible.filter((a) => a.status !== "PENDING");

  const filtered = (tab === "PENDING" ? pending : decided).filter(
    (a) => category === "ALL" || a.category === category,
  );

  const decide = useMutation({
    mutationFn: async (input: { approval: Approval; decision: "APPROVED" | "REJECTED" | "REVIEW_REQUESTED"; reason: string }) =>
      decideApproval({
        approval: input.approval,
        decision: input.decision,
        reason: input.reason,
        actor: { user_id: user?.id ?? null, actor_name: profile?.name ?? null, role },
      }),
    onSuccess: () => {
      toast.success("Decision recorded");
      void queryClient.invalidateQueries({ queryKey: qk.approvals });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <AppShell breadcrumbs={[{ label: "Approvals" }]}>
      <PageHeader
        title="Approval Center"
        subtitle="AI recommends. Humans decide. Every recommendation here requires an explicit approve, reject or request-review decision."
      />

      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {CATEGORIES.map((c) => (
          <KpiCard
            key={c.key}
            label={c.label}
            value={pending.filter((a) => a.category === c.key).length}
            tone={pending.filter((a) => a.category === c.key).length ? "warn" : "default"}
          />
        ))}
      </div>

      <Panel className="mt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Tabs value={tab} onValueChange={(v) => setTab(v as "PENDING" | "DECIDED")}>
            <TabsList>
              <TabsTrigger value="PENDING">Pending ({pending.length})</TabsTrigger>
              <TabsTrigger value="DECIDED">Decided ({decided.length})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex flex-wrap gap-1.5">
            <Button
              size="sm"
              variant={category === "ALL" ? "default" : "outline"}
              onClick={() => setCategory("ALL")}
            >
              All
            </Button>
            {CATEGORIES.map((c) => (
              <Button
                key={c.key}
                size="sm"
                variant={category === c.key ? "default" : "outline"}
                onClick={() => setCategory(c.key)}
              >
                {c.label}
              </Button>
            ))}
          </div>
        </div>

        {approvals.isLoading ? (
          <LoadingRows rows={4} />
        ) : approvals.isError ? (
          <ErrorState message={(approvals.error as Error).message} onRetry={() => void approvals.refetch()} />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={tab === "PENDING" ? "Nothing pending here." : "No decisions recorded yet."}
            description="Items appear once AI generates a recommendation that needs a human decision."
          />
        ) : (
          <ul className="space-y-4">
            {filtered.map((a) => (
              <ApprovalCard
                key={a.id}
                approval={a}
                disabled={isManager && a.assigned_role !== "MANAGER"}
                onDecide={(decision, reason) => decide.mutate({ approval: a, decision, reason })}
                pending={decide.isPending}
              />
            ))}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}

function ApprovalCard({
  approval,
  disabled,
  onDecide,
  pending,
}: {
  approval: Approval;
  disabled: boolean;
  onDecide: (decision: "APPROVED" | "REJECTED" | "REVIEW_REQUESTED", reason: string) => void;
  pending: boolean;
}) {
  const [reason, setReason] = useState("");
  const factors = Array.isArray(approval.ai_factors)
    ? (approval.ai_factors as { label: string; value: string }[])
    : [];
  const isPending = approval.status === "PENDING";

  return (
    <li className="ghost rounded-2xl p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium">{approval.title}</p>
            <StatusBadge status={approval.category} />
            <StatusBadge status={approval.status} />
          </div>
          <p className="label-mono mt-1">
            {approval.entity_type} · assigned to {approval.assigned_role.replace(/_/g, " ")} ·{" "}
            {approval.responsible_name ?? "unassigned"} · {fmtDateTime(approval.created_at)}
          </p>
        </div>
      </div>

      <AiRecommendationCard
        className="mt-3"
        recommendation={approval.ai_recommendation ?? "No recommendation"}
        score={approval.ai_score ?? undefined}
        explanation={approval.ai_explanation ?? "No explanation recorded."}
        factors={factors}
        confidence={approval.confidence ?? undefined}
        approvalState={isPending ? "Human decision required" : `Decided: ${approval.status.replace(/_/g, " ").toLowerCase()}`}
      />

      {!isPending ? (
        <div className="ghost mt-3 rounded-lg px-3 py-2 text-xs text-muted-foreground">
          Decided {fmtDateTime(approval.decided_at)}
          {approval.decision_reason ? ` — "${approval.decision_reason}"` : ""}
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <LabelMono>Optional reason</LabelMono>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Add a reason for your decision (optional)"
            disabled={disabled}
            rows={2}
          />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" disabled={disabled || pending} onClick={() => onDecide("APPROVED", reason)}>
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={disabled || pending}
              onClick={() => onDecide("REJECTED", reason)}
            >
              Reject
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={disabled || pending}
              onClick={() => onDecide("REVIEW_REQUESTED", reason)}
            >
              Request review
            </Button>
          </div>
          {disabled ? (
            <p className="text-xs text-muted-foreground">Assigned to the other role — you cannot act on this item.</p>
          ) : null}
        </div>
      )}
    </li>
  );
}
