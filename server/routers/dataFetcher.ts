import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { DataFetcherAgent } from "../agents/dataFetcher";

export const dataFetcherRouter = router({
  // Get match data
  getMatchData: publicProcedure
    .input(
      z.object({
        homeTeam: z.string().min(1),
        awayTeam: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const data = await DataFetcherAgent.getMatchData(input.homeTeam, input.awayTeam);
        return {
          success: true,
          data,
        };
      } catch (error) {
        console.error("Error in getMatchData:", error);
        throw error;
      }
    }),

  // Get latest news
  getLatestNews: publicProcedure.query(async () => {
    try {
      const news = await DataFetcherAgent.getLatestNews();
      return {
        success: true,
        news,
      };
    } catch (error) {
      console.error("Error in getLatestNews:", error);
      throw error;
    }
  }),

  // Get team info
  getTeamInfo: publicProcedure
    .input(
      z.object({
        teamName: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const info = await DataFetcherAgent.getTeamInfo(input.teamName);
        return {
          success: true,
          info,
        };
      } catch (error) {
        console.error("Error in getTeamInfo:", error);
        throw error;
      }
    }),

  // Get match prediction data
  getMatchPredictionData: publicProcedure
    .input(
      z.object({
        homeTeam: z.string().min(1),
        awayTeam: z.string().min(1),
        league: z.enum(["ligat_hael", "ligah_leumit"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const data = await DataFetcherAgent.getMatchPredictionData(
          input.homeTeam,
          input.awayTeam,
          input.league
        );
        return {
          success: true,
          data,
        };
      } catch (error) {
        console.error("Error in getMatchPredictionData:", error);
        throw error;
      }
    }),

  // Get league standings
  getLeagueStandings: publicProcedure
    .input(
      z.object({
        league: z.enum(["ligat_hael", "ligah_leumit"]),
      })
    )
    .query(async ({ input }) => {
      try {
        const standings = await DataFetcherAgent.getLeagueStandings(input.league);
        return {
          success: true,
          standings,
        };
      } catch (error) {
        console.error("Error in getLeagueStandings:", error);
        throw error;
      }
    }),

  // Get player info
  getPlayerInfo: publicProcedure
    .input(
      z.object({
        playerName: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const info = await DataFetcherAgent.getPlayerInfo(input.playerName);
        return {
          success: true,
          info,
        };
      } catch (error) {
        console.error("Error in getPlayerInfo:", error);
        throw error;
      }
    }),

  // Get transfer news
  getTransferNews: publicProcedure.query(async () => {
    try {
      const news = await DataFetcherAgent.getTransferNews();
      return {
        success: true,
        news,
      };
    } catch (error) {
      console.error("Error in getTransferNews:", error);
      throw error;
    }
  }),

  // Get injury updates
  getInjuryUpdates: publicProcedure.query(async () => {
    try {
      const updates = await DataFetcherAgent.getInjuryUpdates();
      return {
        success: true,
        updates,
      };
    } catch (error) {
      console.error("Error in getInjuryUpdates:", error);
      throw error;
    }
  }),

  // Get head-to-head statistics
  getHeadToHead: publicProcedure
    .input(
      z.object({
        team1: z.string().min(1),
        team2: z.string().min(1),
      })
    )
    .query(async ({ input }) => {
      try {
        const data = await DataFetcherAgent.getHeadToHead(input.team1, input.team2);
        return {
          success: true,
          data,
        };
      } catch (error) {
        console.error("Error in getHeadToHead:", error);
        throw error;
      }
    }),
});

