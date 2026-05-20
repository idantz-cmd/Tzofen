import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { competitions, competitionParticipants, users, predictions } from "../../drizzle/schema";
import { eq, and, desc, sql, inArray } from "drizzle-orm";

export const competitionsRouter = router({
  // Get all active competitions (public - anyone can browse)
  getActive: publicProcedure.query(async () => {
    const db = getDb();
    if (!db) return [];

    const result = await db
      .select({
        id: competitions.id,
        name: competitions.name,
        type: competitions.type,
        status: competitions.status,
        creatorId: competitions.creatorId,
        maxParticipants: competitions.maxParticipants,
        startDate: competitions.startDate,
        endDate: competitions.endDate,
        createdAt: competitions.createdAt,
      })
      .from(competitions)
      .where(eq(competitions.status, "active"))
      .orderBy(desc(competitions.createdAt));

    // Get participant counts
    const competitionIds = result.map((c) => c.id);
    if (competitionIds.length === 0) return [];

    const participantCounts = await db
      .select({
        competitionId: competitionParticipants.competitionId,
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(competitionParticipants)
      .where(inArray(competitionParticipants.competitionId, competitionIds))
      .groupBy(competitionParticipants.competitionId);

    const countMap = new Map(participantCounts.map((p) => [p.competitionId, p.count]));

    return result.map((comp) => ({
      ...comp,
      participantCount: countMap.get(comp.id) || 0,
    }));
  }),

  // Get competition by ID with participants
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) return null;

      const [competition] = await db
        .select()
        .from(competitions)
        .where(eq(competitions.id, input.id))
        .limit(1);

      if (!competition) return null;

      const participants = await db
        .select({
          userId: competitionParticipants.userId,
          points: competitionParticipants.points,
          joinedAt: competitionParticipants.joinedAt,
          userName: users.name,
        })
        .from(competitionParticipants)
        .leftJoin(users, eq(users.id, competitionParticipants.userId))
        .where(eq(competitionParticipants.competitionId, input.id))
        .orderBy(desc(competitionParticipants.points));

      return {
        ...competition,
        participants,
      };
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
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new Error("Database unavailable");

      const result = await db.insert(competitions).values({
        name: input.name,
        type: input.type,
        status: "active",
        creatorId: ctx.user.id,
        maxParticipants: input.maxParticipants || (input.type === "head_to_head" ? 2 : 20),
        startDate: new Date(),
        endDate: input.endDate ? new Date(input.endDate) : null,
      });

      const competitionId = Number(result.lastInsertRowid);

      // Auto-join the creator
      await db.insert(competitionParticipants).values({
        competitionId: Number(competitionId),
        userId: ctx.user.id,
        points: 0,
      });

      return { id: Number(competitionId), success: true };
    }),

  // Join a competition
  join: protectedProcedure
    .input(z.object({ competitionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if competition exists and is active
      const [competition] = await db
        .select()
        .from(competitions)
        .where(
          and(
            eq(competitions.id, input.competitionId),
            eq(competitions.status, "active")
          )
        )
        .limit(1);

      if (!competition) throw new Error("×ª×—×¨×•×ª ×œ× × ×ž×¦××” ××• ×œ× ×¤×¢×™×œ×”");

      // Check if already joined
      const [existing] = await db
        .select()
        .from(competitionParticipants)
        .where(
          and(
            eq(competitionParticipants.competitionId, input.competitionId),
            eq(competitionParticipants.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (existing) throw new Error("×›×‘×¨ ×”×¦×˜×¨×¤×ª ×œ×ª×—×¨×•×ª ×–×•");

      // Check max participants
      const [{ count }] = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(competitionParticipants)
        .where(eq(competitionParticipants.competitionId, input.competitionId));

      if (count >= (competition.maxParticipants || 20)) {
        throw new Error("×”×ª×—×¨×•×ª ×ž×œ××”");
      }

      await db.insert(competitionParticipants).values({
        competitionId: input.competitionId,
        userId: ctx.user.id,
        points: 0,
      });

      return { success: true };
    }),

  // Get my competitions
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) return [];

    const myParticipations = await db
      .select({
        competitionId: competitionParticipants.competitionId,
        points: competitionParticipants.points,
      })
      .from(competitionParticipants)
      .where(eq(competitionParticipants.userId, ctx.user.id));

    if (myParticipations.length === 0) return [];

    const competitionIds = myParticipations.map((p) => p.competitionId);

    const comps = await db
      .select()
      .from(competitions)
      .where(inArray(competitions.id, competitionIds))
      .orderBy(desc(competitions.createdAt));

    const pointsMap = new Map(myParticipations.map((p) => [p.competitionId, p.points]));

    return comps.map((comp) => ({
      ...comp,
      myPoints: pointsMap.get(comp.id) || 0,
    }));
  }),

  // Get competition leaderboard
  getLeaderboard: publicProcedure
    .input(z.object({ competitionId: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) return [];

      const participants = await db
        .select({
          userId: competitionParticipants.userId,
          points: competitionParticipants.points,
          joinedAt: competitionParticipants.joinedAt,
          userName: users.name,
        })
        .from(competitionParticipants)
        .leftJoin(users, eq(users.id, competitionParticipants.userId))
        .where(eq(competitionParticipants.competitionId, input.competitionId))
        .orderBy(desc(competitionParticipants.points));

      return participants.map((p, index) => ({
        rank: index + 1,
        ...p,
      }));
    }),

  // Challenge a user (head-to-head)
  challenge: protectedProcedure
    .input(
      z.object({
        opponentId: z.number(),
        name: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = getDb();
      if (!db) throw new Error("Database unavailable");

      if (input.opponentId === ctx.user.id) {
        throw new Error("×œ× × ×™×ª×Ÿ ×œ××ª×’×¨ ××ª ×¢×¦×ž×š");
      }

      // Get opponent name
      const [opponent] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, input.opponentId))
        .limit(1);

      const challengeName =
        input.name || `${ctx.user.name} vs ${opponent?.name || "×ž×ª×—×¨×”"}`;

      const result = await db.insert(competitions).values({
        name: challengeName,
        type: "head_to_head",
        status: "active",
        creatorId: ctx.user.id,
        maxParticipants: 2,
        startDate: new Date(),
        endDate: null,
      });

      const competitionId = Number(result.lastInsertRowid);

      // Add both participants
      await db.insert(competitionParticipants).values([
        { competitionId, userId: ctx.user.id, points: 0 },
        { competitionId, userId: input.opponentId, points: 0 },
      ]);

      return { id: competitionId, success: true };
    }),

  // Get available users to challenge
  getUsers: protectedProcedure.query(async ({ ctx }) => {
    const db = getDb();
    if (!db) return [];

    const allUsers = await db
      .select({
        id: users.id,
        name: users.name,
      })
      .from(users)
      .where(sql`${users.id} != ${ctx.user.id}`)
      .orderBy(users.name);

    return allUsers;
  }),
});

