import { ArrowDownRight, ArrowRight, ArrowUpRight, Sparkles, UserCheck } from "lucide-react";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl leading-tight">{title}</h1>
        {subtitle ? <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("panel rounded-2xl p-5", className)}>{children}</div>;
}

export function SectionTitle({ children, hint }: { children: ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-lg">{children}</h2>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function LabelMono({ children }: { children: ReactNode }) {
  return <span className="label-mono block">{children}</span>;
}

export function ScoreBar({ value, className }: { value: number; className?: string }) {
  const tone = value >= 82 ? "bg-teal" : value >= 68 ? "bg-amber" : "bg-rose";
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div className={cn("h-full rounded-full", tone)} style={{ width: `${Math.max(2, Math.min(100, value))}%` }} />
    </div>
  );
}

export function ScoreBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const tone =
    value >= 82
      ? "border-teal/40 bg-teal/10 text-teal"
      : value >= 68
        ? "border-amber/40 bg-amber/10 text-amber"
        : "border-rose/40 bg-rose/10 text-rose";
  return (
    <span className={cn("tnum inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-xs", tone)}>
      {value}
      {suffix}
    </span>
  );
}

export function TrendArrow({ trend }: { trend: string }) {
  if (trend === "UP")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-teal">
        <ArrowUpRight className="size-3.5" /> Improving
      </span>
    );
  if (trend === "DOWN")
    return (
      <span className="inline-flex items-center gap-1 text-xs text-rose">
        <ArrowDownRight className="size-3.5" /> Declining
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <ArrowRight className="size-3.5" /> Stable
    </span>
  );
}

export function AiBadge({ children = "AI recommendation" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-teal/40 bg-teal/10 px-2 py-0.5 text-[11px] font-medium text-teal">
      <Sparkles className="size-3" />
      {children}
    </span>
  );
}

export function HumanBadge({ children = "Human decision required" }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber/40 bg-amber/10 px-2 py-0.5 text-[11px] font-medium text-amber">
      <UserCheck className="size-3" />
      {children}
    </span>
  );
}

const statusTone: Record<string, string> = {
  PENDING: "border-amber/40 bg-amber/10 text-amber",
  PENDING_APPROVAL: "border-amber/40 bg-amber/10 text-amber",
  IN_PROGRESS: "border-teal/40 bg-teal/10 text-teal",
  ACTIVE: "border-teal/40 bg-teal/10 text-teal",
  APPROVED: "border-teal/40 bg-teal/10 text-teal",
  COMPLETED: "border-teal/40 bg-teal/10 text-teal",
  ACCEPTED: "border-teal/40 bg-teal/10 text-teal",
  HIRED: "border-teal/40 bg-teal/10 text-teal",
  SHORTLISTED: "border-teal/40 bg-teal/10 text-teal",
  REJECTED: "border-rose/40 bg-rose/10 text-rose",
  BLOCKED: "border-rose/40 bg-rose/10 text-rose",
  FLAGGED: "border-rose/40 bg-rose/10 text-rose",
  CANCELLED: "border-rose/40 bg-rose/10 text-rose",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("font-mono text-[10px] tracking-wide", statusTone[status] ?? "")}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel-soft flex flex-col items-center justify-center rounded-2xl px-6 py-14 text-center">
      <p className="text-base">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="panel-soft rounded-2xl border-rose/30 px-6 py-10 text-center">
      <p className="text-sm text-rose">{message}</p>
      {onRetry ? (
        <button onClick={onRetry} className="mt-3 rounded-md border border-input px-3 py-1.5 text-sm">
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "warn" | "good";
}) {
  return (
    <div className="panel rounded-2xl p-4">
      <LabelMono>{label}</LabelMono>
      <p
        className={cn(
          "tnum mt-2 font-mono text-2xl",
          tone === "warn" && "text-amber",
          tone === "good" && "text-teal",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Explain({ text, children }: { text: string; children: ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="cursor-help border-b border-dotted border-muted-foreground/50">{children}</span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm text-xs leading-relaxed">{text}</TooltipContent>
    </Tooltip>
  );
}

/** The reusable AI recommendation card used everywhere a score is shown. */
export function AiRecommendationCard({
  recommendation,
  score,
  explanation,
  factors,
  confidence,
  approvalState = "Human decision required",
  className,
}: {
  recommendation: string;
  score?: number;
  explanation: string;
  factors?: { label: string; value: string }[];
  confidence?: number;
  approvalState?: string;
  className?: string;
}) {
  return (
    <div className={cn("panel-soft rounded-2xl p-4", className)}>
      <div className="flex flex-wrap items-center gap-2">
        <AiBadge />
        <span className="text-sm font-medium">{recommendation}</span>
        {score != null ? <ScoreBadge value={score} /> : null}
        <span className="ml-auto flex items-center gap-2">
          {confidence != null ? (
            <span className="label-mono">confidence {Math.round(confidence * 100)}%</span>
          ) : null}
          <HumanBadge>{approvalState}</HumanBadge>
        </span>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{explanation}</p>
      {factors?.length ? (
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          {factors.map((f) => (
            <div key={f.label} className="ghost flex items-center justify-between rounded-lg px-3 py-1.5">
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd className="tnum font-mono text-xs">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

export function fmtDate(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

export function fmtDateTime(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
