import type { Config } from "drizzle-kit";

const config = {
  schema: "./lib/db/schema.ts",
  out: "./lib/db/migrations",
  casing: "snake_case",
  // Configure for AWS Aurora PostgreSQL
  // When DATABASE_URL is set, uncomment and adjust driver
  // driver: "pg",
  // dbCredentials: {
  //   connectionString: process.env.DATABASE_URL!,
  // },
} as unknown as Config;

export default config;
