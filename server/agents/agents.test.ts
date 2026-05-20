import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getAgentConfig,
  getAllAgents,
  queryAgent,
  queryMultipleAgents,
  AgentType,
} from "./agents";
import * as llmModule from "../_core/llm";
import * as dbModule from "../db";

// Mock the LLM module
vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// Mock the database
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

describe("AI Agents System", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAgentConfig", () => {
    it("should return statistics agent config", () => {
      const config = getAgentConfig("statistics");
      expect(config.id).toBe("statistics");
      expect(config.hebrewName).toBe("×¡×•×›×Ÿ ×¡×˜×˜×™×¡×˜×™×§×”");
      expect(config.icon).toBe("ðŸ“Š");
      expect(config.skills).toContain("Statistical Analysis");
    });

    it("should return research agent config", () => {
      const config = getAgentConfig("research");
      expect(config.id).toBe("research");
      expect(config.hebrewName).toBe("×¡×•×›×Ÿ ×—×™×¤×•×© ×ž×™×“×¢");
      expect(config.icon).toBe("ðŸ”");
      expect(config.skills).toContain("League Research");
    });

    it("should return prediction agent config", () => {
      const config = getAgentConfig("prediction");
      expect(config.id).toBe("prediction");
      expect(config.hebrewName).toBe("×¡×•×›×Ÿ ×—×™×–×•×™ ×ª×•×¦××•×ª");
      expect(config.icon).toBe("ðŸŽ¯");
      expect(config.skills).toContain("Match Prediction");
    });

    it("should return tactical agent config", () => {
      const config = getAgentConfig("tactical");
      expect(config.id).toBe("tactical");
      expect(config.hebrewName).toBe("×¡×•×›×Ÿ × ×™×ª×•×— ×˜×§×˜×™");
      expect(config.icon).toBe("âš½");
      expect(config.skills).toContain("Formation Analysis");
    });
  });

  describe("getAllAgents", () => {
    it("should return all 4 agents", () => {
      const agents = getAllAgents();
      expect(agents).toHaveLength(4);
      expect(agents.map((a) => a.id)).toEqual([
        "statistics",
        "research",
        "prediction",
        "tactical",
      ]);
    });

    it("should return agents with all required properties", () => {
      const agents = getAllAgents();
      agents.forEach((agent) => {
        expect(agent).toHaveProperty("id");
        expect(agent).toHaveProperty("name");
        expect(agent).toHaveProperty("hebrewName");
        expect(agent).toHaveProperty("description");
        expect(agent).toHaveProperty("hebrewDescription");
        expect(agent).toHaveProperty("systemPrompt");
        expect(agent).toHaveProperty("skills");
        expect(agent).toHaveProperty("icon");
      });
    });
  });

  describe("queryAgent", () => {
    it("should query statistics agent successfully", async () => {
      const mockInvokeLLM = vi.spyOn(llmModule, "invokeLLM");
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "×¡×˜×˜×™×¡×˜×™×§×”: ×ž×›×‘×™ ×ª×œ ××‘×™×‘ × ×™×¦×—×” 70% ×ž×”×ž×©×—×§×™× ×©×œ×”",
            },
          },
        ],
      } as any);

      const response = await queryAgent(
        "statistics",
        "×ž×” ×”× ×‘×™×¦×•×¢×™ ×ž×›×‘×™ ×ª×œ ××‘×™×‘?"
      );

      expect(response).toContain("×¡×˜×˜×™×¡×˜×™×§×”");
      expect(mockInvokeLLM).toHaveBeenCalled();
    });

    it("should query research agent successfully", async () => {
      const mockInvokeLLM = vi.spyOn(llmModule, "invokeLLM");
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "×ž×›×‘×™ ×ª×œ ××‘×™×‘ ×”×™× ×§×‘×•×¦×” ×‘×œ×™×’×ª ×”×¢×œ",
            },
          },
        ],
      } as any);

      const response = await queryAgent(
        "research",
        "×ž×™ ×”×™× ×ž×›×‘×™ ×ª×œ ××‘×™×‘?"
      );

      expect(response).toContain("×ž×›×‘×™ ×ª×œ ××‘×™×‘");
      expect(mockInvokeLLM).toHaveBeenCalled();
    });

    it("should query prediction agent successfully", async () => {
      const mockInvokeLLM = vi.spyOn(llmModule, "invokeLLM");
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "×”×ª×—×–×•×§×”: × ×™×¦×—×•×Ÿ ×‘×™×ª 65%, ×ª×™×§×• 20%, × ×™×¦×—×•×Ÿ ×—×•×¥ 15%",
            },
          },
        ],
      } as any);

      const response = await queryAgent(
        "prediction",
        "×ž×” ×”×ª×—×–×•×§×” ×œ×ž×©×—×§?"
      );

      expect(response).toContain("×”×ª×—×–×•×§×”");
      expect(mockInvokeLLM).toHaveBeenCalled();
    });

    it("should query tactical agent successfully", async () => {
      const mockInvokeLLM = vi.spyOn(llmModule, "invokeLLM");
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "× ×™×ª×•×— ×˜×§×˜×™: ×§×‘×•×¦×” ×ž×©×—×§×ª ×‘-4-3-3",
            },
          },
        ],
      } as any);

      const response = await queryAgent(
        "tactical",
        "×ž×” ×”×˜×§×˜×™×§×” ×©×œ ×”×§×‘×•×¦×”?"
      );

      expect(response).toContain("× ×™×ª×•×— ×˜×§×˜×™");
      expect(mockInvokeLLM).toHaveBeenCalled();
    });

    it("should include system prompt in LLM call", async () => {
      const mockInvokeLLM = vi.spyOn(llmModule, "invokeLLM");
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "×ª×©×•×‘×”",
            },
          },
        ],
      } as any);

      await queryAgent("statistics", "×©××œ×”");

      const callArgs = mockInvokeLLM.mock.calls[0][0];
      expect(callArgs.messages[0].role).toBe("system");
      expect(callArgs.messages[0].content).toContain("statistician");
    });

    it("should handle LLM errors gracefully", async () => {
      const mockInvokeLLM = vi.spyOn(llmModule, "invokeLLM");
      mockInvokeLLM.mockRejectedValueOnce(new Error("LLM service unavailable"));

      try {
        await queryAgent("statistics", "×©××œ×”");
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Failed to query ×¡×•×›×Ÿ ×¡×˜×˜×™×¡×˜×™×§×”");
      }
    });
  });

  describe("queryMultipleAgents", () => {
    it("should query all agents in parallel", async () => {
      const mockInvokeLLM = vi.spyOn(llmModule, "invokeLLM");
      mockInvokeLLM
        .mockResolvedValueOnce({
          choices: [{ message: { content: "×¡×˜×˜×™×¡×˜×™×§×”" } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: "×ž×—×§×¨" } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: "×ª×—×–×•×§×”" } }],
        } as any)
        .mockResolvedValueOnce({
          choices: [{ message: { content: "×˜×§×˜×™×§×”" } }],
        } as any);

      const results = await queryMultipleAgents("×©××œ×”");

      expect(results.statistics).toContain("×¡×˜×˜×™×¡×˜×™×§×”");
      expect(results.research).toContain("×ž×—×§×¨");
      expect(results.prediction).toContain("×ª×—×–×•×§×”");
      expect(results.tactical).toContain("×˜×§×˜×™×§×”");
      expect(mockInvokeLLM).toHaveBeenCalledTimes(4);
    });

    it("should handle errors in multi-agent query", async () => {
      const mockInvokeLLM = vi.spyOn(llmModule, "invokeLLM");
      mockInvokeLLM.mockRejectedValueOnce(new Error("LLM service error"));

      try {
        await queryMultipleAgents("×©××œ×”");
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Failed to query");
      }
    });
  });
});

