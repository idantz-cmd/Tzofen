import path from "path";
import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();
dotenv.config({ path: ".env.local", override: true });

const isProduction = process.env.NODE_ENV === "production";

// In production the JWT secrets MUST be set (>=32 chars) — the app refuses to
// boot otherwise, so we never silently fall back to a hardcoded dev string that
// lives in public source. In development they stay optional with a dev fallback.
const jwtSecretSchema = isProduction
  ? z.string().min(32, "must be at least 32 characters in production")
  : z.string().min(1).optional();

const envSchema = z.object({
  DATABASE_URL: z.string().optional(),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  DATABASE_PATH: z.string().optional(),
  JWT_SECRET: jwtSecretSchema,
  JWT_REFRESH_SECRET: jwtSecretSchema,
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().optional(),
  CORS_ORIGIN: z.string().optional(),
  ADMIN_EMAIL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  // Tiered LLM models — tune cost/quality without a redeploy. "reasoning" is
  // used for the hard calls (agents, synthesis); "fast" for cheap ones.
  LLM_MODEL_REASONING: z.string().optional(),
  LLM_MODEL_FAST: z.string().optional(),
  RAPIDAPI_KEY: z.string().optional(),
  APISPORTS_KEY: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  // Billing (Stripe) — all optional; when unset, billing endpoints return a
  // friendly "not configured" error and the rest of the app is unaffected.
  APP_URL: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PRO_YEARLY: z.string().optional(),
  STRIPE_PRICE_CHAMPION_MONTHLY: z.string().optional(),
  STRIPE_PRICE_CHAMPION_YEARLY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const ENV = {
  // In production these are guaranteed present by the schema above, so the
  // dev fallback can only ever apply outside production.
  cookieSecret: isProduction
    ? (process.env.JWT_SECRET as string)
    : (process.env.JWT_SECRET ?? "dev-secret-change-in-production"),
  refreshSecret: isProduction
    ? (process.env.JWT_REFRESH_SECRET as string)
    : (process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-in-production"),
  databaseUrl: process.env.DATABASE_URL,
  databaseAuthToken: process.env.DATABASE_AUTH_TOKEN,
  databasePath: process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "tzofen.db"),
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT ?? "3000", 10),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  aiApiKey: process.env.AI_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  rapidApiKey: process.env.RAPIDAPI_KEY ?? "",
  // Public base URL for Stripe redirect (checkout success/cancel, portal return).
  // Falls back to CORS_ORIGIN, then localhost dev.
  appUrl: process.env.APP_URL ?? process.env.CORS_ORIGIN ?? "http://localhost:5173",
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY ?? "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
    prices: {
      pro: {
        month: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
        year: process.env.STRIPE_PRICE_PRO_YEARLY ?? "",
      },
      champion: {
        month: process.env.STRIPE_PRICE_CHAMPION_MONTHLY ?? "",
        year: process.env.STRIPE_PRICE_CHAMPION_YEARLY ?? "",
      },
    },
  },
};
