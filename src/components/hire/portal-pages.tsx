import { Link } from "@tanstack/react-router";
import { Check } from "lucide-react";

import { EmptyState, fmtDate, fmtDateTime, LoadingRows, PageHeader, Panel, SectionTitle, StatusBadge } from "@/components/hire/bits";
import { usePortalData } from "@/components/hire/portal-data";
import { Button } from "@/components/ui/button";
import { useActor } from "@/hooks/useActor";
import * as api from "@/lib/api";
import { candidateJourney, journeyIndexForStage } from "@/lib/types";
import { cn } from "@/lib/utils";

type Page = "home" | "application" | "interview" | "offer" | "onboarding" | "notifications" | "profile";

export function PortalBody({ page }: { page: Page }) {
  const d = usePortalData();
  const { actor, run, user } = useActor();
  if (d.loading) return <LoadingRows />;
  if (!d.me)
    return <EmptyState title="No application yet" description="We couldn't find an application linked to your email." />;
  const me = d.me;
  const stageIdx = journeyIndexForStage(d.app?.stage ?? me.status);
  const title = d.requirement?.position_title ?? "Your application";

  const timeline = (
    <ol className="space-y-3">
      {candidateJourney.map((s, i) => (
        <li key={s.key} className="flex items-center gap-3">
          <span className={cn("flex size-6 items-center justify-center rounded-full border text-xs", i < stageIdx && "bg-primary text-primary-foreground", i === stageIdx && "border-primary text-primary")}>
            {i < stageIdx ? <Check className="size-3" /> : i + 1}
          </span>
          <span className={cn("text-sm", i > stageIdx && "text-muted-foreground")}>{s.label}</span>
          {i === stageIdx && <span className="text-xs text-primary">Current</span>}
        </li>
      ))}
    </ol>
  );

  switch (page) {
    case "home": {
      const next = d.interviews.find((i) => i.status === "SCHEDULED");
      return (
        <>
          <PageHeader title={`Hello, ${me.name.split(" ")[0]}`} subtitle={`${title} · ${d.app?.application_id ?? ""}`} />
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel><SectionTitle>Your journey</SectionTitle>{timeline}</Panel>
            <Panel>
              <SectionTitle>Next step</SectionTitle>
              <p className="text-sm text-muted-foreground">
                {d.offer ? "You have an offer to review." : next ? `Interview on ${fmtDateTime(next.scheduled_at)}.` : "Our recruiters are reviewing your profile. We'll notify you of any update."}
              </p>
              <div className="mt-4 flex gap-2">
                {d.offer && <Button asChild size="sm"><Link to="/portal/offer">View offer</Link></Button>}
                {next && <Button asChild size="sm" variant="outline"><Link to="/portal/interview">Interview details</Link></Button>}
              </div>
            </Panel>
          </div>
        </>
      );
    }
    case "application":
      return (
        <>
          <PageHeader title="My Application" subtitle={`${d.app?.application_id ?? ""} · ${title}`} />
          <div className="grid gap-5 lg:grid-cols-2">
            <Panel>
              <SectionTitle>Status</SectionTitle>
              <StatusBadge status={d.app?.stage ?? me.status} />
              <p className="mt-3 text-sm text-muted-foreground">{d.requirement?.location} · {d.requirement?.work_mode} · Applied {fmtDate(d.app?.created_at ?? me.created_at)}</p>
            </Panel>
            <Panel><SectionTitle>Timeline</SectionTitle>{timeline}</Panel>
          </div>
        </>
      );
    case "interview":
      return (
        <>
          <PageHeader title="My Interview" />
          {d.interviews.length === 0 ? <EmptyState title="No interviews yet" /> : (
            <div className="grid gap-4 md:grid-cols-2">
              {d.interviews.map((i) => (
                <Panel key={i.id}>
                  <div className="flex items-center justify-between"><h3 className="text-lg">{i.round} round</h3><StatusBadge status={i.status} /></div>
                  <p className="mt-2 text-sm">{fmtDateTime(i.scheduled_at)} · {i.duration_minutes} min · {i.mode}</p>
                  <p className="text-sm text-muted-foreground">With {i.interviewer_name}</p>
                  {i.meeting_link && i.status === "SCHEDULED" && (
                    <Button asChild size="sm" className="mt-3"><a href={i.meeting_link} target="_blank" rel="noreferrer">Join Teams meeting</a></Button>
                  )}
                </Panel>
              ))}
            </div>
          )}
        </>
      );
    case "offer": {
      const o = d.offer;
      if (!o) return <><PageHeader title="My Offer" /><EmptyState title="No offer yet" description="You'll be notified here when an offer is ready." /></>;
      const canRespond = o.status === "SENT" || o.status === "CLARIFICATION_REQUESTED";
      const respond = (status: "ACCEPTED" | "REJECTED" | "CLARIFICATION_REQUESTED", msg: string) =>
        run(() => api.updateOfferStatus({ offer: o, status, actor, candidateUserId: user?.id ?? null, candidateName: me.name }), msg);
      return (
        <>
          <PageHeader title="My Offer" subtitle={o.position_title} />
          <Panel>
            <div className="flex items-center justify-between"><SectionTitle>{o.position_title}</SectionTitle><StatusBadge status={o.status} /></div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-muted-foreground">Department</dt><dd>{o.department ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Location</dt><dd>{o.location ?? "—"}</dd></div>
              <div><dt className="text-muted-foreground">Start date</dt><dd>{fmtDate(o.start_date)}</dd></div>
              <div><dt className="text-muted-foreground">Compensation</dt><dd>{o.compensation_band ?? "Shared separately"}</dd></div>
              <div><dt className="text-muted-foreground">Documents</dt><dd>{o.documents.join(", ") || "—"}</dd></div>
            </dl>
            {canRespond && (
              <div className="mt-5 flex flex-wrap gap-2">
                <Button onClick={() => respond("ACCEPTED", "Offer accepted")}>Accept offer</Button>
                <Button variant="outline" onClick={() => respond("CLARIFICATION_REQUESTED", "Clarification requested")}>Request clarification</Button>
                <Button variant="ghost" onClick={() => respond("REJECTED", "Offer declined")}>Decline</Button>
              </div>
            )}
          </Panel>
        </>
      );
    }
    case "onboarding":
      return (
        <>
          <PageHeader title="Onboarding" subtitle={`${d.tasks.filter((t) => t.status === "COMPLETED").length} of ${d.tasks.length} tasks done`} />
          {d.tasks.length === 0 ? <EmptyState title="Onboarding starts after you accept an offer" /> : (
            <Panel>
              <ul className="divide-y">
                {d.tasks.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-3">
                    <div><p className="text-sm font-medium">{t.task}</p><p className="text-xs text-muted-foreground">{t.description} · Owner {t.owner} · Due {fmtDate(t.due_date)}</p></div>
                    <StatusBadge status={t.status} />
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      );
    case "notifications":
      return (
        <>
          <PageHeader title="Notifications" />
          {d.notifications.length === 0 ? <EmptyState title="You're all caught up" /> : (
            <Panel>
              <ul className="divide-y">
                {d.notifications.map((n) => (
                  <li key={n.id} className="flex items-start justify-between gap-3 py-3">
                    <div><p className={cn("text-sm", !n.read_at && "font-medium")}>{n.title}</p><p className="text-xs text-muted-foreground">{n.body} · {fmtDateTime(n.created_at)}</p></div>
                    {!n.read_at && n.user_id === user?.id && <Button size="sm" variant="ghost" onClick={() => run(() => api.markNotificationRead(n.id), "Marked as read")}>Mark read</Button>}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      );
    case "profile":
      return (
        <>
          <PageHeader title="Profile" />
          <Panel>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[["Name", me.name], ["Email", me.email], ["Phone", me.phone], ["Location", me.location], ["Experience", `${me.total_experience} years`], ["Education", me.education], ["Current company", me.current_company]].map(([k, v]) => (
                <div key={k}><dt className="text-muted-foreground">{k}</dt><dd>{v ?? "—"}</dd></div>
              ))}
              <div className="sm:col-span-2"><dt className="text-muted-foreground">Skills</dt><dd className="mt-1 flex flex-wrap gap-1">{me.skills.map((s) => <span key={s} className="rounded-full border px-2 py-0.5 text-xs">{s}</span>)}</dd></div>
            </dl>
          </Panel>
        </>
      );
  }
}
