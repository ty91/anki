import { router } from "./trpc.js";
import { authRouter } from "./routers/auth.js";
import { entriesRouter } from "./routers/entries.js";

export const appRouter = router({
  auth: authRouter,
  entries: entriesRouter,
});

export type AppRouter = typeof appRouter;

