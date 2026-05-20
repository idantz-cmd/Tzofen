import path from "path";

export const ENV = {
  cookieSecret: process.env.JWT_SECRET ?? "dev-secret-change-in-production",
  databasePath: process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "betingapp.db"),
  isProduction: process.env.NODE_ENV === "production",
  adminEmail: process.env.ADMIN_EMAIL ?? "",
  aiApiKey: process.env.AI_API_KEY ?? "",
};
