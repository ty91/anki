import { initTRPC, TRPCError } from "@trpc/server";
import type { TRPCContext } from "./context.js";

const t = initTRPC.context<TRPCContext>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const authed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { user: ctx.user } });
});

export const authedProcedure = publicProcedure.use(authed);

