import { GoogleGenerativeAI, type Content } from "@google/generative-ai";
import { ENV } from "./env";

export type Role = "system" | "user" | "assistant";

export type Message = {
  role: Role;
  content: string;
  name?: string;
};

export type InvokeParams = {
  messages: Message[];
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

const MODEL_ID = "gemini-2.0-flash";

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  if (!ENV.aiApiKey) throw new Error("GEMINI_API_KEY not configured");

  const genAI = new GoogleGenerativeAI(ENV.aiApiKey);

  const systemMsg = params.messages.find((m) => m.role === "system");
  const nonSystem = params.messages.filter((m) => m.role !== "system");

  const model = genAI.getGenerativeModel({
    model: MODEL_ID,
    ...(systemMsg ? { systemInstruction: systemMsg.content } : {}),
  });

  // Split into history (all but last) + final user message
  const history: Content[] = nonSystem.slice(0, -1).map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const lastMsg = nonSystem[nonSystem.length - 1];
  const userText = lastMsg?.content ?? "";

  let responseText: string;
  if (history.length > 0) {
    const chat = model.startChat({ history });
    const result = await chat.sendMessage(userText);
    responseText = result.response.text();
  } else {
    const result = await model.generateContent(userText);
    responseText = result.response.text();
  }

  return {
    id: `gemini-${Date.now()}`,
    created: Math.floor(Date.now() / 1000),
    model: MODEL_ID,
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: responseText },
        finish_reason: "stop",
      },
    ],
  };
}
