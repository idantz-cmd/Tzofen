export type AgentType = "statistics" | "research" | "prediction" | "tactical";

export function getAllAgents() {
  return [];
}

export async function queryAgent(
  _agentType: AgentType,
  _userMessage: string,
  _matchId?: number
): Promise<string> {
  throw new Error("Agents not configured");
}

export async function queryMultipleAgents(
  _userMessage: string,
  _matchId?: number
): Promise<Record<AgentType, string>> {
  throw new Error("Agents not configured");
}
