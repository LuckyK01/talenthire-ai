/**
 * CandidateScreeningService — deterministic, explainable candidate scoring.
 * Pure functions: no data access, no UI.
 */

export type ScreeningCandidate = {
  id: string;
  name: string;
  location: string | null;
  total_experience: number;
  education: string | null;
  skills: string[];
};

export type ScreeningRequirement = {
  id: string;
  position_title: string;
  required_skills: string[];
  preferred_skills: string[];
  location: string | null;
  experience_level: string | null;
};

export type ScreeningResult = {
  overall_score: number;
  skill_scores: Record<string, number>;
  experience_score: number;
  location_score: number;
  education_score: number;
  strengths: string[];
  gaps: string[];
  explanation: string;
  ai_recommendation: "RECOMMENDED" | "REVIEW" | "WEAK_MATCH";
  confidence: number;
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

export function parseExperienceBand(level: string | null): { min: number; max: number } {
  if (!level) return { min: 0, max: 40 };
  const nums = level.match(/\d+/g)?.map(Number) ?? [];
  if (nums.length >= 2) return { min: nums[0]!, max: nums[1]! };
  if (nums.length === 1) return { min: nums[0]!, max: nums[0]! + 3 };
  return { min: 0, max: 40 };
}

export function experienceScore(years: number, level: string | null): number {
  const { min, max } = parseExperienceBand(level);
  if (years >= min && years <= max) return clamp(88 + (years - min) * 2);
  if (years < min) return clamp(100 - (min - years) * 22);
  return clamp(92 - (years - max) * 9);
}

export function locationScore(candidate: string | null, requirement: string | null): number {
  if (!requirement || requirement.toLowerCase() === "remote") return 100;
  if (!candidate) return 60;
  if (candidate.toLowerCase() === requirement.toLowerCase()) return 100;
  if (candidate.toLowerCase() === "remote") return 80;
  return 60;
}

export function educationScore(education: string | null): number {
  if (!education) return 60;
  const e = education.toLowerCase();
  if (e.includes("m.tech") || e.includes("m.sc") || e.includes("mba") || e.includes("phd")) return 92;
  if (e.includes("b.tech") || e.includes("b.e") || e.includes("b.sc")) return 84;
  return 72;
}

/** Deterministic per-skill score derived from the candidate's declared skills. */
export function skillScore(candidate: ScreeningCandidate, skill: string): number {
  const has = candidate.skills.some((s) => s.toLowerCase() === skill.toLowerCase());
  const related = candidate.skills.some(
    (s) =>
      s.toLowerCase().includes(skill.toLowerCase().split(" ")[0]!) ||
      skill.toLowerCase().includes(s.toLowerCase().split(" ")[0]!),
  );
  const experienceBoost = Math.min(12, candidate.total_experience * 2);
  if (has) return clamp(74 + experienceBoost);
  if (related) return clamp(58 + experienceBoost * 0.6);
  return clamp(34 + experienceBoost * 0.4);
}

export function screenCandidate(
  candidate: ScreeningCandidate,
  requirement: ScreeningRequirement,
): ScreeningResult {
  const required = requirement.required_skills;
  const skill_scores: Record<string, number> = {};
  for (const s of required) skill_scores[s] = skillScore(candidate, s);
  for (const s of requirement.preferred_skills)
    if (!(s in skill_scores)) skill_scores[s] = skillScore(candidate, s);

  const requiredValues = required.map((s) => skill_scores[s] ?? 0);
  const skillAvg =
    requiredValues.length > 0
      ? requiredValues.reduce((a, b) => a + b, 0) / requiredValues.length
      : 70;

  const exp = experienceScore(candidate.total_experience, requirement.experience_level);
  const loc = locationScore(candidate.location, requirement.location);
  const edu = educationScore(candidate.education);

  const overall = clamp(skillAvg * 0.6 + exp * 0.2 + loc * 0.1 + edu * 0.1);

  const strengths: string[] = [];
  const gaps: string[] = [];
  for (const s of required) {
    const v = skill_scores[s] ?? 0;
    if (v >= 80) strengths.push(`${s} meets the requirement (${v}%)`);
    else if (v < 70) gaps.push(`${s} below requirement level (${v}%)`);
  }
  if (exp >= 85) strengths.push(`Experience of ${candidate.total_experience} years sits inside the target band`);
  else gaps.push(`Experience of ${candidate.total_experience} years is outside the target band`);
  if (loc === 100 && requirement.location) strengths.push(`Already based in ${requirement.location}`);
  else if (loc < 80) gaps.push("Relocation would be required");

  const ai_recommendation: ScreeningResult["ai_recommendation"] =
    overall >= 82 ? "RECOMMENDED" : overall >= 68 ? "REVIEW" : "WEAK_MATCH";

  const met = required.filter((s) => (skill_scores[s] ?? 0) >= 70);
  const explanation = `Scores ${overall}% overall for ${requirement.position_title}. ${met.length} of ${required.length} required skills meet the bar (${required
    .map((s) => `${s} ${skill_scores[s]}%`)
    .join(", ")}). Experience ${exp}%, location ${loc}%, education ${edu}%. This is an AI recommendation — a human decision is required before shortlisting or rejecting.`;

  const confidence = Math.round(Math.min(0.95, 0.6 + required.length * 0.08) * 100) / 100;

  return {
    overall_score: overall,
    skill_scores,
    experience_score: exp,
    location_score: loc,
    education_score: edu,
    strengths,
    gaps,
    explanation,
    ai_recommendation,
    confidence,
  };
}

export const screeningLabel: Record<ScreeningResult["ai_recommendation"], string> = {
  RECOMMENDED: "Recommended",
  REVIEW: "Review",
  WEAK_MATCH: "Weak match",
};
