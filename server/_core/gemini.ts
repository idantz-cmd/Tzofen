export async function callGemini(_prompt: string): Promise<string> {
  throw new Error("AI provider not configured");
}

export async function fetchFootballData(_query: string): Promise<string> {
  throw new Error("AI provider not configured");
}

export async function fetchFootballNews(): Promise<string> {
  throw new Error("AI provider not configured");
}

export async function fetchTeamStats(_teamName: string): Promise<string> {
  throw new Error("AI provider not configured");
}

export async function fetchMatchPredictionData(
  _homeTeam: string,
  _awayTeam: string,
  _league: string
): Promise<string> {
  throw new Error("AI provider not configured");
}

export async function validateGeminiApiKey(): Promise<boolean> {
  return false;
}
