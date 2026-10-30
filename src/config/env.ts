import "server-only";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DATABASE_URL: z.string().min(1, "DATABASE URL IS REQQUIRED"),
  DATABASE_URL_UNPOOLED: z.string().optional(),
  JWT_SECRET: z.string().min(32, "A minimum length of 32 please"),
  MAX_AGE_SECONDS: z.coerce.number().int().positive(),
  AUTH_COOKIE: z.string(),
});

export const env = envSchema.parse(process.env);
