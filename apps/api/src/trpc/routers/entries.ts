import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "../../db/client.js";
import { entries, type Entry } from "../../db/schema/entries.js";
import {
  classifyEntry,
  generateEntry,
  type ClassificationResult,
  type GenerateResponse,
} from "../../openaiGenerator.js";
import { authedProcedure, router } from "../trpc.js";

type EntryResponse = { existed: boolean; entry: Entry };

export const entriesRouter = router({
  add: authedProcedure
    .input(z.object({ entry: z.string().min(1) }))
    .mutation(async ({ input, ctx }) => {
      const authUser = ctx.user!;
      const entry = input.entry.trim();

      const existingRows = await db
        .select()
        .from(entries)
        .where(and(eq(entries.expression, entry), eq(entries.userId, authUser.id)))
        .limit(1);
      const existing = existingRows[0] ?? null;
      if (existing) {
        return { existed: true, entry: existing } satisfies EntryResponse;
      }

      const classification: ClassificationResult = await classifyEntry(entry);
      if (!classification.isValid) {
        throw new Error(classification.reason);
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
        .where(and(eq(entries.expression, entry), eq(entries.userId, authUser.id)))
        .limit(1);
      const saved = savedRows[0] ?? null;
      if (!saved) {
        throw new Error("Failed to persist entry.");
      }
      return { existed: false, entry: saved } satisfies EntryResponse;
    }),

  list: authedProcedure.query(async ({ ctx }) => {
    const authUser = ctx.user!;
    const rows = await db
      .select({ id: entries.id, expression: entries.expression })
      .from(entries)
      .where(eq(entries.userId, authUser.id));
    return rows;
  }),

  getById: authedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ input, ctx }) => {
      const authUser = ctx.user!;
      const rows = await db
        .select()
        .from(entries)
        .where(and(eq(entries.id, input.id), eq(entries.userId, authUser.id)))
        .limit(1);
      const entry = rows[0];
      if (!entry) {
        throw new Error("Entry not found.");
      }
      return entry;
    }),

  delete: authedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const authUser = ctx.user!;
      const deleted = await db
        .delete(entries)
        .where(and(eq(entries.id, input.id), eq(entries.userId, authUser.id)))
        .returning({ id: entries.id });
      if (deleted.length === 0) {
        throw new Error("Entry not found.");
      }
      return { ok: true } as const;
    }),
});

