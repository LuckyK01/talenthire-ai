# HireFlow AI — Build Roadmap

## Foundation
- [x] Enable Lovable Cloud
- [x] Design system tokens (Frosted Glass Enterprise: ink #0f1b2d, teal #0d9488, amber, rose; Instrument Serif + Inter + JetBrains Mono)
- [x] Database schema: users/profiles, skills, requirements, vendors, vendor_skill_scores, vendor_performance, vendor_score_history, candidates, applications, candidate_scores, sourcing_requests, interviews, interview_feedback, offers, onboarding_tasks, approvals, notifications, audit_events
- [x] RLS + grants per role (HR_ADMIN / MANAGER / CANDIDATE)
- [x] Seed data: REQ-2091 Data Analyst, 5 vendors, 8+ candidates, interviews, offers, onboarding, audit
- [x] Demo auth accounts (hr@/manager@/candidate@hireflow.demo / Demo@123)

## Services (business logic, separate from UI)
- [x] VendorRankingService (configurable weights, recency weighting, explanations)
- [x] CandidateScreeningService
- [x] Vendor performance feedback loop + score history
- [x] Workflow state machines (requirement / candidate / offer / onboarding)
- [x] Approval service + audit logging
- [x] Mock AI agent layer (contract, sourcing, screening, scheduling, feedback summary, offer)

## HR/Admin UI
- [x] App shell (nav, breadcrumbs, global search, notifications)
- [x] Dashboard (KPIs, top vendors widget, approvals, audit, upcoming)
- [x] Requirements list + new requirement + detail
- [x] Contract validation
- [x] Vendor Ranking (filters, sort, explanation, compare, select, request sourcing)
- [x] Vendors list + vendor detail (tabs)
- [x] Candidates + AI screening + comparison + recruiter review
- [x] Interviews + feedback
- [x] Approval Center
- [x] Offers
- [x] Onboarding dashboard
- [x] AI Control Center
- [x] Reports, Audit Trail, Users, Settings

## Manager UI
- [x] Manager dashboard, requirements, candidates, interviews, feedback, approvals

## Candidate portal
- [x] Home, My Application, My Interview, My Offer, Onboarding, Notifications, Profile

## Tests
- [x] Vendor ranking, screening, approval, offer→onboarding, feedback loop
