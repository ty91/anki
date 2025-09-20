import { config as loadEnv } from "dotenv";
import { z } from "zod";

const dotenvResult = loadEnv();

if (dotenvResult.error) {
  throw new Error(
    `Failed to load environment variables: ${dotenvResult.error.message}`
  );
}

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().min(0).max(65535).default(3000),
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  OPENAI_MODEL: z.string().min(1).default("gpt-4o-mini"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  DATABASE_SSL_MODE: z.enum(["require", "disable"]).default("require"),
  SUPABASE_JWT_SECRET: z.string().min(1),
  SUPABASE_URL: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SESSION_COOKIE_NAME: z.string().default("session"),
  SESSION_TTL_DAYS: z
    .coerce
    .number()
    .int()
    .min(1)
    .max(365)
    .default(7),
});

const parseResult = envSchema.safeParse(process.env);

if (!parseResult.success) {
  const message = parseResult.error.issues
    .map((issue) => `${issue.path.join(".") || "ENV"}: ${issue.message}`)
    .join("\n");

  throw new Error(`Invalid environment configuration:\n${message}`);
}

export type AppConfig = z.infer<typeof envSchema>;

export const appConfig: AppConfig = Object.freeze(parseResult.data);
