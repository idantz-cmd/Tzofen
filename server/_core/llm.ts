import OpenAI from "openai";
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant";

export type Message = {
  role: Role;
  content: string;
  name?: string;
};

export type InvokeParams = {
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
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

const MODEL_ID = "gpt-4.1-nano";

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.aiApiKey) throw new Error("OPENAI_API_KEY not configured");

  const client = new OpenAI({ apiKey: ENV.aiApiKey });

  const response = await client.chat.completions.create({
    model: MODEL_ID,
    messages: params.messages.map((m) => ({ role: m.role, content: m.content })),
    max_tokens: params.maxTokens ?? 120,
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
        message: {
          role: "assistant",
          content: choice?.message?.content ?? "",
        },
        finish_reason: choice?.finish_reason ?? null,
      },
    ],
  };
}
