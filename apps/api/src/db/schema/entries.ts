import { jsonb, pgTable, serial, text, timestamp, uniqueIndex, integer } from "drizzle-orm/pg-core";
import { users } from "./users.js";

export const entries = pgTable(
  "entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id, { onDelete: "cascade" }),
    expression: text("expression").notNull(),
    meaning: text("meaning").notNull(),
    examples: jsonb("examples").$type<string[]>().notNull(),
    toneTip: text("tone_tip").notNull(),
    etymology: text("etymology").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("entries_user_expression_key").on(table.userId, table.expression),
  ]
);

export type Entry = typeof entries.$inferSelect;
export type EntryInsert = typeof entries.$inferInsert;
