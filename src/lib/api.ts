/**
 * Data access layer. Every read/write goes through here so UI components never
 * talk to the database directly. Row-level security enforces role access:
 * staff see everything, candidates only their own rows.
 */

import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  defaultAiSettings,
  type AiSettings,
  type AppRole,
  type CandidateStatus,
  type OfferStatus,
  type RequirementStatus,
} from "@/lib/types";
import type { VendorInput } from "@/lib/services/vendorRanking";
import { screenCandidate } from "@/lib/services/candidateScreening";

type Tables = Database["public"]["Tables"];
export type Requirement = Tables["requirements"]["Row"];
export type Vendor = Tables["vendors"]["Row"];
export type VendorSkillScoreRow = Tables["vendor_skill_scores"]["Row"];
export type VendorPerformance = Tables["vendor_performance"]["Row"];
export type VendorScoreHistory = Tables["vendor_score_history"]["Row"];
export type Candidate = Tables["candidates"]["Row"];
export type Application = Tables["applications"]["Row"];
export type CandidateScore = Tables["candidate_scores"]["Row"];
export type Interview = Tables["interviews"]["Row"];
export type InterviewFeedback = Tables["interview_feedback"]["Row"];
export type Offer = Tables["offers"]["Row"];
export type OnboardingTask = Tables["onboarding_tasks"]["Row"];
export type Approval = Tables["approvals"]["Row"];
export type AuditEvent = Tables["audit_events"]["Row"];
export type Notification = Tables["notifications"]["Row"];
export type AiAgent = Tables["ai_agents"]["Row"];
export type SourcingRequest = Tables["sourcing_requests"]["Row"];
export type Profile = Tables["profiles"]["Row"];

function unwrap<T>({ data, error }: { data: T | null; error: { message: string } | null }): T {
  if (error) throw new Error(error.message);
  return (data ?? []) as T;
}

/* --------------------------------------------------------------- settings */

export async function fetchAiSettings(): Promise<AiSettings> {
  const { data, error } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "ai_settings")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data?.value) return defaultAiSettings;
  const v = data.value as Partial<AiSettings>;
  return {
    ...defaultAiSettings,
    ...v,
    weights: { ...defaultAiSettings.weights, ...(v.weights ?? {}) },
    recency: { ...defaultAiSettings.recency, ...(v.recency ?? {}) },
  };
}

export async function saveAiSettings(settings: AiSettings, actor: AuditActor): Promise<void> {
  const { error } = await supabase
    .from("app_settings")
    .update({ value: settings as never, updated_at: new Date().toISOString() })
    .eq("key", "ai_settings");
  if (error) throw new Error(error.message);
  await logAudit({
    ...actor,
    action: "AI settings updated",
    entity_type: "settings",
    entity_label: "Vendor ranking weights & recency",
    new_value: settings as never,
  });
}

/* ------------------------------------------------------------------ audit */

export type AuditActor = { user_id: string | null; actor_name: string | null; role: string | null };

export async function logAudit(input: {
  user_id?: string | null;
  actor_name?: string | null;
  role?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  entity_label?: string | null;
  previous_value?: unknown;
  new_value?: unknown;
  reason?: string | null;
  source?: "HUMAN" | "AI" | "SYSTEM";
}): Promise<void> {
  const { error } = await supabase.from("audit_events").insert({
    user_id: input.user_id ?? null,
    actor_name: input.actor_name ?? null,
    role: input.role ?? null,
    action: input.action,
    entity_type: input.entity_type,
    entity_id: input.entity_id ?? null,
    entity_label: input.entity_label ?? null,
    previous_value: (input.previous_value ?? null) as never,
    new_value: (input.new_value ?? null) as never,
    reason: input.reason ?? null,
    source: input.source ?? "HUMAN",
  });
  if (error) console.error("[audit]", error.message);
}

export async function fetchAuditEvents(limit = 200): Promise<AuditEvent[]> {
  return unwrap(
    await supabase.from("audit_events").select("*").order("created_at", { ascending: false }).limit(limit),
  );
}

/* ----------------------------------------------------------- notifications */

export async function fetchNotifications(role: AppRole | null, userId: string | null): Promise<Notification[]> {
  let query = supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
  if (role) query = query.or(`audience_role.eq.${role},user_id.eq.${userId ?? "00000000-0000-0000-0000-000000000000"}`);
  return unwrap(await query);
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function notify(input: {
  title: string;
  body?: string;
  category: string;
  audience_role?: AppRole | null;
  user_id?: string | null;
  link?: string | null;
}): Promise<void> {
  const { error } = await supabase.from("notifications").insert({
    title: input.title,
    body: input.body ?? null,
    category: input.category,
    audience_role: input.audience_role ?? null,
    user_id: input.user_id ?? null,
    link: input.link ?? null,
  });
  if (error) console.error("[notify]", error.message);
}

/* ----------------------------------------------------------- requirements */

export async function fetchRequirements(): Promise<Requirement[]> {
  return unwrap(await supabase.from("requirements").select("*").order("created_at", { ascending: false }));
}

export async function fetchRequirement(id: string): Promise<Requirement | null> {
  const { data, error } = await supabase.from("requirements").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export type RequirementDraft = {
  position_title: string;
  department: string;
  employment_type: string;
  experience_level: string;
  required_skills: string[];
  preferred_skills: string[];
  number_of_openings: number;
  location: string;
  work_mode: string;
  target_hiring_timeline: string;
  hiring_manager_name: string;
  priority: string;
  job_description: string;
  contract_document: string | null;
};

async function nextRequirementCode(): Promise<string> {
  const { data } = await supabase
    .from("requirements")
    .select("requirement_id")
    .order("requirement_id", { ascending: false })
    .limit(1);
  const last = data?.[0]?.requirement_id ?? "REQ-2090";
  const n = Number(last.replace(/\D/g, "")) || 2090;
  return `REQ-${n + 1}`;
}

export async function createRequirement(
  draft: RequirementDraft,
  submit: boolean,
  actor: AuditActor,
): Promise<Requirement> {
  const requirement_id = await nextRequirementCode();
  const { data, error } = await supabase
    .from("requirements")
    .insert({
      ...draft,
      requirement_id,
      status: submit ? "SUBMITTED" : "DRAFT",
      contract_status: draft.contract_document ? "PENDING" : "NOT_UPLOADED",
      created_by: actor.user_id,
      is_seed: false,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await logAudit({
    ...actor,
    action: submit ? "Requirement submitted" : "Requirement saved as draft",
    entity_type: "requirement",
    entity_id: data.id,
    entity_label: `${requirement_id} ${draft.position_title}`,
    new_value: { status: data.status },
  });
  if (submit) {
    await notify({
      title: `Requirement ${requirement_id} submitted`,
      body: `${draft.position_title} — ${draft.number_of_openings} opening(s) in ${draft.location}.`,
      category: "REQUIREMENT",
      audience_role: "HR_ADMIN",
      link: `/requirements/${data.id}`,
    });
  }
  return data;
}

export async function setRequirementStatus(
  requirement: Requirement,
  status: RequirementStatus,
  actor: AuditActor,
  reason?: string,
): Promise<void> {
  const { error } = await supabase
    .from("requirements")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", requirement.id);
  if (error) throw new Error(error.message);
  await logAudit({
    ...actor,
    action: `Requirement moved to ${status.replace(/_/g, " ").toLowerCase()}`,
    entity_type: "requirement",
    entity_id: requirement.id,
    entity_label: `${requirement.requirement_id} ${requirement.position_title}`,
    previous_value: { status: requirement.status },
    new_value: { status },
    reason: reason ?? null,
  });
}

export async function setContractDecision(
  requirement: Requirement,
  decision: "APPROVED" | "REJECTED" | "CORRECTION_REQUESTED",
  actor: AuditActor,
  reason?: string,
): Promise<void> {
  const { error } = await supabase
    .from("requirements")
    .update({ contract_status: decision, updated_at: new Date().toISOString() })
    .eq("id", requirement.id);
  if (error) throw new Error(error.message);
  await logAudit({
    ...actor,
    action: `Contract ${decision.replace(/_/g, " ").toLowerCase()}`,
    entity_type: "requirement",
    entity_id: requirement.id,
    entity_label: `${requirement.requirement_id} contract`,
    previous_value: { contract_status: requirement.contract_status },
    new_value: { contract_status: decision },
    reason: reason ?? null,
  });
  if (decision === "APPROVED" && requirement.status === "SUBMITTED") {
    await setRequirementStatus(requirement, "VENDOR_IDENTIFICATION", actor);
  }
}

/* ---------------------------------------------------------------- vendors */

export async function fetchVendors(): Promise<Vendor[]> {
  return unwrap(await supabase.from("vendors").select("*").order("overall_score", { ascending: false }));
}

export async function fetchVendorInputs(): Promise<VendorInput[]> {
  const [vendors, skills, performance] = await Promise.all([
    fetchVendors(),
    unwrap<VendorSkillScoreRow[]>(await supabase.from("vendor_skill_scores").select("*")),
    unwrap<VendorPerformance[]>(await supabase.from("vendor_performance").select("*")),
  ]);
  return vendors.map((v) => ({
    id: v.id,
    vendor_name: v.vendor_name,
    status: v.status,
    specialisations: v.specialisations,
    locations: v.locations,
    overall_score: v.overall_score,
    skillScores: skills
      .filter((s) => s.vendor_id === v.id)
      .map((s) => ({
        skill: s.skill,
        score: s.score,
        sample_size: s.sample_size,
        recent_score: s.recent_score,
        historical_score: s.historical_score,
        trend: s.trend,
      })),
    performance: performance
      .filter((p) => p.vendor_id === v.id)
      .map((p) => ({
        requirement_id: p.requirement_id,
        candidates_submitted: p.candidates_submitted,
        candidates_screened: p.candidates_screened,
        candidates_matched: p.candidates_matched,
        candidates_shortlisted: p.candidates_shortlisted,
        interviews: p.interviews,
        offers: p.offers,
        hires: p.hires,
        average_candidate_match_score: p.average_candidate_match_score,
        recorded_at: p.recorded_at,
      })),
  }));
}

export async function fetchVendor(id: string): Promise<Vendor | null> {
  const { data, error } = await supabase.from("vendors").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function fetchVendorSkillScores(vendorId: string): Promise<VendorSkillScoreRow[]> {
  return unwrap(
    await supabase.from("vendor_skill_scores").select("*").eq("vendor_id", vendorId).order("skill"),
  );
}

export async function fetchVendorPerformance(vendorId: string): Promise<VendorPerformance[]> {
  return unwrap(
    await supabase
      .from("vendor_performance")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("recorded_at", { ascending: false }),
  );
}

export async function fetchVendorScoreHistory(vendorId?: string): Promise<VendorScoreHistory[]> {
  let q = supabase.from("vendor_score_history").select("*").order("created_at", { ascending: false }).limit(200);
  if (vendorId) q = q.eq("vendor_id", vendorId);
  return unwrap(await q);
}

export async function selectVendorForRequirement(input: {
  vendorId: string;
  vendorName: string;
  requirement: Requirement;
  score: number;
  explanation: string;
  confidence: number;
  actor: AuditActor;
}): Promise<void> {
  const { error } = await supabase.from("approvals").insert({
    title: `Vendor selection — ${input.vendorName} for ${input.requirement.requirement_id}`,
    category: "VENDOR_SELECTION",
    entity_type: "vendor",
    entity_id: input.vendorId,
    requirement_id: input.requirement.id,
    assigned_role: "HR_ADMIN",
    responsible_name: input.actor.actor_name,
    status: "PENDING",
    ai_recommendation: "RECOMMEND",
    ai_score: input.score,
    ai_explanation: input.explanation,
    confidence: input.confidence,
    ai_factors: [] as never,
  });
  if (error) throw new Error(error.message);
  await logAudit({
    ...input.actor,
    action: "Vendor selected for approval",
    entity_type: "vendor",
    entity_id: input.vendorId,
    entity_label: `${input.vendorName} → ${input.requirement.requirement_id}`,
    new_value: { score: input.score },
  });
  await notify({
    title: "Vendor selection needs approval",
    body: `${input.vendorName} was selected for ${input.requirement.requirement_id}.`,
    category: "APPROVAL",
    audience_role: "HR_ADMIN",
    link: "/approvals",
  });
}

export async function requestSourcing(input: {
  vendorIds: string[];
  requirement: Requirement;
  candidates_requested: number;
  deadline: string | null;
  notes: string;
  actor: AuditActor;
}): Promise<void> {
  const rows = input.vendorIds.map((vendor_id) => ({
    vendor_id,
    requirement_id: input.requirement.id,
    candidates_requested: input.candidates_requested,
    deadline: input.deadline,
    notes: input.notes,
    status: "REQUESTED",
    requested_by: input.actor.user_id,
  }));
  const { error } = await supabase.from("sourcing_requests").insert(rows);
  if (error) throw new Error(error.message);
  await logAudit({
    ...input.actor,
    action: "Candidate sourcing requested",
    entity_type: "requirement",
    entity_id: input.requirement.id,
    entity_label: `${input.requirement.requirement_id} — ${input.vendorIds.length} vendor(s)`,
    new_value: { candidates_requested: input.candidates_requested, deadline: input.deadline },
  });
  if (input.requirement.status === "VENDOR_IDENTIFICATION") {
    await setRequirementStatus(input.requirement, "SOURCING", input.actor);
  }
}

export async function fetchSourcingRequests(requirementId?: string): Promise<SourcingRequest[]> {
  let q = supabase.from("sourcing_requests").select("*").order("created_at", { ascending: false });
  if (requirementId) q = q.eq("requirement_id", requirementId);
  return unwrap(await q);
}

/* ------------------------------------------------------------- candidates */

export async function fetchCandidates(): Promise<Candidate[]> {
  return unwrap(await supabase.from("candidates").select("*").order("created_at", { ascending: false }));
}

export async function fetchApplications(requirementId?: string): Promise<Application[]> {
  let q = supabase.from("applications").select("*").order("created_at", { ascending: false });
  if (requirementId) q = q.eq("requirement_id", requirementId);
  return unwrap(await q);
}

export async function fetchCandidateScores(requirementId?: string): Promise<CandidateScore[]> {
  let q = supabase.from("candidate_scores").select("*").order("overall_score", { ascending: false });
  if (requirementId) q = q.eq("requirement_id", requirementId);
  return unwrap(await q);
}

export async function fetchSkills(): Promise<Tables["skills"]["Row"][]> {
  return unwrap(await supabase.from("skills").select("*").order("name"));
}

export async function fetchProfiles(): Promise<Profile[]> {
  return unwrap(await supabase.from("profiles").select("*").order("name"));
}

export async function fetchUserRoles(): Promise<Tables["user_roles"]["Row"][]> {
  return unwrap(await supabase.from("user_roles").select("*"));
}

/**
 * Runs the deterministic screening service for a candidate and stores the
 * result. This is an AI recommendation only — no status changes happen here.
 */
export async function runScreening(input: {
  candidate: Candidate;
  requirement: Requirement;
  actor: AuditActor;
}): Promise<CandidateScore> {
  const result = screenCandidate(
    {
      id: input.candidate.id,
      name: input.candidate.name,
      location: input.candidate.location,
      total_experience: input.candidate.total_experience,
      education: input.candidate.education,
      skills: input.candidate.skills,
    },
    {
      id: input.requirement.id,
      position_title: input.requirement.position_title,
      required_skills: input.requirement.required_skills,
      preferred_skills: input.requirement.preferred_skills,
      location: input.requirement.location,
      experience_level: input.requirement.experience_level,
    },
  );

  const { data, error } = await supabase
    .from("candidate_scores")
    .upsert(
      {
        candidate_id: input.candidate.id,
        requirement_id: input.requirement.id,
        overall_score: result.overall_score,
        skill_scores: result.skill_scores as never,
        experience_score: result.experience_score,
        location_score: result.location_score,
        education_score: result.education_score,
        strengths: result.strengths,
        gaps: result.gaps,
        explanation: result.explanation,
        ai_recommendation: result.ai_recommendation,
        confidence: result.confidence,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "candidate_id,requirement_id" },
    )
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase
    .from("applications")
    .update({ stage: "SCREENING", match_score: result.overall_score, updated_at: new Date().toISOString() })
    .eq("candidate_id", input.candidate.id)
    .eq("requirement_id", input.requirement.id);

  await logAudit({
    ...input.actor,
    source: "AI",
    action: `AI screening produced a ${result.overall_score}% match`,
    entity_type: "candidate",
    entity_id: input.candidate.id,
    entity_label: `${input.candidate.name} — ${input.requirement.requirement_id}`,
    new_value: { overall_score: result.overall_score, ai_recommendation: result.ai_recommendation },
  });
  return data;
}

/* ------------------------------------- recruiter decision + feedback loop */

export async function recordRecruiterDecision(input: {
  application: Application;
  candidate: Candidate;
  requirement: Requirement;
  decision: "SHORTLIST" | "REJECT" | "REVIEW";
  reason: string;
  matchScore: number;
  actor: AuditActor;
}): Promise<void> {
  const nextStatus: CandidateStatus =
    input.decision === "SHORTLIST" ? "SHORTLISTED" : input.decision === "REJECT" ? "REJECTED" : "REVIEW";

  const { error } = await supabase
    .from("applications")
    .update({
      stage: nextStatus,
      status: input.decision === "REJECT" ? "CLOSED" : "ACTIVE",
      recruiter_decision: input.decision,
      recruiter_decision_reason: input.reason || null,
      decided_by: input.actor.user_id,
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.application.id);
  if (error) throw new Error(error.message);

  await supabase
    .from("candidates")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", input.candidate.id);

  await logAudit({
    ...input.actor,
    action: `Human decision: ${input.decision.toLowerCase()}`,
    entity_type: "application",
    entity_id: input.application.id,
    entity_label: `${input.candidate.name} — ${input.requirement.requirement_id}`,
    previous_value: { stage: input.application.stage },
    new_value: { stage: nextStatus },
    reason: input.reason || null,
  });

  if (input.candidate.vendor_id) {
    await applyVendorFeedback({
      vendorId: input.candidate.vendor_id,
      requirement: input.requirement,
      candidate: input.candidate,
      matchScore: input.matchScore,
      outcome: input.decision,
      actor: input.actor,
    });
  }

  await notify({
    title:
      input.decision === "SHORTLIST"
        ? `${input.candidate.name} shortlisted`
        : input.decision === "REJECT"
          ? `${input.candidate.name} not progressed`
          : `${input.candidate.name} sent for human review`,
    body: `${input.requirement.requirement_id} — ${input.requirement.position_title}.`,
    category: "CANDIDATE",
    audience_role: "HR_ADMIN",
    link: "/candidates",
  });
  if (input.candidate.user_id) {
    await notify({
      title: "Your application was updated",
      body:
        input.decision === "SHORTLIST"
          ? "You have been shortlisted. We will be in touch about interview scheduling."
          : input.decision === "REJECT"
            ? "Your application was not progressed for this role."
            : "Your application is under review.",
      category: "APPLICATION",
      user_id: input.candidate.user_id,
      link: "/portal/application",
    });
  }
}

/**
 * The vendor performance feedback loop: a candidate outcome updates the
 * vendor's performance counters, per-skill scores and overall score, and every
 * change is written to the immutable vendor score history.
 */
export async function applyVendorFeedback(input: {
  vendorId: string;
  requirement: Requirement;
  candidate: Candidate;
  matchScore: number;
  outcome: "SHORTLIST" | "REJECT" | "REVIEW" | "INTERVIEW" | "OFFER" | "HIRE";
  actor: AuditActor;
}): Promise<void> {
  const vendor = await fetchVendor(input.vendorId);
  if (!vendor) return;

  const { data: existing } = await supabase
    .from("vendor_performance")
    .select("*")
    .eq("vendor_id", input.vendorId)
    .eq("requirement_id", input.requirement.id)
    .maybeSingle();

  const base =
    existing ??
    ({
      candidates_submitted: 0,
      candidates_screened: 0,
      candidates_matched: 0,
      candidates_shortlisted: 0,
      interviews: 0,
      offers: 0,
      hires: 0,
      average_candidate_match_score: 0,
    } as VendorPerformance);

  const screened = base.candidates_screened + 1;
  const avg =
    (base.average_candidate_match_score * base.candidates_screened + input.matchScore) / Math.max(1, screened);

  const next = {
    vendor_id: input.vendorId,
    requirement_id: input.requirement.id,
    candidates_submitted: Math.max(base.candidates_submitted, screened),
    candidates_screened: screened,
    candidates_matched: base.candidates_matched + (input.matchScore >= 70 ? 1 : 0),
    candidates_shortlisted: base.candidates_shortlisted + (input.outcome === "SHORTLIST" ? 1 : 0),
    interviews: base.interviews + (input.outcome === "INTERVIEW" ? 1 : 0),
    offers: base.offers + (input.outcome === "OFFER" ? 1 : 0),
    hires: base.hires + (input.outcome === "HIRE" ? 1 : 0),
    average_candidate_match_score: Math.round(avg * 10) / 10,
    recorded_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabase.from("vendor_performance").update(next).eq("id", existing.id);
  } else {
    await supabase.from("vendor_performance").insert(next);
  }

  // Per-skill score update for each required skill the candidate actually has.
  const skillRows = await fetchVendorSkillScores(input.vendorId);
  const relevant = input.requirement.required_skills.filter((s) =>
    input.candidate.skills.some((c) => c.toLowerCase() === s.toLowerCase()),
  );

  for (const skill of relevant) {
    const row = skillRows.find((r) => r.skill.toLowerCase() === skill.toLowerCase());
    const previous = row?.score ?? null;
    const sample = (row?.sample_size ?? 0) + 1;
    const blended = previous == null ? input.matchScore : (previous * (sample - 1) + input.matchScore) / sample;
    const newScore = Math.round(blended * 10) / 10;
    const trend = previous == null ? "FLAT" : newScore > previous + 0.5 ? "UP" : newScore < previous - 0.5 ? "DOWN" : "FLAT";

    if (row) {
      await supabase
        .from("vendor_skill_scores")
        .update({
          score: newScore,
          sample_size: sample,
          recent_score: input.matchScore,
          historical_score: previous,
          trend,
          last_updated: new Date().toISOString(),
        })
        .eq("id", row.id);
    } else {
      await supabase.from("vendor_skill_scores").insert({
        vendor_id: input.vendorId,
        skill,
        score: newScore,
        sample_size: sample,
        recent_score: input.matchScore,
        historical_score: null,
        trend,
      });
    }

    await supabase.from("vendor_score_history").insert({
      vendor_id: input.vendorId,
      requirement_id: input.requirement.id,
      skill,
      previous_score: previous,
      new_score: newScore,
      source_candidate_id: input.candidate.id,
      source: "AI",
      reason: `Vendor score updated because candidate ${input.candidate.name} achieved a ${input.matchScore}% match for the ${input.requirement.position_title} requirement.`,
    });
  }

  // Recompute the vendor's overall score from its refreshed skill scores.
  const refreshed = await fetchVendorSkillScores(input.vendorId);
  if (refreshed.length) {
    const overall = Math.round((refreshed.reduce((a, r) => a + r.score, 0) / refreshed.length) * 10) / 10;
    if (Math.abs(overall - vendor.overall_score) >= 0.1) {
      await supabase
        .from("vendors")
        .update({ overall_score: overall, updated_at: new Date().toISOString() })
        .eq("id", input.vendorId);
      await supabase.from("vendor_score_history").insert({
        vendor_id: input.vendorId,
        requirement_id: input.requirement.id,
        skill: null,
        previous_score: vendor.overall_score,
        new_score: overall,
        source_candidate_id: input.candidate.id,
        source: "AI",
        reason: `Overall score recalculated from ${refreshed.length} skill scores after ${input.candidate.name}'s ${input.matchScore}% match.`,
      });
      await logAudit({
        ...input.actor,
        source: "AI",
        action: `Vendor overall score recalculated ${vendor.overall_score} → ${overall}`,
        entity_type: "vendor",
        entity_id: input.vendorId,
        entity_label: vendor.vendor_name,
        previous_value: { overall_score: vendor.overall_score },
        new_value: { overall_score: overall },
      });
    }
  }
}

/* ------------------------------------------------------------- interviews */

export async function fetchInterviews(): Promise<Interview[]> {
  return unwrap(await supabase.from("interviews").select("*").order("scheduled_at", { ascending: true }));
}

export async function fetchInterviewFeedback(): Promise<InterviewFeedback[]> {
  return unwrap(await supabase.from("interview_feedback").select("*").order("created_at", { ascending: false }));
}

export async function scheduleInterview(input: {
  application: Application;
  candidate: Candidate;
  requirement: Requirement;
  interviewer_name: string;
  interviewer_email: string;
  scheduled_at: string;
  duration_minutes: number;
  mode: string;
  round: string;
  actor: AuditActor;
}): Promise<void> {
  const { error } = await supabase.from("interviews").insert({
    application_id: input.application.id,
    candidate_id: input.candidate.id,
    requirement_id: input.requirement.id,
    interviewer_name: input.interviewer_name,
    interviewer_email: input.interviewer_email || null,
    scheduled_at: input.scheduled_at,
    duration_minutes: input.duration_minutes,
    mode: input.mode,
    round: input.round,
    status: "SCHEDULED",
    // Simulated meeting link — the Teams/Outlook adapter is not connected yet.
    meeting_link: `https://teams.microsoft.com/l/meetup-join/hireflow-demo/${input.application.application_id.toLowerCase()}`,
  });
  if (error) throw new Error(error.message);

  await supabase.from("applications").update({ stage: "INTERVIEW" }).eq("id", input.application.id);
  await supabase.from("candidates").update({ status: "INTERVIEW" }).eq("id", input.candidate.id);

  await logAudit({
    ...input.actor,
    action: "Interview scheduled",
    entity_type: "interview",
    entity_id: input.application.id,
    entity_label: `${input.candidate.name} — ${input.requirement.requirement_id}`,
    new_value: { scheduled_at: input.scheduled_at, interviewer: input.interviewer_name },
  });
  if (input.candidate.user_id) {
    await notify({
      title: "Your interview is scheduled",
      body: `${new Date(input.scheduled_at).toLocaleString()} — ${input.mode}.`,
      category: "INTERVIEW",
      user_id: input.candidate.user_id,
      link: "/portal/interview",
    });
  }
  await notify({
    title: `Interview scheduled for ${input.candidate.name}`,
    category: "INTERVIEW",
    audience_role: "MANAGER",
    link: "/interviews",
  });
}

export async function updateInterview(
  interview: Interview,
  patch: Partial<Tables["interviews"]["Update"]>,
  action: string,
  actor: AuditActor,
  reason?: string,
): Promise<void> {
  const { error } = await supabase
    .from("interviews")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", interview.id);
  if (error) throw new Error(error.message);
  await logAudit({
    ...actor,
    action,
    entity_type: "interview",
    entity_id: interview.id,
    previous_value: { status: interview.status, scheduled_at: interview.scheduled_at },
    new_value: patch as never,
    reason: reason ?? null,
  });
}

export async function submitInterviewFeedback(input: {
  interview: Interview;
  candidateName: string;
  technical_capability: string;
  communication: string;
  problem_solving: string;
  strengths: string;
  concerns: string;
  overall_recommendation: string;
  actor: AuditActor;
}): Promise<void> {
  const ratings = [input.technical_capability, input.communication, input.problem_solving];
  const strong = ratings.filter((r) => r === "STRONG").length;
  const weak = ratings.filter((r) => r === "WEAK").length;
  const ai_recommendation = strong >= 2 && weak === 0 ? "PROCEED" : weak >= 2 ? "DO_NOT_PROCEED" : "DISCUSS";
  const ai_summary = `Simulated AI summary: ${input.candidateName} was rated technical ${input.technical_capability.toLowerCase()}, communication ${input.communication.toLowerCase()}, problem solving ${input.problem_solving.toLowerCase()}. ${
    input.strengths ? `Strengths noted: ${input.strengths}. ` : ""
  }${input.concerns ? `Concerns noted: ${input.concerns}. ` : ""}Interviewer recommendation is ${input.overall_recommendation.replace(/_/g, " ").toLowerCase()}. A human approval is required before any offer.`;

  const { error } = await supabase.from("interview_feedback").insert({
    interview_id: input.interview.id,
    technical_capability: input.technical_capability,
    communication: input.communication,
    problem_solving: input.problem_solving,
    strengths: input.strengths || null,
    concerns: input.concerns || null,
    overall_recommendation: input.overall_recommendation,
    ai_summary,
    ai_recommendation,
    submitted_by: input.actor.user_id,
    submitted_by_name: input.actor.actor_name,
  });
  if (error) throw new Error(error.message);

  await supabase
    .from("interviews")
    .update({ status: "COMPLETED", updated_at: new Date().toISOString() })
    .eq("id", input.interview.id);
  await supabase
    .from("applications")
    .update({ stage: "INTERVIEW_COMPLETED" })
    .eq("id", input.interview.application_id);
  await supabase
    .from("candidates")
    .update({ status: "INTERVIEW_COMPLETED" })
    .eq("id", input.interview.candidate_id);

  await supabase.from("approvals").insert({
    title: `Interview outcome — ${input.candidateName}`,
    category: "INTERVIEW_OUTCOME",
    entity_type: "interview",
    entity_id: input.interview.id,
    requirement_id: input.interview.requirement_id,
    assigned_role: "HR_ADMIN",
    responsible_name: input.actor.actor_name,
    status: "PENDING",
    ai_recommendation,
    ai_explanation: ai_summary,
    confidence: 0.7,
    ai_factors: [] as never,
  });

  await logAudit({
    ...input.actor,
    action: "Interview feedback submitted",
    entity_type: "interview",
    entity_id: input.interview.id,
    entity_label: input.candidateName,
    new_value: { overall_recommendation: input.overall_recommendation },
  });
  await notify({
    title: `Interview feedback received for ${input.candidateName}`,
    category: "FEEDBACK",
    audience_role: "HR_ADMIN",
    link: "/interviews",
  });
}

/* -------------------------------------------------------------- approvals */

export async function fetchApprovals(): Promise<Approval[]> {
  return unwrap(await supabase.from("approvals").select("*").order("created_at", { ascending: false }));
}

export async function decideApproval(input: {
  approval: Approval;
  decision: "APPROVED" | "REJECTED" | "REVIEW_REQUESTED";
  reason: string;
  actor: AuditActor;
}): Promise<void> {
  const { error } = await supabase
    .from("approvals")
    .update({
      status: input.decision,
      decision_reason: input.reason || null,
      decided_by: input.actor.user_id,
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.approval.id);
  if (error) throw new Error(error.message);

  await logAudit({
    ...input.actor,
    action: `Approval ${input.decision.replace(/_/g, " ").toLowerCase()}`,
    entity_type: "approval",
    entity_id: input.approval.id,
    entity_label: input.approval.title,
    previous_value: { status: input.approval.status },
    new_value: { status: input.decision },
    reason: input.reason || null,
  });

  // Offer approvals move the offer forward.
  if (input.approval.category === "OFFER_APPROVAL" && input.approval.entity_id) {
    const nextStatus: OfferStatus = input.decision === "APPROVED" ? "APPROVED" : "DRAFT";
    await supabase
      .from("offers")
      .update({
        status: nextStatus,
        approved_by: input.decision === "APPROVED" ? input.actor.user_id : null,
        approved_at: input.decision === "APPROVED" ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", input.approval.entity_id);
  }
}

/* ----------------------------------------------------------------- offers */

export async function fetchOffers(): Promise<Offer[]> {
  return unwrap(await supabase.from("offers").select("*").order("created_at", { ascending: false }));
}

export async function createOffer(input: {
  application: Application;
  candidate: Candidate;
  requirement: Requirement;
  start_date: string;
  compensation_band: string;
  location: string;
  employment_type: string;
  actor: AuditActor;
}): Promise<void> {
  const { data, error } = await supabase
    .from("offers")
    .insert({
      application_id: input.application.id,
      candidate_id: input.candidate.id,
      requirement_id: input.requirement.id,
      position_title: input.requirement.position_title,
      department: input.requirement.department,
      start_date: input.start_date || null,
      compensation_band: input.compensation_band,
      location: input.location,
      employment_type: input.employment_type,
      status: "PENDING_APPROVAL",
      documents: ["Offer letter (draft)"],
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);

  await supabase.from("approvals").insert({
    title: `Offer approval — ${input.candidate.name}`,
    category: "OFFER_APPROVAL",
    entity_type: "offer",
    entity_id: data.id,
    requirement_id: input.requirement.id,
    assigned_role: "HR_ADMIN",
    responsible_name: input.actor.actor_name,
    status: "PENDING",
    ai_recommendation: "DRAFTED",
    ai_explanation:
      "Simulated offer drafting agent prepared this offer from the requirement and the interview outcome. Compensation is never set or negotiated by AI — a human must approve the band.",
    confidence: 0.6,
    ai_factors: [] as never,
  });

  await supabase.from("applications").update({ stage: "OFFER" }).eq("id", input.application.id);
  await supabase.from("candidates").update({ status: "OFFER" }).eq("id", input.candidate.id);

  await logAudit({
    ...input.actor,
    action: "Offer drafted and sent for approval",
    entity_type: "offer",
    entity_id: data.id,
    entity_label: `${input.candidate.name} — ${input.requirement.position_title}`,
    new_value: { compensation_band: input.compensation_band, start_date: input.start_date },
  });
  await notify({
    title: `Offer ready for approval — ${input.candidate.name}`,
    category: "OFFER",
    audience_role: "HR_ADMIN",
    link: "/offers",
  });
}

export async function updateOfferStatus(input: {
  offer: Offer;
  status: OfferStatus;
  actor: AuditActor;
  reason?: string;
  candidateUserId?: string | null;
  candidateName?: string | undefined;
}): Promise<void> {
  const patch: Tables["offers"]["Update"] = { status: input.status, updated_at: new Date().toISOString() };
  if (input.status === "ACCEPTED") patch.accepted_at = new Date().toISOString();
  if (input.status === "APPROVED") {
    patch.approved_at = new Date().toISOString();
    patch.approved_by = input.actor.user_id;
  }
  if (input.status === "CLARIFICATION_REQUESTED") patch.clarification_note = input.reason ?? null;

  const { error } = await supabase.from("offers").update(patch).eq("id", input.offer.id);
  if (error) throw new Error(error.message);

  await logAudit({
    ...input.actor,
    action: `Offer ${input.status.replace(/_/g, " ").toLowerCase()}`,
    entity_type: "offer",
    entity_id: input.offer.id,
    entity_label: input.candidateName ?? input.offer.position_title,
    previous_value: { status: input.offer.status },
    new_value: { status: input.status },
    reason: input.reason ?? null,
  });

  if (input.status === "SENT" && input.candidateUserId) {
    await notify({
      title: "Your offer is available",
      body: `${input.offer.position_title} — review and respond in your portal.`,
      category: "OFFER",
      user_id: input.candidateUserId,
      link: "/portal/offer",
    });
  }

  if (input.status === "ACCEPTED") {
    await supabase.from("candidates").update({ status: "HIRED" }).eq("id", input.offer.candidate_id);
    await supabase.from("applications").update({ stage: "HIRED" }).eq("id", input.offer.application_id);
    await startOnboarding({ offer: input.offer, actor: input.actor, candidateName: input.candidateName });
  }
}

/* ------------------------------------------------------------- onboarding */

const ONBOARDING_TEMPLATE = [
  { task: "Welcome email", owner: "HR", category: "HR", description: "Send the welcome pack and first-day details.", offsetDays: 1 },
  { task: "IT access request", owner: "IT", category: "IT", description: "Laptop, email, VPN and tool access.", offsetDays: 3 },
  { task: "Document submission", owner: "Candidate", category: "DOCUMENTS", description: "ID proof, education certificates and previous employment letters.", offsetDays: 5 },
  { task: "Orientation session", owner: "HR", category: "ORIENTATION", description: "Company orientation and policy walkthrough.", offsetDays: 7 },
  { task: "Manager introduction", owner: "Manager", category: "MANAGER", description: "Team introduction and first-week plan.", offsetDays: 8 },
];

export async function startOnboarding(input: {
  offer: Offer;
  actor: AuditActor;
  candidateName?: string | undefined;
}): Promise<void> {
  const { data: existing } = await supabase
    .from("onboarding_tasks")
    .select("id")
    .eq("candidate_id", input.offer.candidate_id)
    .limit(1);
  if (existing?.length) return;

  const start = input.offer.start_date ? new Date(input.offer.start_date) : new Date();
  const rows = ONBOARDING_TEMPLATE.map((t, i) => ({
    candidate_id: input.offer.candidate_id,
    offer_id: input.offer.id,
    requirement_id: input.offer.requirement_id,
    task: t.task,
    owner: t.owner,
    category: t.category,
    description: t.description,
    status: i === 0 ? "IN_PROGRESS" : "PENDING",
    due_date: new Date(start.getTime() + t.offsetDays * 86_400_000).toISOString().slice(0, 10),
    sort_order: i,
  }));
  const { error } = await supabase.from("onboarding_tasks").insert(rows);
  if (error) throw new Error(error.message);

  await logAudit({
    ...input.actor,
    source: "SYSTEM",
    action: "Onboarding started automatically after offer acceptance",
    entity_type: "onboarding",
    entity_id: input.offer.candidate_id,
    entity_label: input.candidateName ?? input.offer.position_title,
    new_value: { tasks: rows.length },
  });
  await notify({
    title: `Onboarding started for ${input.candidateName ?? "new hire"}`,
    category: "ONBOARDING",
    audience_role: "HR_ADMIN",
    link: "/onboarding",
  });
}

export async function fetchOnboardingTasks(): Promise<OnboardingTask[]> {
  return unwrap(
    await supabase.from("onboarding_tasks").select("*").order("sort_order", { ascending: true }),
  );
}

export async function updateOnboardingTask(input: {
  task: OnboardingTask;
  status: string;
  actor: AuditActor;
}): Promise<void> {
  const { error } = await supabase
    .from("onboarding_tasks")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.task.id);
  if (error) throw new Error(error.message);
  await logAudit({
    ...input.actor,
    action: `Onboarding task ${input.status.replace(/_/g, " ").toLowerCase()}`,
    entity_type: "onboarding",
    entity_id: input.task.id,
    entity_label: input.task.task,
    previous_value: { status: input.task.status },
    new_value: { status: input.status },
  });
}

/* -------------------------------------------------------------- ai agents */

export async function fetchAiAgents(): Promise<AiAgent[]> {
  return unwrap(await supabase.from("ai_agents").select("*").order("sort_order"));
}

export async function recordAgentRun(agentKey: string): Promise<void> {
  const { data } = await supabase
    .from("ai_agents")
    .select("id, executions")
    .eq("agent_key", agentKey)
    .maybeSingle();
  if (!data) return;
  await supabase
    .from("ai_agents")
    .update({ executions: data.executions + 1, last_execution: new Date().toISOString() })
    .eq("id", data.id);
}
