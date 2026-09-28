# HireFlow AI — Build Roadmap

## Foundation
- [ ] Enable Lovable Cloud
- [ ] Design system tokens (Frosted Glass Enterprise: ink #0f1b2d, teal #0d9488, amber, rose; Instrument Serif + Inter + JetBrains Mono)
- [ ] Database schema: users/profiles, skills, requirements, vendors, vendor_skill_scores, vendor_performance, vendor_score_history, candidates, applications, candidate_scores, sourcing_requests, interviews, interview_feedback, offers, onboarding_tasks, approvals, notifications, audit_events
- [ ] RLS + grants per role (HR_ADMIN / MANAGER / CANDIDATE)
- [ ] Seed data: REQ-2091 Data Analyst, 5 vendors, 8+ candidates, interviews, offers, onboarding, audit
- [ ] Demo auth accounts (hr@/manager@/candidate@hireflow.demo / Demo@123)

## Services (business logic, separate from UI)
- [ ] VendorRankingService (configurable weights, recency weighting, explanations)
- [ ] CandidateScreeningService
- [ ] Vendor performance feedback loop + score history
- [ ] Workflow state machines (requirement / candidate / offer / onboarding)
- [ ] Approval service + audit logging
- [ ] Mock AI agent layer (contract, sourcing, screening, scheduling, feedback summary, offer)

## HR/Admin UI
- [ ] App shell (nav, breadcrumbs, global search, notifications)
- [ ] Dashboard (KPIs, top vendors widget, approvals, audit, upcoming)
- [ ] Requirements list + new requirement + detail
- [ ] Contract validation
- [ ] Vendor Ranking (filters, sort, explanation, compare, select, request sourcing)
- [ ] Vendors list + vendor detail (tabs)
- [ ] Candidates + AI screening + comparison + recruiter review
- [ ] Interviews + feedback
- [ ] Approval Center
- [ ] Offers
- [ ] Onboarding dashboard
- [ ] AI Control Center
- [ ] Reports, Audit Trail, Users, Settings

## Manager UI
- [ ] Manager dashboard, requirements, candidates, interviews, feedback, approvals

## Candidate portal
- [ ] Home, My Application, My Interview, My Offer, Onboarding, Notifications, Profile

## Tests
- [ ] Vendor ranking, screening, approval, offer→onboarding, feedback loop
