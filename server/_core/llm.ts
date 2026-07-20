import OpenAI from "openai";
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant";

export type Message = {
  role: Role;
  content: string;
  name?: string;
};

/**
 * Model tiers. The old code hard-coded gpt-4.1-nano for EVERYTHING, including
 * the orchestrator synthesis and structured-JSON agents — nano can't reliably
 * follow a complex Hebrew enforcement prompt or emit clean JSON, which is why
 * outputs came back generic and self-contradictory.
 *
 * Now each caller picks a tier by ROLE, not by a magic string:
 *   - "reasoning": the orchestrator synthesis + the heavy analytical agents
 *     (statistics, deep prediction). Needs to follow instructions and write
 *     natural Hebrew. Worth the extra cost — it runs a handful of times/match.
 *   - "fast": the lighter agents (fatigue, league research, tactical, news).
 *     Good enough, cheaper, quicker.
 *
 * Override per-environment with LLM_MODEL_REASONING / LLM_MODEL_FAST so you can
 * dial cost vs. quality without a code change.
 */
export type ModelTier = "reasoning" | "fast";

const MODELS: Record<ModelTier, string> = {
  reasoning: process.env.LLM_MODEL_REASONING ?? "gpt-4o",
  fast: process.env.LLM_MODEL_FAST ?? "gpt-4o-mini",
};

export type InvokeParams = {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
  /** Pick the model tier by role. Defaults to "fast". */
  tier?: ModelTier;
  /** When "json_object", forces the model to return valid JSON. */
  responseFormat?: "json_object" | "text";
  [key: string]: unknown;
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: Role; content: string };
    finish_reason: string | null;
  }>;
};

let _client: OpenAI | null = null;
function client(): OpenAI {
  if (!ENV.aiApiKey) throw new Error("OPENAI_API_KEY not configured");
  if (!_client) _client = new OpenAI({ apiKey: ENV.aiApiKey });
  return _client;
}

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  const model = MODELS[params.tier ?? "fast"];

  const response = await client().chat.completions.create({
    model,
    messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
    // A JSON structured Hebrew report needs real headroom; 120 was starving it.
    max_tokens: params.maxTokens ?? 1200,
    ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
    ...(params.responseFormat === "json_object"
      ? { response_format: { type: "json_object" as const } }
      : {}),
  });

  const choice = response.choices[0];

  return {
    id: response.id,
    created: response.created,
    model: response.model,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: choice?.message?.content ?? "" },
        finish_reason: choice?.finish_reason ?? null,
      },
    ],
  };
}
