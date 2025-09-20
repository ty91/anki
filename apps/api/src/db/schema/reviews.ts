import { integer, pgEnum, pgTable, serial, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users.js";
import { entries } from "./entries.js";

export const ratingEnum = pgEnum("rating", ["again", "hard", "good", "easy"]);

export const reviews = pgTable(
  "reviews",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    entryId: integer("entry_id").notNull().references(() => entries.id, { onDelete: "cascade" }),
    rating: text("rating").notNull().$type<"again" | "hard" | "good" | "easy">(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" }).notNull().defaultNow(),
  },
  (table) => [
    index("reviews_user_entry_idx").on(table.userId, table.entryId),
    index("reviews_user_created_idx").on(table.userId, table.createdAt),
  ]
);

export type Review = typeof reviews.$inferSelect;
export type ReviewInsert = typeof reviews.$inferInsert;

