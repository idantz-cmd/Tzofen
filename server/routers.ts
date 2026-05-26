import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { matchesRouter } from "./routers/matches";
import { leaderboardRouter } from "./routers/leaderboard";
import { dashboardRouter } from "./routers/dashboard";
import { adminRouter } from "./routers/admin";
import { chatRouter } from "./routers/chat";
import { agentsRouter } from "./routers/agents";
import { dataFetcherRouter } from "./routers/dataFetcher";
import { competitionsRouter } from "./routers/competitions";
import { userChatRouter } from "./routers/userChat";
import { streaksRouter } from "./routers/streaks";
import { importRouter } from "./routers/import";
import { leagueDataRouter } from "./routers/leagueData";
import { newsRouter } from "./routers/news";
import { engagementRouter } from "./routers/engagement";
import { cupRouter } from "./routers/cup";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  matches: matchesRouter,
  leaderboard: leaderboardRouter,
  dashboard: dashboardRouter,
  admin: adminRouter,
  chat: chatRouter,
  agents: agentsRouter,
  dataFetcher: dataFetcherRouter,
  competitions: competitionsRouter,
  userChat: userChatRouter,
  streaks: streaksRouter,
  import: importRouter,
  leagueData: leagueDataRouter,
  news: newsRouter,
  engagement: engagementRouter,
  cup: cupRouter,
});

export type AppRouter = typeof appRouter;

