import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { AppShell } from "@/components/hire/app-shell";
import { LoadingRows, PageHeader, Panel, SectionTitle } from "@/components/hire/bits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { createRequirement, type RequirementDraft } from "@/lib/api";
import { profilesQuery, qk, skillsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/requirements/new")({
  head: () => ({
    meta: [
      { title: "New requirement — HireFlow AI" },
      { name: "description", content: "Raise a new hiring requirement with role details, skills and hiring manager." },
      { property: "og:title", content: "New requirement — HireFlow AI" },
      { property: "og:description", content: "Raise a new hiring requirement with role details, skills and hiring manager." },
    ],
  }),
  component: NewRequirementPage,
});

const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "INTERNSHIP"];
const EXPERIENCE_LEVELS = ["ENTRY", "MID", "SENIOR", "LEAD", "EXECUTIVE"];
const WORK_MODES = ["ONSITE", "REMOTE", "HYBRID"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const emptyDraft: RequirementDraft = {
  position_title: "",
  department: "",
  employment_type: "FULL_TIME",
  experience_level: "MID",
  required_skills: [],
  preferred_skills: [],
  number_of_openings: 1,
  location: "",
  work_mode: "ONSITE",
  target_hiring_timeline: "",
  hiring_manager_name: "",
  priority: "MEDIUM",
  job_description: "",
  contract_document: null,
};

function NewRequirementPage() {
  const { user, profile, role } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const skills = useQuery(skillsQuery());
  const profiles = useQuery(profilesQuery());
  const [draft, setDraft] = useState<RequirementDraft>(emptyDraft);
  const [managerFreeText, setManagerFreeText] = useState("");

  const actor = { user_id: user?.id ?? null, actor_name: profile?.name ?? null, role: role ?? null };

  const mutation = useMutation({
    mutationFn: (submit: boolean) =>
      createRequirement(
        { ...draft, hiring_manager_name: draft.hiring_manager_name || managerFreeText },
        submit,
        actor,
      ),
    onSuccess: (data, submit) => {
      void queryClient.invalidateQueries({ queryKey: qk.requirements });
      toast.success(submit ? "Requirement submitted" : "Requirement saved as draft");
      void navigate({ to: "/requirements/$id", params: { id: data.id } });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  function update<K extends keyof RequirementDraft>(key: K, value: RequirementDraft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function toggleSkill(list: "required_skills" | "preferred_skills", skill: string) {
    setDraft((d) => {
      const current = d[list];
      const next = current.includes(skill) ? current.filter((s) => s !== skill) : [...current, skill];
      return { ...d, [list]: next };
    });
  }

  const canSubmit = draft.position_title.trim().length > 0 && draft.department.trim().length > 0;

  return (
    <AppShell breadcrumbs={[{ label: "Requirements", to: "/requirements" }, { label: "New requirement" }]}>
      <PageHeader title="New requirement" subtitle="Capture role details once — AI validates the contract and ranks vendors from here." />

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          <Panel>
            <SectionTitle>Role details</SectionTitle>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Position title</Label>
                <Input value={draft.position_title} onChange={(e) => update("position_title", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input value={draft.department} onChange={(e) => update("department", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Employment type</Label>
                <Select value={draft.employment_type} onValueChange={(v) => update("employment_type", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Experience level</Label>
                <Select value={draft.experience_level} onValueChange={(v) => update("experience_level", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPERIENCE_LEVELS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Number of openings</Label>
                <Input
                  type="number"
                  min={1}
                  value={draft.number_of_openings}
                  onChange={(e) => update("number_of_openings", Math.max(1, Number(e.target.value) || 1))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Location</Label>
                <Input value={draft.location} onChange={(e) => update("location", e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Work mode</Label>
                <Select value={draft.work_mode} onValueChange={(v) => update("work_mode", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WORK_MODES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Target hiring timeline</Label>
                <Input
                  placeholder="e.g. 30 days"
                  value={draft.target_hiring_timeline}
                  onChange={(e) => update("target_hiring_timeline", e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select value={draft.priority} onValueChange={(v) => update("priority", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Panel>

          <Panel>
            <SectionTitle hint="Used by the AI matching and screening engine.">Skills</SectionTitle>
            <div className="space-y-4">
              <div>
                <Label>Required skills</Label>
                {skills.isLoading ? (
                  <LoadingRows rows={2} />
                ) : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(skills.data ?? []).map((s) => (
                      <Badge
                        key={s.id}
                        variant={draft.required_skills.includes(s.name) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSkill("required_skills", s.name)}
                      >
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label>Preferred skills</Label>
                {skills.isLoading ? null : (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {(skills.data ?? []).map((s) => (
                      <Badge
                        key={s.id}
                        variant={draft.preferred_skills.includes(s.name) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => toggleSkill("preferred_skills", s.name)}
                      >
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <Panel>
            <SectionTitle>Job description</SectionTitle>
            <Textarea
              rows={8}
              value={draft.job_description}
              onChange={(e) => update("job_description", e.target.value)}
              placeholder="Responsibilities, requirements, benefits…"
            />
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel>
            <SectionTitle>Hiring manager</SectionTitle>
            {profiles.isLoading ? (
              <LoadingRows rows={2} />
            ) : (
              <div className="space-y-3">
                <Select
                  value={draft.hiring_manager_name || undefined}
                  onValueChange={(v) => {
                    update("hiring_manager_name", v);
                    setManagerFreeText("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose from profiles" />
                  </SelectTrigger>
                  <SelectContent>
                    {(profiles.data ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1.5">
                  <Label>Or type a name</Label>
                  <Input
                    value={managerFreeText}
                    onChange={(e) => {
                      setManagerFreeText(e.target.value);
                      update("hiring_manager_name", "");
                    }}
                    placeholder="Free text fallback"
                  />
                </div>
              </div>
            )}
          </Panel>

          <Panel>
            <SectionTitle hint="Simulated AI contract validation runs once submitted.">Contract / document</SectionTitle>
            <Input
              type="file"
              onChange={(e) => update("contract_document", e.target.files?.[0]?.name ?? null)}
            />
            {draft.contract_document ? (
              <p className="mt-2 text-xs text-muted-foreground">Attached: {draft.contract_document}</p>
            ) : null}
          </Panel>

          <Panel>
            <SectionTitle>Save</SectionTitle>
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                disabled={!canSubmit || mutation.isPending}
                onClick={() => mutation.mutate(false)}
              >
                Save draft
              </Button>
              <Button disabled={!canSubmit || mutation.isPending} onClick={() => mutation.mutate(true)}>
                Submit requirement
              </Button>
            </div>
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}
