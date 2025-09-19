import {
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const entries = pgTable(
  "entries",
  {
    id: serial("id").primaryKey(),
    expression: text("expression").notNull(),
    meaning: text("meaning").notNull(),
    examples: jsonb("examples").$type<string[]>().notNull(),
    toneTip: text("tone_tip").notNull(),
    etymology: text("etymology").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [uniqueIndex("entries_expression_key").on(table.expression)]
);

export type Entry = typeof entries.$inferSelect;
export type EntryInsert = typeof entries.$inferInsert;
