import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";

import { HumanBadge } from "@/components/hire/bits";
import { Button } from "@/components/ui/button";
import { aiAssist } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";

type Task = "candidate" | "contract" | "feedback" | "jd" | "ask";

/** Live AI insight (Lovable AI). Output is advisory; a human always decides. */
export function AiAssist({
  task,
  context,
  label = "Generate AI insight",
  question,
  className,
  onResult,
}: {
  task: Task;
  context: unknown;
  label?: string;
  question?: string;
  className?: string;
  onResult?: (text: string) => void;
}) {
  const call = useServerFn(aiAssist);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const go = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await call({
        data: { task, context: JSON.stringify(context).slice(0, 19000), ...(question ? { question } : {}) },
      });
      if (res.ok) {
        setText(res.text);
        onResult?.(res.text);
      } else setError(res.error);
    } catch {
      setError("AI request failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("panel-soft rounded-2xl p-4", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Sparkles className="size-4 text-primary" /> Live AI
        </span>
        <Button size="sm" variant="outline" onClick={go} disabled={loading}>
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
          {text ? "Regenerate" : label}
        </Button>
      </div>
      {loading && <p className="mt-3 text-sm text-muted-foreground">Thinking… this can take a few seconds.</p>}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      {text && !loading && (
        <>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{text}</p>
          <div className="mt-3"><HumanBadge /></div>
        </>
      )}
    </div>
  );
}
