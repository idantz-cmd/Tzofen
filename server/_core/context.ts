import { inferAsyncReturnType } from '@trpc/server';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { verifyAccessToken } from '../services/auth';
import * as db from '../db';

export const createContext = async ({
  req,
  res,
}: CreateExpressContextOptions) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

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
