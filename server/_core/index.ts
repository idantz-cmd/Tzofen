import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import net from "net";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { importMatchesHandler } from "../scheduled/importHandler";
import { startResultsSync } from "../services/resultsSync";
import { requestLogger, additionalSecurityHeaders } from "../middleware";
import { ENV } from "./env";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function runMigrations() {
  try {
    if (process.env.RESET_DB === "true" && ENV.databasePath) {
      const fs = await import("fs");
      if (fs.existsSync(ENV.databasePath)) {
        fs.unlinkSync(ENV.databasePath);
        console.log("🗑️  Wiped stale database for fresh migration");
      }
    }
    const { migrate } = await import("drizzle-orm/libsql/migrator");
    const migrationsFolder = ENV.isProduction
      ? path.resolve(__dirname, "../drizzle")
      : path.resolve(__dirname, "../../drizzle");
    await migrate(getDb(), { migrationsFolder });
    console.log("✅ Database migrations applied");
  } catch (e) {
    console.error("❌ Migration failed:", e);
    throw e;
  }
}

async function ensureColumns() {
  const db = getDb();
  const columns: Array<{ name: string }> = await db.all(sql`PRAGMA table_info(users)`);
  const names = columns.map((c) => c.name);
  if (!names.includes("favTeam")) {
    await db.run(sql`ALTER TABLE users ADD COLUMN favTeam text`);
    console.log("✅ Added favTeam column");
  }
  if (!names.includes("plan")) {
    await db.run(sql`ALTER TABLE users ADD COLUMN plan text DEFAULT 'free'`);
    console.log("✅ Added plan column");
  }
}

async function ensureAdmin() {
  if (!ENV.adminEmail) return;
  try {
    await getDb().run(
      sql`UPDATE users SET role = 'admin' WHERE email = ${ENV.adminEmail} AND role != 'admin'`
    );
    console.log(`✅ Admin role ensured for ${ENV.adminEmail}`);
  } catch {
    // table may not exist yet on very first boot — migrations run before this
  }
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  message: { error: "יותר מדי בקשות, נסה שוב בעוד מעט" },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "יותר מדי ניסיונות התחברות" },
});

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: "מגבלת AI הושגה, המתן דקה" },
});

async function startServer() {
  await runMigrations();
  await ensureColumns();
  await ensureAdmin();

  const app = express();
  const server = createServer(app);

  // Trust Fly.io / reverse proxy headers for rate limiting
  app.set("trust proxy", 1);

  // Security headers — disable CSP in dev so Vite's inline scripts work
  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === "development"
          ? false
          : {
              directives: {
                ...helmet.contentSecurityPolicy.getDefaultDirectives(),
                // Allow team logos from api-sports CDN and Google Fonts
                "img-src": ["'self'", "data:", "https://media.api-sports.io"],
                "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
                "font-src": ["'self'", "https://fonts.gstatic.com"],
              },
            },
    })
  );
  app.use(cors({
    origin: ENV.corsOrigin,
    credentials: true,
  }));
  app.use(additionalSecurityHeaders);
  app.use(cookieParser());
  app.use(requestLogger);

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Rate limits
  app.use("/api/trpc", globalLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/register", authLimiter);
  app.use("/api/trpc/agents", aiLimiter);

  registerStorageProxy(app);
  registerAuthRoutes(app);

  // Scheduled handlers (heartbeat callbacks)
  app.post("/api/scheduled/importMatches", importMatchesHandler);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // In production Railway sets PORT; in dev we find an available port
  const port = ENV.isProduction ? ENV.port : await findAvailablePort(ENV.port);

  if (!ENV.isProduction && port !== ENV.port) {
    console.log(`Port ${ENV.port} is busy, using port ${port} instead`);
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}/`);
    startResultsSync();
  });
}

startServer().catch(console.error);

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  process.exit(0);
});

