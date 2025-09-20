import { integer, pgTable, real, serial, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { entries } from "./entries.js";

export const userEntrySrs = pgTable(
  "user_entry_srs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    entryId: integer("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
    ef: real("ef").notNull().default(2.5),
    intervalDays: integer("interval_days").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),
    lapses: integer("lapses").notNull().default(0),
    dueAt: timestamp("due_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true, mode: "string" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("user_entry_srs_user_entry_key").on(table.userId, table.entryId)]
);

export type UserEntrySrs = typeof userEntrySrs.$inferSelect;
export type UserEntrySrsInsert = typeof userEntrySrs.$inferInsert;

