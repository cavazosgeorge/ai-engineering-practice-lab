import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serveStatic } from "hono/bun";

import lessonsRoutes from "./routes/lessons";
import challengesRoutes from "./routes/challenges";
import progressRoutes from "./routes/progress";

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

// API routes
app.route("/api/lessons", lessonsRoutes);
app.route("/api/challenges", challengesRoutes);
app.route("/api/progress", progressRoutes);

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
