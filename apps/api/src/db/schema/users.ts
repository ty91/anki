import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull().unique(),
    email: text("email").unique(),
    passwordHash: text("password_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => []
);

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
