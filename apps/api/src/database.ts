import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { desc, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const moduleDirectory = dirname(fileURLToPath(import.meta.url));
const dataDirectory = join(moduleDirectory, "..", "data");
mkdirSync(dataDirectory, { recursive: true });

const defaultDatabaseUrl = `file:${join(dataDirectory, "app.sqlite")}`;

const client = createClient({
  url: process.env.DATABASE_URL ?? defaultDatabaseUrl,
});

const db = drizzle(client);

const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  expression: text("expression").notNull().unique(),
  meaning: text("meaning").notNull(),
  examples: text("examples").notNull(),
  toneTip: text("tone_tip").notNull(),
  etymology: text("etymology").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

type EntryRow = typeof entries.$inferSelect;

type EntryInsert = typeof entries.$inferInsert;

export type StoredEntry = {
  id: number;
  expression: string;
  meaning: string;
  examples: string[];
  toneTip: string;
  etymology: string;
  createdAt: string;
};

export type CreateEntryPayload = {
  expression: string;
  meaning: string;
  examples: string[];
  toneTip: string;
  etymology: string;
};

const initializationPromise: Promise<void> = client
  .execute(
    `
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expression TEXT NOT NULL UNIQUE,
      meaning TEXT NOT NULL,
      examples TEXT NOT NULL,
      tone_tip TEXT NOT NULL,
      etymology TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `
  )
  .then(() => undefined);

const mapEntryRow = (row: EntryRow): StoredEntry => ({
  id: row.id!,
  expression: row.expression!,
  meaning: row.meaning!,
  examples: JSON.parse(row.examples ?? "[]") as string[],
  toneTip: row.toneTip!,
  etymology: row.etymology!,
  createdAt: row.createdAt!,
});

export const saveEntry = async (payload: CreateEntryPayload): Promise<void> => {
  await initializationPromise;

  const serializedExamples = JSON.stringify(payload.examples);

  const values: EntryInsert = {
    expression: payload.expression,
    meaning: payload.meaning,
    examples: serializedExamples,
    toneTip: payload.toneTip,
    etymology: payload.etymology,
  };

  await db
    .insert(entries)
    .values(values)
    .onConflictDoUpdate({
      target: entries.expression,
      set: {
        meaning: payload.meaning,
        examples: serializedExamples,
        toneTip: payload.toneTip,
        etymology: payload.etymology,
      },
    });
};

export const listEntries = async (): Promise<StoredEntry[]> => {
  await initializationPromise;

  const rows = await db
    .select()
    .from(entries)
    .orderBy(desc(entries.createdAt), desc(entries.id));

  return rows.map(mapEntryRow);
};
