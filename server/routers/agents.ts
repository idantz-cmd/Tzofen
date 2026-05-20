import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";

export const agentsRouter = router({
  listAgents: publicProcedure.query(async () => {
    return [];
  }),

  query: publicProcedure
    .input(
      z.object({
        agentType: z.enum(["statistics", "research", "prediction", "tactical"]),
        message: z.string().min(1).max(2000),
        matchId: z.number().optional(),
      })
    )
    .mutation(async () => {
      throw new Error("Agents not configured");
    }),

  queryAll: publicProcedure
    .input(
      z.object({
        message: z.string().min(1).max(2000),
        matchId: z.number().optional(),
      })
    )
    .mutation(async () => {
      throw new Error("Agents not configured");
    }),
});
