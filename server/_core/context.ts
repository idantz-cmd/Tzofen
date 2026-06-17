import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { verifyAccessToken } from '../services/auth';
import { COOKIE_NAME } from '../../shared/const';
import * as db from '../db';

export const createContext = async ({
  req,
  res,
}: CreateExpressContextOptions) => {
  // Read token from Authorization header first, then fall back to cookie
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.cookies?.[COOKIE_NAME] ?? null);

  let user = null;
  if (token) {
    const payload = await verifyAccessToken(token);
    if (payload) {
      user = await db.getUserById(payload.userId);
    }
  }

  return { req, res, user };
};

export type Context = inferAsyncReturnType<typeof createContext>;
export type TrpcContext = Context;
