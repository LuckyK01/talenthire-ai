/**
 * VendorRankingService — the core differentiator.
 *
 * Pure, testable scoring. No UI, no data access. Weights and recency
 * behaviour are configuration, never hardcoded in components.
 */

import type { AiSettings, RankingWeights, RecencyConfig } from "@/lib/types";
import { weightLabels } from "@/lib/types";

export type VendorSkillScore = {
  skill: string;
  score: number;
  sample_size: number;
  recent_score: number | null;
  historical_score: number | null;
  trend: string;
};

export type VendorPerformanceRow = {
  requirement_id: string | null;
  candidates_submitted: number;
  candidates_screened: number;
  candidates_matched: number;
  candidates_shortlisted: number;
  interviews: number;
  offers: number;
  hires: number;
  average_candidate_match_score: number;
  recorded_at: string;
};

export type VendorInput = {
  id: string;
  vendor_name: string;
  status: string;
  specialisations: string[];
  locations: string[];
  overall_score: number;
  skillScores: VendorSkillScore[];
  performance: VendorPerformanceRow[];
};

export type RequirementInput = {
  id: string;
  requirement_id: string;
  position_title: string;
  required_skills: string[];
  preferred_skills: string[];
  location: string | null;
};

export type ScoreComponent = {
  key: keyof RankingWeights;
  label: string;
  value: number;
  weight: number;
  contribution: number;
  note?: string | undefined;
};

export type RankedVendor = {
  vendor: VendorInput;
  rank: number;
  overallScore: number;
  components: ScoreComponent[];
  skillBreakdown: { skill: string; score: number; trend: string; sampleSize: number }[];
  candidateQuality: number;
  recentPerformance: number;
  historicalPerformance: number;
  shortlistRate: number;
  interviewRate: number;
  offerRate: number;
  hiringRate: number;
  candidatesSubmitted: number;
  trend: "UP" | "DOWN" | "FLAT";
  limitedHistory: boolean;
  aiRecommendation: "RECOMMEND" | "CONSIDER" | "WEAK" | "LIMITED_DATA";
  confidence: number;
  explanation: string;
};

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const pct = (num: number, den: number) => (den > 0 ? clamp((num / den) * 100) : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

export function recencyWeightFor(recordedAt: string, cfg: RecencyConfig, now = new Date()): number {
  const ageDays = (now.getTime() - new Date(recordedAt).getTime()) / 86_400_000;
  if (ageDays <= cfg.recentDays) return cfg.recentWeight;
  if (ageDays <= cfg.midDays) return cfg.midWeight;
  return cfg.olderWeight;
}

/** Recency-weighted average match score across a vendor's performance records. */
export function weightedPerformance(
  rows: VendorPerformanceRow[],
  cfg: RecencyConfig,
  now = new Date(),
): number {
  const scored = rows.filter((r) => r.candidates_submitted > 0);
  if (scored.length === 0) return 0;
  let weightSum = 0;
  let total = 0;
  for (const row of scored) {
    const w = recencyWeightFor(row.recorded_at, cfg, now) * Math.max(1, row.candidates_submitted);
    weightSum += w;
    total += w * row.average_candidate_match_score;
  }
  return weightSum > 0 ? clamp(total / weightSum) : 0;
}

/** Blended skill score: recent outcomes count for more than older ones. */
export function blendedSkillScore(row: VendorSkillScore, cfg: RecencyConfig): number {
  const recent = row.recent_score;
  const historical = row.historical_score;
  if (recent == null && historical == null) return clamp(row.score);
  if (recent == null) return clamp(historical ?? row.score);
  if (historical == null) return clamp(recent);
  const rw = cfg.recentWeight;
  const hw = cfg.olderWeight;
  return clamp((recent * rw + historical * hw) / (rw + hw));
}

export function skillFitFor(
  vendor: VendorInput,
  requirement: RequirementInput,
  cfg: RecencyConfig,
): { value: number; covered: number; missing: string[] } {
  const required = requirement.required_skills.length
    ? requirement.required_skills
    : requirement.preferred_skills;
  if (required.length === 0) return { value: clamp(vendor.overall_score), covered: 0, missing: [] };

  const missing: string[] = [];
  let sum = 0;
  let covered = 0;
  for (const skill of required) {
    const row = vendor.skillScores.find((s) => s.skill.toLowerCase() === skill.toLowerCase());
    if (!row) {
      missing.push(skill);
      // Unproven skill: neutral 55 rather than a fabricated strength.
      sum += 55;
      continue;
    }
    covered += 1;
    sum += blendedSkillScore(row, cfg);
  }
  // Preferred skills give a small uplift when proven.
  const preferredRows = requirement.preferred_skills
    .map((s) => vendor.skillScores.find((r) => r.skill.toLowerCase() === s.toLowerCase()))
    .filter(Boolean) as VendorSkillScore[];
  const base = sum / required.length;
  const uplift =
    preferredRows.length > 0
      ? (preferredRows.reduce((a, r) => a + blendedSkillScore(r, cfg), 0) / preferredRows.length -
          base) *
        0.1
      : 0;
  return { value: clamp(base + uplift), covered, missing };
}

function trendOf(vendor: VendorInput): "UP" | "DOWN" | "FLAT" {
  const counts: Record<string, number> = { UP: 0, DOWN: 0, FLAT: 0 };
  for (const s of vendor.skillScores) counts[s.trend] = (counts[s.trend] ?? 0) + 1;
  const up = counts["UP"] ?? 0;
  const down = counts["DOWN"] ?? 0;
  if (up > down) return "UP";
  if (down > up) return "DOWN";
  return "FLAT";
}

export function scoreVendor(
  vendor: VendorInput,
  requirement: RequirementInput,
  settings: AiSettings,
  now = new Date(),
): Omit<RankedVendor, "rank"> {
  const { weights, recency } = settings;
  const global = vendor.performance.find((p) => p.requirement_id === null);
  const perRequirement = vendor.performance.filter((p) => p.requirement_id !== null);
  const all = vendor.performance;

  const submitted = all.reduce((a, p) => a + p.candidates_submitted, 0);
  const shortlisted = all.reduce((a, p) => a + p.candidates_shortlisted, 0);
  const interviews = all.reduce((a, p) => a + p.interviews, 0);
  const offers = all.reduce((a, p) => a + p.offers, 0);
  const hires = all.reduce((a, p) => a + p.hires, 0);

  const totalSubmitted = global ? global.candidates_submitted : submitted;
  const limitedHistory = totalSubmitted < Math.max(settings.minimumSampleSize, 3);

  const fit = skillFitFor(vendor, requirement, recency);
  const candidateQuality = global
    ? clamp(global.average_candidate_match_score)
    : weightedPerformance(perRequirement, recency, now);
  const recentPerformance = weightedPerformance(
    perRequirement.length > 0 ? perRequirement : all,
    recency,
    now,
  );
  const historicalPerformance = global ? clamp(global.average_candidate_match_score) : 0;

  const shortlistRate = pct(shortlisted, submitted);
  const interviewRate = pct(interviews, submitted);
  const offerRate = pct(offers, submitted);
  const hiringRate = pct(hires, submitted);

  const raw: ScoreComponent[] = [
    {
      key: "skillFit",
      label: weightLabels.skillFit,
      value: round1(fit.value),
      weight: weights.skillFit,
      contribution: 0,
      note: fit.missing.length
        ? `No proven history for ${fit.missing.join(", ")} — scored neutral.`
        : undefined,
    },
    {
      key: "candidateQuality",
      label: weightLabels.candidateQuality,
      value: round1(candidateQuality),
      weight: weights.candidateQuality,
      contribution: 0,
    },
    {
      key: "recentPerformance",
      label: weightLabels.recentPerformance,
      value: round1(recentPerformance),
      weight: weights.recentPerformance,
      contribution: 0,
    },
    {
      key: "shortlistConversion",
      label: weightLabels.shortlistConversion,
      value: round1(shortlistRate),
      weight: weights.shortlistConversion,
      contribution: 0,
    },
    {
      key: "interviewConversion",
      label: weightLabels.interviewConversion,
      value: round1(interviewRate),
      weight: weights.interviewConversion,
      contribution: 0,
    },
    {
      key: "hiringConversion",
      label: weightLabels.hiringConversion,
      value: round1(hiringRate),
      weight: weights.hiringConversion,
      contribution: 0,
    },
  ];

  const totalWeight = raw.reduce((a, c) => a + c.weight, 0) || 100;
  const components = raw.map((c) => ({
    ...c,
    contribution: round1((c.value * c.weight) / totalWeight),
  }));

  // Full weighted model when there is history; skill-fit-led fallback when not.
  const weighted = components.reduce((a, c) => a + c.contribution, 0);
  const fallback = fit.value * 0.8 + candidateQuality * 0.2;
  const overallScore = round1(clamp(limitedHistory ? fallback : weighted));

  const confidence = clamp(
    limitedHistory ? 45 + Math.min(totalSubmitted, 3) * 5 : 60 + Math.min(totalSubmitted, 40),
  ) / 100;

  let aiRecommendation: RankedVendor["aiRecommendation"];
  if (limitedHistory) aiRecommendation = "LIMITED_DATA";
  else if (overallScore >= 85) aiRecommendation = "RECOMMEND";
  else if (overallScore >= 72) aiRecommendation = "CONSIDER";
  else aiRecommendation = "WEAK";

  const strongSkills = vendor.skillScores
    .filter((s) => requirement.required_skills.some((r) => r.toLowerCase() === s.skill.toLowerCase()))
    .filter((s) => blendedSkillScore(s, recency) >= 80)
    .map((s) => s.skill);

  const explanation = limitedHistory
    ? `Limited historical data — only ${totalSubmitted} submission${totalSubmitted === 1 ? "" : "s"} on record. Score is based on skill fit (${round1(fit.value)}) and available candidate quality rather than conversion history.`
    : `Scored ${overallScore} for ${requirement.position_title}. ${
        strongSkills.length
          ? `Strong proven performance for ${strongSkills.join(", ")}. `
          : "No required skill reaches the strong band. "
      }Average candidate match score ${round1(candidateQuality)}, recent performance ${round1(recentPerformance)}, shortlist conversion ${round1(shortlistRate)}% and hiring conversion ${round1(hiringRate)}%.`;

  return {
    vendor,
    overallScore,
    components,
    skillBreakdown: vendor.skillScores.map((s) => ({
      skill: s.skill,
      score: round1(blendedSkillScore(s, recency)),
      trend: s.trend,
      sampleSize: s.sample_size,
    })),
    candidateQuality: round1(candidateQuality),
    recentPerformance: round1(recentPerformance),
    historicalPerformance: round1(historicalPerformance),
    shortlistRate: round1(shortlistRate),
    interviewRate: round1(interviewRate),
    offerRate: round1(offerRate),
    hiringRate: round1(hiringRate),
    candidatesSubmitted: totalSubmitted,
    trend: trendOf(vendor),
    limitedHistory,
    aiRecommendation,
    confidence: Math.round(confidence * 100) / 100,
    explanation,
  };
}

export function rankVendors(
  vendors: VendorInput[],
  requirement: RequirementInput,
  settings: AiSettings,
  now = new Date(),
): RankedVendor[] {
  return vendors
    .map((v) => scoreVendor(v, requirement, settings, now))
    .sort((a, b) => b.overallScore - a.overallScore || a.vendor.vendor_name.localeCompare(b.vendor.vendor_name))
    .map((v, i) => ({ ...v, rank: i + 1 }));
}

/* ---------------------------------------------------------------- filtering */

export type VendorFilters = {
  search: string;
  status: string;
  location: string;
  specialisation: string;
  skills: string[];
  minOverall: number;
  minSkillFit: number;
  minCandidateQuality: number;
  minRecentPerformance: number;
  minShortlistRate: number;
  minInterviewRate: number;
  minOfferRate: number;
  minHiringRate: number;
  quick: string;
};

export const emptyVendorFilters: VendorFilters = {
  search: "",
  status: "ALL",
  location: "ALL",
  specialisation: "ALL",
  skills: [],
  minOverall: 0,
  minSkillFit: 0,
  minCandidateQuality: 0,
  minRecentPerformance: 0,
  minShortlistRate: 0,
  minInterviewRate: 0,
  minOfferRate: 0,
  minHiringRate: 0,
  quick: "NONE",
};

export const quickFilters = [
  { key: "NONE", label: "All vendors" },
  { key: "BEST_MATCH", label: "Best match" },
  { key: "TOP_PERFORMING", label: "Top performing" },
  { key: "STRONG_RECENT", label: "Strong recent performance" },
  { key: "STRONG_PYTHON", label: "Strong Python vendors" },
  { key: "STRONG_SQL", label: "Strong SQL vendors" },
  { key: "STRONG_ML", label: "Strong ML vendors" },
  { key: "LIMITED_HISTORY", label: "Limited history" },
] as const;

function componentValue(v: RankedVendor, key: keyof RankingWeights): number {
  return v.components.find((c) => c.key === key)?.value ?? 0;
}

function skillScoreFor(v: RankedVendor, skill: string): number {
  return v.skillBreakdown.find((s) => s.skill.toLowerCase() === skill.toLowerCase())?.score ?? 0;
}

export function filterVendors(ranked: RankedVendor[], f: VendorFilters): RankedVendor[] {
  return ranked.filter((v) => {
    const vendor = v.vendor;
    if (f.search.trim()) {
      const q = f.search.trim().toLowerCase();
      const hay = `${vendor.vendor_name} ${vendor.specialisations.join(" ")} ${vendor.locations.join(" ")}`;
      if (!hay.toLowerCase().includes(q)) return false;
    }
    if (f.status !== "ALL" && vendor.status !== f.status) return false;
    if (f.location !== "ALL" && !vendor.locations.includes(f.location)) return false;
    if (f.specialisation !== "ALL" && !vendor.specialisations.includes(f.specialisation)) return false;
    if (f.skills.length && !f.skills.every((s) => skillScoreFor(v, s) >= 70)) return false;
    if (v.overallScore < f.minOverall) return false;
    if (componentValue(v, "skillFit") < f.minSkillFit) return false;
    if (v.candidateQuality < f.minCandidateQuality) return false;
    if (v.recentPerformance < f.minRecentPerformance) return false;
    if (v.shortlistRate < f.minShortlistRate) return false;
    if (v.interviewRate < f.minInterviewRate) return false;
    if (v.offerRate < f.minOfferRate) return false;
    if (v.hiringRate < f.minHiringRate) return false;

    switch (f.quick) {
      case "BEST_MATCH":
        return v.rank <= 3 && !v.limitedHistory;
      case "TOP_PERFORMING":
        return v.overallScore >= 80;
      case "STRONG_RECENT":
        return v.recentPerformance >= 80 && v.trend !== "DOWN";
      case "STRONG_PYTHON":
        return skillScoreFor(v, "Python") >= 80;
      case "STRONG_SQL":
        return skillScoreFor(v, "SQL") >= 80;
      case "STRONG_ML":
        return skillScoreFor(v, "Machine Learning") >= 80;
      case "LIMITED_HISTORY":
        return v.limitedHistory;
      default:
        return true;
    }
  });
}

export const sortOptions = [
  { key: "RANK", label: "Rank" },
  { key: "OVERALL", label: "Overall score" },
  { key: "SKILL_FIT", label: "Skill fit" },
  { key: "RECENT", label: "Recent performance" },
  { key: "QUALITY", label: "Candidate quality" },
  { key: "SHORTLIST", label: "Shortlist rate" },
  { key: "HIRING", label: "Hiring rate" },
  { key: "MOST_IMPROVED", label: "Most improved" },
  { key: "DECLINING", label: "Declining performance" },
] as const;

export type SortKey = (typeof sortOptions)[number]["key"];

export function sortVendors(ranked: RankedVendor[], key: SortKey): RankedVendor[] {
  const list = [...ranked];
  const delta = (v: RankedVendor) => v.recentPerformance - v.historicalPerformance;
  switch (key) {
    case "OVERALL":
      return list.sort((a, b) => b.overallScore - a.overallScore);
    case "SKILL_FIT":
      return list.sort((a, b) => componentValue(b, "skillFit") - componentValue(a, "skillFit"));
    case "RECENT":
      return list.sort((a, b) => b.recentPerformance - a.recentPerformance);
    case "QUALITY":
      return list.sort((a, b) => b.candidateQuality - a.candidateQuality);
    case "SHORTLIST":
      return list.sort((a, b) => b.shortlistRate - a.shortlistRate);
    case "HIRING":
      return list.sort((a, b) => b.hiringRate - a.hiringRate);
    case "MOST_IMPROVED":
      return list.sort((a, b) => delta(b) - delta(a));
    case "DECLINING":
      return list.sort((a, b) => delta(a) - delta(b));
    default:
      return list.sort((a, b) => a.rank - b.rank);
  }
}

export const recommendationLabel: Record<RankedVendor["aiRecommendation"], string> = {
  RECOMMEND: "Recommend",
  CONSIDER: "Consider",
  WEAK: "Weak match",
  LIMITED_DATA: "Limited historical data",
};
