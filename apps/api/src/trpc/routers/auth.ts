import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { db } from "../../db/client.js";
import { users } from "../../db/schema/users.js";
import { sessions } from "../../db/schema/sessions.js";
import { appConfig } from "../../config.js";
import { router, publicProcedure } from "../trpc.js";
import { eq } from "drizzle-orm";

const isProd = appConfig.NODE_ENV === "production";
const cookieName = appConfig.SESSION_COOKIE_NAME;
const maxAgeSeconds = appConfig.SESSION_TTL_DAYS * 24 * 60 * 60;

export const authRouter = router({
  session: publicProcedure.query(async ({ ctx }) => {
    return { user: ctx.user };
  }),

  login: publicProcedure
    .input(z.object({ userid: z.string().min(1), password: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const userId = input.userid.trim().toLowerCase();
      const password = input.password;

      const rows = await db
        .select()
        .from(users)
        .where(eq(users.userId, userId))
        .limit(1);
      const user = rows[0];
      if (!user) {
        throw new Error("Invalid user id or password.");
      }
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        throw new Error("Invalid user id or password.");
      }

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);

      await db.insert(sessions).values({
        id: token,
        userId: user.id,
        expiresAt: expiresAt.toISOString(),
      });

      ctx.cookies.set(cookieName, token, {
        httpOnly: true,
        sameSite: "Lax",
        secure: isProd,
        path: "/",
        maxAge: maxAgeSeconds,
      });
      return { ok: true } as const;
    }),

  "sign-up": publicProcedure
    .input(
      z.object({
        userid: z.string().min(3),
        email: z.string().email().optional(),
        password: z.string().min(6),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = input.userid.trim().toLowerCase();
      const email = input.email?.trim().toLowerCase() ?? null;
      const passwordHash = await bcrypt.hash(input.password, 12);

      try {
        await db.insert(users).values({ userId, email, passwordHash });
      } catch (error) {
        const code = (error as { code?: string } | null)?.code;
        if (code === "23505") {
          throw new Error("User already exists.");
        }
        throw new Error("Failed to create user.");
      }

      const rows = await db
        .select()
        .from(users)
        .where(eq(users.userId, userId))
        .limit(1);
      const user = rows[0];
      if (!user) throw new Error("User not found after creation.");

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + maxAgeSeconds * 1000);
      await db.insert(sessions).values({
        id: token,
        userId: user.id,
        expiresAt: expiresAt.toISOString(),
      });

      ctx.cookies.set(cookieName, token, {
        httpOnly: true,
        sameSite: "Lax",
        secure: isProd,
        path: "/",
        maxAge: maxAgeSeconds,
      });

      return { ok: true } as const;
    }),

  logout: publicProcedure.mutation(async ({ ctx }) => {
    const token = ctx.cookies.get(cookieName);
    if (token) {
      await db.delete(sessions).where(eq(sessions.id, token));
    }
    ctx.cookies.delete(cookieName, { path: "/" });
    return { ok: true } as const;
  }),
});

