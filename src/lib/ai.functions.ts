import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const TASKS = {
  candidate:
    "You are a recruiting analyst. Given a candidate profile, the job requirement and the deterministic screening scores, write a concise screening brief: 3 strengths, 2-3 risks, and 3 targeted interview questions. End with a one-line suggestion (Shortlist / Review further / Weak match) clearly labelled as a recommendation only.",
  contract:
    "You are a contract compliance reviewer for staffing agreements. Review the requirement and contract text. List missing or risky clauses (compensation band, notice period, IP, data protection, SLAs), each with severity (High/Medium/Low) and a suggested fix. End with an overall suggestion clearly labelled as a recommendation only.",
  feedback:
    "You are an interview panel summariser. Summarise the interview feedback into: overall impression, key strengths, concerns, and a suggested next step clearly labelled as a recommendation only.",
  jd: "You are an HR writer. Draft a clear, inclusive job description (about 180 words) with sections: About the role, Responsibilities, Must-have skills, Nice to have.",
  ask: "You are HireFlow AI, an assistant for HR teams. Answer using the provided hiring data. Be concise and practical.",
} as const;

export const aiAssist = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        task: z.enum(["candidate", "contract", "feedback", "jd", "ask"]),
        context: z.string().max(20000),
        question: z.string().max(2000).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: isCandidate } = await context.supabase.rpc("has_role", {
      _user_id: context.userId,
      _role: "CANDIDATE",
    });
    if (isCandidate) return { ok: false as const, error: "AI assistance is available to the hiring team only." };

    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) return { ok: false as const, error: "AI is not configured." };

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");
    const provider = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey,
      headers: { "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });
    let failure: unknown = null;
    const result = streamText({
      model: provider.responses("openai/gpt-6-astra"),
      system: `${TASKS[data.task]}\nNever make a final hiring, rejection, compensation or offer decision — a human decides. Use short markdown-free plain text with simple "-" bullets.`,
      prompt: `${data.question ? `Question: ${data.question}\n\n` : ""}Data:\n${data.context}`,
      providerOptions: {
        openai: {
          forceReasoning: true,
          reasoningEffort: "low",
          reasoningSummary: "auto",
          store: false,
          include: ["reasoning.encrypted_content"],
        },
      },
      onError: ({ error }) => {
        failure = error;
      },
    });
    try {
      const text = await result.text;
      if (failure) throw failure;
      return { ok: true as const, text };
    } catch (e) {
      const status = (e as { statusCode?: number })?.statusCode;
      console.error("[aiAssist]", e);
      if (status === 429) return { ok: false as const, error: "AI is busy right now. Please try again in a minute." };
      if (status === 402) return { ok: false as const, error: "AI credits are used up. Add credits to keep using AI." };
      return { ok: false as const, error: "AI request failed. Please try again." };
    }
  });
