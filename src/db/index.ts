import "server-only";

import { Pool } from "@neondatabase/serverless";
import { env } from "@/config/env";
import { drizzle } from "drizzle-orm/neon-serverless";

import * as schema from "./schema";

// Reuse the connection pool on local developmentt

const globalForDb = globalThis as unknown as { pgPool?: Pool };

const pool =
  globalForDb.pgPool ??
  new Pool({ connectionString: env.DATABASE_URL, max: 5 });
if (process.env.NODE_ENV !== "production") globalForDb.pgPool = pool;

export const db = drizzle(pool, { schema });
export type TDB = typeof db;
