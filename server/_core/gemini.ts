import { GoogleGenerativeAI } from "@google/generative-ai";
import { ENV } from "./env";

function getClient(): GoogleGenerativeAI {
  if (!ENV.aiApiKey) throw new Error("GEMINI_API_KEY not configured");
  return new GoogleGenerativeAI(ENV.aiApiKey);
}

export async function callGemini(prompt: string): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ googleSearch: {} } as any],
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function validateGeminiApiKey(): Promise<boolean> {
  try {
    if (!ENV.aiApiKey) return false;
    const genAI = new GoogleGenerativeAI(ENV.aiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    await model.generateContent("ping");
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
