import { router } from "./trpc.js";
import { authRouter } from "./routers/auth.js";
import { entriesRouter } from "./routers/entries.js";
import { ankiRouter } from "./routers/anki.js";

export const appRouter = router({
  auth: authRouter,
  entries: entriesRouter,
  anki: ankiRouter,
});

export type AppRouter = typeof appRouter;
