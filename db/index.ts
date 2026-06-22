import { drizzle } from "drizzle-orm/node-postgres"
import { Pool } from "pg"
import * as schema from "./schema"

let db: ReturnType<typeof drizzle> | null = null

export function getDb() {
    console.log("getDb called")
  if (!db) {
    console.log("before ",process.env.DATABASE_URL)
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not set")
    }
    console.log(process.env.DATABASE_URL)
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    db = drizzle(pool, { schema })
  }

  return db
}

export { schema }
