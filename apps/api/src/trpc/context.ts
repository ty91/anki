import type { Context } from "hono";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/client.js";
import { sessions } from "../db/schema/sessions.js";
import { users } from "../db/schema/users.js";
import { appConfig } from "../config.js";

export type AuthedUser = { id: number; userId: string };

export type TRPCContext = {
  c: Context;
  user: AuthedUser | null;
  cookies: {
    get: (name: string) => string | undefined;
    set: (name: string, value: string, opts?: Parameters<typeof setCookie>[3]) => void;
    delete: (name: string, opts?: Parameters<typeof deleteCookie>[2]) => void;
  };
};

export async function buildContext(c: Context): Promise<TRPCContext> {
  const cookieName = appConfig.SESSION_COOKIE_NAME;
  const token = getCookie(c, cookieName);
  let user: AuthedUser | null = null;

  if (token) {
    const nowIso = new Date().toISOString();
    const result = await db
      .select({ id: users.id, userId: users.userId })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.id, token), gt(sessions.expiresAt, nowIso)))
      .limit(1);
    const row = result[0];
    if (row) user = { id: row.id, userId: row.userId };
  }

  return {
    c,
    user,
    cookies: {
      get: (name) => getCookie(c, name),
      set: (name, value, opts) => setCookie(c, name, value, opts),
      delete: (name, opts) => deleteCookie(c, name, opts ?? { path: "/" }),
    },
  };
}
