import { describe, it, expect, vi, beforeEach } from "vitest";
import { chatRouter } from "./chat";
import * as dbModule from "../db";

// getDb is synchronous in this router, so mock it with a plain return value.
vi.mock("../db", () => ({
  getDb: vi.fn(),
}));

const makeCaller = () =>
  chatRouter.createCaller({ user: null, req: {} as any, res: {} as any });

function mockDb() {
  const db = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue([]),
  };
  vi.spyOn(dbModule, "getDb").mockReturnValue(db as any);
  return db;
}

describe("Chat Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("chat.ask", () => {
    // chat.ask is currently a stub: the AI assistant is disabled, so it always
    // resolves to success:false with a fixed Hebrew "unavailable" message and
    // never calls the LLM.
    it("returns the AI-unavailable stub response", async () => {
      const result = await makeCaller().ask({
        message: "מה הביצועים של מכבי תל אביב?",
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("אינו זמין");
    });

    it("accepts an optional matchId without error", async () => {
      const result = await makeCaller().ask({
        message: "מה התחזית לגבי המשחק הזה?",
        matchId: 1,
      });

      expect(result.success).toBe(false);
      expect(result.message).toContain("אינו זמין");
    });

    it("validates message length (rejects an empty message)", async () => {
      await expect(makeCaller().ask({ message: "" })).rejects.toThrow();
    });
  });

  describe("chat.getTeamForm", () => {
    it("returns team form statistics", async () => {
      mockDb();

      const result = await makeCaller().getTeamForm({
        teamName: "מכבי תל אביב",
      });

      expect(result).toHaveProperty("teamName", "מכבי תל אביב");
      expect(result).toHaveProperty("recentMatches");
      expect(result).toHaveProperty("wins");
      expect(result).toHaveProperty("draws");
      expect(result).toHaveProperty("losses");
    });
  });

  describe("chat.getHeadToHead", () => {
    it("returns head-to-head statistics between two teams", async () => {
      mockDb();

      const result = await makeCaller().getHeadToHead({
        team1: "מכבי תל אביב",
        team2: "הפועל ירושלים",
      });

      expect(result).toHaveProperty("team1", "מכבי תל אביב");
      expect(result).toHaveProperty("team2", "הפועל ירושלים");
      expect(result).toHaveProperty("totalMatches");
      expect(result).toHaveProperty("team1Wins");
      expect(result).toHaveProperty("team2Wins");
      expect(result).toHaveProperty("draws");
    });
  });
});
