import { createMiddleware } from "hono/factory";
import { auth } from "../auth";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string | null;
}

export const requireAuth = createMiddleware<{
  Variables: { user: SessionUser };
}>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  c.set("user", {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: (session.user as Record<string, unknown>).role as string | null,
  });
  await next();
});

export const requireAdmin = createMiddleware<{
  Variables: { user: SessionUser };
}>(async (c, next) => {
  const session = await auth.api.getSession({
    headers: c.req.raw.headers,
  });
  if (!session) return c.json({ error: "Unauthorized" }, 401);
  const role = (session.user as Record<string, unknown>).role;
  if (role !== "admin") return c.json({ error: "Forbidden: admin access required" }, 403);
  c.set("user", {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: role as string,
  });
  await next();
});
