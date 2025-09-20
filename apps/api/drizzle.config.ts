import { defineConfig } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

loadEnv({ path: "./.env" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./dist/db/schema/**/*.js",
  out: "./drizzle",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  migrations: {
    schema: "public",
  },
  verbose: true,
  strict: true,
});
