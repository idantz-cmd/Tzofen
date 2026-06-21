import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/auth';
import { COOKIE_NAME } from '../../shared/const';
import pino from 'pino';

const logger = pino({ transport: { target: 'pino-pretty' } });

// --- Context מועשר לכל request ---
export interface AuthRequest extends Request {
  user?: { userId: number; role: string };
}

// --- Auth Middleware ---
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Read token from Authorization header first, then fall back to the session
  // cookie — mirrors createContext so cookie-only clients (the web app) are
  // recognized on any route that mounts this middleware.
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (req.cookies?.[COOKIE_NAME] ?? null);

  if (!token) {
    req.user = undefined;
    return next(); // guest — לא זורק שגיאה, פשוט ממשיך ללא user
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'טוקן לא תקין או פג תוקף' });
  }

  req.user = payload;
  next();
};

// --- Admin Guard ---
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'נדרשת התחברות' });
  }
  if (req.user.role !== 'admin') {
    logger.warn({ userId: req.user.userId }, 'Unauthorized admin access attempt');
    return res.status(403).json({ error: 'אין הרשאת גישה' });
  }
  next();
};

// --- Request Logger ---
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? 'error'
                : res.statusCode >= 400 ? 'warn'
                : 'info';

    logger[level]({
      method:   req.method,
      url:      req.url,
      status:   res.statusCode,
      duration: `${duration}ms`,
      ip:       req.ip,
    });
  });
  next();
};

// --- Security Headers נוספים מעבר ל-helmet ---
export const additionalSecurityHeaders = (
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  );
  next();
};
