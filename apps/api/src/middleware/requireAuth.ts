import type { MiddlewareHandler } from "hono";
import { getCookie } from "hono/cookie";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/client.js";
import { sessions } from "../db/schema/sessions.js";
import { users } from "../db/schema/users.js";
import { appConfig } from "../config.js";

export const requireAuth: MiddlewareHandler = async (context, next) => {
  const cookieName = appConfig.SESSION_COOKIE_NAME;
  const token = getCookie(context, cookieName);
  if (!token) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  const nowIso = new Date().toISOString();
  const result = await db
    .select({ id: users.id, userId: users.userId })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, nowIso)))
    .limit(1);

  const row = result[0];
  if (!row) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  context.set("user", { id: row.id, userId: row.userId });
  await next();
};

