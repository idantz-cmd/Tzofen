import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";

// TODO: implement with new schema — `competitions` and `competitionParticipants`
// tables were removed in the schema migration. All procedures stub-throw NOT_IMPLEMENTED
// so the tRPC router keeps the same surface area without referencing removed tables.

const NOT_IMPL = new TRPCError({
  code: "NOT_IMPLEMENTED",
  message: "תכונת התחרויות אינה זמינה במהדורה הנוכחית",
});

export const competitionsRouter = router({
  // Get all active competitions
  getActive: publicProcedure.query(async () => {
    return [] as Array<{
      id: number;
      name: string;
      type: "tournament" | "head_to_head";
      status: "active" | "completed" | "cancelled";
      creatorId: number;
      maxParticipants: number | null;
      startDate: Date | null;
      endDate: Date | null;
      createdAt: Date;
      participantCount: number;
    }>;
  }),

  // Get competition by ID with participants
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async () => {
      return null;
    }),

  // Create a new competition
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(3).max(50),
        type: z.enum(["tournament", "head_to_head"]),
        maxParticipants: z.number().min(2).max(100).optional(),
        endDate: z.string().optional(),
      })
    )
    .mutation(async () => {
      throw NOT_IMPL;
    }),

  // Join a competition
  join: protectedProcedure
    .input(z.object({ competitionId: z.number() }))
    .mutation(async () => {
      throw NOT_IMPL;
    }),

  // Get my competitions
  getMine: protectedProcedure.query(async () => {
    return [] as Array<{
      id: number;
      name: string;
      type: "tournament" | "head_to_head";
      status: "active" | "completed" | "cancelled";
      myPoints: number;
    }>;
  }),

  // Get competition leaderboard
  getLeaderboard: publicProcedure
    .input(z.object({ competitionId: z.number() }))
    .query(async () => {
      return [] as Array<{ rank: number; userId: number; userName: string | null; points: number | null; joinedAt: Date }>;
    }),

  // Challenge a user (head-to-head)
  challenge: protectedProcedure
    .input(
      z.object({
        opponentId: z.number(),
        name: z.string().optional(),
      })
    )
    .mutation(async () => {
      throw NOT_IMPL;
    }),

  // Get available users to challenge
  getUsers: protectedProcedure.query(async () => {
    return [] as Array<{ id: number; name: string | null }>;
  }),
});
