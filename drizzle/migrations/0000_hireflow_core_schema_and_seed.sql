-- ========== ROLES & PROFILES ==========
CREATE TYPE public.app_role AS ENUM ('HR_ADMIN','MANAGER','CANDIDATE');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role IN ('HR_ADMIN','MANAGER'))
$$;

CREATE OR REPLACE FUNCTION public.is_hr()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'HR_ADMIN')
$$;

CREATE POLICY profiles_select ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff());
CREATE POLICY profiles_insert ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.is_hr());

CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff());

-- ========== SKILLS ==========
CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL DEFAULT 'Technical',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.skills TO authenticated;
GRANT ALL ON public.skills TO service_role;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
CREATE POLICY skills_select ON public.skills FOR SELECT TO authenticated USING (true);

-- ========== REQUIREMENTS ==========
CREATE TABLE public.requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id TEXT NOT NULL UNIQUE,
  position_title TEXT NOT NULL,
  department TEXT,
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  experience_level TEXT,
  required_skills TEXT[] NOT NULL DEFAULT '{}',
  preferred_skills TEXT[] NOT NULL DEFAULT '{}',
  number_of_openings INT NOT NULL DEFAULT 1,
  location TEXT,
  work_mode TEXT DEFAULT 'Hybrid',
  target_hiring_timeline TEXT,
  hiring_manager_name TEXT,
  hiring_manager_id UUID,
  priority TEXT NOT NULL DEFAULT 'Medium',
  job_description TEXT,
  contract_document TEXT,
  contract_status TEXT NOT NULL DEFAULT 'NOT_UPLOADED',
  contract_findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  is_seed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.requirements TO authenticated;
GRANT ALL ON public.requirements TO service_role;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_requirements_updated BEFORE UPDATE ON public.requirements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY requirements_select ON public.requirements FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY requirements_insert ON public.requirements FOR INSERT TO authenticated WITH CHECK (public.is_staff());
CREATE POLICY requirements_update ON public.requirements FOR UPDATE TO authenticated USING (public.is_staff());
CREATE POLICY requirements_delete ON public.requirements FOR DELETE TO authenticated USING (public.is_hr());

-- ========== VENDORS ==========
CREATE TABLE public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_name TEXT NOT NULL,
  vendor_type TEXT NOT NULL DEFAULT 'Staffing Agency',
  description TEXT,
  specialisations TEXT[] NOT NULL DEFAULT '{}',
  locations TEXT[] NOT NULL DEFAULT '{}',
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  is_seed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendors TO authenticated;
GRANT ALL ON public.vendors TO service_role;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_vendors_updated BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY vendors_select ON public.vendors FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY vendors_write ON public.vendors FOR ALL TO authenticated USING (public.is_hr()) WITH CHECK (public.is_hr());

CREATE TABLE public.vendor_skill_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  sample_size INT NOT NULL DEFAULT 0,
  recent_score NUMERIC(5,2),
  historical_score NUMERIC(5,2),
  trend TEXT NOT NULL DEFAULT 'FLAT',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, skill)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_skill_scores TO authenticated;
GRANT ALL ON public.vendor_skill_scores TO service_role;
ALTER TABLE public.vendor_skill_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY vss_select ON public.vendor_skill_scores FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY vss_write ON public.vendor_skill_scores FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE TABLE public.vendor_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES public.requirements(id) ON DELETE CASCADE,
  candidates_submitted INT NOT NULL DEFAULT 0,
  candidates_screened INT NOT NULL DEFAULT 0,
  candidates_matched INT NOT NULL DEFAULT 0,
  candidates_shortlisted INT NOT NULL DEFAULT 0,
  interviews INT NOT NULL DEFAULT 0,
  offers INT NOT NULL DEFAULT 0,
  hires INT NOT NULL DEFAULT 0,
  average_candidate_match_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (vendor_id, requirement_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vendor_performance TO authenticated;
GRANT ALL ON public.vendor_performance TO service_role;
ALTER TABLE public.vendor_performance ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_vp_updated BEFORE UPDATE ON public.vendor_performance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY vp_select ON public.vendor_performance FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY vp_write ON public.vendor_performance FOR ALL TO authenticated USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE TABLE public.vendor_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES public.requirements(id) ON DELETE SET NULL,
  skill TEXT,
  previous_score NUMERIC(5,2),
  new_score NUMERIC(5,2),
  reason TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'AI',
  source_candidate_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.vendor_score_history TO authenticated;
GRANT ALL ON public.vendor_score_history TO service_role;
ALTER TABLE public.vendor_score_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY vsh_select ON public.vendor_score_history FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY vsh_insert ON public.vendor_score_history FOR INSERT TO authenticated WITH CHECK (public.is_staff());

-- ========== CANDIDATES ==========
CREATE TABLE public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  location TEXT,
  total_experience NUMERIC(4,1) NOT NULL DEFAULT 0,
  education TEXT,
  current_company TEXT,
  previous_companies TEXT[] NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  resume_url TEXT,
  source TEXT NOT NULL DEFAULT 'VENDOR',
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  is_seed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidates TO authenticated;
GRANT ALL ON public.candidates TO service_role;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_candidates_updated BEFORE UPDATE ON public.candidates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY candidates_select ON public.candidates FOR SELECT TO authenticated
  USING (public.is_staff() OR user_id = auth.uid());
CREATE POLICY candidates_write ON public.candidates FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE OR REPLACE FUNCTION public.my_candidate_ids()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.candidates WHERE user_id = auth.uid()
$$;

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id TEXT NOT NULL UNIQUE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE SET NULL,
  stage TEXT NOT NULL DEFAULT 'RECEIVED',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  match_score NUMERIC(5,2),
  recruiter_decision TEXT,
  recruiter_decision_reason TEXT,
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.applications TO authenticated;
GRANT ALL ON public.applications TO service_role;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_applications_updated BEFORE UPDATE ON public.applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY applications_select ON public.applications FOR SELECT TO authenticated
  USING (public.is_staff() OR candidate_id IN (SELECT public.my_candidate_ids()));
CREATE POLICY applications_write ON public.applications FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

CREATE TABLE public.candidate_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  overall_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  skill_scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  experience_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  location_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  education_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  strengths TEXT[] NOT NULL DEFAULT '{}',
  gaps TEXT[] NOT NULL DEFAULT '{}',
  explanation TEXT,
  ai_recommendation TEXT NOT NULL DEFAULT 'REVIEW',
  confidence NUMERIC(4,2) NOT NULL DEFAULT 0.8,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (candidate_id, requirement_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.candidate_scores TO authenticated;
GRANT ALL ON public.candidate_scores TO service_role;
ALTER TABLE public.candidate_scores ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_cs_updated BEFORE UPDATE ON public.candidate_scores
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY cs_select ON public.candidate_scores FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY cs_write ON public.candidate_scores FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ========== SOURCING ==========
CREATE TABLE public.sourcing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  candidates_requested INT NOT NULL DEFAULT 5,
  deadline DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'REQUESTED',
  requested_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sourcing_requests TO authenticated;
GRANT ALL ON public.sourcing_requests TO service_role;
ALTER TABLE public.sourcing_requests ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_sr_updated BEFORE UPDATE ON public.sourcing_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY sr_select ON public.sourcing_requests FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY sr_write ON public.sourcing_requests FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ========== INTERVIEWS ==========
CREATE TABLE public.interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  interviewer_name TEXT NOT NULL,
  interviewer_email TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 45,
  mode TEXT NOT NULL DEFAULT 'Microsoft Teams',
  meeting_link TEXT,
  round TEXT NOT NULL DEFAULT 'Technical',
  status TEXT NOT NULL DEFAULT 'SCHEDULED',
  reschedule_requested BOOLEAN NOT NULL DEFAULT false,
  reschedule_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interviews TO authenticated;
GRANT ALL ON public.interviews TO service_role;
ALTER TABLE public.interviews ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_interviews_updated BEFORE UPDATE ON public.interviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY interviews_select ON public.interviews FOR SELECT TO authenticated
  USING (public.is_staff() OR candidate_id IN (SELECT public.my_candidate_ids()));
CREATE POLICY interviews_write ON public.interviews FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY interviews_candidate_update ON public.interviews FOR UPDATE TO authenticated
  USING (candidate_id IN (SELECT public.my_candidate_ids()));

CREATE TABLE public.interview_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES public.interviews(id) ON DELETE CASCADE,
  technical_capability TEXT NOT NULL,
  communication TEXT NOT NULL,
  problem_solving TEXT NOT NULL,
  strengths TEXT,
  concerns TEXT,
  overall_recommendation TEXT NOT NULL,
  ai_summary TEXT,
  ai_recommendation TEXT,
  submitted_by UUID,
  submitted_by_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interview_feedback TO authenticated;
GRANT ALL ON public.interview_feedback TO service_role;
ALTER TABLE public.interview_feedback ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_if_updated BEFORE UPDATE ON public.interview_feedback
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY if_select ON public.interview_feedback FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY if_write ON public.interview_feedback FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ========== OFFERS ==========
CREATE TABLE public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  requirement_id UUID NOT NULL REFERENCES public.requirements(id) ON DELETE CASCADE,
  position_title TEXT NOT NULL,
  department TEXT,
  start_date DATE,
  compensation_band TEXT,
  location TEXT,
  employment_type TEXT NOT NULL DEFAULT 'Full-time',
  documents TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'DRAFT',
  clarification_note TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO authenticated;
GRANT ALL ON public.offers TO service_role;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_offers_updated BEFORE UPDATE ON public.offers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY offers_select ON public.offers FOR SELECT TO authenticated
  USING (public.is_staff() OR candidate_id IN (SELECT public.my_candidate_ids()));
CREATE POLICY offers_write ON public.offers FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY offers_candidate_update ON public.offers FOR UPDATE TO authenticated
  USING (candidate_id IN (SELECT public.my_candidate_ids()));

-- ========== ONBOARDING ==========
CREATE TABLE public.onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  offer_id UUID REFERENCES public.offers(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES public.requirements(id) ON DELETE SET NULL,
  task TEXT NOT NULL,
  description TEXT,
  owner TEXT NOT NULL DEFAULT 'HR',
  category TEXT NOT NULL DEFAULT 'GENERAL',
  status TEXT NOT NULL DEFAULT 'PENDING',
  due_date DATE,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_tasks TO authenticated;
GRANT ALL ON public.onboarding_tasks TO service_role;
ALTER TABLE public.onboarding_tasks ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_ot_updated BEFORE UPDATE ON public.onboarding_tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY ot_select ON public.onboarding_tasks FOR SELECT TO authenticated
  USING (public.is_staff() OR candidate_id IN (SELECT public.my_candidate_ids()));
CREATE POLICY ot_write ON public.onboarding_tasks FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());
CREATE POLICY ot_candidate_update ON public.onboarding_tasks FOR UPDATE TO authenticated
  USING (candidate_id IN (SELECT public.my_candidate_ids()));

-- ========== APPROVALS ==========
CREATE TABLE public.approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  requirement_id UUID REFERENCES public.requirements(id) ON DELETE CASCADE,
  ai_recommendation TEXT,
  ai_score NUMERIC(5,2),
  ai_explanation TEXT,
  ai_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  confidence NUMERIC(4,2),
  status TEXT NOT NULL DEFAULT 'PENDING',
  assigned_role public.app_role NOT NULL DEFAULT 'HR_ADMIN',
  responsible_name TEXT,
  decision_reason TEXT,
  decided_by UUID,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.approvals TO authenticated;
GRANT ALL ON public.approvals TO service_role;
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_approvals_updated BEFORE UPDATE ON public.approvals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE POLICY approvals_select ON public.approvals FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY approvals_write ON public.approvals FOR ALL TO authenticated
  USING (public.is_staff()) WITH CHECK (public.is_staff());

-- ========== NOTIFICATIONS ==========
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  audience_role public.app_role,
  title TEXT NOT NULL,
  body TEXT,
  category TEXT NOT NULL DEFAULT 'GENERAL',
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_select ON public.notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid()
    OR (audience_role IS NOT NULL AND public.has_role(auth.uid(), audience_role)));
CREATE POLICY notifications_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()
    OR (audience_role IS NOT NULL AND public.has_role(auth.uid(), audience_role)));

-- ========== AUDIT ==========
CREATE TABLE public.audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  actor_name TEXT,
  role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_label TEXT,
  previous_value JSONB,
  new_value JSONB,
  source TEXT NOT NULL DEFAULT 'HUMAN',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.audit_events TO authenticated;
GRANT ALL ON public.audit_events TO service_role;
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_select ON public.audit_events FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY audit_insert ON public.audit_events FOR INSERT TO authenticated WITH CHECK (true);

-- ========== AI SETTINGS & AGENTS ==========
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_select ON public.app_settings FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY settings_write ON public.app_settings FOR ALL TO authenticated
  USING (public.is_hr()) WITH CHECK (public.is_hr());

CREATE TABLE public.ai_agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  purpose TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'SIMULATED',
  requires_human_approval BOOLEAN NOT NULL DEFAULT true,
  executions INT NOT NULL DEFAULT 0,
  last_execution TIMESTAMPTZ,
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT, UPDATE ON public.ai_agents TO authenticated;
GRANT ALL ON public.ai_agents TO service_role;
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;
CREATE POLICY agents_select ON public.ai_agents FOR SELECT TO authenticated USING (public.is_staff());
CREATE POLICY agents_update ON public.ai_agents FOR UPDATE TO authenticated USING (public.is_staff());

-- ========== SEED ==========
INSERT INTO public.skills (name, category) VALUES
 ('Python','Technical'),('SQL','Technical'),('Machine Learning','Technical'),
 ('Data Analytics','Technical'),('Java','Technical'),('JavaScript','Technical'),
 ('React','Technical'),('Cloud','Technical'),('AWS','Technical'),('Azure','Technical'),
 ('Communication','Soft Skill'),('Problem Solving','Soft Skill');

INSERT INTO public.app_settings (key, value) VALUES
 ('ai_settings', '{"weights":{"skillFit":40,"candidateQuality":20,"recentPerformance":15,"shortlistConversion":10,"interviewConversion":5,"hiringConversion":10},"recency":{"recentDays":90,"midDays":180,"recentWeight":1,"midWeight":0.6,"olderWeight":0.3},"minimumConfidence":0.6,"requireHumanApproval":true,"minimumSampleSize":3}'::jsonb);

INSERT INTO public.ai_agents (agent_key,name,purpose,status,requires_human_approval,executions,last_execution,sort_order) VALUES
 ('contract_validation','Contract Validation Agent','Extracts contract fields and flags discrepancies for human review.','SIMULATED',true,12, now() - interval '2 days',1),
 ('vendor_recommendation','Vendor Recommendation Agent','Scores and ranks vendors against a requirement with transparent factors.','ACTIVE',true,148, now() - interval '3 hours',2),
 ('resume_sourcing','Resume Sourcing Agent','Requests and collects candidate profiles from selected vendors.','SIMULATED',true,26, now() - interval '1 day',3),
 ('candidate_screening','Candidate Screening Agent','Scores candidate fit against requirement skills, experience and location.','ACTIVE',true,312, now() - interval '1 hour',4),
 ('interview_scheduling','Interview Scheduling Agent','Proposes interview slots; Teams/Outlook integration pending.','INTEGRATION_REQUIRED',true,0,NULL,5),
 ('feedback_summary','Feedback Summary Agent','Summarises interviewer feedback into a recommendation.','SIMULATED',true,18, now() - interval '5 hours',6),
 ('offer_drafting','Offer Drafting Agent','Drafts offer documents for HR review. Never approves compensation.','SIMULATED',true,9, now() - interval '1 day',7);

INSERT INTO public.requirements (id,requirement_id,position_title,department,employment_type,experience_level,required_skills,preferred_skills,number_of_openings,location,work_mode,target_hiring_timeline,hiring_manager_name,priority,job_description,contract_document,contract_status,contract_findings,status,is_seed) VALUES
 ('a1000000-0000-4000-8000-000000002091','REQ-2091','Data Analyst','Risk & Analytics','Full-time','3-5 years',ARRAY['Python','SQL','Machine Learning'],ARRAY['Data Analytics','Communication'],2,'Bengaluru','Hybrid','6 weeks','Rohan Verma','High','Analyse risk datasets, build models and partner with the Risk & Analytics team to deliver decision-ready insight.','REQ-2091-vendor-contract.pdf','FLAGGED','[{"field":"Compensation band","severity":"warning","message":"Compensation field requires human review — band not stated in the uploaded contract."},{"field":"Notice period","severity":"info","message":"Extracted as 60 days."}]'::jsonb,'SCREENING',true),
 ('a1000000-0000-4000-8000-000000002088','REQ-2088','Backend Engineer','Platform Engineering','Full-time','4-7 years',ARRAY['Java','Cloud','AWS'],ARRAY['Problem Solving'],3,'Pune','Hybrid','8 weeks','Meera Kulkarni','Medium','Build and operate core platform services.',NULL,'NOT_UPLOADED','[]'::jsonb,'VENDOR_IDENTIFICATION',true),
 ('a1000000-0000-4000-8000-000000002095','REQ-2095','Cloud Engineer','Infrastructure','Contract','5-8 years',ARRAY['Azure','Cloud'],ARRAY['Communication'],1,'Remote','Remote','4 weeks','Rohan Verma','High','Own cloud infrastructure automation.',NULL,'NOT_UPLOADED','[]'::jsonb,'DRAFT',true);

INSERT INTO public.vendors (id,vendor_name,vendor_type,description,specialisations,locations,contact_name,contact_email,contact_phone,status,overall_score,is_seed) VALUES
 ('b1000000-0000-4000-8000-000000000001','TalentBridge Partners','Specialist Agency','Analytics and data science hiring specialist with a strong Bengaluru bench.',ARRAY['Analytics','Data Science'],ARRAY['Bengaluru','Hyderabad'],'Sudha Krishnan','sudha@talentbridge.example','+91 98450 11221','ACTIVE',92,true),
 ('b1000000-0000-4000-8000-000000000002','NorthStar Staffing','Staffing Agency','Generalist staffing partner with broad engineering coverage.',ARRAY['Generalist','Engineering'],ARRAY['Bengaluru','Pune','Remote'],'Amit Raghavan','amit@northstar.example','+91 98200 44112','ACTIVE',84,true),
 ('b1000000-0000-4000-8000-000000000003','Apex Talent','Specialist Agency','Machine learning and research hiring boutique.',ARRAY['Machine Learning','Research'],ARRAY['Bengaluru','Chennai'],'Fiona D''Souza','fiona@apextalent.example','+91 90030 77553','ACTIVE',81,true),
 ('b1000000-0000-4000-8000-000000000004','Meridian Recruit','Staffing Agency','Volume staffing with mixed quality outcomes in analytics roles.',ARRAY['Generalist','Operations'],ARRAY['Pune','Mumbai'],'Deepak Shah','deepak@meridian.example','+91 99870 22118','ACTIVE',76,true),
 ('b1000000-0000-4000-8000-000000000005','Vertex Staffing Co.','Staffing Agency','Newly onboarded vendor — limited historical data.',ARRAY['Cloud','Engineering'],ARRAY['Remote','Bengaluru'],'Latha Menon','latha@vertex.example','+91 98111 66554','ACTIVE',71,true);

INSERT INTO public.vendor_skill_scores (vendor_id,skill,score,sample_size,recent_score,historical_score,trend) VALUES
 ('b1000000-0000-4000-8000-000000000001','Python',94,22,95,91,'UP'),
 ('b1000000-0000-4000-8000-000000000001','SQL',92,20,93,89,'UP'),
 ('b1000000-0000-4000-8000-000000000001','Machine Learning',88,14,90,85,'UP'),
 ('b1000000-0000-4000-8000-000000000001','Data Analytics',90,18,91,88,'FLAT'),
 ('b1000000-0000-4000-8000-000000000002','Python',82,16,80,84,'DOWN'),
 ('b1000000-0000-4000-8000-000000000002','SQL',86,19,88,83,'UP'),
 ('b1000000-0000-4000-8000-000000000002','Machine Learning',74,8,73,76,'DOWN'),
 ('b1000000-0000-4000-8000-000000000002','Java',88,24,89,86,'UP'),
 ('b1000000-0000-4000-8000-000000000003','Python',85,12,84,86,'FLAT'),
 ('b1000000-0000-4000-8000-000000000003','SQL',78,9,76,80,'DOWN'),
 ('b1000000-0000-4000-8000-000000000003','Machine Learning',93,17,95,90,'UP'),
 ('b1000000-0000-4000-8000-000000000004','Python',72,11,68,75,'DOWN'),
 ('b1000000-0000-4000-8000-000000000004','SQL',75,13,72,78,'DOWN'),
 ('b1000000-0000-4000-8000-000000000004','Machine Learning',64,6,62,66,'DOWN'),
 ('b1000000-0000-4000-8000-000000000005','Python',70,2,70,NULL,'FLAT'),
 ('b1000000-0000-4000-8000-000000000005','Cloud',80,2,80,NULL,'FLAT'),
 ('b1000000-0000-4000-8000-000000000005','Azure',78,1,78,NULL,'FLAT');

INSERT INTO public.vendor_performance (vendor_id,requirement_id,candidates_submitted,candidates_screened,candidates_matched,candidates_shortlisted,interviews,offers,hires,average_candidate_match_score,recorded_at) VALUES
 ('b1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000002091',2,2,2,1,1,1,0,86,now() - interval '4 days'),
 ('b1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000002091',2,2,1,0,0,0,0,75.5,now() - interval '4 days'),
 ('b1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000002091',2,2,1,0,0,0,0,73.5,now() - interval '5 days'),
 ('b1000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000002091',2,2,0,0,0,0,0,66,now() - interval '6 days'),
 ('b1000000-0000-4000-8000-000000000005','a1000000-0000-4000-8000-000000002091',1,1,0,0,0,0,0,69,now() - interval '2 days'),
 ('b1000000-0000-4000-8000-000000000001',NULL,48,46,41,28,19,9,7,88,now() - interval '30 days'),
 ('b1000000-0000-4000-8000-000000000002',NULL,52,50,38,22,14,6,4,81,now() - interval '30 days'),
 ('b1000000-0000-4000-8000-000000000003',NULL,31,30,22,13,8,3,2,79,now() - interval '30 days'),
 ('b1000000-0000-4000-8000-000000000004',NULL,44,40,21,9,5,2,1,70,now() - interval '30 days'),
 ('b1000000-0000-4000-8000-000000000005',NULL,4,4,2,1,0,0,0,69,now() - interval '10 days');

INSERT INTO public.vendor_score_history (vendor_id,requirement_id,skill,previous_score,new_score,reason,source,created_at) VALUES
 ('b1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000002091','Python',91,94,'Vendor score updated because candidate Priya Sharma achieved a 94% Python match for the Data Analyst requirement.','AI',now() - interval '3 days'),
 ('b1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000002091','SQL',89,92,'Vendor score updated because recent submissions averaged 92% on SQL.','AI',now() - interval '3 days'),
 ('b1000000-0000-4000-8000-000000000001',NULL,NULL,89,92,'Overall score recalculated after three recent candidates averaged a 91% match score. Rank moved #2 to #1.','AI',now() - interval '3 days'),
 ('b1000000-0000-4000-8000-000000000004',NULL,NULL,79,76,'Overall score recalculated after two recent candidates fell below the 70% match threshold.','AI',now() - interval '6 days');

INSERT INTO public.candidates (id,name,email,phone,location,total_experience,education,current_company,previous_companies,skills,resume_url,source,vendor_id,status,is_seed) VALUES
 ('c1000000-0000-4000-8000-000000000001','Priya Sharma','candidate@hireflow.demo','+91 98860 12345','Bengaluru',4,'M.Sc. Statistics, Christ University','FinEdge Analytics',ARRAY['Quantly Labs'],ARRAY['Python','SQL','Machine Learning','Data Analytics'],'priya-sharma-resume.pdf','VENDOR','b1000000-0000-4000-8000-000000000001','INTERVIEW_COMPLETED',true),
 ('c1000000-0000-4000-8000-000000000002','Arjun Mehta','arjun.mehta@example.com','+91 98860 22345','Bengaluru',5,'B.Tech CSE, VIT','Northwind Bank',ARRAY['Tessel Data'],ARRAY['Python','SQL','Data Analytics'],'arjun-mehta-resume.pdf','VENDOR','b1000000-0000-4000-8000-000000000001','SHORTLISTED',true),
 ('c1000000-0000-4000-8000-000000000003','Neha Iyer','neha.iyer@example.com','+91 98860 32345','Chennai',3,'B.E. IT, Anna University','Brightline Retail',ARRAY[]::text[],ARRAY['SQL','Data Analytics','Communication'],'neha-iyer-resume.pdf','VENDOR','b1000000-0000-4000-8000-000000000002','REVIEW',true),
 ('c1000000-0000-4000-8000-000000000004','Rahul Desai','rahul.desai@example.com','+91 98860 42345','Pune',6,'MBA Analytics, SIBM','Corvus Insurance',ARRAY['Helio Systems'],ARRAY['SQL','Python'],'rahul-desai-resume.pdf','VENDOR','b1000000-0000-4000-8000-000000000002','REVIEW',true),
 ('c1000000-0000-4000-8000-000000000005','Sneha Rao','sneha.rao@example.com','+91 98860 52345','Bengaluru',4,'M.Tech Data Science, IIIT-B','Kestrel AI',ARRAY[]::text[],ARRAY['Machine Learning','Python'],'sneha-rao-resume.pdf','VENDOR','b1000000-0000-4000-8000-000000000003','REVIEW',true),
 ('c1000000-0000-4000-8000-000000000006','Vikram Nair','vikram.nair@example.com','+91 98860 62345','Kochi',2,'B.Sc. Mathematics, CUSAT','Datawave',ARRAY[]::text[],ARRAY['Python'],'vikram-nair-resume.pdf','VENDOR','b1000000-0000-4000-8000-000000000003','REVIEW',true),
 ('c1000000-0000-4000-8000-000000000007','Ananya Bose','ananya.bose@example.com','+91 98860 72345','Kolkata',3,'B.Tech ECE, Jadavpur','Mercury Logistics',ARRAY[]::text[],ARRAY['SQL','Communication'],'ananya-bose-resume.pdf','VENDOR','b1000000-0000-4000-8000-000000000004','REVIEW',true),
 ('c1000000-0000-4000-8000-000000000008','Karan Malhotra','karan.malhotra@example.com','+91 98860 82345','Delhi',1,'B.Com, DU','Fresh Start Labs',ARRAY[]::text[],ARRAY['SQL'],'karan-malhotra-resume.pdf','VENDOR','b1000000-0000-4000-8000-000000000004','REVIEW',true),
 ('c1000000-0000-4000-8000-000000000009','Divya Menon','divya.menon@example.com','+91 98860 92345','Remote',4,'B.Tech IT, NIT Calicut','Skyforge Cloud',ARRAY[]::text[],ARRAY['Python','Cloud'],'divya-menon-resume.pdf','VENDOR','b1000000-0000-4000-8000-000000000005','REVIEW',true);

INSERT INTO public.applications (id,application_id,candidate_id,requirement_id,vendor_id,stage,status,match_score,recruiter_decision,recruiter_decision_reason,created_at) VALUES
 ('d1000000-0000-4000-8000-000000000001','APP-4101','c1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000002091','b1000000-0000-4000-8000-000000000001','INTERVIEW_COMPLETED','ACTIVE',88,'SHORTLIST','Strong banking analytics experience and excellent Python/SQL depth.',now() - interval '9 days'),
 ('d1000000-0000-4000-8000-000000000002','APP-4102','c1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000002091','b1000000-0000-4000-8000-000000000001','SHORTLISTED','ACTIVE',84,'SHORTLIST','Good SQL depth, ML exposure lighter but acceptable.',now() - interval '8 days'),
 ('d1000000-0000-4000-8000-000000000003','APP-4103','c1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000002091','b1000000-0000-4000-8000-000000000002','REVIEW','ACTIVE',79,NULL,NULL,now() - interval '7 days'),
 ('d1000000-0000-4000-8000-000000000004','APP-4104','c1000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000002091','b1000000-0000-4000-8000-000000000002','REVIEW','ACTIVE',72,NULL,NULL,now() - interval '7 days'),
 ('d1000000-0000-4000-8000-000000000005','APP-4105','c1000000-0000-4000-8000-000000000005','a1000000-0000-4000-8000-000000002091','b1000000-0000-4000-8000-000000000003','REVIEW','ACTIVE',81,NULL,NULL,now() - interval '6 days'),
 ('d1000000-0000-4000-8000-000000000006','APP-4106','c1000000-0000-4000-8000-000000000006','a1000000-0000-4000-8000-000000002091','b1000000-0000-4000-8000-000000000003','REVIEW','ACTIVE',66,NULL,NULL,now() - interval '6 days'),
 ('d1000000-0000-4000-8000-000000000007','APP-4107','c1000000-0000-4000-8000-000000000007','a1000000-0000-4000-8000-000000002091','b1000000-0000-4000-8000-000000000004','REVIEW','ACTIVE',74,NULL,NULL,now() - interval '5 days'),
 ('d1000000-0000-4000-8000-000000000008','APP-4108','c1000000-0000-4000-8000-000000000008','a1000000-0000-4000-8000-000000002091','b1000000-0000-4000-8000-000000000004','REVIEW','ACTIVE',58,NULL,NULL,now() - interval '5 days'),
 ('d1000000-0000-4000-8000-000000000009','APP-4109','c1000000-0000-4000-8000-000000000009','a1000000-0000-4000-8000-000000002091','b1000000-0000-4000-8000-000000000005','REVIEW','ACTIVE',69,NULL,NULL,now() - interval '3 days');

INSERT INTO public.candidate_scores (candidate_id,requirement_id,overall_score,skill_scores,experience_score,location_score,education_score,strengths,gaps,explanation,ai_recommendation,confidence) VALUES
 ('c1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000002091',88,'{"Python":94,"SQL":91,"Machine Learning":86}'::jsonb,92,100,90,ARRAY['Strong Python and SQL depth','Banking risk analytics domain experience','4 years experience inside the 3-5 year band'],ARRAY['Limited deep-learning exposure'],'Scores 88% overall. All three required skills are met (Python 94%, SQL 91%, Machine Learning 86%), experience sits mid-band at 4 years, and the candidate is already based in Bengaluru.','RECOMMENDED',0.91),
 ('c1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000002091',84,'{"Python":88,"SQL":90,"Machine Learning":70}'::jsonb,95,100,85,ARRAY['Excellent SQL','5 years relevant experience'],ARRAY['Machine Learning below requirement level'],'Scores 84%. Python and SQL comfortably meet the requirement; Machine Learning is the weakest dimension at 70%.','RECOMMENDED',0.86),
 ('c1000000-0000-4000-8000-000000000003','a1000000-0000-4000-8000-000000002091',79,'{"Python":68,"SQL":88,"Machine Learning":66}'::jsonb,80,70,82,ARRAY['Strong SQL and reporting background','Clear communication'],ARRAY['Python below target','Not based in Bengaluru'],'Scores 79%. SQL is a clear strength but Python and Machine Learning fall short, and the candidate is based in Chennai.','REVIEW',0.78),
 ('c1000000-0000-4000-8000-000000000004','a1000000-0000-4000-8000-000000002091',72,'{"Python":70,"SQL":82,"Machine Learning":58}'::jsonb,70,65,80,ARRAY['Insurance analytics domain'],ARRAY['Experience above band','Machine Learning gap'],'Scores 72%. Domain experience is relevant but Machine Learning is a material gap and experience sits above the target band.','REVIEW',0.74),
 ('c1000000-0000-4000-8000-000000000005','a1000000-0000-4000-8000-000000002091',81,'{"Python":86,"SQL":72,"Machine Learning":94}'::jsonb,88,100,92,ARRAY['Outstanding Machine Learning depth','Bengaluru based'],ARRAY['SQL below target'],'Scores 81%. Machine Learning is exceptional at 94% but SQL at 72% sits under the requirement bar.','REVIEW',0.8),
 ('c1000000-0000-4000-8000-000000000006','a1000000-0000-4000-8000-000000002091',66,'{"Python":74,"SQL":60,"Machine Learning":55}'::jsonb,50,70,72,ARRAY['Solid Python fundamentals'],ARRAY['Only 2 years experience','SQL and ML both below bar'],'Scores 66%. Below the experience band and two of three required skills fall short.','WEAK_MATCH',0.72),
 ('c1000000-0000-4000-8000-000000000007','a1000000-0000-4000-8000-000000002091',74,'{"Python":62,"SQL":86,"Machine Learning":60}'::jsonb,78,60,80,ARRAY['Strong SQL','Good stakeholder communication'],ARRAY['Python gap','Relocation required'],'Scores 74%. SQL is strong; Python and Machine Learning are gaps and relocation from Kolkata would be required.','REVIEW',0.75),
 ('c1000000-0000-4000-8000-000000000008','a1000000-0000-4000-8000-000000002091',58,'{"Python":40,"SQL":72,"Machine Learning":35}'::jsonb,35,60,65,ARRAY['Eager and fast learning SQL'],ARRAY['1 year experience vs 3-5 required','No Python or ML depth'],'Scores 58%. Materially under the experience band with no Python or Machine Learning evidence.','WEAK_MATCH',0.82),
 ('c1000000-0000-4000-8000-000000000009','a1000000-0000-4000-8000-000000002091',69,'{"Python":76,"SQL":64,"Machine Learning":52}'::jsonb,85,80,78,ARRAY['Cloud data pipeline experience'],ARRAY['Machine Learning gap','Limited vendor history for calibration'],'Scores 69%. Reasonable Python and pipeline experience but Machine Learning is a gap. Submitted by a vendor with limited historical data.','REVIEW',0.64);

INSERT INTO public.sourcing_requests (requirement_id,vendor_id,candidates_requested,deadline,notes,status,created_at) VALUES
 ('a1000000-0000-4000-8000-000000002091','b1000000-0000-4000-8000-000000000001',3,current_date + 7,'Prioritise Python + SQL depth with banking exposure.','SUBMITTED',now() - interval '10 days'),
 ('a1000000-0000-4000-8000-000000002091','b1000000-0000-4000-8000-000000000002',3,current_date + 7,'Generalist coverage as backup.','SUBMITTED',now() - interval '10 days'),
 ('a1000000-0000-4000-8000-000000002091','b1000000-0000-4000-8000-000000000003',2,current_date + 9,'ML-heavy profiles welcome.','SUBMITTED',now() - interval '9 days');

INSERT INTO public.interviews (id,application_id,candidate_id,requirement_id,interviewer_name,interviewer_email,scheduled_at,mode,meeting_link,round,status) VALUES
 ('e1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000002091','Rohan Verma','rohan.verma@hireflow.demo',now() - interval '2 days','Microsoft Teams','https://teams.microsoft.com/l/meetup-join/demo-req2091-priya','Technical','COMPLETED'),
 ('e1000000-0000-4000-8000-000000000002','d1000000-0000-4000-8000-000000000002','c1000000-0000-4000-8000-000000000002','a1000000-0000-4000-8000-000000002091','Rohan Verma','rohan.verma@hireflow.demo',now() + interval '2 days' ,'Microsoft Teams','https://teams.microsoft.com/l/meetup-join/demo-req2091-arjun','Technical','SCHEDULED');

INSERT INTO public.interview_feedback (interview_id,technical_capability,communication,problem_solving,strengths,concerns,overall_recommendation,ai_summary,ai_recommendation,submitted_by_name) VALUES
 ('e1000000-0000-4000-8000-000000000001','Strong','Good','Strong','Clear model reasoning, strong SQL under pressure, good risk domain vocabulary.','Limited exposure to deep learning frameworks.','PROCEED','Technical capability: Strong. Communication: Good. Problem solving: Strong. The interviewer highlights clear model reasoning and strong SQL, with deep-learning exposure as the only concern.','Proceed to offer','Rohan Verma');

INSERT INTO public.offers (id,application_id,candidate_id,requirement_id,position_title,department,start_date,compensation_band,location,employment_type,documents,status) VALUES
 ('f1000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','c1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000002091','Data Analyst','Risk & Analytics',current_date + 30,'Band D4 (as approved by HR)','Bengaluru','Full-time',ARRAY['offer-letter-APP-4101.pdf'],'PENDING_APPROVAL');

INSERT INTO public.approvals (category,title,entity_type,entity_id,requirement_id,ai_recommendation,ai_score,ai_explanation,ai_factors,confidence,status,assigned_role,responsible_name) VALUES
 ('CONTRACT_EXCEPTION','Contract exception — REQ-2091','requirement','a1000000-0000-4000-8000-000000002091','a1000000-0000-4000-8000-000000002091','Request correction',NULL,'Compensation field requires review — the uploaded vendor contract does not state a compensation band.','[{"label":"Missing field","value":"Compensation band"},{"label":"Extracted notice period","value":"60 days"}]'::jsonb,0.7,'PENDING','HR_ADMIN','Kashmira Rao'),
 ('OFFER_APPROVAL','Offer approval — Priya Sharma','offer','f1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000002091','Proceed to offer',88,'Interview feedback is positive across technical capability and problem solving, and the screening match score is 88%. Compensation approval remains a human decision.','[{"label":"Match score","value":"88%"},{"label":"Interview recommendation","value":"Proceed"}]'::jsonb,0.89,'PENDING','HR_ADMIN','Kashmira Rao'),
 ('CANDIDATE_SHORTLIST','Shortlist review — Sneha Rao','application','d1000000-0000-4000-8000-000000000005','a1000000-0000-4000-8000-000000002091','Review',81,'Machine Learning depth is exceptional at 94% but SQL at 72% is below the requirement bar.','[{"label":"Machine Learning","value":"94%"},{"label":"SQL","value":"72%"}]'::jsonb,0.8,'PENDING','MANAGER','Rohan Verma'),
 ('VENDOR_SELECTION','Vendor selection — REQ-2091','vendor','b1000000-0000-4000-8000-000000000001','a1000000-0000-4000-8000-000000002091','Recommend TalentBridge Partners',92,'Ranked #1 for strong recent performance in Python, SQL and Machine Learning, with a high average candidate match score and best-in-class shortlist conversion.','[{"label":"Skill fit","value":"94"},{"label":"Candidate quality","value":"88"},{"label":"Shortlist conversion","value":"58%"}]'::jsonb,0.91,'APPROVED','HR_ADMIN','Kashmira Rao');

INSERT INTO public.audit_events (actor_name,role,action,entity_type,entity_id,entity_label,source,reason,created_at) VALUES
 ('Vendor Recommendation Agent','AI','Vendor ranking updated','vendor','b1000000-0000-4000-8000-000000000001','TalentBridge Partners','AI','Candidate Priya Sharma achieved a 91% average match across recent submissions. Rank moved #2 to #1.',now() - interval '3 days'),
 ('Kashmira Rao','HR_ADMIN','Candidate shortlisted','application','d1000000-0000-4000-8000-000000000001','APP-4101 — Priya Sharma','HUMAN','Strong banking analytics experience.',now() - interval '5 days'),
 ('Candidate Screening Agent','AI','Candidate screening completed','application','d1000000-0000-4000-8000-000000000001','APP-4101 — Priya Sharma','AI','Overall match 88% for REQ-2091.',now() - interval '7 days'),
 ('Feedback Summary Agent','AI','Interview summary drafted','interview','e1000000-0000-4000-8000-000000000001','Priya Sharma — Technical','AI','Recommendation: proceed to offer. Human approval required.',now() - interval '2 days'),
 ('Contract Validation Agent','AI','Contract discrepancy flagged','requirement','a1000000-0000-4000-8000-000000002091','REQ-2091','AI','Compensation field requires human review.',now() - interval '11 days'),
 ('Kashmira Rao','HR_ADMIN','Vendor selected','vendor','b1000000-0000-4000-8000-000000000001','TalentBridge Partners','HUMAN','Accepted AI recommendation for REQ-2091.',now() - interval '10 days');

INSERT INTO public.notifications (audience_role,title,body,category) VALUES
 ('HR_ADMIN','Offer ready for approval','The offer for Priya Sharma (Data Analyst, REQ-2091) is drafted and awaiting your approval.','OFFER'),
 ('HR_ADMIN','Contract exception flagged','REQ-2091 vendor contract is missing a compensation band.','CONTRACT'),
 ('HR_ADMIN','Vendor ranking updated','TalentBridge Partners moved from #2 to #1 for REQ-2091.','VENDOR'),
 ('MANAGER','Candidates ready for review','9 screened candidates are awaiting review for REQ-2091.','CANDIDATE'),
 ('MANAGER','Interview feedback recorded','Your feedback for Priya Sharma has been summarised.','FEEDBACK');