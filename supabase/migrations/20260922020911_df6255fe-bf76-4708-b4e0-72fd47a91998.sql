CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS TABLE(id uuid, name text, email text, department text, role public.app_role)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  em text := lower(coalesce(auth.jwt() ->> 'email', ''));
  nm text; dep text; rl public.app_role;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF em = 'hr@hireflow.demo' THEN
    nm := 'Kashmira Rao'; dep := 'Human Resources'; rl := 'HR_ADMIN';
  ELSIF em = 'manager@hireflow.demo' THEN
    nm := 'Rohan Verma'; dep := 'Risk & Analytics'; rl := 'MANAGER';
  ELSIF em = 'candidate@hireflow.demo' THEN
    nm := 'Priya Sharma'; dep := NULL; rl := 'CANDIDATE';
  ELSE
    nm := initcap(replace(split_part(em, '@', 1), '.', ' ')); dep := NULL; rl := 'CANDIDATE';
  END IF;

  INSERT INTO public.profiles AS p (id, name, email, department)
  VALUES (uid, nm, em, dep)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  INSERT INTO public.user_roles (user_id, role) VALUES (uid, rl)
  ON CONFLICT (user_id, role) DO NOTHING;

  UPDATE public.candidates c SET user_id = uid
   WHERE lower(c.email) = em AND (c.user_id IS DISTINCT FROM uid);

  IF rl = 'MANAGER' THEN
    UPDATE public.requirements r SET hiring_manager_id = uid
     WHERE r.hiring_manager_name = nm AND r.hiring_manager_id IS NULL;
  END IF;

  RETURN QUERY
    SELECT pr.id, pr.name, pr.email, pr.department, rl
      FROM public.profiles pr WHERE pr.id = uid;
END $$;

REVOKE ALL ON FUNCTION public.ensure_profile() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ensure_profile() TO authenticated, service_role;