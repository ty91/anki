import { Hono } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { eq, and, gt } from "drizzle-orm";
import { db } from "../db/client.js";
import { users } from "../db/schema/users.js";
import { sessions } from "../db/schema/sessions.js";
import { appConfig } from "../config.js";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

export const authRoutes = new Hono();

const cookieName = appConfig.SESSION_COOKIE_NAME;
const isProd = appConfig.NODE_ENV === "production";
const sessionTtlDays = appConfig.SESSION_TTL_DAYS;
const maxAgeSeconds = sessionTtlDays * 24 * 60 * 60;

authRoutes.post("/login", async (context) => {
  type Body = { userid?: string; password?: string };
  let body: Body;

  try {
    body = await context.req.json<Body>();
  } catch {
    return context.json({ error: "Invalid JSON payload." }, 400);
  }

  const userId = body.userid?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!userId || !password) {
    return context.json({ error: "User id and password are required." }, 400);
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);

  const user = rows[0];

  if (!user) {
    return context.json({ error: "Invalid user id or password." }, 401);
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return context.json({ error: "Invalid user id or password." }, 401);
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

  await db.insert(sessions).values({
    id: token,
    userId: user.id,
    expiresAt: expiresAt.toISOString(),
  });

  setCookie(context, cookieName, token, {
    httpOnly: true,
    sameSite: "Lax",
    secure: isProd,
    path: "/",
    maxAge: maxAgeSeconds,
  });

  return context.json({ ok: true });
});

authRoutes.post("/sign-up", async (context) => {
  type Body = { userid?: string; email?: string; password?: string };
  let body: Body;

  try {
    body = await context.req.json<Body>();
  } catch {
    return context.json({ error: "Invalid JSON payload." }, 400);
  }

  const userId = body.userid?.trim().toLowerCase();
  const email = body.email?.trim().toLowerCase();
  const password = body.password ?? "";

  if (!userId || !password) {
    return context.json({ error: "User id and password are required." }, 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await db.insert(users).values({
      userId,
      email: email ?? null,
      passwordHash,
    });
  } catch (error) {
    const code = (error as { code?: string } | null)?.code;
    if (code === "23505") {
      return context.json({ error: "User already exists." }, 409);
    }
    console.error("Sign-up failed:", error);
    return context.json({ error: "Failed to create user." }, 500);
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.userId, userId))
    .limit(1);

  const user = rows[0];
  if (!user) {
    return context.json({ error: "User not found after creation." }, 500);
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

  await db.insert(sessions).values({
    id: token,
    userId: user.id,
    expiresAt: expiresAt.toISOString(),
  });

  setCookie(context, cookieName, token, {
    httpOnly: true,
    sameSite: "Lax",
    secure: isProd,
    path: "/",
    maxAge: maxAgeSeconds,
  });

  return context.json({ ok: true });
});

authRoutes.post("/logout", async (context) => {
  const token = getCookie(context, cookieName);
  if (token) {
    await db.delete(sessions).where(eq(sessions.id, token));
  }

  deleteCookie(context, cookieName, { path: "/" });
  return context.json({ ok: true });
});

authRoutes.get("/session", async (context) => {
  const token = getCookie(context, cookieName);
  if (!token) {
    return context.json({ user: null });
  }

  const nowIso = new Date().toISOString();

  const result = await db
    .select({
      id: users.id,
      userId: users.userId,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, token), gt(sessions.expiresAt, nowIso)))
    .limit(1);

  const row = result[0];

  if (!row) {
    return context.json({ user: null });
  }

  return context.json({ user: { id: row.id, userId: row.userId } });
});
