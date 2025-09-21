import { z } from "zod";
import { and, eq, lte, or, isNull, asc, sql } from "drizzle-orm";
import { router, authedProcedure } from "../trpc.js";
import { db } from "../../db/client.js";
import { entries } from "../../db/schema/entries.js";
import { userEntrySrs } from "../../db/schema/userEntrySrs.js";
import { reviews } from "../../db/schema/reviews.js";

const RATING = z.enum(["again", "hard", "good", "easy"]);

export const ankiRouter = router({
  start: authedProcedure.query(async ({ ctx }) => {
    const nowIso = new Date().toISOString();
    const rows = await db
      .select({
        id: entries.id,
        expression: entries.expression,
        meaning: entries.meaning,
        examples: entries.examples,
        toneTip: entries.toneTip,
        etymology: entries.etymology,
        dueAt: userEntrySrs.dueAt,
      })
      .from(entries)
      .leftJoin(
        userEntrySrs,
        and(
          eq(userEntrySrs.entryId, entries.id),
          eq(userEntrySrs.userId, ctx.user!.id)
        )
      )
      .where(
        and(
          eq(entries.userId, ctx.user!.id),
          or(isNull(userEntrySrs.dueAt), lte(userEntrySrs.dueAt, nowIso))
        )
      )
      .orderBy(
        // Null dueAt (new items) first, then the earliest due items
        sql`CASE WHEN ${userEntrySrs.dueAt} IS NULL THEN 0 ELSE 1 END`,
        asc(userEntrySrs.dueAt),
        asc(entries.createdAt),
        asc(entries.id)
      )
      .limit(30);

    const items = rows.map((r) => ({
      id: r.id,
      expression: r.expression,
      meaning: r.meaning,
      examples: r.examples,
      toneTip: r.toneTip,
      etymology: r.etymology,
    }));

    // If the filter above excludes rows w/ null dueAt due to SQL null comparison, we already include them via the extra filter.
    return { items } as const;
  }),

  review: authedProcedure
    .input(z.object({ entryId: z.number().int().positive(), rating: RATING }))
    .mutation(async ({ input, ctx }) => {
      // Verify ownership
      const owned = await db
        .select({ id: entries.id })
        .from(entries)
        .where(and(eq(entries.id, input.entryId), eq(entries.userId, ctx.user!.id)))
        .limit(1);
      if (owned.length === 0) throw new Error("Entry not found.");

      // Insert review record
      await db.insert(reviews).values({
        userId: ctx.user!.id,
        entryId: input.entryId,
        rating: input.rating,
      });

      // Load or initialize SRS state
      const srsRows = await db
        .select()
        .from(userEntrySrs)
        .where(
          and(
            eq(userEntrySrs.userId, ctx.user!.id),
            eq(userEntrySrs.entryId, input.entryId)
          )
        )
        .limit(1);

      let ef = srsRows[0]?.ef ?? 2.5;
      let intervalDays = srsRows[0]?.intervalDays ?? 0;
      let repetitions = srsRows[0]?.repetitions ?? 0;
      let lapses = srsRows[0]?.lapses ?? 0;

      switch (input.rating) {
        case "again":
          repetitions = 0;
          lapses += 1;
          intervalDays = 0;
          ef = Math.max(1.3, ef - 0.2);
          break;
        case "hard":
          repetitions += 1;
          intervalDays = Math.max(1, Math.ceil(intervalDays * 1.2));
          ef = Math.max(1.3, ef - 0.15);
          break;
        case "good":
          repetitions += 1;
          intervalDays = repetitions === 1 ? 1 : Math.max(1, Math.ceil(intervalDays * ef));
          // ef unchanged
          break;
        case "easy":
          repetitions += 1;
          intervalDays = repetitions === 1 ? 2 : Math.max(1, Math.ceil(intervalDays * (ef + 0.3)));
          ef = Math.max(1.3, ef + 0.1);
          break;
      }

      // Clamp EF to a reasonable upper bound to avoid runaway intervals
      ef = Math.min(3.0, Math.max(1.3, ef));

      const now = new Date();
      const dayMs = 24 * 60 * 60 * 1000;
      let due = new Date(now.getTime() + intervalDays * dayMs);
      // Add a small short-term delay so "again" or "hard" items don't reappear immediately
      if (input.rating === "again") {
        due = new Date(due.getTime() + 5 * 60 * 1000); // +5 minutes
      } else if (input.rating === "hard") {
        due = new Date(due.getTime() + 10 * 60 * 1000); // +10 minutes
      }

      if (srsRows.length === 0) {
        await db.insert(userEntrySrs).values({
          userId: ctx.user!.id,
          entryId: input.entryId,
          ef,
          intervalDays,
          repetitions,
          lapses,
          dueAt: due.toISOString(),
          lastReviewedAt: now.toISOString(),
        });
      } else {
        await db
          .update(userEntrySrs)
          .set({
            ef,
            intervalDays,
            repetitions,
            lapses,
            dueAt: due.toISOString(),
            lastReviewedAt: now.toISOString(),
          })
          .where(
            and(
              eq(userEntrySrs.userId, ctx.user!.id),
              eq(userEntrySrs.entryId, input.entryId)
            )
          );
      }

      return { ok: true as const, srs: { ef, intervalDays, repetitions, lapses, dueAt: due.toISOString() } };
    }),
});
