import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

const connectionString =
  process.env.DATABASE_URL ??
  process.env.postgresql ??
  process.env.POSTGRES_URL ??
  process.env.SUPABASE_URL ??
  process.env.SUPABASE_DB_URL ??
  process.env.SUPABASE_POSTGRES_URL;

if (!connectionString) {
  throw new Error(
    "Set DATABASE_URL (or the Supabase-provided `postgresql` variable) with your PostgreSQL connection string.",
  );
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Supabase
  },
});

export const db = drizzle(pool, { schema });
