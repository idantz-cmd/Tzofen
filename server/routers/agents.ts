import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import {
  queryAgent,
  queryMultipleAgents,
  getAllAgents,
  AgentType,
} from "../agents/agents";

export const agentsRouter = router({
  // ── List all available agents ────────────────────────────────────────────────
  listAgents: publicProcedure.query(async () => {
    return getAllAgents().map((agent) => ({
      id: agent.id,
      name: agent.name,
      hebrewName: agent.hebrewName,
      description: agent.description,
      hebrewDescription: agent.hebrewDescription,
      skills: agent.skills,
      icon: agent.icon,
    }));
  }),

  // ── Query a single specialist agent ─────────────────────────────────────────
  query: publicProcedure
    .input(
      z.object({
        agentType: z.enum([
          "statistics",
          "research",
          "prediction",
          "tactical",
          "bankroll",
          "news",
          "orchestrator",
          "schedule",
        ]),
        message: z.string().min(1).max(2000),
        matchId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      const response = await queryAgent(
        input.agentType as AgentType,
        input.message,
        input.matchId,
        userId
      );
      return {
        success: true,
        agentType: input.agentType,
        response,
      };
    }),

  // ── Run all agents in parallel + orchestrator ────────────────────────────────
  queryAll: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        matchId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      const responses = await queryMultipleAgents(
        input.message,
        input.matchId,
        userId
      );

      return {
        success: true,
        responses: {
          statistics: {
            agentType: "statistics",
            hebrewName: "סוכן סטטיסטיקה",
            icon: "📊",
            response: responses.statistics,
          },
          research: {
            agentType: "research",
            hebrewName: "סוכן חיפוש מידע",
            icon: "🔍",
            response: responses.research,
          },
          prediction: {
            agentType: "prediction",
            hebrewName: "סוכן חיזוי תוצאות",
            icon: "🎯",
            response: responses.prediction,
          },
          tactical: {
            agentType: "tactical",
            hebrewName: "סוכן ניתוח טקטי",
            icon: "⚽",
            response: responses.tactical,
          },
          news: {
            agentType: "news",
            hebrewName: "סוכן חדשות בזמן אמת",
            icon: "📰",
            response: responses.news,
          },
          schedule: {
            agentType: "schedule",
            hebrewName: "סוכן לוח משחקים ועומס",
            icon: "📅",
            response: responses.schedule,
          },
          orchestrator: {
            agentType: "orchestrator",
            hebrewName: "סוכן מסכם ראשי",
            icon: "🧠",
            response: responses.orchestrator,
          },
        },
      };
    }),

  // ── Bankroll agent (protected — needs user history) ──────────────────────────
  queryBankroll: protectedProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        matchId: z.number().optional(),
        /**
         * Assumed decimal odds for the recommended bet (e.g. 1.85).
         * If provided, injected into the message so the agent can compute Kelly.
         */
        assumedOdds: z.number().min(1.01).max(50).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Enrich message with odds if provided
      const enrichedMessage = input.assumedOdds
        ? `${input.message}\n\n[אורקל: הנחת אודס עשרוניים = ${input.assumedOdds}]`
        : input.message;

      const response = await queryAgent(
        "bankroll",
        enrichedMessage,
        input.matchId,
        ctx.user.id
      );

      return {
        success: true,
        agentType: "bankroll",
        response,
      };
    }),
});
