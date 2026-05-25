import { COOKIE_NAME, REFRESH_COOKIE_NAME } from "@shared/const";
import bcrypt from "bcryptjs";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import { nanoid } from "nanoid";
import * as db from "../db";
import { createTokens, refreshAccessToken, ACCESS_MAX_AGE, REFRESH_MAX_AGE } from "../services/auth";
import { getSessionCookieOptions } from "./cookies";

function setAuthCookies(
  req: Request,
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  const opts = getSessionCookieOptions(req);
  res.cookie(COOKIE_NAME, accessToken, { ...opts, maxAge: ACCESS_MAX_AGE });
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, { ...opts, maxAge: REFRESH_MAX_AGE });
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    const { email, password, name } = req.body ?? {};

    if (!email || !password || !name) {
      res.status(400).json({ error: "email, password, name are required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    try {
      const existing = await db.getUserByEmail(email);
      if (existing) {
        res.status(409).json({ error: "Email already registered" });
        return;
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const openId = nanoid();

      await db.upsertUser({
        openId,
        name,
        email,
        passwordHash,
        loginMethod: "email",
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByOpenId(openId);
      if (!user) {
        res.status(500).json({ error: "Failed to create user" });
        return;
      }

      const { accessToken, refreshToken } = await createTokens(user.id, user.role);
      setAuthCookies(req, res, accessToken, refreshToken);
      res.json({ success: true, accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      console.error("[Auth] Register failed", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      res.status(400).json({ error: "email and password are required" });
      return;
    }

    try {
      const user = await db.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      await db.upsertUser({ openId: user.openId, lastSignedIn: new Date() });

      const { accessToken, refreshToken } = await createTokens(user.id, user.role);
      setAuthCookies(req, res, accessToken, refreshToken);
      res.json({ success: true, accessToken, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (error) {
      console.error("[Auth] Login failed", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/refresh", async (req: Request, res: Response) => {
    const cookies = parseCookieHeader(req.headers.cookie ?? "");
    const refreshToken = cookies[REFRESH_COOKIE_NAME];

    if (!refreshToken) {
      res.status(401).json({ error: "No refresh token" });
      return;
    }

    const newAccessToken = await refreshAccessToken(refreshToken);
    if (!newAccessToken) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    const opts = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, newAccessToken, { ...opts, maxAge: ACCESS_MAX_AGE });
    res.json({ success: true });
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const opts = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, opts);
    res.clearCookie(REFRESH_COOKIE_NAME, opts);
    res.json({ success: true });
  });
}
