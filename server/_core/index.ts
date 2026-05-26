import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import net from "net";
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
  const app = express();
  const server = createServer(app);

  // Security headers — disable CSP in dev so Vite's inline scripts work
  app.use(helmet({ contentSecurityPolicy: process.env.NODE_ENV !== "development" }));
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

  const port = await findAvailablePort(ENV.port);

  if (port !== ENV.port) {
    console.log(`Port ${ENV.port} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    startResultsSync();
  });
}

startServer().catch(console.error);

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down...");
  process.exit(0);
});

