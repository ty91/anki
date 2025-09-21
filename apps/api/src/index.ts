import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import fs from "node:fs";
import path from "node:path";
import { appConfig } from "./config.js";
import { trpcServer } from "@hono/trpc-server";
import { appRouter } from "./trpc/router.js";
import { buildContext } from "./trpc/context.js";

const app = new Hono();

// Mount API first so it isn't intercepted by static handlers
app.use(
  "/api/*",
  trpcServer({
    router: appRouter,
    createContext: (_opts, c) => buildContext(c),
  })
);

// Dedicated health endpoint (used by Docker and PaaS health checks)
app.get("/healthz", (c) => c.json({ status: "ok" }));

// Resolve SPA static directory if present (works in Docker and local build)
const staticCandidates = [
  path.resolve(process.cwd(), "apps/web/dist"),
  path.resolve(process.cwd(), "../web/dist"),
];
const staticRoot = staticCandidates.find((p) => fs.existsSync(p));

if (staticRoot) {
  // Serve built assets (e.g., /assets/*)
  app.use("/assets/*", serveStatic({ root: staticRoot }));
  // Common top-level static files
  app.get(
    "/favicon.ico",
    serveStatic({ root: staticRoot, path: "favicon.ico" })
  );
  app.get("/robots.txt", serveStatic({ root: staticRoot, path: "robots.txt" }));

  // Serve the SPA at root
  app.get("/", async (c) => {
    const html = await fs.promises.readFile(
      path.join(staticRoot!, "index.html"),
      "utf-8"
    );
    return c.html(html);
  });

  // History API fallback: anything not /api/* returns index.html
  app.get("/*", async (c) => {
    const html = await fs.promises.readFile(
      path.join(staticRoot!, "index.html"),
      "utf-8"
    );
    return c.html(html);
  });
} else {
  // Fallback health endpoint when no SPA is built
  app.get("/", (c) => c.json({ status: "ok" }));
}

const port = appConfig.PORT;

console.log(`Backend listening on http://localhost:${port}`);
if (staticRoot) {
  console.log(`Serving SPA from: ${staticRoot}`);
}
serve({ fetch: app.fetch, port });

// Type-only export for client-side typing
export type AppType = typeof app;
