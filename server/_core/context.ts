import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";
import { sdk } from "./sdk";
import { getSessionCookieOptions } from "./cookies";
import { refreshAccessToken, verifyAccessToken, ACCESS_MAX_AGE } from "../services/auth";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch {
    // Access token missing/expired — try refresh token transparently
    try {
      const refreshToken = sdk.getRefreshTokenFromRequest(opts.req);
      if (refreshToken) {
        const newAccessToken = await refreshAccessToken(refreshToken);
        if (newAccessToken) {
          opts.res.cookie(COOKIE_NAME, newAccessToken, {
            ...getSessionCookieOptions(opts.req),
            maxAge: ACCESS_MAX_AGE,
          });
          const session = await verifyAccessToken(newAccessToken);
          if (session) {
            user = await db.getUserById(session.userId);
          }
        }
      }
    } catch {
      user = null;
    }
  }

  return { req: opts.req, res: opts.res, user };
}
