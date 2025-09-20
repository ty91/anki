import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { requireAuth } from "../middleware/requireAuth.js";
import { db } from "../db/client.js";
import { entries, type Entry } from "../db/schema/entries.js";
import {
  classifyEntry,
  generateEntry,
  type ClassificationResult,
  type GenerateResponse,
} from "../openaiGenerator.js";

export const entriesRoutes = new Hono();

type EntryResponse = { existed: boolean; entry: Entry };

type GenerateRequestBody = {
  entry: string;
};

entriesRoutes.post("/entries", requireAuth, async (context) => {
  const authUser = (context as unknown as { get: (k: string) => unknown }).get(
    "user"
  ) as { id: number; userId: string } | undefined;
  if (!authUser) {
    return context.json({ error: "Unauthorized" }, 401);
  }
  let payload: GenerateRequestBody;

  try {
    payload = await context.req.json<GenerateRequestBody>();
  } catch (error) {
    return context.json({ error: "Invalid JSON payload." }, 400);
  }

  const entry = payload.entry?.trim();

  if (!entry) {
    return context.json({ error: "Entry is required." }, 400);
  }

  try {
    const existingRows = await db
      .select()
      .from(entries)
      .where(
        and(eq(entries.expression, entry), eq(entries.userId, authUser.id))
      )
      .limit(1);

    const existingEntry: Entry | null =
      existingRows.length > 0 ? existingRows[0] : null;

    if (existingEntry) {
      const payload: EntryResponse = { existed: true, entry: existingEntry };
      return context.json(payload);
    }

    const classification: ClassificationResult = await classifyEntry(entry);

    if (!classification.isValid) {
      return context.json({ error: classification.reason }, 400);
    }

    const response: GenerateResponse = await generateEntry(entry);

    await db
      .insert(entries)
      .values({
        userId: authUser.id,
        expression: entry,
        meaning: response.meaning,
        examples: response.examples,
        toneTip: response.toneTip,
        etymology: response.etymology,
      })
      .onConflictDoUpdate({
        target: [entries.userId, entries.expression],
        set: {
          meaning: response.meaning,
          examples: response.examples,
          toneTip: response.toneTip,
          etymology: response.etymology,
        },
      });

    const savedRows = await db
      .select()
      .from(entries)
      .where(
        and(eq(entries.expression, entry), eq(entries.userId, authUser.id))
      )
      .limit(1);

    const saved = savedRows.length > 0 ? savedRows[0] : null;

    if (!saved) {
      throw new Error("Failed to persist entry.");
    }

    const payload: EntryResponse = { existed: false, entry: saved };
    return context.json(payload);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate content from OpenAI.";

    console.error("OpenAI generation failed:", message);

    return context.json({ error: message }, 500);
  }
});

// List entries (only id and expression)
entriesRoutes.get("/entries", requireAuth, async (context) => {
  const authUser = (context as unknown as { get: (k: string) => unknown }).get(
    "user"
  ) as { id: number; userId: string } | undefined;
  if (!authUser) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  const rows = await db
    .select({ id: entries.id, expression: entries.expression })
    .from(entries)
    .where(eq(entries.userId, authUser.id));

  return context.json(rows);
});

// Get detailed entry by id
entriesRoutes.get("/entries/:id", requireAuth, async (context) => {
  const authUser = (context as unknown as { get: (k: string) => unknown }).get(
    "user"
  ) as { id: number; userId: string } | undefined;
  if (!authUser) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  const idParam = context.req.param("id");
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return context.json({ error: "Invalid entry id." }, 400);
  }

  const rows = await db
    .select()
    .from(entries)
    .where(and(eq(entries.id, id), eq(entries.userId, authUser.id)))
    .limit(1);

  const entry = rows[0];
  if (!entry) {
    return context.json({ error: "Entry not found." }, 404);
  }

  return context.json(entry);
});

// Delete entry by id
entriesRoutes.delete("/entries/:id", requireAuth, async (context) => {
  const authUser = (context as unknown as { get: (k: string) => unknown }).get(
    "user"
  ) as { id: number; userId: string } | undefined;
  if (!authUser) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  const idParam = context.req.param("id");
  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return context.json({ error: "Invalid entry id." }, 400);
  }

  const deleted = await db
    .delete(entries)
    .where(and(eq(entries.id, id), eq(entries.userId, authUser.id)))
    .returning({ id: entries.id });

  if (deleted.length === 0) {
    return context.json({ error: "Entry not found." }, 404);
  }

  return context.json({ ok: true });
});
