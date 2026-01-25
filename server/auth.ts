import { betterAuth } from "better-auth";
import { admin } from "better-auth/plugins";
import Database from "bun:sqlite";

const dbPath = process.env.DB_PATH || "./data/app.db";

export const auth = betterAuth({
  database: new Database(dbPath),
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    admin({ defaultRole: "user" }),
  ],
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },
  trustedOrigins: [
    process.env.APP_URL || "http://localhost:5173",
    "http://localhost:3000",
  ],
});

export type Auth = typeof auth;
