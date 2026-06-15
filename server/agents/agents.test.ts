import { describe, it, expect, vi, beforeEach } from "vitest";
import * as llmModule from "../_core/llm";
import * as geminiModule from "../_core/gemini";
import {
  getAgentConfig,
  getAllAgents,
  queryAgent,
  queryMultipleAgents,
  AgentType,
} from "./agents";

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

vi.mock("../_core/gemini", () => ({
  callGemini: vi.fn(),
}));

vi.mock("../db", () => ({
  getDb: vi.fn().mockResolvedValue(null), // no DB in unit tests
}));

function mockLLMResponse(content: string) {
  vi.spyOn(llmModule, "invokeLLM").mockResolvedValueOnce({
    choices: [{ message: { content } }],
  } as any);
}

// ─── Agent Config Tests ───────────────────────────────────────────────────────

describe("Agent Config", () => {
  it("should expose all 8 agents", () => {
    const agents = getAllAgents();
    const ids = agents.map((a) => a.id);
    expect(ids).toContain("statistics");
    expect(ids).toContain("research");
    expect(ids).toContain("prediction");
    expect(ids).toContain("tactical");
    expect(ids).toContain("points-strategy");
    expect(ids).toContain("news");
    expect(ids).toContain("orchestrator");
    expect(ids).toContain("schedule");
    expect(agents).toHaveLength(8);
  });

  it("each agent has all required fields", () => {
    getAllAgents().forEach((agent) => {
      expect(agent).toHaveProperty("id");
      expect(agent).toHaveProperty("name");
      expect(agent).toHaveProperty("hebrewName");
      expect(agent).toHaveProperty("description");
      expect(agent).toHaveProperty("hebrewDescription");
      expect(agent).toHaveProperty("systemPrompt");
      expect(agent).toHaveProperty("skills");
      expect(agent).toHaveProperty("icon");
      expect(agent.skills.length).toBeGreaterThan(0);
      expect(agent.systemPrompt.length).toBeGreaterThan(100);
    });
  });

  it("points-strategy agent config focuses on confidence and points", () => {
    const config = getAgentConfig("points-strategy");
    expect(config.systemPrompt).toContain("confidence");
    expect(config.skills).toContain("Confidence Tier Selection");
  });

  it("news agent config mentions real-time priorities", () => {
    const config = getAgentConfig("news");
    expect(config.systemPrompt).toContain("CRITICAL");
    expect(config.skills).toContain("Injury Tracking");
  });

  it("orchestrator agent config has structured output instructions", () => {
    const config = getAgentConfig("orchestrator");
    expect(config.systemPrompt).toContain("המלצה סופית");
    expect(config.systemPrompt).toContain("גורמי הכרעה");
  });

  it("schedule agent config covers fixture congestion", () => {
    const config = getAgentConfig("schedule");
    expect(config.systemPrompt).toContain("congestion");
    expect(config.skills).toContain("Fixture Congestion Analysis");
  });
});

// ─── queryAgent Tests ─────────────────────────────────────────────────────────

describe("queryAgent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(geminiModule, "callGemini").mockResolvedValue(
      "חדשות בזמן אמת: אין פציעות חדשות"
    );
  });

  const agents: AgentType[] = [
    "statistics",
    "research",
    "prediction",
    "tactical",
    "points-strategy",
    "orchestrator",
    "schedule",
  ];

  agents.forEach((agentType) => {
    it(`should query ${agentType} agent successfully`, async () => {
      mockLLMResponse(`תשובה מ-${agentType}`);
      const response = await queryAgent(agentType, "שאלת בדיקה");
      expect(response).toContain(`תשובה מ-${agentType}`);
      expect(llmModule.invokeLLM).toHaveBeenCalledOnce();
    });
  });

  it("news agent calls Gemini for live data", async () => {
    mockLLMResponse("תשובת חדשות");
    await queryAgent("news", "מה חדש לפני המשחק?");
    expect(geminiModule.callGemini).toHaveBeenCalled();
  });

  it("non-news agents do NOT call Gemini", async () => {
    mockLLMResponse("תשובת סטטיסטיקה");
    await queryAgent("statistics", "סטטיסטיקות של מכבי תל אביב");
    expect(geminiModule.callGemini).not.toHaveBeenCalled();
  });

  it("injects system prompt as system role message", async () => {
    const spy = vi.spyOn(llmModule, "invokeLLM").mockResolvedValueOnce({
      choices: [{ message: { content: "ok" } }],
    } as any);

    await queryAgent("points-strategy", "איזה ביטחון להשתמש?");

    const call = spy.mock.calls[0][0];
    expect(call.messages[0].role).toBe("system");
    expect(call.messages[0].content).toContain("confidence");
    expect(call.messages[1].role).toBe("user");
    expect(call.messages[1].content).toBe("איזה ביטחון להשתמש?");
  });

  it("returns fallback message when LLM returns empty content", async () => {
    vi.spyOn(llmModule, "invokeLLM").mockResolvedValueOnce({
      choices: [{ message: { content: "" } }],
    } as any);
    const result = await queryAgent("statistics", "שאלה");
    expect(result).toBe("סליחה, לא הצלחתי להשיב על השאלה שלך.");
  });

  it("throws a typed error when LLM fails", async () => {
    vi.spyOn(llmModule, "invokeLLM").mockRejectedValueOnce(
      new Error("LLM unavailable")
    );
    await expect(queryAgent("tactical", "שאלה")).rejects.toThrow(
      "Failed to query סוכן ניתוח טקטי"
    );
  });
});

// ─── queryMultipleAgents Tests ────────────────────────────────────────────────

describe("queryMultipleAgents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(geminiModule, "callGemini").mockResolvedValue("חדשות: לא נמצאו עדכונים");
  });

  it("runs all specialist agents + orchestrator and returns correct shape", async () => {
    // 6 specialists + 1 orchestrator = 7 LLM calls
    const spy = vi.spyOn(llmModule, "invokeLLM");
    for (let i = 0; i < 7; i++) {
      spy.mockResolvedValueOnce({
        choices: [{ message: { content: `תשובה ${i + 1}` } }],
      } as any);
    }

    const results = await queryMultipleAgents("ניתח את המשחק");

    expect(results.statistics).toBeTruthy();
    expect(results.research).toBeTruthy();
    expect(results.prediction).toBeTruthy();
    expect(results.tactical).toBeTruthy();
    expect(results.news).toBeTruthy();
    expect(results.schedule).toBeTruthy();
    expect(results.orchestrator).toBeTruthy();

    // points-strategy is queried on demand via queryPointsStrategy, not in the multi-agent call
    expect(results["points-strategy"]).toBe("");

    expect(spy).toHaveBeenCalledTimes(7);
  });

  it("orchestrator receives all agent outputs in its prompt", async () => {
    const spy = vi.spyOn(llmModule, "invokeLLM");

    // First 6 calls = specialist agents
    const specialistOutputs = [
      "סטטיסטיקה: 60% ניצחון בית",
      "מחקר: מכבי עם 5 ניצחונות רצופים",
      "תחזית: ניצחון בית בביטחון גבוה",
      "טקטי: 4-3-3 מול 5-3-2",
      "חדשות: אין פציעות",
      "לוח: 3 ימי מנוחה לבית, 5 לחוץ",
    ];
    specialistOutputs.forEach((content) => {
      spy.mockResolvedValueOnce({
        choices: [{ message: { content } }],
      } as any);
    });

    // 7th call = orchestrator
    spy.mockResolvedValueOnce({
      choices: [{ message: { content: "המלצה: ניצחון בית — ביטחון גבוה" } }],
    } as any);

    await queryMultipleAgents("מכבי נגד הפועל");

    const orchestratorCall = spy.mock.calls[6][0];
    const orchestratorUserMessage = orchestratorCall.messages[1].content as string;

    // Verify all agent outputs are present in the orchestrator prompt
    specialistOutputs.forEach((output) => {
      expect(orchestratorUserMessage).toContain(output);
    });
    expect(orchestratorUserMessage).toContain("מכבי נגד הפועל");
  });

  it("propagates error if any specialist agent fails", async () => {
    vi.spyOn(llmModule, "invokeLLM").mockRejectedValue(
      new Error("LLM service error")
    );
    await expect(queryMultipleAgents("שאלה")).rejects.toThrow();
  });
});
