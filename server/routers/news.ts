import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import { fetchIsraeliFootballNews, clearNewsCache } from "../agents/newsScraperAgent";

export const newsRouter = router({
  getNews: publicProcedure
    .input(
      z.object({
        source: z.enum(["all", "Sport5", "ONE", "Walla", "Mako"]).default("all"),
        limit: z.number().min(1).max(50).default(30),
        forceRefresh: z.boolean().default(false),
      })
    )
    .query(async ({ input }) => {
      const items = await fetchIsraeliFootballNews(input.forceRefresh);
      const filtered =
        input.source === "all"
          ? items
          : items.filter((i) => i.source === input.source);
      return {
        items: filtered.slice(0, input.limit),
        total: filtered.length,
        cachedAt: new Date().toISOString(),
      };
    }),

  refresh: publicProcedure.mutation(async () => {
    clearNewsCache();
    const items = await fetchIsraeliFootballNews(true);
    return { success: true, count: items.length };
  }),
});
