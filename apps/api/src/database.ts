import DatabaseConstructor, { Database as SqliteDatabase } from 'better-sqlite3';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let databaseInstance: SqliteDatabase | null = null;

const resolveDatabasePath = (): string => {
  const customPath = process.env.DATABASE_PATH;
  if (customPath && customPath.trim().length > 0) {
    return customPath;
  }

  const moduleDirectory = dirname(fileURLToPath(import.meta.url));
  const dataDirectory = join(moduleDirectory, '..', 'data');

  mkdirSync(dataDirectory, { recursive: true });

  return join(dataDirectory, 'app.sqlite');
};

const initializeSchema = (database: SqliteDatabase): void => {
  database.exec(`
    CREATE TABLE IF NOT EXISTS entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      expression TEXT NOT NULL UNIQUE,
      meaning TEXT NOT NULL,
      examples TEXT NOT NULL,
      tone_tip TEXT NOT NULL,
      etymology TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

};

const openDatabase = (): SqliteDatabase => {
  if (databaseInstance) {
    return databaseInstance;
  }

  const databasePath = resolveDatabasePath();

  databaseInstance = new DatabaseConstructor(databasePath);
  databaseInstance.pragma('journal_mode = WAL');

  initializeSchema(databaseInstance);

  return databaseInstance;
};

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

const mapEntryRow = (row: {
  id: number;
  expression: string;
  meaning: string;
  examples: string;
  tone_tip: string;
  etymology: string;
  created_at: string;
}): StoredEntry => ({
  id: row.id,
  expression: row.expression,
  meaning: row.meaning,
  examples: JSON.parse(row.examples) as string[],
  toneTip: row.tone_tip,
  etymology: row.etymology,
  createdAt: row.created_at,
});

export const saveEntry = (payload: CreateEntryPayload): void => {
  const database = openDatabase();

  database.prepare(`
    INSERT INTO entries (expression, meaning, examples, tone_tip, etymology)
    VALUES (@expression, @meaning, @examples, @toneTip, @etymology)
    ON CONFLICT(expression) DO UPDATE SET
      meaning = excluded.meaning,
      examples = excluded.examples,
      tone_tip = excluded.tone_tip,
      etymology = excluded.etymology
  `).run({
    expression: payload.expression,
    meaning: payload.meaning,
    examples: JSON.stringify(payload.examples),
    toneTip: payload.toneTip,
    etymology: payload.etymology,
  });
};

export const listEntries = (): StoredEntry[] => {
  const database = openDatabase();

  const rows = database
    .prepare(`
      SELECT id, expression, meaning, examples, tone_tip, etymology, created_at
      FROM entries
      ORDER BY created_at DESC, id DESC
    `)
    .all() as Array<{
      id: number;
      expression: string;
      meaning: string;
      examples: string;
      tone_tip: string;
      etymology: string;
      created_at: string;
    }>;

  return rows.map(mapEntryRow);
};

