import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/hooks/useAuth";
import type { AuditActor } from "@/lib/api";

/** Current user as an audit actor, plus a helper that runs an action, toasts and refreshes data. */
export function useActor() {
  const { user, profile, role } = useAuth();
  const qc = useQueryClient();
  const actor: AuditActor = { user_id: user?.id ?? null, actor_name: profile?.name ?? null, role };
  const run = async (fn: () => Promise<unknown>, success: string) => {
    try {
      await fn();
      toast.success(success);
      await qc.invalidateQueries();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    }
  };
  return { actor, run, role, profile, user };
}
