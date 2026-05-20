import { describe, it, expect, vi, beforeEach } from "vitest";
import { chatRouter } from "./chat";
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

describe("Chat Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("chat.ask", () => {
    it("should return a success response with AI message", async () => {
      // Mock database
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.spyOn(dbModule, "getDb").mockResolvedValue(mockDb as any);

      // Mock LLM
      const mockInvokeLLM = vi.spyOn(llmModule, "invokeLLM");
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "×–×”×• ×ª×©×•×‘×” ×‘×¢×‘×¨×™×ª ×ž-AI",
            },
          },
        ],
      } as any);

      const caller = chatRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.ask({
        message: "×ž×” ×”× ×‘×™×¦×•×¢×™ ×ž×›×‘×™ ×ª×œ ××‘×™×‘?",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("×–×”×• ×ª×©×•×‘×” ×‘×¢×‘×¨×™×ª ×ž-AI");
      expect(mockInvokeLLM).toHaveBeenCalled();
    });

    it("should handle LLM errors gracefully", async () => {
      // Mock database
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.spyOn(dbModule, "getDb").mockResolvedValue(mockDb as any);

      // Mock LLM to throw error
      const mockInvokeLLM = vi.spyOn(llmModule, "invokeLLM");
      mockInvokeLLM.mockRejectedValueOnce(new Error("LLM service unavailable"));

      const caller = chatRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.ask({
          message: "×ž×” ×”× ×‘×™×¦×•×¢×™ ×ž×›×‘×™ ×ª×œ ××‘×™×‘?",
        });
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        expect(error.message).toContain("Failed to process");
      }
    });

    it("should validate message length", async () => {
      const caller = chatRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      try {
        await caller.ask({
          message: "", // Empty message
        });
        expect.fail("Should have thrown validation error");
      } catch (error: any) {
        // Check if the error message contains validation info
        expect(error.message).toMatch(/Too small|at least 1 characters|string/i);
      }
    });

    it("should accept optional matchId parameter", async () => {
      // Mock database
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.spyOn(dbModule, "getDb").mockResolvedValue(mockDb as any);

      // Mock LLM
      const mockInvokeLLM = vi.spyOn(llmModule, "invokeLLM");
      mockInvokeLLM.mockResolvedValueOnce({
        choices: [
          {
            message: {
              content: "× ×™×ª×•×— ×”×ž×©×—×§",
            },
          },
        ],
      } as any);

      const caller = chatRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.ask({
        message: "×ž×” ×”×ª×—×–×•×§×” ×œ×’×‘×™ ×”×ž×©×—×§ ×”×–×”?",
        matchId: 1,
      });

      expect(result.success).toBe(true);
      expect(mockInvokeLLM).toHaveBeenCalled();
    });
  });

  describe("chat.getTeamForm", () => {
    it("should return team form statistics", async () => {
      // Mock database
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.spyOn(dbModule, "getDb").mockResolvedValue(mockDb as any);

      const caller = chatRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getTeamForm({
        teamName: "×ž×›×‘×™ ×ª×œ ××‘×™×‘",
      });

      expect(result).toHaveProperty("teamName", "×ž×›×‘×™ ×ª×œ ××‘×™×‘");
      expect(result).toHaveProperty("recentMatches");
      expect(result).toHaveProperty("wins");
      expect(result).toHaveProperty("draws");
      expect(result).toHaveProperty("losses");
    });
  });

  describe("chat.getHeadToHead", () => {
    it("should return head-to-head statistics between two teams", async () => {
      // Mock database
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };
      vi.spyOn(dbModule, "getDb").mockResolvedValue(mockDb as any);

      const caller = chatRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.getHeadToHead({
        team1: "×ž×›×‘×™ ×ª×œ ××‘×™×‘",
        team2: "×”×¤×•×¢×œ ×‘×™×¨×•×©×œ×™×",
      });

      expect(result).toHaveProperty("team1", "×ž×›×‘×™ ×ª×œ ××‘×™×‘");
      expect(result).toHaveProperty("team2", "×”×¤×•×¢×œ ×‘×™×¨×•×©×œ×™×");
      expect(result).toHaveProperty("totalMatches");
      expect(result).toHaveProperty("team1Wins");
      expect(result).toHaveProperty("team2Wins");
      expect(result).toHaveProperty("draws");
    });
  });
});

