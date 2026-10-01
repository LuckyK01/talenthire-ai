import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/hooks/useAuth";
import {
  applicationsQuery,
  candidatesQuery,
  interviewsQuery,
  notificationsQuery,
  offersQuery,
  onboardingQuery,
  requirementsQuery,
} from "@/lib/queries";

/** Candidate-scoped data. Defensive filtering on top of RLS: only the signed-in candidate's own records. */
export function usePortalData() {
  const { user, role, profile } = useAuth();
  const cands = useQuery(candidatesQuery());
  const apps = useQuery(applicationsQuery());
  const reqs = useQuery(requirementsQuery());
  const ints = useQuery(interviewsQuery());
  const offs = useQuery(offersQuery());
  const tasks = useQuery(onboardingQuery());
  const notes = useQuery(notificationsQuery(role, user?.id ?? null));
  const me = (cands.data ?? []).find((c) => c.user_id === user?.id) ?? null;
  const app = me ? (apps.data ?? []).find((a) => a.candidate_id === me.id) ?? null : null;
  const requirement = app ? (reqs.data ?? []).find((r) => r.id === app.requirement_id) ?? null : null;
  return {
    loading: cands.isLoading || apps.isLoading,
    profile,
    me,
    app,
    requirement,
    interviews: me ? (ints.data ?? []).filter((i) => i.candidate_id === me.id) : [],
    offer: me ? (offs.data ?? []).find((o) => o.candidate_id === me.id && o.status !== "DRAFT" && o.status !== "PENDING_APPROVAL") ?? null : null,
    tasks: me ? (tasks.data ?? []).filter((t) => t.candidate_id === me.id) : [],
    notifications: (notes.data ?? []).filter((n) => n.user_id === user?.id || n.audience_role === "CANDIDATE"),
  };
}
