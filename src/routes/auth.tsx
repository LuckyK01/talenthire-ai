import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { homeRouteFor, useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LabelMono } from "@/components/hire/bits";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — HireFlow AI" },
      { name: "description", content: "Sign in to the HireFlow AI recruitment and onboarding workspace." },
      { property: "og:title", content: "Sign in — HireFlow AI" },
      { property: "og:description", content: "Access requirements, vendor ranking, candidates and onboarding." },
    ],
  }),
  component: AuthPage,
});

const demoAccounts = [
  { label: "HR / Admin", name: "Kashmira Rao", email: "hr@hireflow.demo" },
  { label: "Hiring manager", name: "Rohan Verma", email: "manager@hireflow.demo" },
  { label: "Candidate", name: "Priya Sharma", email: "candidate@hireflow.demo" },
];

const DEMO_PASSWORD = "Demo@123";

function AuthPage() {
  const { session, role, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("hr@hireflow.demo");
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && session) void navigate({ to: homeRouteFor(role), replace: true });
  }, [loading, session, role, navigate]);

  const signIn = async (nextEmail = email, nextPassword = password) => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: nextEmail,
        password: nextPassword,
      });
      if (error) {
        // Demo accounts are created on first use so the walkthrough always works.
        if (nextEmail.endsWith("@hireflow.demo") && nextPassword === DEMO_PASSWORD) {
          const { error: signUpError } = await supabase.auth.signUp({
            email: nextEmail,
            password: nextPassword,
          });
          if (signUpError) throw signUpError;
          const { error: retry } = await supabase.auth.signInWithPassword({
            email: nextEmail,
            password: nextPassword,
          });
          if (retry) throw retry;
        } else {
          throw error;
        }
      }
      toast.success("Signed in");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="app-backdrop flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-4xl gap-6 md:grid-cols-[1.1fr_1fr]">
        <section className="panel rounded-3xl p-8">
          <LabelMono>HireFlow AI</LabelMono>
          <h1 className="mt-3 text-4xl leading-tight">AI recommends.<br />Humans decide.</h1>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            An enterprise recruitment and onboarding workspace: explainable vendor ranking, candidate
            screening with visible reasoning, and a human approval at every final decision.
          </p>
          <ul className="mt-6 space-y-2 text-sm">
            {[
              "Vendor ranking with a transparent weighted model",
              "Candidate screening scores you can interrogate",
              "A vendor performance feedback loop after every outcome",
              "Full audit trail separating AI from human actions",
            ].map((item) => (
              <li key={item} className="ghost rounded-lg px-3 py-2">
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="panel rounded-3xl p-8">
          <h2 className="text-xl">Sign in</h2>
          <form
            className="mt-5 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void signIn();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={busy}>
              {busy ? <Loader2 className="size-4 animate-spin" /> : null}
              Sign in
            </Button>
          </form>

          <div className="mt-6">
            <LabelMono>Demo accounts</LabelMono>
            <div className="mt-2 space-y-2">
              {demoAccounts.map((a) => (
                <button
                  key={a.email}
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setEmail(a.email);
                    setPassword(DEMO_PASSWORD);
                    void signIn(a.email, DEMO_PASSWORD);
                  }}
                  className="ghost flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-white/60"
                >
                  <span>
                    <span className="block font-medium">{a.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {a.name} · {a.email}
                    </span>
                  </span>
                  <span className="label-mono">Demo@123</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
