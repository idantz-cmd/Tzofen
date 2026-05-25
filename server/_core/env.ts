import path from "path";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_PATH: z.string().optional(),
  JWT_SECRET: z.string().min(1).optional(),
  JWT_REFRESH_SECRET: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ADMIN_EMAIL: z.string().optional(),
  AI_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  RAPIDAPI_KEY: z.string().optional(),
  APISPORTS_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  refreshSecret: process.env.JWT_REFRESH_SECRET ?? "dev-refresh-secret-change-in-production",
  databasePath: process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "betingapp.db"),
  isProduction: process.env.NODE_ENV === "production",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  aiApiKey: process.env.AI_API_KEY ?? process.env.GEMINI_API_KEY ?? "",
  rapidApiKey: process.env.RAPIDAPI_KEY ?? "",
};
