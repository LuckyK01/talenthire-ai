# TalentFlow AI

# BUILD PROMPT — HIREFLOW AI

## 1. PROJECT OVERVIEW

Build a fully functional, end-to-end enterprise recruitment and onboarding web application called:

**HireFlow AI**

Tagline:

**AI recommends. Humans decide.**

HireFlow AI is an AI-assisted recruitment and onboarding platform focused on automating repetitive recruitment activities while keeping all important hiring, compensation, contract, and approval decisions under human control.

The application must be a **working product prototype**, not a static UI mockup.

The core business differentiator is:

> **AI-powered Vendor Ranking, Vendor Selection, Vendor Filtering, Candidate Screening, and a Vendor Performance Feedback Loop.**

The application must demonstrate a complete recruitment journey from:

**Recruitment Requirement → Contract Validation → Vendor Ranking → Vendor Selection → Candidate Sourcing → AI Screening → Human Shortlisting → Interview → Feedback → Offer → Candidate Acceptance → Onboarding**

The supplied product requirements define the ten-stage recruitment process and explicitly require human approval for final decisions.

The governing principle is:

> **AI recommends. Humans decide.**

No AI feature should independently make a final hiring, compensation, offer, contract, or rejection decision.

---

# 2. SOURCE MATERIAL

Use the provided HireFlow AI product requirements, process-flow diagrams, Recruiter/HR Workspace and Candidate/Employee Portal as the functional and visual baseline.

Preserve the terminology and business concepts from those materials.

The supplied process flow defines:

1. Request
2. Contract validation
3. Vendor identification
4. Resume sourcing
5. Profile screening
6. Recruiter review
7. Interview scheduling
8. Feedback collection
9. Offer generation
10. Onboarding

The product requirements also define:

* Role-based access
* AI vendor recommendations
* AI resume sourcing
* Candidate screening
* Interview scheduling
* Feedback collection
* Offer generation
* Onboarding
* Full audit trail
* Human approval
* Vendor field-level scoring
* Vendor ranking feedback loop

Do not remove these capabilities.

---

# 3. PRIMARY PRODUCT OBJECTIVE

Build an enterprise-grade recruitment platform with special emphasis on:

## CORE DIFFERENTIATOR

### Vendor Intelligence Engine

The system must be able to:

1. Analyse a recruitment requirement.
2. Identify suitable vendors.
3. Score vendors against the requirement.
4. Rank vendors.
5. Explain why a vendor is ranked at a particular position.
6. Allow HR/Admin to filter vendors.
7. Allow HR/Admin to compare vendors.
8. Allow HR/Admin to select/request sourcing from vendors.
9. Allow vendors to submit candidates.
10. AI-screen submitted candidates.
11. Calculate candidate match scores.
12. Feed candidate screening results back into vendor performance.
13. Recalculate vendor skill-level scores.
14. Update vendor rankings.
15. Maintain an auditable history of vendor scores.

This feedback loop is one of the most important features in the entire application.

---

# 4. USER TYPES

There are two primary login entry types.

## LOGIN TYPE 1 — HR / ADMIN

HR/Admin has full access to:

* Dashboard
* Requirements
* Vendors
* Vendor Ranking
* Candidates
* Interviews
* Approvals
* Offers
* Onboarding
* AI Modules
* Reports
* Audit Trail
* User Management
* Settings

---

## LOGIN TYPE 2 — MANAGER / CANDIDATE

After selecting this login type, authenticate the user and route according to their assigned role.

### MANAGER

Manager can access:

* Manager Dashboard
* Requirements
* Candidate Shortlists
* Vendor Recommendations
* Candidate Comparison
* Interviews
* Feedback
* Recruitment Status
* Approval actions assigned to them

### CANDIDATE

Candidate can access:

* Candidate Dashboard
* My Application
* My Interview
* My Offer
* Documents
* Onboarding
* Notifications
* Profile

Do not allow candidates to access HR/Admin information.

---

# 5. AUTHENTICATION

Implement functional authentication.

For the prototype, provide seeded demo accounts.

Example:

### HR/Admin

Email:
[hr@hireflow.demo](mailto:hr@hireflow.demo)

Password:
Demo@123

### Manager

Email:
[manager@hireflow.demo](mailto:manager@hireflow.demo)

Password:
Demo@123

### Candidate

Email:
[candidate@hireflow.demo](mailto:candidate@hireflow.demo)

Password:
Demo@123

Authentication should persist between page refreshes.

Implement:

* Login
* Logout
* Session persistence
* Protected routes
* Role-based routing
* Unauthorized page
* Demo account selector if useful

Do not hard-code the logged-in user's role into individual pages.

The role must come from the authenticated session/user record.

---

# 6. APPLICATION ARCHITECTURE

Use a modern production-style architecture.

Preferred stack:

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui or equivalent enterprise UI component system
* Supabase/PostgreSQL or an equivalent persistent relational database
* Server-side/API layer for sensitive operations
* Modular service architecture

If the platform has a native database/authentication system, use it.

Do NOT build the application entirely with local component state.

Use a real persistent data model.

---

# 7. DATABASE

Create relational entities for at least:

## Users

Fields:

* id
* name
* email
* role
* department
* status
* created_at
* updated_at

Roles:

* HR_ADMIN
* MANAGER
* CANDIDATE

---

## Requirements

Fields:

* id
* requirement_id
* position_title
* department
* employment_type
* experience_level
* required_skills
* preferred_skills
* number_of_openings
* location
* work_mode
* target_hiring_timeline
* hiring_manager_id
* priority
* job_description
* contract_document
* status
* created_by
* created_at
* updated_at

Statuses:

* DRAFT
* SUBMITTED
* CONTRACT_VALIDATION
* VENDOR_IDENTIFICATION
* SOURCING
* SCREENING
* RECRUITER_REVIEW
* INTERVIEW
* FEEDBACK
* OFFER
* ONBOARDING
* COMPLETED
* ON_HOLD

---

# 8. VENDOR DATA MODEL

Create:

## Vendors

Fields:

* id
* vendor_name
* vendor_type
* description
* specialisations
* locations
* contact_name
* contact_email
* contact_phone
* status
* overall_score
* created_at
* updated_at

---

## VendorSkillScores

Fields:

* id
* vendor_id
* skill_id
* score
* sample_size
* recent_score
* historical_score
* trend
* last_updated

---

## VendorPerformance

Track:

* vendor_id
* requirement_id
* candidates_submitted
* candidates_screened
* candidates_matched
* candidates_shortlisted
* interviews
* offers
* hires
* average_candidate_match_score
* shortlist_rate
* interview_rate
* offer_rate
* hiring_rate
* recorded_at

---

## VendorScoreHistory

Store:

* vendor_id
* requirement_id
* skill
* previous_score
* new_score
* reason
* source_candidate_id
* created_at

This must be immutable audit history.

---

# 9. SKILLS

Create a reusable Skill entity.

Seed skills including:

* Python
* SQL
* Machine Learning
* Data Analytics
* Java
* JavaScript
* React
* Cloud
* AWS
* Azure
* Communication
* Problem Solving

Allow requirements and vendors/candidates to reference skills.

---

# 10. CANDIDATE DATA MODEL

Create:

## Candidates

Fields:

* id
* name
* email
* phone
* location
* total_experience
* education
* current_company
* previous_companies
* skills
* resume_url
* source
* vendor_id
* status
* created_at
* updated_at

---

# 11. APPLICATION DATA MODEL

Create:

## Applications

Fields:

* id
* application_id
* candidate_id
* requirement_id
* vendor_id
* stage
* status
* match_score
* recruiter_decision
* recruiter_decision_reason
* created_at
* updated_at

---

# 12. CANDIDATE SCORING

Create:

## CandidateScores

Fields:

* candidate_id
* requirement_id
* overall_score
* skill_scores
* experience_score
* location_score
* education_score
* strengths
* gaps
* explanation
* ai_recommendation
* created_at
* updated_at

Example:

Candidate:

Priya Sharma

Requirement:

Data Analyst

Overall:

88%

Skill scores:

* Python: 94%
* SQL: 91%
* Machine Learning: 86%
* Experience: 92%

The exact numbers can be demo data, but the UI and data model must support dynamic scoring.

---

# 13. VENDOR RANKING ENGINE

This is the highest-priority feature.

Create a dedicated service/module:

`VendorRankingService`

The service should calculate a vendor's suitability for a requirement.

Use a transparent scoring model.

Suggested initial weighting:

### Skill Fit — 40%

How well the vendor historically supplies candidates matching required skills.

### Candidate Quality — 20%

Average candidate screening score.

### Recent Performance — 15%

Recency-weighted vendor performance.

### Shortlist Conversion — 10%

Percentage of submitted candidates reaching shortlist.

### Interview Conversion — 5%

Percentage progressing to interview.

### Hiring Conversion — 10%

Percentage ultimately hired.

Total:

100%.

Make the weights configurable rather than hard-coded throughout the UI.

---

# 14. VENDOR RANKING FORMULA

For a requirement:

```text
Vendor Score =
Skill Fit × 40%
+ Candidate Quality × 20%
+ Recent Performance × 15%
+ Shortlist Conversion × 10%
+ Interview Conversion × 5%
+ Hiring Conversion × 10%
```

Normalize all components to 0–100.

If a vendor has insufficient historical data, clearly indicate:

**Limited historical data**

and use a sensible fallback based on skill fit and available information.

Do not fabricate historical statistics without marking them as demo/seed data.

---

# 15. VENDOR RANKING PAGE

Create a dedicated:

**Vendor Ranking**

page.

Top section:

### Requirement Selector

Example:

Data Analyst — REQ-2091

Then display:

* Requirement skills
* Experience
* Location
* Openings
* Timeline

Below that:

## Ranked Vendors

Columns:

* Rank
* Vendor
* Overall Score
* Skill Fit
* Candidate Quality
* Recent Performance
* Shortlist Rate
* Interview Rate
* Hiring Rate
* Trend
* AI Recommendation
* Actions

Actions:

* View
* Compare
* Select
* Request Sourcing

---

# 16. VENDOR RANKING EXPLANATION

Every vendor score must have a:

### "Why this ranking?"

Expandable panel.

Example:

> Ranked #1 because this vendor has strong recent performance for Python, SQL and Machine Learning requirements, with a high average candidate match score and strong shortlist conversion.

Show the actual contributing factors.

Never display a bare AI score without explanation.

---

# 17. VENDOR FILTERING

Implement functional filters.

Filters:

### General

* Vendor
* Status
* Location
* Specialisation

### Score

* Overall score
* Skill score
* Candidate quality
* Recent performance

### Conversion

* Shortlist rate
* Interview rate
* Offer rate
* Hiring rate

### Skill

Allow multi-select:

* Python
* SQL
* Machine Learning
* etc.

### AI filters

Provide quick filters such as:

* Best Match
* Top Performing
* Strong Recent Performance
* Strong Python Vendors
* Strong SQL Vendors
* Strong ML Vendors
* Vendors with Limited History

Filters must actually change the displayed results.

---

# 18. VENDOR SORTING

Allow sorting by:

* Rank
* Overall score
* Skill fit
* Recent performance
* Candidate quality
* Shortlist rate
* Hiring rate
* Most improved
* Declining performance

---

# 19. VENDOR COMPARISON

Allow selecting 2–5 vendors.

Create a comparison page/modal.

Compare:

* Overall score
* Skill scores
* Candidate quality
* Recent performance
* Shortlist rate
* Interview rate
* Offer rate
* Hiring rate
* Candidate volume
* Trend
* Historical performance

Highlight the strongest value in each category.

Add:

### AI Comparison Summary

Example:

> Vendor A has the strongest overall fit for this requirement, particularly for Python and SQL. Vendor B has stronger Machine Learning performance but lower recent shortlist conversion.

Again:

**AI recommendation only. Human decision required.**

---

# 20. VENDOR DETAIL PAGE

Create a rich vendor profile.

Header:

* Vendor name
* Overall score
* Rank
* Status
* Specialisation
* Contact

Tabs:

### Overview

* Overall score
* Current rank
* Trend
* Recommendation

### Skills

* Skill-by-skill scores
* Score trend

### Performance

* Candidate volume
* Match rate
* Shortlist rate
* Interview rate
* Hiring rate

### Candidates

Candidates submitted by vendor.

### History

Historical requirements and outcomes.

### Score History

Graph of score changes.

### Audit

Changes to vendor ranking.

---

# 21. VENDOR PERFORMANCE FEEDBACK LOOP

This is mandatory.

When a vendor submits a candidate:

```text
Vendor submits candidate
↓
Candidate screening
↓
Candidate match score generated
↓
Candidate progresses/rejected
↓
Vendor performance updated
↓
Vendor skill score updated
↓
Vendor overall score recalculated
↓
Vendor rank recalculated
```

For example:

If Vendor A submits a candidate with:

Python = 95%
SQL = 92%
ML = 88%

and the candidate is shortlisted, update Vendor A's corresponding performance metrics.

The score update must be stored in:

`VendorScoreHistory`

The system should show:

> Vendor score updated because candidate XYZ achieved an 88% match for the Data Analyst requirement.

---

# 22. RECENCY WEIGHTING

Vendor scores should prioritize recent outcomes.

Implement a simple recency weighting strategy.

Recent performance should contribute more than older performance.

For example:

* Last 90 days: highest weight
* 91–180 days: medium weight
* Older than 180 days: lower weight

Make the implementation configurable.

Display:

**Recent Performance**

and

**Historical Performance**

separately so users understand the ranking.

---

# 23. REQUIREMENT CREATION

Create:

**New Requirement**

Fields:

* Position Title
* Department
* Employment Type
* Experience Level
* Required Skills
* Preferred Skills
* Number of Openings
* Location
* Work Mode
* Target Hiring Timeline
* Hiring Manager
* Priority
* Job Description
* Contract/document upload

Buttons:

* Save Draft
* Submit Requirement

On submission:

```text
Requirement created
↓
Contract validation
↓
Vendor ranking
↓
Candidate sourcing
```

For prototype mode, this workflow may use simulated asynchronous processing.

Show visible status changes.

---

# 24. CONTRACT VALIDATION

Create an AI Contract Validation page.

Functional MVP behaviour:

* Upload document
* Extract basic fields where possible
* Display validation result
* Identify missing fields
* Display risk/exception flags

Example:

### Status

Potential discrepancy

### Flag

Compensation field requires review.

Actions:

* Review
* Approve
* Reject
* Request Correction

This must always require human approval when an exception is flagged.

If actual document AI integration is unavailable, create a clean adapter/service interface and use a mock implementation.

Clearly label mock AI behaviour.

---

# 25. CANDIDATE SOURCING

After vendor selection:

### Request Sourcing

Allow HR to:

* Select vendors
* Set candidate requirements
* Set number of candidates
* Set deadline
* Send sourcing request

Show:

**Sourcing Requested**

Then vendor submissions can appear in the candidate pipeline.

---

# 26. CANDIDATE SCREENING

Create a dedicated:

**AI Screening**

interface.

Display:

* Candidate
* Vendor
* Requirement
* Overall match
* Skill scores
* Experience
* Education
* Location
* Strengths
* Gaps
* AI explanation

Example:

### Match Score

88%

### Skill Match

Python — Meets

SQL — Meets

Machine Learning — Meets

### Experience

Meets

### AI Explanation

Explain the score in natural language.

---

# 27. CANDIDATE COMPARISON

Allow HR/Manager to select candidates.

Comparison table:

* Python
* SQL
* Machine Learning
* Experience
* Education
* Location
* Overall match
* Vendor
* AI recommendation

Actions:

* Shortlist
* Reject
* Request Human Review

Require a human decision.

---

# 28. RECRUITER REVIEW

Create a recruiter review workspace.

For each candidate:

### AI Recommendation

Recommended / Review / Weak Match

### Human Decision

* Shortlist
* Reject
* Request Human Review

Optional:

**Decision Reason**

This reason must be stored in the audit trail.

---

# 29. INTERVIEW MODULE

Create:

**Interviews**

Features:

* Interview list
* Calendar
* Candidate
* Position
* Interviewer
* Date
* Time
* Mode
* Status

Support:

* Schedule
* Reschedule
* Cancel
* Confirm
* Add to calendar

For prototype purposes, Teams integration may be simulated.

Create an integration adapter so Microsoft Teams can be connected later.

---

# 30. INTERVIEW FEEDBACK

After an interview:

Interviewer can submit:

* Technical capability
* Communication
* Problem solving
* Strengths
* Concerns
* Overall recommendation

Then generate an AI summary.

Example:

Technical capability: Strong

Communication: Good

Problem solving: Strong

AI recommendation:

Proceed to offer

But require human approval.

---

# 31. APPROVAL CENTER

Create a central:

**Approval Center**

Everything waiting for human action appears here.

Categories:

* Contract exceptions
* Vendor selection
* Candidate shortlist
* Interview outcome
* Offer approval
* Onboarding trigger

Each approval card must show:

* Item
* AI recommendation
* Explanation
* Current status
* Responsible person
* Timestamp

Actions:

* Approve
* Reject
* Request Review

---

# 32. OFFER GENERATION

Create:

**Offer Management**

Flow:

```text
Candidate approved
↓
Offer draft generated
↓
HR review
↓
Approve / Reject
↓
Candidate receives offer
↓
Candidate accepts / requests clarification
```

Offer fields:

* Candidate
* Position
* Department
* Start date
* Compensation band
* Location
* Employment type
* Documents
* Status

Do not implement salary negotiation or compensation benchmarking.

Compensation approval remains human-controlled.

---

# 33. CANDIDATE PORTAL

Candidate portal navigation:

* Home
* My Application
* My Interview
* My Offer
* Onboarding
* Notifications
* Profile
* Logout

Candidate dashboard should show:

* Position applied for
* Current stage
* Next step
* Application timeline

---

# 34. CANDIDATE APPLICATION PAGE

Display:

### Application

* Position
* Application ID
* Submitted date
* Current stage

Timeline:

```text
Application Submitted
↓
Resume Screening
↓
Interview
↓
Offer
↓
Onboarding
```

Show status and details.

Candidates must NOT see internal AI ranking information about vendors or other candidates.

---

# 35. CANDIDATE INTERVIEW PAGE

Show:

* Position
* Date
* Time
* Mode
* Interviewer
* Meeting link

Actions:

* Add to Calendar
* Request Reschedule

---

# 36. CANDIDATE OFFER PAGE

Show:

* Offer status
* Offer document
* Required documents

Actions:

* View
* Accept Offer
* Request Clarification
* Upload Document

---

# 37. ONBOARDING

When an offer is accepted:

Automatically create onboarding tasks.

Example:

1. Welcome email
2. IT access request
3. Document submission
4. Orientation session
5. Manager introduction

Each task has:

* Task
* Owner
* Status
* Due date
* Description

Statuses:

* Pending
* In Progress
* Completed
* Blocked

Show overall onboarding progress.

---

# 38. HR ONBOARDING DASHBOARD

HR can see:

* New hires
* Onboarding progress
* Pending documents
* IT tasks
* Orientation
* Manager tasks
* Blocked items

---

# 39. NOTIFICATION SYSTEM

Implement in-app notifications.

Notifications for:

### HR

* Requirement submitted
* Vendor recommendation
* Candidate received
* Candidate screening completed
* Approval required
* Interview scheduled
* Feedback received
* Offer ready
* Offer accepted
* Onboarding started

### Manager

* Requirement update
* Candidates ready for review
* Interview feedback
* Approval request

### Candidate

* Application update
* Interview scheduled
* Interview reminder
* Offer available
* Onboarding task

---

# 40. GLOBAL SEARCH

Implement global search.

Search across:

* Requirements
* Candidates
* Vendors
* Applications
* Interviews
* Offers

Search results should be role-sensitive.

Candidates must only see their own information.

---

# 41. AUDIT TRAIL

Every important action must create an audit event.

Fields:

* id
* user_id
* role
* action
* entity_type
* entity_id
* previous_value
* new_value
* timestamp
* source
* reason

Example:

```text
Vendor ranking updated
Source: AI
Reason: Candidate XYZ achieved 91% match
```

Example:

```text
Candidate shortlisted
Source: Human
User: HR Admin
Reason: Strong banking experience
```

Clearly distinguish:

**AI action**

from

**Human action**

---

# 42. AI ARCHITECTURE

Create a modular AI service layer.

Agents/modules:

1. Contract Validation Agent
2. Vendor Recommendation Agent
3. Resume Sourcing Agent
4. Candidate Screening Agent
5. Interview Scheduling Agent
6. Feedback Summary Agent
7. Offer Drafting Agent

Every agent must return structured output.

Example:

```typescript
{
  recommendation: string,
  confidence: number,
  explanation: string,
  factors: [],
  requiresHumanApproval: true
}
```

Do not allow an AI agent to directly finalize hiring decisions.

---

# 43. AI DEVELOPMENT STATUS

Clearly distinguish modules:

### FUNCTIONAL MVP

* Vendor Ranking
* Vendor Filtering
* Vendor Comparison
* Vendor Performance Loop
* Candidate Screening
* Candidate Comparison
* Human Approval

### MOCK / SIMULATED AI

* Contract validation
* Resume sourcing
* Interview scheduling
* Feedback summary
* Offer generation

### FUTURE INTEGRATION READY

* Microsoft Teams
* Outlook Calendar
* Power Automate
* Microsoft Dataverse
* SharePoint
* Word
* Enterprise AI models

Do not pretend external integrations are live if they are not configured.

---

# 44. AI MODULE PAGE

Create:

**AI Control Center**

Display all AI modules.

For each:

* Agent name
* Purpose
* Status
* Last execution
* Number of executions
* Human approval requirement

Statuses:

* Active
* Simulated
* Development
* Integration Required

For future modules, show:

**Coming Soon / Under Development**

instead of broken functionality.

---

# 45. DASHBOARD

Create an enterprise HR/Admin dashboard.

KPI cards:

* Open Requirements
* Candidates in Pipeline
* Active Vendors
* Pending Approvals
* Interviews
* Offers Pending
* Onboarding

Charts:

* Recruitment pipeline
* Vendor performance
* Candidate screening distribution
* Hiring funnel
* Requirement status
* Vendor ranking trends

Widgets:

* AI recommendations
* Pending approvals
* Recent activity
* Upcoming interviews
* Exceptions

---

# 46. MANAGER DASHBOARD

Manager dashboard should focus on:

* My Requirements
* Candidates awaiting review
* Shortlisted candidates
* Upcoming interviews
* Pending feedback
* Approval requests

Do not show unnecessary HR administrative functionality.

---

# 47. CANDIDATE DASHBOARD

Candidate dashboard should focus on:

* Application status
* Current stage
* Next action
* Interview
* Offer
* Onboarding

Keep it simple and transparent.

---

# 48. REPORTS

Create an HR Analytics page.

Reports:

### Recruitment

* Time to hire
* Open requirements
* Candidates per requirement
* Funnel conversion

### Vendor

* Vendor rankings
* Vendor performance
* Vendor shortlist rate
* Vendor hiring rate
* Vendor skill performance

### Candidate

* Average match score
* Screening distribution
* Shortlist rate
* Interview conversion

Clearly identify demo/seed data.

---

# 49. DESIGN SYSTEM

Use the uploaded HireFlow AI screens as visual inspiration.

Design style:

* Enterprise
* Professional
* Clean
* Modern
* Minimal
* Data-driven

Use:

* Cards
* Tables
* Tabs
* Filters
* Badges
* Drawers
* Modals
* Side panels
* Progress indicators
* Timeline components
* Charts

Avoid:

* Excessive gradients
* Overly playful design
* Excessive animation
* Generic startup landing-page styling

The application should feel like an enterprise HR/recruitment operations platform.

---

# 50. AI VS HUMAN VISUAL LANGUAGE

Make AI and human actions visually distinguishable.

For example:

### AI

Badge:

**AI Recommendation**

### Human

Badge:

**Human Decision Required**

Use clear labels rather than relying only on colour.

Every AI recommendation must show:

* Recommendation
* Score
* Explanation
* Factors
* Human approval status

---

# 51. RESPONSIVE DESIGN

The entire application must work on:

* Desktop
* Laptop
* Tablet

Prioritize desktop because this is an enterprise HR application.

Candidate portal should also work well on mobile.

---

# 52. ACCESSIBILITY

Implement:

* Keyboard navigation
* Proper labels
* Accessible buttons
* Focus states
* Semantic HTML
* Sufficient contrast
* Accessible tables
* Screen-reader-friendly status indicators

---

# 53. ERROR HANDLING

Do not leave broken buttons.

Every async operation should have:

* Loading state
* Success state
* Error state
* Retry option

Examples:

Vendor ranking failed:

> We couldn't update vendor rankings. Retry.

Candidate screening failed:

> Screening could not be completed. The candidate remains available for manual review.

Never silently fail.

---

# 54. EMPTY STATES

Create meaningful empty states.

Examples:

No vendors:

> No vendors match the selected filters.

No candidates:

> No candidates have been submitted for this requirement yet.

No approvals:

> You're all caught up.

No onboarding tasks:

> No onboarding tasks have been created yet.

---

# 55. SEED DATA

Populate the system with realistic demo data.

Use the supplied example:

### Requirement

Data Analyst

Department:

Risk & Analytics

Employment:

Full-time

Experience:

3–5 years

Skills:

Python, SQL, Machine Learning

Openings:

2

Location:

Bengaluru

Timeline:

6 weeks

Hiring Manager:

Rohan Verma

Priority:

High

Requirement ID:

REQ-2091

---

# 56. SEED VENDORS

Create at least 5 vendors.

Example:

### TalentBridge Partners

Overall:

92%

Specialisation:

Analytics

### NorthStar Staffing

Overall:

84%

Specialisation:

Generalist

Add at least three additional realistic vendors.

Each vendor should have different skill scores and performance metrics.

---

# 57. SEED CANDIDATES

Create at least 8 candidates.

Include candidates with:

* Strong matches
* Medium matches
* Weak matches
* Different vendors
* Different skill strengths

Use example candidate:

### Priya Sharma

Data Analyst

4 years experience

Match:

88%

Skills:

Python, SQL, Machine Learning

---

# 58. DEMO DATA MUST BE INTERCONNECTED

Do not create isolated fake cards.

The data must relate.

For example:

Requirement REQ-2091

→ Vendor TalentBridge

→ Candidate Priya Sharma

→ Application

→ Screening score 88%

→ Shortlist

→ Interview

→ Feedback

→ Offer

→ Candidate portal

→ Onboarding

The user should be able to follow this entire journey.

---

# 59. DEMO END-TO-END TEST

The application must support this demonstration:

## HR logs in

↓

## Creates requirement

Data Analyst / Python / SQL / ML

↓

## Requirement submitted

↓

## Vendor ranking generated

↓

## HR filters vendors

↓

## HR opens Vendor #1

↓

## HR sees vendor skill scores

↓

## HR compares vendors

↓

## HR selects vendor

↓

## Sourcing request created

↓

## Candidates appear

↓

## AI screening runs

↓

## Candidate scores appear

↓

## Vendor performance updates

↓

## Vendor ranking changes

↓

## HR compares candidates

↓

## HR shortlists candidate

↓

## Interview scheduled

↓

## Interview feedback entered

↓

## AI summary generated

↓

## Human approves candidate

↓

## Offer generated

↓

## HR approves offer

↓

## Candidate logs in

↓

## Candidate accepts offer

↓

## Onboarding automatically starts

↓

## HR tracks onboarding

This journey must work without requiring manual database manipulation.

---

# 60. IMPORTANT: NO STATIC MOCKUP

Do NOT simply create pages with fake buttons.

Buttons must perform real application actions.

Examples:

"Shortlist"

must update candidate status.

"Reject"

must update candidate status.

"Select Vendor"

must create/update vendor selection.

"Request Sourcing"

must create a sourcing request.

"Accept Offer"

must update offer status and trigger onboarding.

"Approve"

must update the approval record and move the workflow forward.

"Filter"

must actually filter.

"Sort"

must actually sort.

"Compare"

must actually compare.

"Update Vendor Score"

must update the vendor performance model and history.

---

# 61. WORKFLOW STATE MACHINE

Implement workflow states rather than manually changing arbitrary labels.

Requirement:

```text
DRAFT
SUBMITTED
CONTRACT_VALIDATION
VENDOR_IDENTIFICATION
SOURCING
SCREENING
RECRUITER_REVIEW
INTERVIEW
FEEDBACK
OFFER
ONBOARDING
COMPLETED
```

Candidate:

```text
RECEIVED
SCREENING
REVIEW
SHORTLISTED
REJECTED
INTERVIEW
INTERVIEW_COMPLETED
SELECTED
OFFER
HIRED
```

Offer:

```text
DRAFT
PENDING_APPROVAL
APPROVED
SENT
ACCEPTED
REJECTED
CLARIFICATION_REQUESTED
```

Onboarding:

```text
NOT_STARTED
IN_PROGRESS
COMPLETED
BLOCKED
```

---

# 62. SECURITY

Implement role-based authorization.

HR/Admin:

Full access.

Manager:

Only relevant recruitment and candidate information.

Candidate:

Only their own:

* Application
* Interview
* Offer
* Documents
* Onboarding

Never expose another candidate's personal information.

---

# 63. DATA PRIVACY

Treat candidate information as sensitive.

Do not expose:

* Candidate data across unauthorized roles
* Internal ranking information to candidates
* Other candidate information
* Vendor confidential information to candidates

Provide an appropriate privacy/access architecture.

---

# 64. AUDITABILITY

Every AI-generated recommendation should be traceable.

For example:

```text
AI Vendor Recommendation
Requirement: REQ-2091
Vendor: TalentBridge
Score: 92%
Generated: 20 Sep 2026
Reason: Strong recent performance in Python, SQL and ML
Human decision: Pending
```

---

# 65. HUMAN-IN-THE-LOOP RULE

This rule is mandatory throughout the application.

AI may:

* Recommend
* Score
* Rank
* Summarize
* Flag
* Draft
* Explain

AI may NOT independently:

* Hire
* Reject a candidate as final decision
* Approve compensation
* Approve an offer
* Sign a contract
* Make a final hiring decision

Every such decision requires human action.

---

# 66. FUTURE DEVELOPMENT PLACEHOLDERS

Create visible but disabled/future-ready areas for:

### AI Contract Intelligence

Status:

**Under Development**

### AI Resume Sourcing

Status:

**Under Development**

### AI Interview Intelligence

Status:

**Under Development**

### AI Offer Generation

Status:

**Under Development**

### Microsoft Teams Integration

Status:

**Integration Required**

### Outlook Integration

Status:

**Integration Required**

### Power Automate

Status:

**Integration Required**

Do not make these appear broken.

---

# 67. SETTINGS

Create settings sections:

### Account

* Name
* Email
* Role

### Notifications

* Email
* In-app

### AI Settings

* Vendor ranking weights
* Recency weighting
* Minimum confidence
* Human approval requirements

### System

* Workflow configuration
* Integration status

Only authorized users should modify system-level settings.

---

# 68. UI NAVIGATION

HR/Admin:

```text
Dashboard
Requirements
Vendors
Vendor Ranking
Candidates
Interviews
Approvals
Offers
Onboarding
AI Control Center
Reports
Audit Trail
Users
Settings
```

Manager:

```text
Dashboard
Requirements
Candidates
Interviews
Feedback
Approvals
Settings
```

Candidate:

```text
Home
My Application
My Interview
My Offer
Onboarding
Notifications
Profile
```

---

# 69. BREADCRUMBS

Use breadcrumbs on deep pages.

Example:

```text
Requirements
/
REQ-2091
/
Vendor Ranking
/
TalentBridge Partners
```

---

# 70. TABLE REQUIREMENTS

All major tables should support:

* Search
* Filtering
* Sorting
* Pagination
* Row actions
* Responsive behaviour
* Empty state
* Loading state

---

# 71. DETAIL DRAWERS

Where useful, allow users to click a row and open a detail drawer without leaving the page.

Examples:

* Vendor detail
* Candidate detail
* AI explanation
* Audit event

---

# 72. NOTIFICATIONS

Use toast notifications for successful actions.

Examples:

> Vendor selected successfully.

> Candidate shortlisted.

> Offer approved.

> Onboarding started.

Use errors for failed actions.

---

# 73. LOADING EXPERIENCE

Use skeleton loaders rather than blank screens.

For simulated AI:

Show:

> AI is analysing vendor performance...

Then:

> Vendor ranking generated.

This should be a realistic short async simulation.

---

# 74. AI SIMULATION ARCHITECTURE

If no live AI API key exists:

Create mock AI service functions.

For example:

```text
analyzeRequirement()
rankVendors()
screenCandidate()
summarizeInterview()
generateOffer()
validateContract()
```

Each should return structured results.

Keep the service layer separate so real AI APIs can replace the mock implementation later.

Do NOT hard-code AI results directly into UI components.

---

# 75. FUTURE API ADAPTERS

Design integration interfaces for:

* OpenAI-compatible AI API
* Microsoft Teams
* Outlook Calendar
* Power Automate
* SharePoint
* Dataverse
* Email service

External credentials must be stored securely as environment variables/secrets.

Never expose API keys in client-side code.

---

# 76. PERFORMANCE

Avoid unnecessary database calls.

Use:

* Pagination
* Query filtering
* Lazy loading where appropriate
* Memoization where useful
* Optimistic UI only where safe

---

# 77. CODE QUALITY

Use:

* TypeScript
* Reusable components
* Typed database models
* Central API/service layer
* Reusable hooks
* Clear folder structure
* No duplicated business logic
* No giant monolithic components

Separate:

```text
UI
Business Logic
Data Access
AI Services
Workflow Services
Authentication
Authorization
```

---

# 78. TESTING

Create basic tests for critical business logic.

At minimum:

### Vendor Ranking

Test:

* Correct weighted score
* Ranking order
* Filtering
* Sorting
* Score update

### Candidate Screening

Test:

* Candidate score generated
* Skill scores
* Candidate status transition

### Approval

Test:

* Approval changes status
* Rejection changes status
* Audit event created

### Offer

Test:

* Offer approval
* Offer acceptance
* Onboarding trigger

### Vendor Feedback Loop

Test:

Candidate outcome

→ Vendor score update

→ Score history

→ Ranking recalculation

---

# 79. ACCEPTANCE CRITERIA

The build is NOT complete until all of the following work:

## Authentication

* Login works
* Logout works
* Role routing works
* Protected routes work

## Requirements

* Create requirement
* Edit requirement
* Save draft
* Submit requirement
* View requirement
* Track status

## Vendors

* View vendors
* Search vendors
* Filter vendors
* Sort vendors
* Rank vendors
* Compare vendors
* View vendor details
* Select vendor
* Request sourcing

## Vendor Intelligence

* Skill scores work
* Ranking works
* Explanation works
* Performance works
* Score history works
* Feedback loop works

## Candidates

* Candidates appear
* AI screening works
* Scores appear
* Comparison works
* Shortlisting works
* Rejection works
* Human decision recorded

## Interviews

* Schedule
* Reschedule
* View
* Feedback

## Offers

* Generate draft
* Approve
* Reject
* Send
* Accept
* Clarification

## Onboarding

* Automatically starts after acceptance
* Tasks generated
* Progress updates
* HR can monitor

## Audit

* Important actions logged
* AI vs human distinction visible

---

# 80. DEMO EXPERIENCE

When the application first launches, make the demo easy to understand.

Provide:

### Demo Data Loaded

A clear seeded environment with:

* 1+ requirements
* 5+ vendors
* 8+ candidates
* Interviews
* Offers
* Onboarding records
* AI recommendations
* Audit events

The main demo requirement should be:

**Data Analyst — REQ-2091**

The user should immediately be able to navigate into Vendor Ranking.

---

# 81. LANDING EXPERIENCE

After HR/Admin login:

Show:

> Good morning, Kashmira

Then:

### Recruitment & Onboarding

KPI dashboard.

Quick links:

* New Requirement
* Vendor Ranking
* Candidates
* My Approvals
* Interviews

---

# 82. VENDOR RANKING QUICK ACCESS

Vendor Ranking must be highly visible from the HR dashboard.

Use a dashboard widget:

### Top Vendors for Active Requirements

Example:

1. TalentBridge Partners — 92%
2. NorthStar Staffing — 84%
3. Apex Talent — 81%

Button:

**View Vendor Ranking**

---

# 83. EXPLAINABILITY

For every AI score, provide a tooltip or expandable explanation.

Never display:

> 92%

without context.

Instead:

> 92% — Strong match based on skill fit, recent candidate quality, shortlist conversion and historical performance.

---

# 84. SCORE VISUALIZATION

Use:

* Progress bars
* Score badges
* Trend arrows
* Skill radar/chart where appropriate
* Historical line charts

Avoid visual overload.

---

# 85. RANKING CHANGES

When a vendor's ranking changes, show:

### Ranking Change

> TalentBridge moved from #2 → #1 after three recent candidates achieved an average 91% match score.

This is an important demonstration of the feedback loop.

---

# 86. AI RECOMMENDATION CARD

Use a reusable component:

**AI Recommendation**

Contains:

* Recommendation
* Score
* Reason
* Factors
* Confidence
* Human approval state

Example:

```text
AI Recommendation

Recommend TalentBridge Partners

92% match

Why:
Strong recent performance for Python, SQL and Machine Learning.

Human decision required.
```

---

# 87. FINAL PRODUCT QUALITY

The result should feel like a serious enterprise SaaS product suitable for an HR/recruitment operations team.

It should NOT look like:

* A hackathon demo
* A static Figma conversion
* A generic ATS template
* A collection of disconnected pages

It should feel like one connected system.

---

# 88. MOST IMPORTANT IMPLEMENTATION PRIORITY

If development time is limited, prioritize in this exact order:

### P0

1. Authentication
2. Role-based dashboards
3. Requirements
4. Vendors
5. Vendor ranking
6. Vendor filtering
7. Vendor comparison
8. Vendor selection
9. Candidate sourcing
10. Candidate screening
11. Vendor performance feedback loop
12. Human approval

### P1

13. Candidate comparison
14. Interviews
15. Feedback
16. Offers
17. Candidate portal
18. Onboarding
19. Notifications
20. Audit trail

### P2

21. Contract AI
22. Resume sourcing AI
23. Interview AI
24. Offer AI
25. External integrations

---

# 89. FINAL INSTRUCTION TO THE BUILD AGENT

Do not stop after generating the UI.

First establish:

1. Application architecture
2. Database schema
3. Authentication
4. Authorization
5. Core entities
6. Workflow states
7. Vendor ranking service
8. Candidate scoring service
9. Approval workflow
10. Audit logging

Then build the UI around the working functionality.

Every important screen must be connected to real application data.

Every major action must update the database and workflow state.

Every AI recommendation must be explainable.

Every final decision must require human approval.

The Vendor Ranking and Vendor Performance Feedback Loop must be treated as the primary product differentiator and must receive the highest implementation priority.

---

# 90. FINAL SUCCESS CONDITION

At the end of development, I should be able to log in as HR/Admin and demonstrate this complete journey without manually editing the database:

```text
LOGIN
  ↓
CREATE REQUIREMENT
  ↓
AI ANALYSES REQUIREMENT
  ↓
VENDOR RANKING
  ↓
FILTER / SORT / COMPARE VENDORS
  ↓
SELECT VENDOR
  ↓
REQUEST SOURCING
  ↓
CANDIDATES RECEIVED
  ↓
AI CANDIDATE SCREENING
  ↓
CANDIDATE MATCH SCORES
  ↓
VENDOR PERFORMANCE UPDATED
  ↓
VENDOR RANKING UPDATED
  ↓
HUMAN SHORTLIST
  ↓
INTERVIEW
  ↓
FEEDBACK
  ↓
AI SUMMARY
  ↓
HUMAN APPROVAL
  ↓
OFFER
  ↓
HR APPROVAL
  ↓
CANDIDATE ACCEPTS
  ↓
ONBOARDING AUTOMATICALLY STARTS
  ↓
HR TRACKS ONBOARDING
```

The final product must demonstrate the core principle throughout:

# AI RECOMMENDS. HUMANS DECIDE.

Build this as a **fully functional end-to-end application**, with future AI/integration modules clearly marked and architected for later development rather than represented as fake completed integrations.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2118ee2a-86c0-460f-b8fc-41e9edc79492).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
