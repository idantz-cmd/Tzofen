import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, router } from "../_core/trpc";
import { getTeamStats, getHeadToHead, predictMatch } from "../agents/agents";

// Simple in-memory rate limiter — 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, maxPerMinute = 10) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return;
  }

  if (entry.count >= maxPerMinute) {
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: "יותר מדי בקשות — נסה שוב בעוד דקה",
    });
  }

  entry.count++;
}

export const agentsRouter = router({
  // List agents — empty until AI provider configured
  listAgents: publicProcedure.query(async () => {
    return [];
  }),

  // Get stats for a specific team
  getTeamStats: publicProcedure
    .input(z.object({ teamName: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      checkRateLimit((ctx as any).req?.ip ?? "unknown");
      return await getTeamStats(input.teamName);
    }),

  // Get head-to-head stats between two teams
  getHeadToHead: publicProcedure
    .input(z.object({ team1: z.string().min(1), team2: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      checkRateLimit((ctx as any).req?.ip ?? "unknown");
      return await getHeadToHead(input.team1, input.team2);
    }),

  // Predict match outcome based on real DB stats
  predictMatch: publicProcedure
    .input(
      z.object({
        homeTeam: z.string().min(1),
        awayTeam: z.string().min(1),
      })
    )
    .query(async ({ ctx, input }) => {
      checkRateLimit((ctx as any).req?.ip ?? "unknown");
      return await predictMatch(input.homeTeam, input.awayTeam);
    }),

  // Legacy endpoints — kept for client compatibility
  query: publicProcedure
    .input(
      z.object({
        agentType: z.enum(["statistics", "research", "prediction", "tactical"]),
        message: z.string().min(1).max(2000),
        matchId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx }) => {
      checkRateLimit((ctx as any).req?.ip ?? "unknown");
      throw new Error("Agents not configured");
    }),

  queryAll: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        matchId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx }) => {
      checkRateLimit((ctx as any).req?.ip ?? "unknown");
      throw new Error("Agents not configured");
    }),
});
