import { z } from "zod";
import { adminProcedure, router } from "../_core/trpc";
import { updateMatchResult, updateLeaderboardScore } from "../db";
import { getDb } from "../db";
import { predictions, matches, leaderboardScores, users } from "../../drizzle/schema";
import { eq, count, avg, like, or, sql } from "drizzle-orm";

export const adminRouter = router({
  // Publish match result and calculate scores
  publishMatchResult: adminProcedure
    .input(z.object({
      matchId: z.number(),
      homeScore: z.number().min(0),
      awayScore: z.number().min(0),
      // Advanced stats (optional) — currently ignored (table removed)
      // TODO: implement with new schema once advanced stats tables are reintroduced
      totalCorners: z.number().min(0).optional(),
      totalYellowCards: z.number().min(0).optional(),
      totalRedCards: z.number().min(0).optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        // Determine actual result
        let actualResult: "home" | "draw" | "away";
        if (input.homeScore > input.awayScore) {
          actualResult = "home";
        } else if (input.homeScore < input.awayScore) {
          actualResult = "away";
        } else {
          actualResult = "draw";
        }

        // Update match with result
        await updateMatchResult(input.matchId, actualResult, input.homeScore, input.awayScore);

        // Get all predictions for this match
        const db = getDb();
        if (!db) {
          throw new Error("Database not available");
        }

        const matchPredictions = await db
          .select()
          .from(predictions)
          .where(eq(predictions.matchId, input.matchId));

        // Calculate scores for each prediction
        let pointsAwarded = 0;
        for (const prediction of matchPredictions) {
          const isCorrect = prediction.prediction === actualResult;
          const points = isCorrect ? 10 : 0;

          // Update prediction record
          await db
            .update(predictions)
            .set({
              isCorrect,
              points,
            })
            .where(eq(predictions.id, prediction.id));

          // Update leaderboard score (also handles streak via currentStreak/longestStreak)
          await updateLeaderboardScore(prediction.userId, points, isCorrect);

          // Update streak fields on leaderboardScores
          const [score] = await db
            .select()
            .from(leaderboardScores)
            .where(eq(leaderboardScores.userId, prediction.userId))
            .limit(1);

          if (score) {
            if (isCorrect) {
              const newCurrent = (score.currentStreak || 0) + 1;
              const newLongest = Math.max(newCurrent, score.longestStreak || 0);
              await db
                .update(leaderboardScores)
                .set({ currentStreak: newCurrent, longestStreak: newLongest })
                .where(eq(leaderboardScores.userId, prediction.userId));
            } else {
              await db
                .update(leaderboardScores)
                .set({ currentStreak: 0 })
                .where(eq(leaderboardScores.userId, prediction.userId));
            }
          }

          if (isCorrect) pointsAwarded++;
        }

        // Advanced stats scoring removed — advancedPredictions/matchAdvancedStats tables no longer exist
        // TODO: implement with new schema once advanced stats are reintroduced
        const advancedBonusCount = 0;

        return {
          success: true,
          message: `התוצאה פורסמה בהצלחה. ${pointsAwarded} משתמשים חזו נכון.`,
          pointsAwarded,
          advancedBonusCount,
        };
      } catch (error) {
        console.error("Error publishing match result:", error);
        throw error;
      }
    }),

  // Get all matches for admin panel
  getAllMatches: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(500).default(100),
    }))
    .query(async ({ input }) => {
      try {
        const db = getDb();
        if (!db) return [];

        return await db.select().from(matches).limit(input.limit);
      } catch (error) {
        console.error("Error fetching matches:", error);
        return [];
      }
    }),

  // KPI stats for admin dashboard
  getStats: adminProcedure.query(async () => {
    const db = getDb();
    if (!db) return null;

    const [totalUsers] = await db.select({ count: count() }).from(users);
    const [payingUsers] = await db
      .select({ count: count() })
      .from(users)
      .where(or(eq(users.plan, "pro"), eq(users.plan, "champion")));
    const [totalPredictions] = await db.select({ count: count() }).from(predictions);
    const [finishedMatches] = await db
      .select({ count: count() })
      .from(matches)
      .where(eq(matches.status, "finished"));
    const [aiAccuracy] = await db
      .select({ avg: avg(leaderboardScores.accuracyRate) })
      .from(leaderboardScores);

    const planCounts = await db
      .select({ plan: users.plan, count: count() })
      .from(users)
      .groupBy(users.plan);

    return {
      totalUsers: totalUsers.count,
      payingUsers: payingUsers.count,
      totalPredictions: totalPredictions.count,
      finishedMatches: finishedMatches.count,
      avgAccuracy: aiAccuracy.avg ? Math.round(Number(aiAccuracy.avg) * 100) : 0,
      planCounts,
    };
  }),

  // All users with leaderboard stats for user management
  getAllUsers: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      const db = getDb();
      if (!db) return [];

      const baseQuery = db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          plan: users.plan,
          createdAt: users.createdAt,
          totalPoints: leaderboardScores.totalPoints,
          accuracyRate: leaderboardScores.accuracyRate,
          totalPredictions: leaderboardScores.totalPredictions,
        })
        .from(users)
        .leftJoin(leaderboardScores, eq(users.id, leaderboardScores.userId));

      if (input.search) {
        return baseQuery
          .where(or(
            like(users.name, `%${input.search}%`),
            like(users.email, `%${input.search}%`),
          ))
          .limit(input.limit)
          .offset(input.offset);
      }

      return baseQuery.limit(input.limit).offset(input.offset);
    }),

  // Set user role (promote / demote)
  setUserRole: adminProcedure
    .input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      if (!db) throw new Error("Database not available");

      await db.update(users).set({ role: input.role }).where(eq(users.id, input.userId));
      return { success: true };
    }),

  // System status check
  getSystemStatus: adminProcedure.query(async () => {
    let dbOk = false;
    try {
      const db = getDb();
      if (db) {
        await db.select({ count: sql<number>`1` }).from(users).limit(1);
        dbOk = true;
      }
    } catch {}

    // Check football.co.il connectivity (the actual data source — no API key needed)
    let footballOk = false;
    try {
      const res = await fetch("https://www.football.co.il/scores/", {
        method: "HEAD",
        signal: AbortSignal.timeout(5000),
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      footballOk = res.ok;
    } catch {}

    return {
      db: dbOk,
      gemini: !!process.env.OPENAI_API_KEY,
      apifootball: footballOk,
    };
  }),
});
