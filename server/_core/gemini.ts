import OpenAI from "openai";
import { ENV } from "./env";

function getClient(): OpenAI {
  if (!ENV.aiApiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey: ENV.aiApiKey });
}

export async function callGemini(prompt: string): Promise<string> {
  const client = getClient();
  const response = await client.chat.completions.create({
    model: "gpt-4.1-nano",
    messages: [{ role: "user", content: prompt }],
  });
  return response.choices[0]?.message?.content ?? "";
}

export async function validateGeminiApiKey(): Promise<boolean> {
  try {
    if (!ENV.aiApiKey) return false;
    const client = new OpenAI({ apiKey: ENV.aiApiKey });
    await client.chat.completions.create({
      model: "gpt-4.1-nano",
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 5,
    });
    return true;
  } catch {
    return false;
  }
}

export async function fetchFootballData(query: string): Promise<string> {
  return callGemini(query);
}

export async function fetchFootballNews(): Promise<string> {
  return callGemini("Latest Israeli football news from ליגת העל and ליגה לאומית, last 48 hours");
}

export async function fetchTeamStats(teamName: string): Promise<string> {
  return callGemini(`Israeli football statistics for ${teamName}`);
}

export async function fetchMatchPredictionData(
  homeTeam: string,
  awayTeam: string,
  league: string
): Promise<string> {
  return callGemini(`Match prediction data for ${homeTeam} vs ${awayTeam} in ${league} Israeli football`);
}
