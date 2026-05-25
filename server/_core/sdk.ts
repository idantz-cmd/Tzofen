import { COOKIE_NAME, REFRESH_COOKIE_NAME } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { verifyAccessToken } from "../services/auth";

class SDKServer {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) return new Map<string, string>();
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const accessCookie = cookies.get(COOKIE_NAME);

    const session = accessCookie ? await verifyAccessToken(accessCookie) : null;
    if (!session) throw ForbiddenError("Invalid session");

    const user = await db.getUserById(session.userId);
    if (!user) throw ForbiddenError("User not found");

    return user;
  }

  getRefreshTokenFromRequest(req: Request): string | null {
    const cookies = this.parseCookies(req.headers.cookie);
    return cookies.get(REFRESH_COOKIE_NAME) ?? null;
  }
}

export const sdk = new SDKServer();
