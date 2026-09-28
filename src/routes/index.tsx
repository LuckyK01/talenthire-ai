import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { homeRouteFor, useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "HireFlow AI — AI recommends. Humans decide." },
      {
        name: "description",
        content:
          "Sign in to HireFlow AI to manage requirements, rank hiring vendors with explainable scores, screen candidates and run onboarding.",
      },
      { property: "og:title", content: "HireFlow AI — AI recommends. Humans decide." },
      {
        property: "og:description",
        content: "Enterprise recruitment and onboarding with explainable vendor ranking and candidate screening.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { loading, session, role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      void navigate({ to: "/auth", replace: true });
      return;
    }
    void navigate({ to: homeRouteFor(role), replace: true });
  }, [loading, session, role, navigate]);

  return (
    <div className="app-backdrop flex min-h-screen items-center justify-center">
      <div className="panel rounded-2xl px-8 py-6 text-center">
        <p className="label-mono">HireFlow AI</p>
        <p className="mt-2 text-lg">Loading your workspace…</p>
        <p className="mt-1 text-sm text-muted-foreground">AI recommends. Humans decide.</p>
      </div>
    </div>
  );
}
