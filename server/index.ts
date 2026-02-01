import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";

import { runMigrations } from "./db";
import { auth } from "./auth";
import lessonsRoutes from "./routes/lessons";
import challengesRoutes from "./routes/challenges";
import progressRoutes from "./routes/progress";
import vocabularyRoutes from "./routes/vocabulary";
import adminRoutes from "./routes/admin";
import weeksRoutes from "./routes/weeks";
import dataSourcesRoutes from "./routes/data-sources";
import aiGenerationRoutes from "./routes/ai-generation";
import ragRoutes from "./routes/rag";
import { checkPythonServiceHealth } from "./services/python-service-client";

// Run migrations on startup
runMigrations();

// Check Python RAG/Agent service availability (non-blocking)
checkPythonServiceHealth().then((health) => {
  if (health) {
    console.log(`Python RAG service: connected (${health.models.chat})`);
  } else {
    console.log("Python RAG service: not available (RAG/agent features disabled)");
  }
});

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "/api/*",
  cors({
    origin: [process.env.APP_URL || "http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// Auth handler - better-auth handles all auth routes
app.on(["GET", "POST", "OPTIONS"], "/api/auth/*", async (c) => {
  const response = await auth.handler(c.req.raw);
  return response;
});

// API routes
app.route("/api/lessons", lessonsRoutes);
app.route("/api/challenges", challengesRoutes);
app.route("/api/progress", progressRoutes);
app.route("/api/vocabulary", vocabularyRoutes);
app.route("/api/weeks", weeksRoutes);
app.route("/api/rag", ragRoutes);
app.route("/api/admin", adminRoutes);
app.route("/api/admin/data-sources", dataSourcesRoutes);
app.route("/api/admin/ai-generation", aiGenerationRoutes);

// Serve static files in production
if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "./dist" }));
  app.get("*", serveStatic({ path: "./dist/index.html" }));
}

const port = parseInt(process.env.PORT || "3000");

console.log(`Server running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
