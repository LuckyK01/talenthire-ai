import { queryOptions } from "@tanstack/react-query";

import * as api from "@/lib/api";
import type { AppRole } from "@/lib/types";

export const qk = {
  aiSettings: ["ai-settings"] as const,
  requirements: ["requirements"] as const,
  requirement: (id: string) => ["requirement", id] as const,
  vendors: ["vendors"] as const,
  vendorInputs: ["vendor-inputs"] as const,
  vendor: (id: string) => ["vendor", id] as const,
  vendorSkills: (id: string) => ["vendor-skills", id] as const,
  vendorPerformance: (id: string) => ["vendor-performance", id] as const,
  vendorHistory: (id?: string) => ["vendor-history", id ?? "all"] as const,
  candidates: ["candidates"] as const,
  applications: ["applications"] as const,
  candidateScores: ["candidate-scores"] as const,
  interviews: ["interviews"] as const,
  interviewFeedback: ["interview-feedback"] as const,
  approvals: ["approvals"] as const,
  offers: ["offers"] as const,
  onboarding: ["onboarding"] as const,
  audit: ["audit"] as const,
  notifications: (role: AppRole | null, userId: string | null) => ["notifications", role, userId] as const,
  agents: ["ai-agents"] as const,
  skills: ["skills"] as const,
  profiles: ["profiles"] as const,
  userRoles: ["user-roles"] as const,
  sourcing: ["sourcing"] as const,
};

export const aiSettingsQuery = () => queryOptions({ queryKey: qk.aiSettings, queryFn: api.fetchAiSettings });
export const requirementsQuery = () => queryOptions({ queryKey: qk.requirements, queryFn: api.fetchRequirements });
export const requirementQuery = (id: string) =>
  queryOptions({ queryKey: qk.requirement(id), queryFn: () => api.fetchRequirement(id) });
export const vendorsQuery = () => queryOptions({ queryKey: qk.vendors, queryFn: api.fetchVendors });
export const vendorInputsQuery = () => queryOptions({ queryKey: qk.vendorInputs, queryFn: api.fetchVendorInputs });
export const vendorQuery = (id: string) => queryOptions({ queryKey: qk.vendor(id), queryFn: () => api.fetchVendor(id) });
export const vendorSkillsQuery = (id: string) =>
  queryOptions({ queryKey: qk.vendorSkills(id), queryFn: () => api.fetchVendorSkillScores(id) });
export const vendorPerformanceQuery = (id: string) =>
  queryOptions({ queryKey: qk.vendorPerformance(id), queryFn: () => api.fetchVendorPerformance(id) });
export const vendorHistoryQuery = (id?: string) =>
  queryOptions({ queryKey: qk.vendorHistory(id), queryFn: () => api.fetchVendorScoreHistory(id) });
export const candidatesQuery = () => queryOptions({ queryKey: qk.candidates, queryFn: api.fetchCandidates });
export const applicationsQuery = () => queryOptions({ queryKey: qk.applications, queryFn: () => api.fetchApplications() });
export const candidateScoresQuery = () =>
  queryOptions({ queryKey: qk.candidateScores, queryFn: () => api.fetchCandidateScores() });
export const interviewsQuery = () => queryOptions({ queryKey: qk.interviews, queryFn: api.fetchInterviews });
export const interviewFeedbackQuery = () =>
  queryOptions({ queryKey: qk.interviewFeedback, queryFn: api.fetchInterviewFeedback });
export const approvalsQuery = () => queryOptions({ queryKey: qk.approvals, queryFn: api.fetchApprovals });
export const offersQuery = () => queryOptions({ queryKey: qk.offers, queryFn: api.fetchOffers });
export const onboardingQuery = () => queryOptions({ queryKey: qk.onboarding, queryFn: api.fetchOnboardingTasks });
export const auditQuery = () => queryOptions({ queryKey: qk.audit, queryFn: () => api.fetchAuditEvents() });
export const notificationsQuery = (role: AppRole | null, userId: string | null) =>
  queryOptions({ queryKey: qk.notifications(role, userId), queryFn: () => api.fetchNotifications(role, userId) });
export const agentsQuery = () => queryOptions({ queryKey: qk.agents, queryFn: api.fetchAiAgents });
export const skillsQuery = () => queryOptions({ queryKey: qk.skills, queryFn: api.fetchSkills });
export const profilesQuery = () => queryOptions({ queryKey: qk.profiles, queryFn: api.fetchProfiles });
export const userRolesQuery = () => queryOptions({ queryKey: qk.userRoles, queryFn: api.fetchUserRoles });
export const sourcingQuery = () => queryOptions({ queryKey: qk.sourcing, queryFn: () => api.fetchSourcingRequests() });
