/**
 * HireFlow AI — domain types and workflow state machines.
 * Business vocabulary lives here so UI, services and data access agree.
 */

export type AppRole = "HR_ADMIN" | "MANAGER" | "CANDIDATE";

export const REQUIREMENT_STATES = [
  "DRAFT",
  "SUBMITTED",
  "CONTRACT_VALIDATION",
  "VENDOR_IDENTIFICATION",
  "SOURCING",
  "SCREENING",
  "RECRUITER_REVIEW",
  "INTERVIEW",
  "FEEDBACK",
  "OFFER",
  "ONBOARDING",
  "COMPLETED",
  "ON_HOLD",
] as const;
export type RequirementStatus = (typeof REQUIREMENT_STATES)[number];

export const CANDIDATE_STATES = [
  "RECEIVED",
  "SCREENING",
  "REVIEW",
  "SHORTLISTED",
  "REJECTED",
  "INTERVIEW",
  "INTERVIEW_COMPLETED",
  "SELECTED",
  "OFFER",
  "HIRED",
] as const;
export type CandidateStatus = (typeof CANDIDATE_STATES)[number];

export const OFFER_STATES = [
  "DRAFT",
  "PENDING_APPROVAL",
  "APPROVED",
  "SENT",
  "ACCEPTED",
  "REJECTED",
  "CLARIFICATION_REQUESTED",
] as const;
export type OfferStatus = (typeof OFFER_STATES)[number];

export const ONBOARDING_STATES = ["PENDING", "IN_PROGRESS", "COMPLETED", "BLOCKED"] as const;
export type OnboardingTaskStatus = (typeof ONBOARDING_STATES)[number];

/** Allowed forward transitions. Nothing in the app sets a status outside this map. */
export const requirementTransitions: Record<RequirementStatus, RequirementStatus[]> = {
  DRAFT: ["SUBMITTED", "ON_HOLD"],
  SUBMITTED: ["CONTRACT_VALIDATION", "ON_HOLD"],
  CONTRACT_VALIDATION: ["VENDOR_IDENTIFICATION", "ON_HOLD"],
  VENDOR_IDENTIFICATION: ["SOURCING", "ON_HOLD"],
  SOURCING: ["SCREENING", "ON_HOLD"],
  SCREENING: ["RECRUITER_REVIEW", "ON_HOLD"],
  RECRUITER_REVIEW: ["INTERVIEW", "ON_HOLD"],
  INTERVIEW: ["FEEDBACK", "ON_HOLD"],
  FEEDBACK: ["OFFER", "ON_HOLD"],
  OFFER: ["ONBOARDING", "ON_HOLD"],
  ONBOARDING: ["COMPLETED", "ON_HOLD"],
  COMPLETED: [],
  ON_HOLD: ["SUBMITTED", "SOURCING", "SCREENING"],
};

export const candidateTransitions: Record<CandidateStatus, CandidateStatus[]> = {
  RECEIVED: ["SCREENING", "REJECTED"],
  SCREENING: ["REVIEW", "REJECTED"],
  REVIEW: ["SHORTLISTED", "REJECTED"],
  SHORTLISTED: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["INTERVIEW_COMPLETED", "REJECTED"],
  INTERVIEW_COMPLETED: ["SELECTED", "REJECTED"],
  SELECTED: ["OFFER", "REJECTED"],
  OFFER: ["HIRED", "REJECTED"],
  HIRED: [],
  REJECTED: [],
};

export const offerTransitions: Record<OfferStatus, OfferStatus[]> = {
  DRAFT: ["PENDING_APPROVAL"],
  PENDING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["SENT"],
  SENT: ["ACCEPTED", "REJECTED", "CLARIFICATION_REQUESTED"],
  CLARIFICATION_REQUESTED: ["SENT", "ACCEPTED", "REJECTED"],
  ACCEPTED: [],
  REJECTED: [],
};

export function canTransition<T extends string>(
  map: Record<T, T[]>,
  from: T,
  to: T,
): boolean {
  return (map[from] ?? []).includes(to);
}

/** The ordered candidate-facing journey used by timelines. */
export const candidateJourney = [
  { key: "APPLICATION_SUBMITTED", label: "Application submitted" },
  { key: "RESUME_SCREENING", label: "Resume screening" },
  { key: "RECRUITER_REVIEW", label: "Recruiter review" },
  { key: "INTERVIEW", label: "Interview" },
  { key: "OFFER", label: "Offer" },
  { key: "ONBOARDING", label: "Onboarding" },
] as const;

export function journeyIndexForStage(stage: string): number {
  switch (stage) {
    case "RECEIVED":
      return 0;
    case "SCREENING":
      return 1;
    case "REVIEW":
      return 2;
    case "SHORTLISTED":
    case "INTERVIEW":
      return 3;
    case "INTERVIEW_COMPLETED":
    case "SELECTED":
      return 3;
    case "OFFER":
      return 4;
    case "HIRED":
      return 5;
    default:
      return 0;
  }
}

export type RankingWeights = {
  skillFit: number;
  candidateQuality: number;
  recentPerformance: number;
  shortlistConversion: number;
  interviewConversion: number;
  hiringConversion: number;
};

export type RecencyConfig = {
  recentDays: number;
  midDays: number;
  recentWeight: number;
  midWeight: number;
  olderWeight: number;
};

export type AiSettings = {
  weights: RankingWeights;
  recency: RecencyConfig;
  minimumConfidence: number;
  requireHumanApproval: boolean;
  minimumSampleSize: number;
};

export const defaultAiSettings: AiSettings = {
  weights: {
    skillFit: 40,
    candidateQuality: 20,
    recentPerformance: 15,
    shortlistConversion: 10,
    interviewConversion: 5,
    hiringConversion: 10,
  },
  recency: {
    recentDays: 90,
    midDays: 180,
    recentWeight: 1,
    midWeight: 0.6,
    olderWeight: 0.3,
  },
  minimumConfidence: 0.6,
  requireHumanApproval: true,
  minimumSampleSize: 3,
};

export const weightLabels: Record<keyof RankingWeights, string> = {
  skillFit: "Skill fit",
  candidateQuality: "Candidate quality",
  recentPerformance: "Recent performance",
  shortlistConversion: "Shortlist conversion",
  interviewConversion: "Interview conversion",
  hiringConversion: "Hiring conversion",
};

/** Structured output contract every AI agent must honour. */
export type AgentResult<T = Record<string, unknown>> = {
  recommendation: string;
  confidence: number;
  explanation: string;
  factors: { label: string; value: string }[];
  requiresHumanApproval: true;
  data: T;
};
