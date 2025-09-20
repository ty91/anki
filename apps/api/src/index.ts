import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { appConfig } from "./config.js";
import { db } from "./db/client.js";
import { entries, type Entry } from "./db/schema/entries.js";
import { eq } from "drizzle-orm";
import { authRoutes } from "./routes/auth.route.js";
import { requireAuth } from "./middleware/requireAuth.js";
import { entriesRoutes } from "./routes/entries.route.js";

type GenerateRequestBody = {
  entry: string;
};

const app = new Hono();

app.get("/", (context) => {
  return context.json({ status: "ok" });
});

app.route("/api/auth", authRoutes);

app.route("/api", entriesRoutes);

const port = appConfig.PORT;

console.log(`Backend listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
