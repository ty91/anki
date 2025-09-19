import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { appConfig } from "../config.js";

// export const pool = new Pool({
//   connectionString: appConfig.DATABASE_URL,
//   ssl:
//     appConfig.DATABASE_SSL_MODE === "require"
//       ? { rejectUnauthorized: false }
//       : false,
// });

const client = postgres(appConfig.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { casing: "snake_case" });
