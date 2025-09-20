import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { appConfig } from "./config.js";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/router.js";
import { buildContext } from "./trpc/context.js";

const app = new Hono();

app.get("/", (context) => {
  return context.json({ status: "ok" });
});

app.use(
  "/api/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, c) => buildContext(c),
  })
);

const port = appConfig.PORT;

console.log(`Backend listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });

// Type-only export for client-side typing
export type AppType = typeof app;
