import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";

import { AppShell } from "@/components/hire/app-shell";
import {
  AiBadge,
  EmptyState,
  fmtDate,
  fmtDateTime,
  KpiCard,
  LabelMono,
  LoadingRows,
  PageHeader,
  Panel,
  ScoreBadge,
  ScoreBar,
  SectionTitle,
  StatusBadge,
  TrendArrow,
} from "@/components/hire/bits";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  aiSettingsQuery,
  applicationsQuery,
  approvalsQuery,
  auditQuery,
  candidateScoresQuery,
  interviewsQuery,
  offersQuery,
  onboardingQuery,
  requirementsQuery,
  vendorInputsQuery,
} from "@/lib/queries";
import { rankVendors, recommendationLabel } from "@/lib/services/vendorRanking";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — HireFlow AI" },
      { name: "description", content: "Recruitment and onboarding KPIs, approvals and top-ranked vendors." },
      { property: "og:title", content: "Dashboard — HireFlow AI" },
      { property: "og:description", content: "Recruitment and onboarding KPIs, approvals and top-ranked vendors." },
    ],
  }),
  component: DashboardPage,
});

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

function DashboardPage() {
  const { profile, role } = useAuth();
  const isManager = role === "MANAGER";

  const requirements = useQuery(requirementsQuery());
  const applications = useQuery(applicationsQuery());
  const scores = useQuery(candidateScoresQuery());
  const approvals = useQuery(approvalsQuery());
  const interviews = useQuery(interviewsQuery());
  const offers = useQuery(offersQuery());
  const onboarding = useQuery(onboardingQuery());
  const audit = useQuery(auditQuery());
  const vendorInputs = useQuery(vendorInputsQuery());
  const settings = useQuery(aiSettingsQuery());

  const myRequirements = useMemo(() => {
    const list = requirements.data ?? [];
    if (!isManager) return list;
    return list.filter((r) => r.hiring_manager_name === profile?.name);
  }, [requirements.data, isManager, profile?.name]);

  const activeRequirement = myRequirements.find((r) => r.status !== "COMPLETED") ?? myRequirements[0];

  const topVendors = useMemo(() => {
    if (!activeRequirement || !vendorInputs.data || !settings.data) return [];
    return rankVendors(vendorInputs.data, activeRequirement, settings.data).slice(0, 3);
  }, [activeRequirement, vendorInputs.data, settings.data]);

  const pendingApprovals = (approvals.data ?? []).filter(
    (a) => a.status === "PENDING" && (!isManager || a.assigned_role === "MANAGER"),
  );
  const upcoming = (interviews.data ?? []).filter(
    (i) => i.status === "SCHEDULED" && new Date(i.scheduled_at) >= new Date(Date.now() - 86_400_000),
  );
  const inPipeline = (applications.data ?? []).filter(
    (a) => !["REJECTED", "HIRED"].includes(a.stage),
  );
  const awaitingReview = (applications.data ?? []).filter((a) => ["SCREENING", "REVIEW"].includes(a.stage));

  const funnel = [
    { stage: "Received", count: (applications.data ?? []).length },
    { stage: "Screened", count: (scores.data ?? []).length },
    { stage: "Shortlisted", count: (applications.data ?? []).filter((a) => a.stage === "SHORTLISTED").length },
    { stage: "Interview", count: (interviews.data ?? []).length },
    { stage: "Offer", count: (offers.data ?? []).length },
    { stage: "Hired", count: (applications.data ?? []).filter((a) => a.stage === "HIRED").length },
  ];

  const distribution = useMemo(() => {
    const list = scores.data ?? [];
    return [
      { name: "Recommended", value: list.filter((s) => s.ai_recommendation === "RECOMMENDED").length },
      { name: "Review", value: list.filter((s) => s.ai_recommendation === "REVIEW").length },
      { name: "Weak match", value: list.filter((s) => s.ai_recommendation === "WEAK_MATCH").length },
    ];
  }, [scores.data]);

  const pieTones = ["var(--teal)", "var(--amber)", "var(--rose)"];

  return (
    <AppShell breadcrumbs={[{ label: "Dashboard" }]}>
      <PageHeader
        title={`${greeting()}, ${profile?.name?.split(" ")[0] ?? "there"}`}
        subtitle={
          isManager
            ? "Your requirements, candidates awaiting review and pending approvals."
            : "Recruitment and onboarding at a glance. AI recommends — every final decision stays with you."
        }
        actions={
          isManager ? (
            <Button asChild size="sm">
              <Link to="/candidates">Review candidates</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="sm">
                <Link to="/requirements/new">New requirement</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/vendor-ranking">Vendor ranking</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/candidates">Candidates</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/approvals">My approvals</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/interviews">Interviews</Link>
              </Button>
            </>
          )
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={isManager ? "My requirements" : "Open requirements"}
          value={myRequirements.filter((r) => r.status !== "COMPLETED").length}
          hint={`${myRequirements.length} total`}
        />
        <KpiCard label="Candidates in pipeline" value={inPipeline.length} hint={`${awaitingReview.length} awaiting review`} />
        {isManager ? null : (
          <KpiCard
            label="Active vendors"
            value={(vendorInputs.data ?? []).filter((v) => v.status === "ACTIVE").length}
            hint="Ranked on every requirement"
          />
        )}
        <KpiCard label="Pending approvals" value={pendingApprovals.length} tone={pendingApprovals.length ? "warn" : "default"} />
        <KpiCard label="Interviews scheduled" value={upcoming.length} />
        {isManager ? null : (
          <>
            <KpiCard
              label="Offers pending"
              value={(offers.data ?? []).filter((o) => o.status !== "ACCEPTED" && o.status !== "REJECTED").length}
            />
            <KpiCard
              label="Onboarding in progress"
              value={new Set((onboarding.data ?? []).filter((t) => t.status !== "COMPLETED").map((t) => t.candidate_id)).size}
            />
          </>
        )}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Panel className="xl:col-span-2">
          <SectionTitle hint="Counts across the current demo data set.">Hiring funnel</SectionTitle>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel}>
                <CartesianGrid vertical={false} strokeOpacity={0.15} />
                <XAxis dataKey="stage" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis tickLine={false} axisLine={false} fontSize={11} allowDecimals={false} />
                <RTooltip />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="var(--teal)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {isManager ? (
          <Panel>
            <SectionTitle hint="Candidates screened and waiting for your decision.">Awaiting your review</SectionTitle>
            {awaitingReview.length === 0 ? (
              <EmptyState title="You're all caught up." />
            ) : (
              <ul className="space-y-2">
                {awaitingReview.slice(0, 6).map((a) => (
                  <li key={a.id} className="ghost flex items-center justify-between rounded-lg px-3 py-2">
                    <span className="font-mono text-xs">{a.application_id}</span>
                    {a.match_score != null ? <ScoreBadge value={a.match_score} /> : <StatusBadge status={a.stage} />}
                  </li>
                ))}
              </ul>
            )}
            <Button asChild variant="outline" size="sm" className="mt-3 w-full">
              <Link to="/candidates">Open candidates</Link>
            </Button>
          </Panel>
        ) : (
          <Panel>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg">Top vendors</h2>
                <p className="text-xs text-muted-foreground">
                  {activeRequirement
                    ? `Ranked for ${activeRequirement.requirement_id} · ${activeRequirement.position_title}`
                    : "No active requirement"}
                </p>
              </div>
              <AiBadge />
            </div>
            {vendorInputs.isLoading || settings.isLoading ? (
              <LoadingRows rows={3} />
            ) : topVendors.length === 0 ? (
              <EmptyState title="No vendors ranked yet." />
            ) : (
              <ul className="space-y-3">
                {topVendors.map((v) => (
                  <li key={v.vendor.id} className="ghost rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <span className="tnum font-mono text-xs text-muted-foreground">#{v.rank}</span>
                        {v.vendor.vendor_name}
                      </span>
                      <ScoreBadge value={v.overallScore} />
                    </div>
                    <ScoreBar value={v.overallScore} className="mt-2" />
                    <div className="mt-2 flex items-center justify-between">
                      <span className="label-mono">{recommendationLabel[v.aiRecommendation]}</span>
                      <TrendArrow trend={v.trend} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <Button asChild size="sm" className="mt-4 w-full">
              <Link to="/vendor-ranking">View vendor ranking</Link>
            </Button>
          </Panel>
        )}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-3">
        <Panel>
          <SectionTitle hint="Every item needs a human decision.">Pending approvals</SectionTitle>
          {approvals.isLoading ? (
            <LoadingRows rows={3} />
          ) : pendingApprovals.length === 0 ? (
            <EmptyState title="You're all caught up." description="No approvals are waiting on you." />
          ) : (
            <ul className="space-y-2">
              {pendingApprovals.slice(0, 5).map((a) => (
                <li key={a.id} className="ghost rounded-lg px-3 py-2">
                  <p className="text-sm">{a.title}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StatusBadge status={a.category} />
                    {a.ai_score != null ? <ScoreBadge value={a.ai_score} /> : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
          <Button asChild variant="outline" size="sm" className="mt-3 w-full">
            <Link to="/approvals">Open approval center</Link>
          </Button>
        </Panel>

        <Panel>
          <SectionTitle>Upcoming interviews</SectionTitle>
          {upcoming.length === 0 ? (
            <EmptyState title="No interviews scheduled." />
          ) : (
            <ul className="space-y-2">
              {upcoming.slice(0, 5).map((i) => (
                <li key={i.id} className="ghost rounded-lg px-3 py-2">
                  <p className="text-sm">{i.interviewer_name}</p>
                  <p className="label-mono mt-1">
                    {fmtDateTime(i.scheduled_at)} · {i.mode}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {isManager ? (
          <Panel>
            <SectionTitle>My requirements</SectionTitle>
            {myRequirements.length === 0 ? (
              <EmptyState title="No requirements assigned to you." />
            ) : (
              <ul className="space-y-2">
                {myRequirements.map((r) => (
                  <li key={r.id} className="ghost rounded-lg px-3 py-2">
                    <Link to="/requirements/$id" params={{ id: r.id }} className="text-sm hover:underline">
                      {r.requirement_id} · {r.position_title}
                    </Link>
                    <div className="mt-1">
                      <StatusBadge status={r.status} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        ) : (
          <Panel>
            <SectionTitle hint="AI actions and human decisions are labelled separately.">Recent activity</SectionTitle>
            {audit.isLoading ? (
              <LoadingRows rows={4} />
            ) : (
              <ul className="space-y-2">
                {(audit.data ?? []).slice(0, 6).map((e) => (
                  <li key={e.id} className="ghost rounded-lg px-3 py-2">
                    <p className="text-sm">{e.action}</p>
                    <p className="label-mono mt-1">
                      {e.source} · {e.entity_label ?? e.entity_type} · {fmtDate(e.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        )}
      </div>

      {isManager ? null : (
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <Panel>
            <SectionTitle hint="AI screening outcomes across all candidates.">Screening distribution</SectionTitle>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80}>
                    {distribution.map((_, i) => (
                      <Cell key={i} fill={pieTones[i]} />
                    ))}
                  </Pie>
                  <RTooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 flex justify-center gap-4">
              {distribution.map((d, i) => (
                <span key={d.name} className="flex items-center gap-1.5 text-xs">
                  <span className="size-2 rounded-full" style={{ background: pieTones[i] }} />
                  {d.name} ({d.value})
                </span>
              ))}
            </div>
          </Panel>

          <Panel>
            <SectionTitle hint="Contract and score exceptions that need attention.">Exceptions</SectionTitle>
            {(requirements.data ?? []).filter((r) => r.contract_status === "FLAGGED").length === 0 ? (
              <EmptyState title="No exceptions raised." />
            ) : (
              <ul className="space-y-2">
                {(requirements.data ?? [])
                  .filter((r) => r.contract_status === "FLAGGED")
                  .map((r) => (
                    <li key={r.id} className="ghost rounded-lg px-3 py-2">
                      <Link to="/requirements/$id" params={{ id: r.id }} className="text-sm hover:underline">
                        {r.requirement_id} · contract flagged
                      </Link>
                      <LabelMono>needs human review</LabelMono>
                    </li>
                  ))}
              </ul>
            )}
          </Panel>
        </div>
      )}
    </AppShell>
  );
}
