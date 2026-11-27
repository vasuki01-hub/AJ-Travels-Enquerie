import "dotenv/config";
import express from "express";
import rateLimit from "express-rate-limit";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.set("trust proxy", 1);

  // ── Security headers ──────────────────────────────────────────────────────
  app.use((_req, res, next) => {
    // Prevent clickjacking
    res.setHeader("X-Frame-Options", "DENY");
    // Stop MIME-type sniffing
    res.setHeader("X-Content-Type-Options", "nosniff");
    // Referrer policy
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    // Permissions policy – disable unused powerful features
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=()");
    // Basic CSP – tightened in production; relaxed for Vite HMR in dev
    const isDev = process.env.NODE_ENV !== "production";
    if (!isDev) {
      res.setHeader(
        "Content-Security-Policy",
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",   // inline scripts used by the SPA bundle
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' https:",
          "frame-ancestors 'none'",
          "object-src 'none'",
          "base-uri 'self'",
        ].join("; ")
      );
      // HSTS – 1 year, include subdomains
      res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }
    next();
  });

  // ── Body parsers (reduced limits – no 50 MB blobs expected here) ──────────
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  // ── Rate limiting ─────────────────────────────────────────────────────────
  // OAuth callback: very tight – 10 attempts per 15 min per IP
  const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many login attempts. Please try again later." },
  });
  // tRPC API: 120 requests per minute per IP (2 req/sec – generous for a team tool)
  const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests. Please slow down." },
  });
  app.use("/api/oauth", oauthLimiter);
  app.use("/api/trpc", apiLimiter);

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
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

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
