REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_staff() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_hr() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.my_candidate_ids() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_staff() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_hr() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.my_candidate_ids() TO authenticated, service_role;