import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Create a PostgreSQL connection pool for AWS Aurora
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Optional: connection pool settings
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Initialize Drizzle ORM with the pool and schema
export const db = drizzle(pool, { schema });

// Health check function
export async function checkDatabaseConnection() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("[DB] Connection successful:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("[DB] Connection failed:", error);
    return false;
  }
}
