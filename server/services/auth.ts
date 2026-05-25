import { SignJWT, jwtVerify } from 'jose';
import { getDb } from '../db';
import { users } from '../../drizzle/schema';
import { eq } from 'drizzle-orm';
import { ENV } from '../_core/env';

const ACCESS_SECRET = new TextEncoder().encode(ENV.cookieSecret);
const REFRESH_SECRET = new TextEncoder().encode(ENV.refreshSecret);

const ACCESS_TTL  = '15m';
const REFRESH_TTL = '30d';

export const ACCESS_MAX_AGE  = 15 * 60 * 1000;           // 15 minutes in ms
export const REFRESH_MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days in ms

export const createTokens = async (userId: number, role: string) => {
  const accessToken = await new SignJWT({ userId, role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(ACCESS_TTL)
    .setIssuedAt()
    .sign(ACCESS_SECRET);

  const refreshToken = await new SignJWT({ userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime(REFRESH_TTL)
    .setIssuedAt()
    .sign(REFRESH_SECRET);

  return { accessToken, refreshToken };
};

export const verifyAccessToken = async (token: string) => {
  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload as { userId: number; role: string };
  } catch {
    return null;
  }
};

export const refreshAccessToken = async (refreshToken: string): Promise<string | null> => {
  try {
    const { payload } = await jwtVerify(refreshToken, REFRESH_SECRET);
    const userId = payload.userId as number;
    const db = getDb();

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!user) return null;

    return new SignJWT({ userId, role: user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(ACCESS_TTL)
      .setIssuedAt()
      .sign(ACCESS_SECRET);
  } catch {
    return null;
  }
};
